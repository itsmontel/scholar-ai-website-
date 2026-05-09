//
//  GetStartedHero.swift
//  WriteScholar
//
//  Page 7 -- final CTA hero. The dancing mascot front and centre, with
//  a chunky green "7 days free trial" badge and a rotating ring of
//  Duolingo-colored feature pills. Bold, celebratory energy.
//

import SwiftUI

struct GetStartedHero: View {
    let progress: CGFloat

    private let pills: [(String, Color)] = [
        ("Essay analyzer", WSColor.duoPurple),
        ("Study packs",    WSColor.duoBlue),
        ("Flashcards",     WSColor.duoGreen),
        ("Crater Blast",   WSColor.duoRed),
        ("Word Tower",     WSColor.duoOrange),
        ("Citations",      WSColor.duoPurple)
    ]

    @State private var ringRotation: Double = 0
    @State private var badgeScale: CGFloat = 0.85
    @State private var confettiAppeared = false

    var body: some View {
        ZStack {
            // Confetti scattered behind -- Duolingo palette
            ForEach(0..<14, id: \.self) { i in
                let palette = [
                    WSColor.duoGreen,
                    WSColor.duoPurple,
                    WSColor.duoBlue,
                    WSColor.duoOrange,
                    WSColor.duoRed
                ]
                Circle()
                    .fill(palette[i % palette.count])
                    .frame(width: 8, height: 8)
                    .offset(
                        x: CGFloat(cos(Double(i) * 0.9)) * 145,
                        y: CGFloat(sin(Double(i) * 0.9)) * 145
                    )
                    .opacity(confettiAppeared ? 0.85 : 0)
                    .scaleEffect(confettiAppeared ? 1 : 0.3)
                    .animation(.spring(response: 0.7, dampingFraction: 0.7).delay(Double(i) * 0.04), value: confettiAppeared)
            }

            // Rotating feature ring -- each pill in its Duolingo color
            ZStack {
                ForEach(Array(pills.enumerated()), id: \.offset) { idx, pill in
                    let angle = (Double(idx) / Double(pills.count)) * 2 * .pi
                    Text(pill.0)
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(pill.1)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule().fill(pill.1.opacity(0.12))
                                .overlay(
                                    Capsule().stroke(pill.1.opacity(0.30), lineWidth: 1.5)
                                )
                                .shadow(color: pill.1.opacity(0.15), radius: 6, y: 2)
                        )
                        .offset(
                            x: cos(angle) * 145,
                            y: sin(angle) * 145
                        )
                        .rotationEffect(.degrees(-ringRotation)) // counter-rotate so text stays upright
                }
            }
            .rotationEffect(.degrees(ringRotation))
            .wsStaggerEntry(0)

            // Dancing mascot in the centre
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 180, height: 180)
                .scaleEffect(badgeScale)
                .shadow(color: WSColor.duoGreen.opacity(0.30), radius: 24, y: 10)
                .wsStaggerEntry(1)

            // "7 days free trial" trophy floating top-right -- chunky green badge
            trialBadge
                .offset(x: 90, y: -110)
                .rotationEffect(.degrees(8))
                .wsStaggerEntry(2)
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
                .foregroundStyle(.white.opacity(0.90))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            ZStack(alignment: .top) {
                // Lip
                Capsule()
                    .fill(WSColor.duoGreenDark)
                    .padding(.top, 4)
                // Top face
                Capsule()
                    .fill(WSColor.duoGreen)
                    .overlay(Capsule().stroke(.white.opacity(0.20), lineWidth: 1.5))
            }
            .shadow(color: WSColor.duoGreen.opacity(0.35), radius: 12, y: 6)
        )
    }
}

#Preview {
    GetStartedHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 6))
}
