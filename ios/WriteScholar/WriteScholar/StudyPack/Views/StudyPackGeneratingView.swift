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
    @State private var mascotBob = false

    private let accent = WSColor.duoOrange
    private let accentDark = Color(hex: 0xB85F00)

    var body: some View {
        ZStack {
            Color.black.opacity(0.22).ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Floating card
                VStack(spacing: 20) {
                    mascotEmblem

                    VStack(spacing: 6) {
                        Text("Building your study pack")
                            .font(WSFont.headline(20, weight: .black))
                            .foregroundStyle(WSColor.duoText)
                        Text(statusText ?? "Usually 30–60 seconds")
                            .font(WSFont.sans(13, weight: .semibold))
                            .foregroundStyle(WSColor.foregroundMuted)
                            .multilineTextAlignment(.center)
                            .id(statusText ?? "default")
                            .transition(.opacity)
                    }

                    // Live status line
                    HStack(spacing: 8) {
                        Image(systemName: Self.steps[stepIndex].icon)
                            .font(.system(size: 14, weight: .heavy))
                            .foregroundStyle(accent)
                        Text(Self.steps[stepIndex].label + "…")
                            .font(WSFont.sans(14, weight: .bold))
                            .foregroundStyle(WSColor.duoText)
                            .id(stepIndex)
                            .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(
                        Capsule()
                            .fill(WSColor.duoOrangeLight.opacity(0.6))
                            .overlay(Capsule().stroke(accent.opacity(0.25), lineWidth: 1.5))
                    )

                    // Progress bar + step dots
                    VStack(spacing: 10) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(WSColor.duoBorder)
                                Capsule()
                                    .fill(
                                        LinearGradient(
                                            colors: [accent, Color(hex: 0xFFC800)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: max(12, geo.size.width * progress))
                            }
                        }
                        .frame(height: 10)

                        HStack(spacing: 6) {
                            ForEach(0..<Self.steps.count, id: \.self) { i in
                                Circle()
                                    .fill(i <= stepIndex ? accent : WSColor.duoBorder)
                                    .frame(width: i == stepIndex ? 8 : 6, height: i == stepIndex ? 8 : 6)
                                    .animation(.spring(response: 0.35), value: stepIndex)
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 28)
                .background(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .fill(WSColor.backgroundElevated)
                        .shadow(color: accent.opacity(0.20), radius: 32, y: 16)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .stroke(
                            LinearGradient(
                                colors: [Color(hex: 0xFFC36B), accent, accentDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2
                        )
                )
                .padding(.horizontal, 28)

                Spacer()
                Spacer()
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                mascotBob = true
            }
            startStepTicker()
            startProgressEasing()
        }
    }

    // MARK: - Mascot emblem

    private var mascotEmblem: some View {
        ZStack {
            Circle()
                .fill(accent.opacity(0.12))
                .frame(width: 130, height: 130)
                .scaleEffect(mascotBob ? 1.06 : 0.94)

            Circle()
                .stroke(accent.opacity(0.18), lineWidth: 2)
                .frame(width: 108, height: 108)

            WSAnimatedImage(name: "mascot-study", ext: "webp")
                .frame(width: 88, height: 88)
                .offset(y: mascotBob ? -4 : 4)
                .shadow(color: accent.opacity(0.30), radius: 12, y: 6)
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
