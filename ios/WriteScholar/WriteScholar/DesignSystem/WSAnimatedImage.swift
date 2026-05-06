//
//  WSAnimatedImage.swift
//  WriteScholar
//
//  Plays an animated WebP / GIF / APNG that lives in the app bundle.
//  Decodes frames + per-frame delays via ImageIO (iOS 14+ supports
//  animated WebP) and drives them with a CADisplayLink so motion stays
//  smooth on 120Hz ProMotion displays.
//

import SwiftUI
import ImageIO
import UniformTypeIdentifiers

/// SwiftUI view that loads an animated bundle resource and plays it on
/// loop. Falls back to a static first frame if decoding fails or there's
/// only one frame.
///
/// Usage:
/// ```
/// WSAnimatedImage(name: "mascot-dance", ext: "webp")
///     .frame(width: 200, height: 200)
/// ```
struct WSAnimatedImage: View {
    let name: String
    /// File extension without the dot. Defaults to "webp".
    var ext: String = "webp"
    /// Speed multiplier (1.0 = native, 0.5 = half speed, 2.0 = double speed).
    var speed: Double = 1.0

    @StateObject private var driver = AnimatedImageDriver()

    var body: some View {
        ZStack {
            if let frame = driver.currentFrame {
                Image(uiImage: frame)
                    .resizable()
                    .scaledToFit()
            } else {
                Color.clear
            }
        }
        .onAppear {
            driver.load(resource: name, ext: ext, speedMultiplier: speed)
        }
        .onDisappear {
            driver.stop()
        }
    }
}

// MARK: - Driver (frame extraction + display-link timing)

@MainActor
final class AnimatedImageDriver: ObservableObject {
    @Published private(set) var currentFrame: UIImage?

    private var frames: [UIImage] = []
    private var delaysMs: [Double] = []     // milliseconds per frame
    private var totalDurationMs: Double = 0
    private var startTime: CFTimeInterval = 0
    private var displayLink: CADisplayLink?
    private var speedMultiplier: Double = 1.0

    func load(resource: String, ext: String, speedMultiplier: Double) {
        guard frames.isEmpty else { return }   // already loaded
        self.speedMultiplier = speedMultiplier

        guard let url = Bundle.main.url(forResource: resource, withExtension: ext),
              let data = try? Data(contentsOf: url),
              let source = CGImageSourceCreateWithData(data as CFData, nil)
        else {
            return
        }

        let count = CGImageSourceGetCount(source)
        guard count > 0 else { return }

        var extractedFrames: [UIImage] = []
        var extractedDelays: [Double] = []

        for i in 0..<count {
            guard let cgImage = CGImageSourceCreateImageAtIndex(source, i, nil) else { continue }
            extractedFrames.append(UIImage(cgImage: cgImage))
            extractedDelays.append(frameDelay(source: source, index: i))
        }

        guard !extractedFrames.isEmpty else { return }

        self.frames = extractedFrames
        self.delaysMs = extractedDelays
        self.totalDurationMs = extractedDelays.reduce(0, +)
        self.currentFrame = extractedFrames[0]

        // Single frame? Just show the static image; no display link needed.
        if extractedFrames.count > 1 {
            startDisplayLink()
        }
    }

    func stop() {
        displayLink?.invalidate()
        displayLink = nil
    }

    // MARK: Internals

    private func startDisplayLink() {
        startTime = CACurrentMediaTime()
        let link = CADisplayLink(target: self, selector: #selector(tick))
        link.add(to: .main, forMode: .common)
        displayLink = link
    }

    @objc private func tick() {
        guard !frames.isEmpty, totalDurationMs > 0 else { return }
        let elapsedMs = (CACurrentMediaTime() - startTime) * 1000.0 * speedMultiplier
        let modMs = elapsedMs.truncatingRemainder(dividingBy: totalDurationMs)

        // Find the frame whose cumulative delay window contains modMs
        var cumulative: Double = 0
        for (idx, delay) in delaysMs.enumerated() {
            cumulative += delay
            if modMs < cumulative {
                if currentFrame !== frames[idx] {
                    currentFrame = frames[idx]
                }
                return
            }
        }
        currentFrame = frames.last
    }

    /// Pulls the per-frame delay (in ms) from the GIF/WebP/APNG metadata.
    /// Falls back to ~10fps if the source omits the value.
    private func frameDelay(source: CGImageSource, index: Int) -> Double {
        guard let props = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any] else {
            return 100
        }

        // Try GIF dictionary, then WebP, then PNG (APNG)
        let containerKeys: [CFString] = [
            kCGImagePropertyGIFDictionary,
            kCGImagePropertyWebPDictionary,
            kCGImagePropertyPNGDictionary
        ]

        for key in containerKeys {
            guard let dict = props[key] as? [CFString: Any] else { continue }
            // Prefer "unclamped" delay; some GIF authors set tiny delays
            // that browsers/viewers clamp to 100ms — we honor the file.
            let unclampedKey: CFString
            let clampedKey: CFString
            switch key {
            case kCGImagePropertyGIFDictionary:
                unclampedKey = kCGImagePropertyGIFUnclampedDelayTime
                clampedKey   = kCGImagePropertyGIFDelayTime
            case kCGImagePropertyWebPDictionary:
                unclampedKey = kCGImagePropertyWebPUnclampedDelayTime
                clampedKey   = kCGImagePropertyWebPDelayTime
            case kCGImagePropertyPNGDictionary:
                unclampedKey = kCGImagePropertyAPNGUnclampedDelayTime
                clampedKey   = kCGImagePropertyAPNGDelayTime
            default:
                continue
            }

            if let v = dict[unclampedKey] as? Double, v > 0 { return v * 1000 }
            if let v = dict[clampedKey] as? Double, v > 0   { return v * 1000 }
        }

        return 100   // 10fps fallback
    }
}

#Preview {
    WSAnimatedImage(name: "mascot-dance", ext: "webp")
        .frame(width: 240, height: 240)
}
