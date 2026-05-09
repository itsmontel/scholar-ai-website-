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
            WSColor.duoSurface.ignoresSafeArea()

            VStack(spacing: 28) {
                Spacer()

                WSAnimatedImage(name: "mascot-paper", ext: "webp")
                    .frame(width: 200, height: 200)
                    .shadow(color: WSColor.duoGreen.opacity(0.35), radius: 28, y: 12)
                    .wsBobbing()

                VStack(spacing: 6) {
                    Text("Reading your paper")
                        .wsHeadline(.medium, weight: .black)
                        .foregroundStyle(WSColor.duoText)
                    Text("Usually 30-60 seconds.")
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                }

                HStack(spacing: 8) {
                    Image(systemName: Self.steps[stepIndex].icon)
                        .foregroundStyle(WSColor.duoGreen)
                    Text(Self.steps[stepIndex].text)
                        .wsBody(.medium, weight: .semibold)
                        .foregroundStyle(WSColor.duoText)
                        .id(stepIndex)
                        .transition(.asymmetric(
                            insertion: .opacity.combined(with: .move(edge: .bottom)),
                            removal: .opacity.combined(with: .move(edge: .top))
                        ))
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 12)
                .background(
                    Capsule().fill(WSColor.backgroundElevated)
                        .overlay(Capsule().stroke(WSColor.duoBorder, lineWidth: 2))
                )

                WSProgressBar(fraction: progress, tint: WSColor.duoGreen, height: 14)
                    .padding(.horizontal, 32)

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
