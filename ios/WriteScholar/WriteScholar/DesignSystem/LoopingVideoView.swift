//
//  LoopingVideoView.swift
//  WriteScholar
//
//  A muted, autoplaying, seamlessly-looping video loaded from a bundled
//  resource (e.g. the arcade game previews in Resources/game-*.mp4).
//  Renders nothing if the resource is missing.
//

import SwiftUI
import AVFoundation
import UIKit

struct LoopingVideoView: UIViewRepresentable {
    let resourceName: String
    var ext: String = "mp4"

    func makeUIView(context: Context) -> LoopingPlayerUIView {
        LoopingPlayerUIView(resourceName: resourceName, ext: ext)
    }

    func updateUIView(_ uiView: LoopingPlayerUIView, context: Context) {}
}

final class LoopingPlayerUIView: UIView {
    private var looper: AVPlayerLooper?
    private let queuePlayer = AVQueuePlayer()
    private let playerLayer = AVPlayerLayer()

    init(resourceName: String, ext: String) {
        super.init(frame: .zero)
        backgroundColor = .clear

        guard let url = Bundle.main.url(forResource: resourceName, withExtension: ext) else {
            return
        }
        let item = AVPlayerItem(url: url)
        looper = AVPlayerLooper(player: queuePlayer, templateItem: item)
        queuePlayer.isMuted = true
        queuePlayer.actionAtItemEnd = .advance

        playerLayer.player = queuePlayer
        playerLayer.videoGravity = .resizeAspectFill
        layer.addSublayer(playerLayer)

        queuePlayer.play()

        // Players pause when the app backgrounds — resume on return.
        NotificationCenter.default.addObserver(
            self, selector: #selector(resume),
            name: UIApplication.didBecomeActiveNotification, object: nil
        )
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    @objc private func resume() { queuePlayer.play() }

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer.frame = bounds
    }
}
