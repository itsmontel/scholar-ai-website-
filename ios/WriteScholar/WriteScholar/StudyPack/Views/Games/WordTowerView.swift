//
//  WordTowerView.swift
//  WriteScholar
//
//  Native Word Tower — vocabulary game where you tap correct items to
//  stack them on a growing tower. Built in SwiftUI; tile drops are
//  animated with a matched-position transition into the tower stack.
//

import SwiftUI

struct WordTowerView: View {
    let wordTower: WordTower

    @State private var qIndex = 0
    @State private var items: [WordTowerItem] = []   // currently on screen
    @State private var tower: [TowerSlot] = []
    @State private var lives: Int = 3
    @State private var score: Int = 0
    @State private var status: GameStatus = .playing
    @State private var feedbackId: String? = nil
    @State private var feedbackKind: FeedbackKind? = nil
    @State private var screenFlash: Color? = nil

    enum GameStatus { case playing, victory, defeat }
    enum FeedbackKind { case correct, wrong }

    /// Wrapper so tower entries are uniquely identifiable even when
    /// the source items repeat across questions.
    private struct TowerSlot: Identifiable {
        let id = UUID()
        let text: String
        let tint: Color
    }

    private var question: WordTowerQuestion? {
        guard wordTower.questions.indices.contains(qIndex) else { return nil }
        return wordTower.questions[qIndex]
    }

    var body: some View {
        ZStack {
            cosmicBackdrop

            switch status {
            case .playing:  gameLayer
            case .victory:  endScreen(victory: true)
            case .defeat:   endScreen(victory: false)
            }

            if let color = screenFlash {
                color.opacity(0.18)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
                    .transition(.opacity)
            }
        }
        .onAppear { resetIfNeeded() }
    }

    // MARK: - Backdrop (emerald → indigo, matches web Word Tower vibe)

