//
//  StudyToolsHero.swift
//  WriteScholar
//
//  Page 3 -- real lesson-plan screenshot in a chunky blue card with the
//  studying mascot reading alongside, plus a 6-tool strip of Duolingo-
//  colored chunky tool badges floating underneath.
//

import SwiftUI

struct StudyToolsHero: View {
    let progress: CGFloat

    @State private var mascotBob: CGFloat = 0
    @State private var visibleTools = 0

    private struct Tool {
        let title: String
        let icon: String
        let tint: Color
    }

    private static let tools: [Tool] = [
        .init(title: "Lessons",      icon: "book.pages.fill",         tint: WSColor.duoBlue),
        .init(title: "Flashcards",   icon: "square.stack.3d.up.fill", tint: WSColor.duoPurple),
        .init(title: "Quiz",         icon: "checkmark.bubble.fill",   tint: WSColor.duoGreen),
        .init(title: "Crossword",    icon: "grid",                    tint: WSColor.duoOrange),
        .init(title: "Crater Blast", icon: "burst.fill",              tint: WSColor.duoRed),
        .init(title: "Word Tower",   icon: "building.2.fill",         tint: WSColor.duoGreen)
    ]

    var body: some View {
        ZStack {
            // Real lesson screenshot in a chunky blue card
            Image("screenshot-lesson")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 280)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .wsChunkyCard(
                    cornerRadius: 22,
                    horizontalPadding: 6,
                    verticalPadding: 6,
                    lipHeight: 6,
                    accent: WSColor.duoBlue
                )
                .rotationEffect(.degrees(2))
                .offset(y: -30)
                .wsStaggerEntry(0)

            // Studying mascot peeks from the right
            WSAnimatedImage(name: "mascot-study", ext: "webp")
                .frame(width: 130, height: 130)
                .offset(x: 120, y: -130 + mascotBob)
                .rotationEffect(.degrees(8))
                .shadow(color: WSColor.duoBlue.opacity(0.30), radius: 18, y: 8)
                .wsStaggerEntry(1)

            // Floating chunky tool strip under the screenshot
            HStack(spacing: 6) {
                ForEach(Array(Self.tools.enumerated()), id: \.offset) { idx, tool in
                    toolPill(tool, visible: idx < visibleTools)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 10)
            .wsChunkyCard(
                cornerRadius: 20,
                horizontalPadding: 4,
                verticalPadding: 4,
                lipHeight: 5,
                accent: WSColor.duoBlue
            )
            .frame(maxWidth: 340)
            .offset(y: 110)
            .wsStaggerEntry(2)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                mascotBob = -8
            }
            animateTools()
        }
    }

    private func animateTools() {
        for i in 0..<Self.tools.count {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.07) {
                withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                    visibleTools = i + 1
                }
            }
        }
    }

    @ViewBuilder
    private func toolPill(_ tool: Tool, visible: Bool) -> some View {
        VStack(spacing: 3) {
            Image(systemName: tool.icon)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(tool.tint)
            Text(tool.title)
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.duoText)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(tool.tint.opacity(0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(tool.tint.opacity(0.20), lineWidth: 1)
                )
        )
        .scaleEffect(visible ? 1 : 0.6)
        .opacity(visible ? 1 : 0)
    }
}

#Preview {
    StudyToolsHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 2))
}
