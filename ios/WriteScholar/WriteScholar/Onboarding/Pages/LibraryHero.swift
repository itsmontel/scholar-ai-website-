//
//  LibraryHero.swift
//  WriteScholar
//
//  Page 6 — composite: real flashcard + crossword + analyse screenshots
//  arranged as small "saved items" cards, with the laptop mascot studying
//  alongside and a floating 12-day streak badge.
//

import SwiftUI

struct LibraryHero: View {
    let progress: CGFloat

    private struct Item {
        let title: String
        let subtitle: String
        let imageName: String
        let tint: Color
    }

    private static let items: [Item] = [
        .init(title: "Climate Change",  subtitle: "Essay · A-",       imageName: "screenshot-analyse",   tint: Color(hex: 0x7C3AED)),
        .init(title: "Cell Biology",    subtitle: "32 flashcards",    imageName: "screenshot-flashcards", tint: Color(hex: 0xD946EF)),
        .init(title: "World War 2",     subtitle: "Crossword · 14",   imageName: "screenshot-crossword", tint: Color(hex: 0x6366F1)),
        .init(title: "Microeconomics",  subtitle: "Lesson · 8 min",   imageName: "screenshot-lesson",    tint: Color(hex: 0x10B981))
    ]

    @State private var streakBob: CGFloat = 0
    @State private var visibleItems = 0

    var body: some View {
        ZStack {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                ForEach(Array(Self.items.enumerated()), id: \.offset) { idx, item in
                    libraryTile(item)
                        .opacity(idx < visibleItems ? 1 : 0)
                        .offset(y: idx < visibleItems ? 0 : 22)
                        .animation(.spring(response: 0.45, dampingFraction: 0.7).delay(Double(idx) * 0.08), value: visibleItems)
                }
            }
            .frame(maxWidth: 320)

            // Laptop mascot studying alongside the library
            WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                .frame(width: 100, height: 100)
                .offset(x: 130, y: 140)
                .rotationEffect(.degrees(8))
                .shadow(color: Color(hex: 0x7C3AED, opacity: 0.28), radius: 16, y: 8)

            // 12-day streak badge floating top-left
            streakBadge
                .offset(x: -90, y: -150 + streakBob)
                .rotationEffect(.degrees(-5))
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                streakBob = -8
            }
            for i in 0..<Self.items.count {
                DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * 0.08) {
                    visibleItems = i + 1
                }
            }
        }
    }

    private var streakBadge: some View {
        HStack(spacing: 6) {
            Image(systemName: "flame.fill")
                .foregroundStyle(Color(hex: 0xF59E0B))
                .shadow(color: Color(hex: 0xF59E0B).opacity(0.6), radius: 4)
            Text("12-day streak")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foreground)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            Capsule().fill(WSColor.backgroundElevated)
                .overlay(Capsule().stroke(Color(hex: 0xF59E0B, opacity: 0.45), lineWidth: 1))
                .shadow(color: Color(hex: 0xF59E0B, opacity: 0.32), radius: 14, y: 6)
        )
    }

    private func libraryTile(_ item: Item) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            // Real screenshot thumbnail at the top
            Image(item.imageName)
                .resizable()
                .scaledToFill()
                .frame(height: 56)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(item.tint.opacity(0.35), lineWidth: 1)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Text(item.subtitle)
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
                .shadow(color: item.tint.opacity(0.18), radius: 10, y: 4)
        )
    }
}

#Preview {
    LibraryHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 5))
}
