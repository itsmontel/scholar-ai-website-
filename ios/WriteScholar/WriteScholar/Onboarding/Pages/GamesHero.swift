//
//  GamesHero.swift
//  WriteScholar
//
//  Page 5 — real Word Tower screenshot tilted in front, plus a tiny
//  Crater Blast tile floating on top, plus the dancing mascot celebrating.
//

import SwiftUI

struct GamesHero: View {
    let progress: CGFloat

    @State private var towerBob: CGFloat = 0
    @State private var blastPulse = false
    @State private var mascotBob: CGFloat = 0

    var body: some View {
        ZStack {
            // Word Tower hero card (real screenshot)
            Image("screenshot-wordtower")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 320)
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(Color(hex: 0x10B981).opacity(0.30), lineWidth: 1)
                )
                .shadow(color: Color(hex: 0x10B981, opacity: 0.32), radius: 28, y: 14)
                .rotationEffect(.degrees(-2))
                .offset(y: towerBob - 10)

            // Floating Crater Blast pill (since the screenshot is Word Tower)
            craterBlastBadge
                .offset(x: 100, y: -130)
                .rotationEffect(.degrees(4))
                .scaleEffect(blastPulse ? 1.04 : 0.97)

            // Dancing mascot — celebrating
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 130, height: 130)
                .offset(x: -130, y: -120 + mascotBob)
                .rotationEffect(.degrees(-8))
                .shadow(color: Color(hex: 0xD946EF, opacity: 0.30), radius: 18, y: 8)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                towerBob = -10
            }
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                blastPulse = true
            }
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) {
                mascotBob = -10
            }
        }
    }

    private var craterBlastBadge: some View {
        VStack(spacing: 8) {
            Text("CRATER BLAST")
                .wsEyebrow()
                .foregroundStyle(.white.opacity(0.85))

            ZStack {
                Image(systemName: "smallcircle.filled.circle.fill")
                    .font(.system(size: 38))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color(hex: 0xFCA5A5), Color(hex: 0xDC2626)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
                    .shadow(color: Color(hex: 0xEF4444, opacity: 0.5), radius: 14)

                Image(systemName: "burst.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(Color(hex: 0xFBBF24))
                    .offset(y: 32)
            }

            Text("Boss battle")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .frame(width: 110, height: 130)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [Color(hex: 0x312E81), Color(hex: 0x1E1B4B)],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color(hex: 0xEF4444).opacity(0.5), lineWidth: 1)
                )
                .shadow(color: Color(hex: 0xEF4444, opacity: 0.30), radius: 18, y: 8)
        )
    }
}

#Preview {
    GamesHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 4))
}
