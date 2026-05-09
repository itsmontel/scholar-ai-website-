//
//  WelcomeHero.swift
//  WriteScholar
//
//  Page 1 -- animated dancing mascot inside a chunky green card,
//  with floating Duolingo-colored sparkle icons around the outside.
//  Bold, playful, Duolingo-style welcome.
//

import SwiftUI

struct WelcomeHero: View {
    let progress: CGFloat

    @State private var bobOffset: CGFloat = 0
    @State private var glowPulse: CGFloat = 0.92
    @State private var sparklesAppeared = false

    var body: some View {
        ZStack {
            // Outer pulsing green glow ring
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            WSColor.duoGreen.opacity(0.35),
                            WSColor.duoGreen.opacity(0.10),
                            .clear
                        ],
                        center: .center,
                        startRadius: 10,
                        endRadius: 200
                    )
                )
                .frame(width: 360, height: 360)
                .scaleEffect(glowPulse)
                .blur(radius: 12)
                .wsStaggerEntry(0)

            // Chunky mascot card
            VStack(spacing: 0) {
                // Real animated WebP mascot (dancing)
                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 200, height: 200)
                    .offset(y: bobOffset)
            }
            .frame(width: 240, height: 240)
            .wsChunkyCard(
                cornerRadius: 120,
                horizontalPadding: 0,
                verticalPadding: 0,
                lipHeight: 7,
                accent: WSColor.duoGreen
            )
            .wsStaggerEntry(1)

            // Floating Duolingo-colored sparkles around the mascot
            sparkleLayer
                .wsStaggerEntry(2)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                bobOffset = -10
            }
            withAnimation(.easeInOut(duration: 3.4).repeatForever(autoreverses: true)) {
                glowPulse = 1.08
            }
            withAnimation(.easeOut(duration: 0.9).delay(0.2)) {
                sparklesAppeared = true
            }
        }
    }

    private var sparkleLayer: some View {
        ZStack {
            sparkle(symbol: "star.fill",    size: 22, color: WSColor.duoOrange,  x: -120, y: -100)
            sparkle(symbol: "sparkles",     size: 28, color: WSColor.duoPurple,  x:  110, y: -110)
            sparkle(symbol: "star.fill",    size: 16, color: WSColor.duoBlue,    x:  130, y:   70)
            sparkle(symbol: "star.fill",    size: 18, color: WSColor.duoGreen,   x: -140, y:   50)
            sparkle(symbol: "heart.fill",   size: 14, color: WSColor.duoRed,     x:   60, y:  120)
        }
        .opacity(sparklesAppeared ? 1 : 0)
    }

    private func sparkle(symbol: String, size: CGFloat, color: Color, x: CGFloat, y: CGFloat) -> some View {
        Image(systemName: symbol)
            .font(.system(size: size, weight: .bold))
            .foregroundStyle(color)
            .shadow(color: color.opacity(0.4), radius: 6)
            .offset(x: x, y: y)
    }
}

#Preview {
    WelcomeHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 0))
}
