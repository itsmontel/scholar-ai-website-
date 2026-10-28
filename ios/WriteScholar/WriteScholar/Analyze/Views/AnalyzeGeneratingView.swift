//
//  AnalyzeGeneratingView.swift
//  WriteScholar
//
//  Animated loading screen for the Analyze flow. Mirrors the StudyPack
//  loader visually but uses the paper-writing mascot and analysis-flavored
//  step messages.
//

import SwiftUI

struct AnalyzeGeneratingView: View {
    private static let steps: [(icon: String, text: String)] = [
        ("doc.text",                  "Reading your essay..."),
        ("text.book.closed",          "Mapping the structure..."),
        ("checkmark.bubble",          "Checking your thesis..."),
        ("quote.bubble",              "Reviewing transitions and tone..."),
        ("checklist",                 "Scoring against the rubric..."),
        ("highlighter",               "Marking strong, revise, concern..."),
        ("books.vertical",            "Looking at citations..."),
        ("sparkles",                  "Drafting your suggestions...")
    ]

    @State private var stepIndex = 0
    @State private var progress: Double = 0.05

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            VStack(spacing: 28) {
                Spacer()

                WSMascotHero(asset: "mascot-paper", size: 180, haloTint: WSColor.pink)

                VStack(spacing: 8) {
                    Text("Grading your essay…")
                        .font(WSFont.headline(34, weight: .black))
                        .tracking(-1)
                        .foregroundStyle(WSColor.foreground)
                    Text("Usually 30 to 60 seconds.")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.foregroundMuted)
                }

                HStack(spacing: 8) {
                    Image(systemName: Self.steps[stepIndex].icon)
                        .font(.system(size: 14, weight: .black))
                    Text(Self.steps[stepIndex].text)
                        .font(WSFont.headline(16, weight: .black))
                        .id(stepIndex)
                        .transition(.asymmetric(
                            insertion: .opacity.combined(with: .move(edge: .bottom)),
                            removal: .opacity.combined(with: .move(edge: .top))
                        ))
                }
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, 18)
                .padding(.vertical, 12)
                .wsStickerCapsule(fill: WSColor.sky, depth: 3)

                WSStripeBar(fraction: progress, fill: WSColor.pink, height: 18)
                    .padding(.horizontal, 24)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .onAppear {
            startStepTicker()
            startProgressEasing()
        }
    }

    private func startStepTicker() {
        Timer.scheduledTimer(withTimeInterval: 2.4, repeats: true) { timer in
            DispatchQueue.main.async {
                withAnimation(.easeInOut(duration: 0.45)) {
                    stepIndex = (stepIndex + 1) % Self.steps.count
                }
            }
        }
    }

    private func startProgressEasing() {
        Timer.scheduledTimer(withTimeInterval: 0.18, repeats: true) { timer in
            DispatchQueue.main.async {
                withAnimation(.easeOut(duration: 0.3)) {
                    let remaining = 0.95 - progress
                    progress += remaining * 0.04
                }
            }
        }
    }
}

#Preview {
    AnalyzeGeneratingView()
}
