//
//  EssayAnalyzerHero.swift
//  WriteScholar
//
//  Page 2 -- real essay-analysis screenshot in a chunky purple card,
//  with the paper-writing mascot peeking from the corner and three
//  Duolingo-colored annotation pills floating alongside.
//

import SwiftUI

struct EssayAnalyzerHero: View {
    let progress: CGFloat

    @State private var pillsAppeared = false
    @State private var mascotBob: CGFloat = 0
    @State private var screenshotTilt: Double = -3

    var body: some View {
        ZStack {
            // Real product screenshot inside a chunky purple card
            Image("screenshot-analyse")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 300)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .wsChunkyCard(
                    cornerRadius: 22,
                    horizontalPadding: 6,
                    verticalPadding: 6,
                    lipHeight: 6,
                    accent: WSColor.duoPurple
                )
                .rotationEffect(.degrees(screenshotTilt))
                .wsStaggerEntry(0)

            // Paper-writing mascot peeks from upper left (real WebP)
            WSAnimatedImage(name: "mascot-paper", ext: "webp")
                .frame(width: 110, height: 110)
                .offset(x: -130, y: -150 + mascotBob)
                .rotationEffect(.degrees(-8))
                .shadow(color: WSColor.duoPurple.opacity(0.28), radius: 16, y: 8)
                .wsStaggerEntry(1)

            // Annotation pills around the screenshot -- Duolingo colors
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
            .wsStaggerEntry(2)
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

// MARK: - Annotation pill (Duolingo-colored chunky badges)

struct AnnotationPill: View {
    enum Tone {
        case strong, revise, concern
        var color: Color {
            switch self {
            case .strong:  return WSColor.duoGreen
            case .revise:  return WSColor.duoOrange
            case .concern: return WSColor.duoRed
            }
        }
        var bgColor: Color {
            switch self {
            case .strong:  return WSColor.duoGreenLight
            case .revise:  return WSColor.duoOrangeLight
            case .concern: return WSColor.duoRedLight
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
            Text(label)
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.duoText)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            Capsule()
                .fill(tone.bgColor)
                .overlay(
                    Capsule()
                        .stroke(tone.color.opacity(0.35), lineWidth: 2)
                )
                .shadow(color: tone.color.opacity(0.20), radius: 10, y: 4)
        )
    }
}

#Preview {
    EssayAnalyzerHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 1))
}
