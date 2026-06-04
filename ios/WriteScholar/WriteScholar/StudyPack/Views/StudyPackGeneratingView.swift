//
//  StudyPackGeneratingView.swift
//  WriteScholar
//
//  Loading state shown while the backend builds the study pack. Mirrors
//  the web's progress modal: animated study mascot, progress bar, and a
//  ticker of step messages so the wait feels active.
//

import SwiftUI

struct StudyPackGeneratingView: View {
    private static let steps: [(icon: String, text: String)] = [
        ("doc.text",          "Reading your notes..."),
        ("brain.head.profile", "Pulling out the key ideas..."),
        ("book.pages",        "Writing your lesson..."),
        ("square.stack.3d.up", "Building flashcards..."),
        ("checkmark.bubble",  "Crafting quiz questions..."),
        ("grid",              "Drawing the crossword..."),
        ("burst",             "Loading the boss battle..."),
        ("sparkles",          "Adding the finishing touches...")
    ]

    @State private var stepIndex = 0
    @State private var progress: Double = 0.05

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            VStack(spacing: 28) {
                Spacer()

                // Mascot with green glow
                ZStack {
                    Circle()
                        .fill(WSColor.duoGreenLight)
                        .frame(width: 240, height: 240)
                        .blur(radius: 30)

                    WSAnimatedImage(name: "mascot-study", ext: "webp")
                        .frame(width: 200, height: 200)
                        .shadow(color: WSColor.duoGreen.opacity(0.35), radius: 28, y: 12)
                        .wsBobbing(amount: 8, duration: 2.6)
                }

                // Title
                VStack(spacing: 6) {
                    Text("Building your study pack")
                        .font(WSFont.headline(22, weight: .black))
                        .foregroundStyle(WSColor.duoText)
                    Text("Usually 30-60 seconds.")
                        .font(WSFont.sans(13))
                        .foregroundStyle(WSColor.foregroundMuted)
                }

                // Step ticker — chunky pill
                HStack(spacing: 8) {
                    Image(systemName: Self.steps[stepIndex].icon)
                        .foregroundStyle(WSColor.duoGreen)
                        .font(.system(size: 16, weight: .heavy))
                    Text(Self.steps[stepIndex].text)
                        .font(WSFont.sans(15, weight: .bold))
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
                        .shadow(color: WSColor.duoGreen.opacity(0.12), radius: 8, y: 3)
                )

                // Green Duolingo-style progress bar
                progressBar
                    .frame(height: 16)
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

    private var progressBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(WSColor.duoBorder)
                Capsule()
                    .fill(WSColor.duoGreen)
                    .frame(width: max(16, geo.size.width * progress))
                    .overlay(
                        // Shine stripe inside the bar
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [.white.opacity(0.0), .white.opacity(0.25), .white.opacity(0.0)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                    )
                    .shadow(color: WSColor.duoGreen.opacity(0.4), radius: 4, y: 1)
            }
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

    /// Asymptotically eases progress toward 0.95 so the bar always feels
    /// like it's making forward motion. The actual completion handler in
    /// the coordinator swaps the view away when the response lands.
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
    StudyPackGeneratingView()
}