    private var cosmicBackdrop: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x064E3B), Color(hex: 0x065F46), Color(hex: 0x312E81)],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            Canvas { ctx, size in
                let count = 60
                for i in 0..<count {
                    let x = (sin(Double(i) * 11.13) + 1) / 2 * size.width
                    let y = (cos(Double(i) * 8.91)  + 1) / 2 * size.height
                    let r = (sin(Double(i) * 4.14) + 1) / 2 * 1.4 + 0.5
                    let alpha = (cos(Double(i) * 1.7) + 1) / 2 * 0.7 + 0.3
                    ctx.fill(
                        Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)),
                        with: .color(.white.opacity(alpha))
                    )
                }
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)

            // Subtle moon
            Circle()
                .fill(Color(hex: 0xCBD5E1).opacity(0.55))
                .frame(width: 60, height: 60)
                .blur(radius: 1)
                .offset(x: 130, y: -290)
        }
    }

    // MARK: - Game layer

    private var gameLayer: some View {
        VStack(spacing: 12) {
            scoreHeader
                .padding(.horizontal, 16)
                .padding(.top, 8)

            if let q = question {
                promptCard(q.prompt)
                    .padding(.horizontal, 16)

                tileGrid
                    .padding(.horizontal, 16)
            }

            Spacer(minLength: 0)

            towerBase
                .frame(height: 160)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
        }
    }

    // MARK: - Score header

    private var scoreHeader: some View {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                Image(systemName: "star.fill").foregroundStyle(Color(hex: 0xFBBF24))
                Text("\(score)")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(Color.white.opacity(0.10)))

            HStack(spacing: 4) {
                Image(systemName: "building.2.fill").foregroundStyle(Color(hex: 0x10B981))
                Text("\(tower.count) tall")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(Color.white.opacity(0.10)))

            Spacer()

            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Image(systemName: i < lives ? "heart.fill" : "heart")
                        .foregroundStyle(i < lives ? Color(hex: 0xEF4444) : Color.white.opacity(0.30))
                        .font(.system(size: 14, weight: .bold))
                }
            }

            Text("Q\(qIndex + 1)/\(wordTower.questions.count)")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Capsule().fill(Color.white.opacity(0.10)))
        }
    }

    // MARK: - Prompt

    private func promptCard(_ prompt: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("STACK ONLY THE CORRECT")
                .wsEyebrow()
                .foregroundStyle(Color(hex: 0xFBBF24))
            Text(prompt)
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.10))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.20), lineWidth: 1)
                )
        )
    }

    // MARK: - Tile grid (2 columns)

    private var tileGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            ForEach(items) { item in
                tile(for: item)
                    .transition(.scale.combined(with: .opacity))
            }
        }
    }

    private func tile(for item: WordTowerItem) -> some View {
        let isFeedback = (feedbackId == item.id)
        let bg: AnyShapeStyle = {
            if isFeedback && feedbackKind == .correct {
                return AnyShapeStyle(LinearGradient(colors: [Color(hex: 0x10B981), Color(hex: 0x059669)],
                                                    startPoint: .top, endPoint: .bottom))
            }
            if isFeedback && feedbackKind == .wrong {
                return AnyShapeStyle(LinearGradient(colors: [Color(hex: 0xEF4444), Color(hex: 0xB91C1C)],
                                                    startPoint: .top, endPoint: .bottom))
            }
            return AnyShapeStyle(LinearGradient(colors: [Color.white.opacity(0.92), Color.white.opacity(0.80)],
                                                startPoint: .top, endPoint: .bottom))
        }()
        let textColor: Color = isFeedback ? .white : Color(hex: 0x312E81)

        return Button {
            handleTap(item)
        } label: {
            Text(item.text)
                .wsBody(.small, weight: .bold)
                .foregroundStyle(textColor)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .padding(.horizontal, 8)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(bg)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color.white.opacity(0.40), lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.30), radius: 8, y: 4)
                )
        }
        .buttonStyle(.plain)
        .scaleEffect(isFeedback ? 1.05 : 1.0)
        .rotationEffect(.degrees(isFeedback && feedbackKind == .wrong ? -3 : 0))
        .animation(.spring(response: 0.28, dampingFraction: 0.65), value: feedbackId)
    }

    // MARK: - Tower base

    private var towerBase: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)
            VStack(spacing: 4) {
                ForEach(tower.suffix(8)) { slot in
                    Text(slot.text)
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .padding(.vertical, 6)
                        .frame(maxWidth: .infinity)
                        .background(
                            RoundedRectangle(cornerRadius: 6)
                                .fill(slot.tint)
                                .shadow(color: slot.tint.opacity(0.5), radius: 4, y: 2)
                        )
                        .padding(.horizontal, 30)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            // Ground
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(Color.white.opacity(0.15), lineWidth: 1)
                )
        )
    }

    // MARK: - Tap handler

    private func handleTap(_ item: WordTowerItem) {
        guard feedbackId == nil else { return }

        feedbackId = item.id
        feedbackKind = item.isCorrect ? .correct : .wrong

        if item.isCorrect {
            Haptics.success()
            score += 50 + (tower.count * 5)
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                screenFlash = Color(hex: 0x10B981)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.75)) {
                    items.removeAll { $0.id == item.id }
                    tower.append(TowerSlot(text: item.text, tint: towerTint(for: tower.count)))
                    feedbackId = nil
                    feedbackKind = nil
                    screenFlash = nil
                }
                checkAdvance()
            }
        } else {
            Haptics.medium()
            lives = max(0, lives - 1)
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                screenFlash = Color(hex: 0xEF4444)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.55) {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                    items.removeAll { $0.id == item.id }
                    feedbackId = nil
                    feedbackKind = nil
                    screenFlash = nil
                }
                checkAdvance()
            }
        }
    }

    private func towerTint(for index: Int) -> Color {
        let palette: [Color] = [
            Color(hex: 0xD946EF),
            Color(hex: 0x7C3AED),
            Color(hex: 0x6366F1),
            Color(hex: 0xF59E0B),
            Color(hex: 0x10B981),
            Color(hex: 0x06B6D4)
        ]
        return palette[index % palette.count]
    }

    // MARK: - Advance / end

    private func checkAdvance() {
        if lives <= 0 {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                status = .defeat
            }
            return
        }
        // If no correct items remain in the current set, advance.
        let correctRemaining = items.contains { $0.isCorrect }
        if !correctRemaining {
            if qIndex + 1 >= wordTower.questions.count {
                withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                    status = .victory
                }
            } else {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.8)) {
                        qIndex += 1
                        loadCurrentItems()
                    }
                }
            }
        }
    }

    private func loadCurrentItems() {
        guard let q = question else { return }
        items = q.items.shuffled()
    }

    private func resetIfNeeded() {
        if items.isEmpty { loadCurrentItems() }
    }

    private func resetGame() {
        qIndex = 0
        lives = 3
        score = 0
        tower.removeAll()
        items.removeAll()
        feedbackId = nil
        feedbackKind = nil
        screenFlash = nil
        status = .playing
        loadCurrentItems()
    }

    // MARK: - End screen

    private func endScreen(victory: Bool) -> some View {
        VStack(spacing: 22) {
            WSAnimatedImage(name: victory ? "mascot-dance" : "mascot-study", ext: "webp")
                .frame(width: 160, height: 160)
                .shadow(color: (victory ? Color(hex: 0x10B981) : Color(hex: 0xEF4444)).opacity(0.5),
                        radius: 22, y: 8)

            VStack(spacing: 6) {
                Text(victory ? "Tower complete!" : "Tower toppled")
                    .wsHeadline(.large, weight: .bold)
                    .foregroundStyle(.white)
                Text("Score \(score)  ·  \(tower.count) blocks stacked")
                    .wsBody(.medium, weight: .semibold)
                    .foregroundStyle(.white.opacity(0.85))
            }

            Button {
                resetGame()
                Haptics.medium()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.counterclockwise")
                    Text(victory ? "Play again" : "Try again")
                }
            }
            .buttonStyle(WSPrimaryButtonStyle(fullWidth: false))
        }
        .padding()
    }
}

#Preview {
    WordTowerView(wordTower: WordTower(
        title: "Cell Biology",
        questions: [
            try! JSONDecoder().decode(WordTowerQuestion.self, from: Data("""
            {
              "id":"q1",
              "prompt":"Which are organelles?",
              "items":[
                {"text":"Nucleus","isCorrect":true},
                {"text":"Mitochondria","isCorrect":true},
                {"text":"Polygon","isCorrect":false},
                {"text":"Lysosome","isCorrect":true},
                {"text":"Velocity","isCorrect":false},
                {"text":"Cosine","isCorrect":false}
              ]
            }
            """.utf8)),
            try! JSONDecoder().decode(WordTowerQuestion.self, from: Data("""
            {
              "id":"q2",
              "prompt":"Which contain DNA?",
              "items":[
                {"text":"Nucleus","isCorrect":true},
                {"text":"Mitochondria","isCorrect":true},
                {"text":"Ribosome","isCorrect":false},
                {"text":"Chloroplast","isCorrect":true},
                {"text":"Vacuole","isCorrect":false},
                {"text":"Lysosome","isCorrect":false}
              ]
            }
            """.utf8))
        ]
    ))
}
