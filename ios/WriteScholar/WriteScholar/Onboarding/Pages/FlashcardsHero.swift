//
//  FlashcardsHero.swift
//  WriteScholar
//
//  Page 4 -- real flashcard screenshot fanned with two chunky "back"
//  cards behind, the laptop mascot studying alongside. All cards use
//  Duolingo green chunky card style.
//

import SwiftUI

struct FlashcardsHero: View {
    let progress: CGFloat

    @State private var stackBob: CGFloat = 0
    @State private var topRotation: Double = -3

    var body: some View {
        ZStack {
            // Back card 2 -- chunky green card surface
            cardSurface(accent: WSColor.duoGreenDark)
                .frame(width: 240, height: 300)
                .rotationEffect(.degrees(8))
                .offset(x: 22, y: 28)
                .opacity(0.65)
                .wsStaggerEntry(0)

            // Back card 1
            cardSurface(accent: WSColor.duoGreen)
                .frame(width: 240, height: 300)
                .rotationEffect(.degrees(-6))
                .offset(x: -16, y: 14)
                .opacity(0.85)
                .wsStaggerEntry(1)

            // Top -- real flashcard screenshot in a chunky card
            Image.bundleResource("screenshot-flashcards")
                .resizable()
                .scaledToFit()
                .frame(width: 250)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .wsChunkyCard(
                    cornerRadius: 22,
                    horizontalPadding: 4,
                    verticalPadding: 4,
                    lipHeight: 6,
                    accent: WSColor.duoGreen
                )
                .rotationEffect(.degrees(topRotation))
                .offset(y: stackBob)
                .wsStaggerEntry(2)

            // Studying mascot in the upper right
            WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                .frame(width: 110, height: 110)
                .offset(x: 130, y: -150)
                .rotationEffect(.degrees(6))
                .shadow(color: WSColor.duoGreen.opacity(0.28), radius: 16, y: 8)
                .wsStaggerEntry(3)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                stackBob = -8
            }
            withAnimation(.easeInOut(duration: 5.2).repeatForever(autoreverses: true)) {
                topRotation = 3
            }
        }
    }

    private func cardSurface(accent: Color) -> some View {
        ZStack(alignment: .top) {
            // Bottom lip
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(accent.opacity(0.35))
                .padding(.top, 6)

            // Top face
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(accent.opacity(0.20), lineWidth: 2)
                )
        }
        .compositingGroup()
        .shadow(color: accent.opacity(0.12), radius: 10, y: 4)
    }
}

#Preview {
    FlashcardsHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 3))
}
