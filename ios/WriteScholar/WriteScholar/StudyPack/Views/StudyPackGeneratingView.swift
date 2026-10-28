//
//  StudyPackGeneratingView.swift
//  WriteScholar
//
//  Compact mascot-led loading card shown while the backend builds a study
//  pack. Mirrors the desktop GenerationOverlay — less vertical, one live
//  status line, slim progress bar with step dots.
//

import SwiftUI

struct StudyPackGeneratingView: View {
    private static let steps: [(icon: String, label: String)] = [
        ("doc.text",           "Reading your material"),
        ("brain.head.profile", "Pulling out key ideas"),
        ("book.pages",         "Writing your lesson"),
        ("rectangle.on.rectangle.angled", "Building flashcards"),
        ("checkmark.bubble",   "Crafting quiz questions"),
        ("gamecontroller.fill", "Loading arcade games"),
        ("sparkles",           "Finishing touches"),
    ]

    var statusText: String? = nil

    @State private var stepIndex = 0
    @State private var progress: Double = 0.06

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            VStack(spacing: 22) {
                Spacer()

                WSMascotHero(asset: "mascot-juggling", size: 170, haloTint: WSColor.lime)

                VStack(spacing: 8) {
                    Text("Cooking your pack…")
                        .font(WSFont.headline(34, weight: .black))
                        .tracking(-1)
                        .foregroundStyle(WSColor.foreground)
                    Text(statusText ?? "Usually 30 to 60 seconds")
                        .font(WSFont.sans(14, weight: .bold))
                        .foregroundStyle(WSColor.foregroundMuted)
                        .multilineTextAlignment(.center)
                        .id(statusText ?? "default")
                        .transition(.opacity)
                }

                // Live status line
                HStack(spacing: 8) {
                    Image(systemName: Self.steps[stepIndex].icon)
                        .font(.system(size: 14, weight: .black))
                    Text(Self.steps[stepIndex].label + "…")
                        .font(WSFont.headline(16, weight: .black))
                        .id(stepIndex)
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .wsStickerCapsule(fill: WSColor.orange, depth: 3)

                VStack(spacing: 12) {
                    WSStripeBar(fraction: progress, fill: WSColor.purple, height: 18)
                    HStack(spacing: 6) {
                        ForEach(0..<Self.steps.count, id: \.self) { i in
                            Circle()
                                .fill(i <= stepIndex ? WSColor.lime : WSColor.backgroundElevated)
                                .overlay(Circle().strokeBorder(WSColor.ink, lineWidth: 1.5))
                                .frame(width: i == stepIndex ? 12 : 9, height: i == stepIndex ? 12 : 9)
                                .animation(.spring(response: 0.35), value: stepIndex)
                        }
                    }
                }
                .padding(.horizontal, 12)

                Spacer()
                Spacer()
            }
            .padding(.horizontal, 28)
        }
        .onAppear {
            startStepTicker()
            startProgressEasing()
        }
    }

    private func startStepTicker() {
        Timer.scheduledTimer(withTimeInterval: 2.2, repeats: true) { _ in
            DispatchQueue.main.async {
                withAnimation(.easeInOut(duration: 0.4)) {
                    stepIndex = (stepIndex + 1) % Self.steps.count
                }
            }
        }
    }

    private func startProgressEasing() {
        Timer.scheduledTimer(withTimeInterval: 0.16, repeats: true) { _ in
            DispatchQueue.main.async {
                withAnimation(.easeOut(duration: 0.28)) {
                    progress += (0.94 - progress) * 0.035
                }
            }
        }
    }
}

#Preview {
    StudyPackGeneratingView(statusText: "Reading your PDF...")
}
