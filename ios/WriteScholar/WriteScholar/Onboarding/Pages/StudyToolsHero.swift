//
//  StudyToolsHero.swift
//  WriteScholar
//
//  Page 3 — real lesson-plan screenshot in a tilted card with the
//  studying mascot reading alongside, plus a 6-tool tab strip floating
//  underneath that mirrors the in-app tab bar.
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
        .init(title: "Lessons",      icon: "book.pages.fill",         tint: Color(hex: 0x6366F1)),
        .init(title: "Flashcards",   icon: "square.stack.3d.up.fill", tint: Color(hex: 0x7C3AED)),
        .init(title: "Quiz",         icon: "checkmark.bubble.fill",   tint: Color(hex: 0xD946EF)),
        .init(title: "Crossword",    icon: "grid",                    tint: Color(hex: 0xF59E0B)),
        .init(title: "Crater Blast", icon: "burst.fill",              tint: Color(hex: 0xEF4444)),
        .init(title: "Word Tower",   icon: "building.2.fill",         tint: Color(hex: 0x10B981))
    ]

    var body: some View {
        ZStack {
            // Real lesson screenshot — tilted card
            Image("screenshot-lesson")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 300)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Color(hex: 0x10B981).opacity(0.28), lineWidth: 1)
                )
                .shadow(color: Color(hex: 0x10B981, opacity: 0.30), radius: 30, y: 14)
                .rotationEffect(.degrees(2))
                .offset(y: -30)

            // Studying mascot peeks from the right
            WSAnimatedImage(name: "mascot-study", ext: "webp")
                .frame(width: 130, height: 130)
                .offset(x: 120, y: -130 + mascotBob)
                .rotationEffect(.degrees(8))
                .shadow(color: Color(hex: 0x10B981, opacity: 0.30), radius: 18, y: 8)

            // Floating tool strip under the screenshot
            HStack(spacing: 6) {
                ForEach(Array(Self.tools.enumerated()), id: \.offset) { idx, tool in
                    toolPill(tool, visible: idx < visibleTools)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(WSColor.hairline, lineWidth: 1)
                    )
                    .shadow(color: WSColor.brandPrimary.opacity(0.20), radius: 18, y: 10)
            )
            .frame(maxWidth: 340)
            .offset(y: 110)
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
                .foregroundStyle(WSColor.foreground)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .padding(.horizontal, 4)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(tool.tint.opacity(0.12))
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
