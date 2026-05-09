//
//  LibraryHero.swift
//  WriteScholar
//
//  Page 6 -- composite: real flashcard + crossword + analyse screenshots
//  arranged as small "saved items" in chunky Duolingo-colored cards, with
//  the laptop mascot studying alongside and a floating streak badge.
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
        .init(title: "Climate Change",  subtitle: "Essay -- A-",      imageName: "screenshot-analyse",    tint: WSColor.duoPurple),
        .init(title: "Cell Biology",    subtitle: "32 flashcards",    imageName: "screenshot-flashcards", tint: WSColor.duoGreen),
        .init(title: "World War 2",     subtitle: "Crossword -- 14",  imageName: "screenshot-crossword",  tint: WSColor.duoBlue),
        .init(title: "Microeconomics",  subtitle: "Lesson -- 8 min",  imageName: "screenshot-lesson",     tint: WSColor.duoOrange)
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
            .wsStaggerEntry(0)

            // Laptop mascot studying alongside the library
            WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                .frame(width: 100, height: 100)
                .offset(x: 130, y: 140)
                .rotationEffect(.degrees(8))
                .shadow(color: WSColor.duoBlue.opacity(0.28), radius: 16, y: 8)
                .wsStaggerEntry(1)

            // Streak badge floating top-left -- Duolingo orange
            streakBadge
                .offset(x: -90, y: -150 + streakBob)
                .rotationEffect(.degrees(-5))
                .wsStaggerEntry(2)
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
                .foregroundStyle(WSColor.duoOrange)
            Text("12-day streak")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.duoText)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(
            Capsule().fill(WSColor.duoOrangeLight)
                .overlay(
                    Capsule().stroke(WSColor.duoOrange.opacity(0.40), lineWidth: 2)
                )
                .shadow(color: WSColor.duoOrange.opacity(0.20), radius: 10, y: 4)
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
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(item.tint.opacity(0.30), lineWidth: 1.5)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.duoText)
                    .lineLimit(1)
                Text(item.subtitle)
                    .wsBody(.caption, weight: .bold)
                    .foregroundStyle(item.tint)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .wsChunkyCard(
            cornerRadius: 18,
            horizontalPadding: 0,
            verticalPadding: 0,
            lipHeight: 5,
            accent: item.tint
        )
    }
}

#Preview {
    LibraryHero(progress: 1.0)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSGradient.onboardingBackdrop(for: 5))
}
