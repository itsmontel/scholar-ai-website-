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
        ("doc.text",          "Reading your notes…"),
        ("brain.head.profile", "Pulling out the key ideas…"),
        ("book.pages",        "Writing your lesson…"),
        ("square.stack.3d.up", "Building flashcards…"),
        ("checkmark.bubble",  "Crafting quiz questions…"),
        ("grid",              "Drawing the crossword…"),
        ("burst",             "Loading the boss battle…"),
        ("sparkles",          "Adding the finishing touches…")
    ]

    @State private var stepIndex = 0
    @State private var progress: Double = 0.05

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Background pulsing glow
            Circle()
                .fill(
                    RadialGradient(
                        colors: [WSColor.brandPrimary.opacity(0.35), .clear],
                        center: .center,
                        startRadius: 20,
                        endRadius: 260
                    )
                )
                .frame(width: 460, height: 460)
                .blur(radius: 26)

            VStack(spacing: 28) {
                Spacer()

                // Mascot
                WSAnimatedImage(name: "mascot-study", ext: "webp")
                    .frame(width: 200, height: 200)
                    .shadow(color: WSColor.brandPrimary.opacity(0.35), radius: 28, y: 12)

                // Title
                VStack(spacing: 6) {
                    Text("Building your study pack")
                        .wsHeadline(.medium, weight: .semibold)
                        .foregroundStyle(WSColor.foreground)
                    Text("Usually 30–60 seconds.")
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                }

                // Step ticker
                HStack(spacing: 8) {
                    Image(systemName: Self.steps[stepIndex].icon)
                        .foregroundStyle(WSColor.brandPrimary)
                    Text(Self.steps[stepIndex].text)
                        .wsBody(.medium, weight: .semibold)
                        .foregroundStyle(WSColor.foreground)
                        .id(stepIndex) // forces transition on change
                        .transition(.asymmetric(
                            insertion: .opacity.combined(with: .move(edge: .bottom)),
                            removal: .opacity.combined(with: .move(edge: .top))
                        ))
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 12)
                .background(
                    Capsule().fill(WSColor.backgroundElevated)
                        .overlay(Capsule().stroke(WSColor.hairline, lineWidth: 1))
                )

                // Progress bar
                progressBar
                    .frame(height: 8)
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
                Capsule().fill(WSColor.surface)
                Capsule()
                    .fill(WSGradient.brand)
                    .frame(width: max(8, geo.size.width * progress))
                    .shadow(color: WSColor.brandPrimary.opacity(0.4), radius: 6, y: 1)
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
