//
//  WSProgressBar.swift
//  WriteScholar
//
//  Chunky 3D progress bar with a sliding white shimmer that mirrors the
//  desktop's `dash-progress-fill` keyframe (35% width white sweep, 0→220%
//  every 2.6s). Centralizes the four progress bars previously inlined in:
//
//    • QuizView (line 113)
//    • LessonView (line 74)
//    • FocusUnlockChallenge (line 121)
//    • AnalyzeGeneratingView (line 81)
//
//  All four now share one implementation, one shimmer cadence and one
//  fill-on-change spring.
//

import SwiftUI

/// Chunky progress bar with darker base lip + sliding white shimmer.
///
///     WSProgressBar(fraction: 0.35, tint: WSColor.duoGreen)
///         .frame(height: 14)
///
/// `fraction` is clamped 0…1. Animate the binding to make the fill spring
/// in on change.
struct WSProgressBar: View {
    var fraction: Double
    var tint: Color = WSColor.duoGreen
    var height: CGFloat = 14
    var showsShimmer: Bool = true
    var trackColor: Color = WSColor.duoBorder.opacity(0.55)

    private var clamped: Double { min(1.0, max(0.0, fraction)) }

    var body: some View {
        // Sticker restyle: ink-outlined capsule with marching stripes.
        // `trackColor` / `showsShimmer` map onto the stripe bar's track and
        // stripes so existing call sites keep their intent.
        WSStripeBar(fraction: clamped,
                    fill: WSStickerTint.face(for: tint),
                    track: tint == .white ? Color.white.opacity(0.25) : WSColor.lilacDeep,
                    height: height,
                    stripes: showsShimmer)
    }
}

// MARK: - Heart-tinted variant (used in quizzes when running low on hearts)

extension WSProgressBar {
    /// Adjusts tint based on remaining fraction — green > 0.66, orange > 0.33,
    /// red below. Useful for hearts / time-remaining indicators.
    static func adaptive(fraction: Double, height: CGFloat = 14) -> WSProgressBar {
        let tint: Color
        if fraction > 0.66 { tint = WSColor.duoGreen }
        else if fraction > 0.33 { tint = WSColor.duoOrange }
        else { tint = WSColor.duoRed }
        return WSProgressBar(fraction: fraction, tint: tint, height: height)
    }
}

// MARK: - Step indicator (used by Lesson / Onboarding)

/// Multi-segment progress indicator (e.g. "you're on slide 3 of 8"). Each
/// segment is a chunky pill that fills in green when reached.
struct WSStepProgress: View {
    var current: Int
    var total: Int
    var tint: Color = WSColor.duoGreen
    var height: CGFloat = 8

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<total, id: \.self) { i in
                RoundedRectangle(cornerRadius: height / 2, style: .continuous)
                    .fill(i < current ? tint : WSColor.duoBorder.opacity(0.55))
                    .frame(height: height)
                    .overlay(
                        RoundedRectangle(cornerRadius: height / 2, style: .continuous)
                            .stroke(i < current ? tint.mix(with: .black, by: 0.15) : WSColor.duoBorder,
                                    lineWidth: 1)
                    )
                    .scaleEffect(y: i == current - 1 ? 1.15 : 1.0, anchor: .center)
                    .animation(.spring(response: 0.30, dampingFraction: 0.70), value: current)
            }
        }
    }
}

// MARK: - Preview

#Preview("Progress bars") {
    VStack(spacing: 22) {
        WSProgressBar(fraction: 0.0)
        WSProgressBar(fraction: 0.35)
        WSProgressBar(fraction: 0.65, tint: WSColor.duoOrange)
        WSProgressBar(fraction: 1.0, tint: WSColor.duoPurple, height: 18)
        WSProgressBar.adaptive(fraction: 0.20)
        WSStepProgress(current: 3, total: 8)
    }
    .padding()
    .background(WSColor.duoSurface)
}
