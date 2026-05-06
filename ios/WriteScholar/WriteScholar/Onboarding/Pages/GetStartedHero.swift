//
//  GetStartedHero.swift
//  WriteScholar
//
//  Page 7 — final CTA hero. The dancing mascot front and centre, with
//  a "7 days free trial" trophy badge and a rotating ring of feature
//  pills around the outside.
//

import SwiftUI

struct GetStartedHero: View {
    let progress: CGFloat

    private let pills = [
        "Essay analyzer",
        "Study packs",
        "Flashcards",
        "Crater Blast",
        "Word Tower",
        "Citations"
    ]

    @State private var ringRotation: Double = 0
    @State private var badgeScale: CGFloat = 0.85
    @State private var confettiAppeared = false

    var body: some View {
        ZStack {
            // Confetti scattered behind
            ForEach(0..<14, id: \.self) { i in
                let palette = [
                    Color(hex: 0x7C3AED),
                    Color(hex: 0xD946EF),
                    Color(hex: 0x10B981),
                    Color(hex: 0xF59E0B),
                    Color(hex: 0x6366F1)
                ]
                Circle()
                    .fill(palette[i % palette.count])
                    .frame(width: 7, height: 7)
                    .offset(
                        x: CGFloat(cos(Double(i) * 0.9)) * 145,
                        y: CGFloat(sin(Double(i) * 0.9)) * 145
                    )
                    .opacity(confettiAppeared ? 0.85 : 0)
                    .scaleEffect(confettiAppeared ? 1 : 0.3)
                    .animation(.spring(response: 0.7, dampingFraction: 0.7).delay(Double(i) * 0.04), value: confettiAppeared)
            }

            // Rotating feature ring
            ZStack {
                ForEach(Array(pills.enumerated()), id: \.offset) { idx, pill in
                    let angle = (Double(idx) / Double(pills.count)) * 2 * .pi
                    Text(pill)
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule().fill(WSColor.backgroundElevated)
                                .overlay(Capsule().stroke(WSColor.brandPrimary.opacity(0.30), lineWidth: 1))
                                .shadow(color: WSColor.brandPrimary.opacity(0.20), radius: 8, y: 3)
                        )
                        .offset(
                            x: cos(angle) * 145,
                            y: sin(angle) * 145
                        )
                        .rotationEffect(.degrees(-ringRotation)) // counter-rotate so text stays upright
                }
            }
            .rotationEffect(.degrees(ringRotation))

            // Dancing mascot in the centre
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 180, height: 180)
                .scaleEffect(badgeScale)
                .shadow(color: Color(hex: 0x7C3AED, opacity: 0.40), radius: 30, y: 12)

            // "7 days free trial" trophy floating top-right
            trialBadge
                .offset(x: 90, y: -110)
                .rotationEffect(.degrees(8))
        }
        .frame(width: 360, height: 360)
        .onAppear {
            withAnimation(.linear(duration: 30).repeatForever(autoreverses: false)) {
                ringRotation = 360
            }
            withAnimation(.spring(response: 0.7, dampingFraction: 0.65)) {
                badgeScale = 1.0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                confettiAppeared = true
            }
        }
    }

    private var trialBadge: some View {
        VStack(spacing: 2) {
            Text("7 DAYS")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(.white)
            Text("FREE TRIAL")
                .wsEyebrow()
                .foregroundStyle(.white.opacity(0.85))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            Capsule()
                .fill(WSGradient.brand)
                .overlay(Capsule().stroke(.white.opacity(0.25), lineWidth: 1.5))
                .shadow(color: WSColor.brandPrimary.opacity(0.45), radius: 18, y: 8)
        )
    }
}

#Preview {
    GetStartedHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 6))
}
