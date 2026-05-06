//
//  EssayAnalyzerHero.swift
//  WriteScholar
//
//  Page 2 — real essay-analysis screenshot floats in a card, with the
//  paper-writing mascot peeking from the corner and three annotation pills
//  pulsing in alongside.
//

import SwiftUI

struct EssayAnalyzerHero: View {
    let progress: CGFloat

    @State private var pillsAppeared = false
    @State private var mascotBob: CGFloat = 0
    @State private var screenshotTilt: Double = -3

    var body: some View {
        ZStack {
            // Real product screenshot — tilted into a card
            Image("screenshot-analyse")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 320)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(WSColor.brandPrimary.opacity(0.25), lineWidth: 1)
                )
                .shadow(color: Color(hex: 0x7C3AED, opacity: 0.30), radius: 30, y: 14)
                .rotationEffect(.degrees(screenshotTilt))

            // Paper-writing mascot peeks from upper left (real WebP)
            WSAnimatedImage(name: "mascot-paper", ext: "webp")
                .frame(width: 110, height: 110)
                .offset(x: -130, y: -150 + mascotBob)
                .rotationEffect(.degrees(-8))
                .shadow(color: Color(hex: 0x7C3AED, opacity: 0.28), radius: 16, y: 8)

            // Annotation pills around the screenshot
            ZStack {
                AnnotationPill(label: "Strong thesis", tone: .strong)
                    .offset(x: -110, y: -50)
                    .rotationEffect(.degrees(-4))
                    .opacity(pillsAppeared ? 1 : 0)
                    .scaleEffect(pillsAppeared ? 1 : 0.7)

                AnnotationPill(label: "Tighten transition", tone: .revise)
                    .offset(x: 100, y: 20)
                    .rotationEffect(.degrees(3))
                    .opacity(pillsAppeared ? 1 : 0)
                    .scaleEffect(pillsAppeared ? 1 : 0.7)

                AnnotationPill(label: "Cite this claim", tone: .concern)
                    .offset(x: -90, y: 110)
                    .rotationEffect(.degrees(-2))
                    .opacity(pillsAppeared ? 1 : 0)
                    .scaleEffect(pillsAppeared ? 1 : 0.7)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                mascotBob = -8
            }
            withAnimation(.easeInOut(duration: 4.5).repeatForever(autoreverses: true)) {
                screenshotTilt = -1
            }
            withAnimation(.spring(response: 0.6, dampingFraction: 0.65).delay(0.2)) {
                pillsAppeared = true
            }
        }
    }
}

// MARK: - Annotation pill (shared with Essay hero)

struct AnnotationPill: View {
    enum Tone {
        case strong, revise, concern
        var color: Color {
            switch self {
            case .strong:  return WSColor.strong
            case .revise:  return WSColor.revise
            case .concern: return WSColor.concern
            }
        }
        var icon: String {
            switch self {
            case .strong:  return "checkmark.circle.fill"
            case .revise:  return "exclamationmark.triangle.fill"
            case .concern: return "xmark.octagon.fill"
            }
        }
    }

    let label: String
    let tone: Tone

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: tone.icon)
                .foregroundStyle(tone.color)
                .font(.system(size: 14, weight: .bold))
                .shadow(color: tone.color.opacity(0.6), radius: 6)
            Text(label)
                .wsBody(.small, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            Capsule()
                .fill(WSColor.backgroundElevated)
                .overlay(Capsule().stroke(tone.color.opacity(0.35), lineWidth: 1))
                .shadow(color: tone.color.opacity(0.30), radius: 18, y: 6)
        )
    }
}

#Preview {
    EssayAnalyzerHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 1))
}
