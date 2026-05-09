//
//  WSConfetti.swift
//  WriteScholar
//
//  Pure-SwiftUI confetti burst, used for celebration moments:
//    • Study pack generated
//    • Quiz finished with > 80% correct
//    • Focus challenge unlocked
//    • Achievement / level up
//
//  Drop in at the top of any view tree:
//
//      ZStack {
//          contentBody
//          WSConfettiView(trigger: $celebrate)
//      }
//
//  …then bump `celebrate` (an Int) by 1 to fire a burst. The view
//  manages its own particle pool — no per-frame work in the parent.
//

import SwiftUI

// MARK: - Particle

private struct ConfettoParticle: Identifiable {
    let id = UUID()
    var x: CGFloat
    var y: CGFloat
    var dx: CGFloat
    var dy: CGFloat
    var rotation: Double
    var spin: Double
    var color: Color
    var shape: ConfettoShape
    var size: CGFloat
    /// 0 → 1 across the lifespan
    var age: Double
    var lifespan: Double
}

private enum ConfettoShape: CaseIterable {
    case square, circle, triangle, sparkle
}

// MARK: - The view

struct WSConfettiView: View {
    /// Bind to an Int counter. Increment to fire a new burst.
    @Binding var trigger: Int
    /// Number of particles per burst. ~80 is the visual sweet spot.
    var particleCount: Int = 80
    /// Override origin (defaults to the geometric center).
    var origin: CGPoint? = nil
    /// Override palette (defaults to brand confetti palette).
    var palette: [Color] = [
        WSColor.duoPurple,
        WSColor.duoGreen,
        WSColor.duoBlue,
        WSColor.duoOrange,
        WSColor.duoRed,
        WSColor.duoGreenDark,
        WSColor.duoOrangeDark,
        WSColor.duoPurpleDark
    ]

    @State private var particles: [ConfettoParticle] = []
    @State private var lastTrigger: Int = 0
    @State private var startTime: Date = Date()

    var body: some View {
        GeometryReader { geo in
            TimelineView(.animation) { timeline in
                Canvas { ctx, size in
                    let now = timeline.date.timeIntervalSince(startTime)
                    drawParticles(into: &ctx, size: size, now: now)
                }
            }
            .allowsHitTesting(false)
            .onChange(of: trigger) { _, newValue in
                guard newValue != lastTrigger else { return }
                lastTrigger = newValue
                fireBurst(in: geo.size)
            }
        }
    }

    // MARK: - Drawing

    private func drawParticles(into ctx: inout GraphicsContext, size: CGSize, now: TimeInterval) {
        for p in particles {
            // Age forward based on real time so it feels physical even
            // on slow refresh devices.
            let age = min(1.0, p.age + 1.0 / 60.0 / p.lifespan)
            guard age < 1 else { continue }

            // Physics: gravity + horizontal drift
            let t = age * p.lifespan
            let x = p.x + p.dx * CGFloat(t)
            let y = p.y + p.dy * CGFloat(t) + 0.5 * 380 * CGFloat(t * t)
            let rotation = p.rotation + p.spin * t * 360

            let opacity = 1.0 - pow(age, 2.4)
            var transform = CGAffineTransform.identity
                .translatedBy(x: x, y: y)
                .rotated(by: rotation * .pi / 180)

            ctx.opacity = opacity

            switch p.shape {
            case .square:
                let rect = CGRect(x: -p.size / 2, y: -p.size / 2, width: p.size, height: p.size * 0.6)
                ctx.fill(Path(rect).applying(transform), with: .color(p.color))
            case .circle:
                let rect = CGRect(x: -p.size / 2, y: -p.size / 2, width: p.size, height: p.size)
                ctx.fill(Path(ellipseIn: rect).applying(transform), with: .color(p.color))
            case .triangle:
                var path = Path()
                path.move(to: CGPoint(x: 0,         y: -p.size / 2))
                path.addLine(to: CGPoint(x:  p.size / 2, y: p.size / 2))
                path.addLine(to: CGPoint(x: -p.size / 2, y: p.size / 2))
                path.closeSubpath()
                ctx.fill(path.applying(transform), with: .color(p.color))
            case .sparkle:
                let rect = CGRect(x: -p.size / 2, y: -p.size / 8, width: p.size, height: p.size / 4)
                ctx.fill(Path(rect).applying(transform), with: .color(p.color))
                let rect2 = CGRect(x: -p.size / 8, y: -p.size / 2, width: p.size / 4, height: p.size)
                ctx.fill(Path(rect2).applying(transform), with: .color(p.color))
            }
        }

        // Mutate the particle ages — done outside drawing for purity is
        // tempting but Canvas re-runs every frame, so this is fine.
        ageParticles()
    }

    private func ageParticles() {
        DispatchQueue.main.async {
            var alive: [ConfettoParticle] = []
            alive.reserveCapacity(particles.count)
            for var p in particles {
                p.age += 1.0 / 60.0 / p.lifespan
                if p.age < 1 { alive.append(p) }
            }
            // Avoid an infinite SwiftUI invalidation loop — only reassign
            // when the set actually shrank.
            if alive.count != particles.count {
                particles = alive
            }
        }
    }

    // MARK: - Spawning

    private func fireBurst(in size: CGSize) {
        Haptics.success()
        let centre = origin ?? CGPoint(x: size.width / 2, y: size.height * 0.32)
        var batch: [ConfettoParticle] = []
        batch.reserveCapacity(particleCount)
        for _ in 0..<particleCount {
            let angle = Double.random(in: 0...(.pi * 2))
            let speed = CGFloat.random(in: 180...440)
            let dx = cos(angle) * Double(speed)
            let dy = sin(angle) * Double(speed) - 240   // bias upward
            batch.append(ConfettoParticle(
                x: centre.x,
                y: centre.y,
                dx: CGFloat(dx),
                dy: CGFloat(dy),
                rotation: Double.random(in: 0...360),
                spin: Double.random(in: -3...3),
                color: palette.randomElement()!,
                shape: ConfettoShape.allCases.randomElement()!,
                size: CGFloat.random(in: 7...13),
                age: 0,
                lifespan: Double.random(in: 1.4...2.4)
            ))
        }
        particles.append(contentsOf: batch)
        startTime = Date()
    }
}

// MARK: - Convenience modifier

extension View {
    /// Drop a confetti emitter on top of any view.
    /// Bind an Int counter — bump it to fire a burst.
    func wsConfetti(trigger: Binding<Int>) -> some View {
        ZStack {
            self
            WSConfettiView(trigger: trigger)
                .ignoresSafeArea()
        }
    }
}

// MARK: - Preview

#Preview("Confetti tap to celebrate") {
    struct DemoCard: View {
        @State private var celebrate = 0
        var body: some View {
            ZStack {
                WSGradient.heroBackdrop.ignoresSafeArea()
                VStack(spacing: 24) {
                    Spacer()
                    WSAnimatedImage(name: "mascot-dance", ext: "webp")
                        .frame(width: 140, height: 140)
                    Text("Tap below to celebrate")
                        .wsHeadline(.medium, weight: .bold)
                    Button("🎉 Burst") {
                        celebrate += 1
                    }
                    .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: false))
                    Spacer()
                }
                WSConfettiView(trigger: $celebrate)
            }
        }
    }
    return DemoCard()
}
