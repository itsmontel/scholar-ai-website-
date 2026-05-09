//
//  GamesHero.swift
//  WriteScholar
//
//  Page 5 -- real Word Tower screenshot in a chunky orange card, plus a
//  chunky red Crater Blast badge floating on top, plus the dancing mascot
//  celebrating. Bold, gamified, Duolingo-style energy.
//

import SwiftUI

struct GamesHero: View {
    let progress: CGFloat

    @State private var towerBob: CGFloat = 0
    @State private var blastPulse = false
    @State private var mascotBob: CGFloat = 0

    var body: some View {
        ZStack {
            // Word Tower hero card (real screenshot) in a chunky orange card
            Image("screenshot-wordtower")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 300)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .wsChunkyCard(
                    cornerRadius: 22,
                    horizontalPadding: 6,
                    verticalPadding: 6,
                    lipHeight: 6,
                    accent: WSColor.duoOrange
                )
                .rotationEffect(.degrees(-2))
                .offset(y: towerBob - 10)
                .wsStaggerEntry(0)

            // Floating Crater Blast badge -- chunky red card
            craterBlastBadge
                .offset(x: 100, y: -130)
                .rotationEffect(.degrees(4))
                .scaleEffect(blastPulse ? 1.04 : 0.97)
                .wsStaggerEntry(1)

            // Dancing mascot -- celebrating
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 130, height: 130)
                .offset(x: -130, y: -120 + mascotBob)
                .rotationEffect(.degrees(-8))
                .shadow(color: WSColor.duoOrange.opacity(0.30), radius: 18, y: 8)
                .wsStaggerEntry(2)
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
                .foregroundStyle(.white.opacity(0.90))

            ZStack {
                Image(systemName: "smallcircle.filled.circle.fill")
                    .font(.system(size: 38))
                    .foregroundStyle(WSColor.duoRed)
                    .shadow(color: WSColor.duoRed.opacity(0.5), radius: 14)

                Image(systemName: "burst.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(WSColor.duoOrange)
                    .offset(y: 32)
            }

            Text("Boss battle")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .frame(width: 110, height: 130)
        .wsChunkyCard(
            cornerRadius: 18,
            horizontalPadding: 0,
            verticalPadding: 0,
            lipHeight: 5,
            accent: WSColor.duoRed,
            fillColor: Color(hex: 0x1E1B4B)
        )
    }
}

#Preview {
    GamesHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 4))
}
