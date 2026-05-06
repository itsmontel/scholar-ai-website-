//
//  FlashcardsHero.swift
//  WriteScholar
//
//  Page 4 — real flashcard screenshot fanned with two paper "back" cards
//  behind, the laptop mascot studying alongside.
//

import SwiftUI

struct FlashcardsHero: View {
    let progress: CGFloat

    @State private var stackBob: CGFloat = 0
    @State private var topRotation: Double = -3

    var body: some View {
        ZStack {
            // Back card 2
            cardSurface
                .frame(width: 240, height: 300)
                .rotationEffect(.degrees(8))
                .offset(x: 22, y: 28)
                .opacity(0.65)

            // Back card 1
            cardSurface
                .frame(width: 240, height: 300)
                .rotationEffect(.degrees(-6))
                .offset(x: -16, y: 14)
                .opacity(0.85)

            // Top — real flashcard screenshot
            Image("screenshot-flashcards")
                .resizable()
                .scaledToFit()
                .frame(width: 260)
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(WSColor.brandPrimary.opacity(0.30), lineWidth: 1)
                )
                .shadow(color: Color(hex: 0x7C3AED, opacity: 0.32), radius: 28, y: 14)
                .rotationEffect(.degrees(topRotation))
                .offset(y: stackBob)

            // Studying mascot in the upper right
            WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                .frame(width: 110, height: 110)
                .offset(x: 130, y: -150)
                .rotationEffect(.degrees(6))
                .shadow(color: Color(hex: 0x7C3AED, opacity: 0.28), radius: 16, y: 8)
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

    private var cardSurface: some View {
        RoundedRectangle(cornerRadius: 22, style: .continuous)
            .fill(WSColor.backgroundElevated)
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(WSColor.hairline, lineWidth: 1)
            )
            .shadow(color: Color(hex: 0x7C3AED, opacity: 0.18), radius: 16, y: 8)
    }
}

#Preview {
    FlashcardsHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 3))
}
