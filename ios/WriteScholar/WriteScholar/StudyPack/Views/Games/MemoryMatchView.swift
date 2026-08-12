//
//  MemoryMatchView.swift
//  WriteScholar
//
//  Memory Match — flip cards to pair a term with its definition. Fewer
//  moves + faster time = higher score. Pairs come from a study pack's
//  flashcards ("My Notes") or a built-in general-knowledge set.
//

import SwiftUI

/// A term↔definition pairing. Two face-down cards are generated per pair.
struct MemoryPair: Identifiable {
    let id = UUID().uuidString
    let term: String
    let definition: String
}

struct MemoryMatchView: View {
    let title: String
    let pairs: [MemoryPair]

    private struct Card: Identifiable {
        let id = UUID().uuidString
        let pairID: String
        let text: String
        let isTerm: Bool
    }

    @State private var cards: [Card] = []
    @State private var faceUp: Set<String> = []      // card ids currently up
    @State private var matched: Set<String> = []     // pairID's solved
    @State private var moves = 0
    @State private var startedAt = Date()
    @State private var finished = false
    @State private var busy = false
    @State private var score = 0
    @State private var isNewHigh = false
    @State private var celebrate = 0

    private var columns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 10), count: cards.count > 12 ? 4 : 3)
    }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()
            if finished { resultScreen } else { board }
            WSConfettiView(trigger: $celebrate).allowsHitTesting(false)
        }
        .onAppear(perform: start)
    }

    // MARK: - Board

    private var board: some View {
        VStack(spacing: 16) {
            header
            ScrollView {
                LazyVGrid(columns: columns, spacing: 10) {
                    ForEach(cards) { card in
                        cardView(card)
                    }
                }
                .padding(.horizontal, 4)
                .padding(.bottom, 20)
            }
        }
        .padding(.horizontal, 18)
        .padding(.top, 14)
    }

    private var header: some View {
        VStack(spacing: 10) {
            HStack {
                Text(title)
                    .wsBody(.large, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Spacer()
                statPill(icon: "arrow.2.squarepath", value: "\(moves)", tint: WSColor.duoPurple)
                statPill(icon: "checkmark.circle.fill", value: "\(matched.count)/\(pairs.count)", tint: WSColor.duoGreen)
            }
            WSProgressBar(fraction: pairs.isEmpty ? 0 : Double(matched.count) / Double(pairs.count),
                          tint: WSColor.duoPurple, height: 8)
        }
    }

    private func statPill(icon: String, value: String, tint: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 11, weight: .black))
            Text(value).font(WSFont.sans(13, weight: .black)).monospacedDigit()
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 10).padding(.vertical, 6)
        .background(Capsule().fill(tint.opacity(0.12)))
    }

    private func cardView(_ card: Card) -> some View {
        let isUp = faceUp.contains(card.id) || matched.contains(card.pairID)
        let isMatched = matched.contains(card.pairID)
        return Button {
            tap(card)
        } label: {
            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(isUp ? (isMatched ? WSColor.duoGreenLight : WSColor.surfacePurple) : WSColor.duoPurple)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(isMatched ? WSColor.duoGreen.opacity(0.4) : WSColor.duoPurple.opacity(0.2), lineWidth: 1.5)
                    )
                    .shadow(color: Color.black.opacity(0.06), radius: 6, y: 3)
                if isUp {
                    Text(card.text)
                        .font(WSFont.sans(card.isTerm ? 14 : 12, weight: card.isTerm ? .black : .bold))
                        .foregroundStyle(isMatched ? WSColor.duoGreenDark : WSColor.foreground)
                        .multilineTextAlignment(.center)
                        .minimumScaleFactor(0.5)
                        .padding(8)
                } else {
                    Image(systemName: "questionmark")
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(.white.opacity(0.85))
                }
            }
            .frame(height: 96)
            .rotation3DEffect(.degrees(isUp ? 0 : 180), axis: (x: 0, y: 1, z: 0))
            .animation(.easeInOut(duration: 0.25), value: isUp)
            .opacity(isMatched ? 0.65 : 1)
        }
        .buttonStyle(WSBouncyButtonStyle())
        .disabled(isMatched || busy)
    }

    // MARK: - Result

    private var resultScreen: some View {
        VStack(spacing: 20) {
            WSAnimatedImage(name: "mascot-dance", ext: "webp").frame(width: 150, height: 150)
            Text(isNewHigh ? "New high score! 🏆" : "Matched them all! 🎉")
                .wsHeadline(.large, weight: .black)
                .foregroundStyle(WSColor.foreground)
                .multilineTextAlignment(.center)
            WSProgressRing(progress: 1, tint: WSColor.duoPurple, size: 150, lineWidth: 12,
                           centerTitle: "\(score)", centerSubtitle: "points")
            HStack(spacing: 10) {
                WSStatChip(icon: "arrow.2.squarepath", value: "\(moves)", label: "Moves", tint: WSColor.duoPurple)
                WSStatChip(icon: "clock.fill", value: elapsedString, label: "Time", tint: WSColor.duoBlue)
                WSStatChip(icon: "rosette", value: "\(GameScoreStore.shared.highScore(for: .memoryMatch))", label: "Best", tint: WSColor.duoYellowDark)
            }
            Button { start() } label: {
                Label("Play again", systemImage: "arrow.counterclockwise").frame(maxWidth: .infinity)
            }
            .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
        }
        .padding(24)
    }

    private var elapsedString: String {
        let s = max(0, Int(Date().timeIntervalSince(startedAt)))
        return String(format: "%dm %02ds", s / 60, s % 60)
    }

    // MARK: - Logic

    private func start() {
        let chosen = Array(pairs.shuffled().prefix(8))   // up to 8 pairs = 16 cards
        var built: [Card] = []
        for p in chosen {
            built.append(Card(pairID: p.id, text: p.term, isTerm: true))
            built.append(Card(pairID: p.id, text: p.definition, isTerm: false))
        }
        cards = built.shuffled()
        faceUp = []; matched = []; moves = 0; finished = false; busy = false
        score = 0; isNewHigh = false
        startedAt = Date()
        Haptics.medium()
    }

    private func tap(_ card: Card) {
        guard !busy, !faceUp.contains(card.id), !matched.contains(card.pairID) else { return }
        Haptics.selection()
        faceUp.insert(card.id)

        let up = cards.filter { faceUp.contains($0.id) }
        guard up.count == 2 else { return }
        moves += 1
        busy = true
        let (a, b) = (up[0], up[1])
        if a.pairID == b.pairID {
            // Match.
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.28) {
                matched.insert(a.pairID)
                faceUp.removeAll()
                busy = false
                Haptics.success()
                if matched.count == min(8, pairs.count) { finish() }
            }
        } else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) {
                faceUp.removeAll()
                busy = false
                Haptics.warning()
            }
        }
    }

    private func finish() {
        let pairCount = min(8, pairs.count)
        let elapsed = Int(Date().timeIntervalSince(startedAt))
        // Reward fewer moves + faster time; always positive.
        let base = pairCount * 120
        let movePenalty = max(0, moves - pairCount) * 12
        let timePenalty = elapsed * 3
        score = max(pairCount * 20, base - movePenalty - timePenalty + 200)
        isNewHigh = GameScoreStore.shared.submit(score, for: .memoryMatch)
        DailyGoalStore.shared.record(.memoryMatchPlayed, title: "Memory Match",
                                     subtitle: "\(pairCount) pairs · \(moves) moves")
        finished = true
        if isNewHigh { celebrate += 1 }
    }
}

#Preview {
    MemoryMatchView(title: "Memory Match", pairs: [
        MemoryPair(term: "Mitochondria", definition: "Powerhouse of the cell"),
        MemoryPair(term: "Photosynthesis", definition: "Light → glucose"),
        MemoryPair(term: "Osmosis", definition: "Water across a membrane"),
        MemoryPair(term: "Atom", definition: "Smallest unit of an element")
    ])
}
