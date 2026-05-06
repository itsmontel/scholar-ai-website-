//
//  WelcomeHero.swift
//  WriteScholar
//
//  Page 1 — animated dancing mascot inside a violet halo, with floating
//  brand sparkles. Matches the web hero's mascot-aside aesthetic.
//

import SwiftUI

struct WelcomeHero: View {
    let progress: CGFloat

    @State private var bobOffset: CGFloat = 0
    @State private var glowScale: CGFloat = 0.85
    @State private var sparklesAppeared = false

    var body: some View {
        ZStack {
            // Outer pulsing brand glow
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            Color(hex: 0x7C3AED, opacity: 0.55),
                            Color(hex: 0xD946EF, opacity: 0.30),
                            .clear
                        ],
                        center: .center,
                        startRadius: 10,
                        endRadius: 240
                    )
                )
                .frame(width: 380, height: 380)
                .scaleEffect(glowScale)
                .blur(radius: 18)

            // Soft white disc backing the mascot
            Circle()
                .fill(WSColor.backgroundElevated)
                .frame(width: 240, height: 240)
                .shadow(color: Color(hex: 0x7C3AED, opacity: 0.30), radius: 36, y: 18)
                .overlay(
                    Circle().stroke(WSColor.brandSoft, lineWidth: 1)
                )

            // Real animated WebP mascot (dancing)
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 220, height: 220)
                .offset(y: bobOffset)

            // Floating brand sparkles, layered around the mascot
            sparkleLayer
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                bobOffset = -10
            }
            withAnimation(.easeInOut(duration: 3.4).repeatForever(autoreverses: true)) {
                glowScale = 1.12
            }
            withAnimation(.easeOut(duration: 0.9).delay(0.2)) {
                sparklesAppeared = true
            }
        }
    }

    private var sparkleLayer: some View {
        ZStack {
            sparkle(symbol: "sparkle",  size: 22, color: Color(hex: 0xFBBF24), x: -110, y: -90)
            sparkle(symbol: "sparkles", size: 30, color: Color(hex: 0xD946EF), x:  100, y: -100)
            sparkle(symbol: "sparkle",  size: 18, color: Color(hex: 0x6366F1), x:  120, y:  80)
            sparkle(symbol: "sparkle",  size: 16, color: Color(hex: 0x10B981), x: -130, y:  50)
        }
        .opacity(sparklesAppeared ? 1 : 0)
    }

    private func sparkle(symbol: String, size: CGFloat, color: Color, x: CGFloat, y: CGFloat) -> some View {
        Image(systemName: symbol)
            .font(.system(size: size, weight: .bold))
            .foregroundStyle(color)
            .shadow(color: color.opacity(0.55), radius: 8)
            .offset(x: x, y: y)
    }
}

#Preview {
    WelcomeHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 0))
}
