//
//  FlashcardsView.swift
//  WriteScholar
//
//  Native iOS swipe-deck (prototype screen #8). Tap to flip (a real 90°
//  flip, no ghosting); grade with Again / Hard / Good / Easy. Again & Hard
//  re-queue the card so it comes back this session (lightweight spaced
//  repetition); Good & Easy master it and remove it. The session finishes
//  when every unique card has been mastered.
//

import SwiftUI

struct FlashcardsView: View {
    let flashcards: Flashcards
    /// Optional back affordance (mockup's ‹ chevron). Embedded pack tabs
    /// leave this nil and rely on the surrounding tab bar.
    var onBack: (() -> Void)? = nil

    private enum Grade { case again, hard, good, easy }

    @State private var deck: [Flashcard] = []
    @State private var masteredIDs: Set<String> = []
    @State private var dragOffset: CGSize = .zero
    @State private var topFlipped = false
    @State private var showingBack = false
    @State private var isAdvancing = false
    @State private var didAward = false

    private let swipeThreshold: CGFloat = 90
    private var totalCards: Int { max(flashcards.cards.count, 1) }

    var body: some View {
        VStack(spacing: 0) {
            header
                .padding(.horizontal, 20)
                .padding(.top, 12)

            ZStack {
                if flashcards.cards.isEmpty {
                    emptyDeckState
                } else if deck.isEmpty {
                    completedState
                } else {
                    cardStack
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            if !deck.isEmpty && !flashcards.cards.isEmpty {
                actionBar
                    .padding(.horizontal, 20)
                    .padding(.bottom, 16)
            }
        }
        .background(WSColor.background.ignoresSafeArea())
        .onAppear {
            if deck.isEmpty && masteredIDs.isEmpty { deck = flashcards.cards }
        }
    }

    // MARK: - Header (‹ · title · counter · thin bar)

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                if let onBack {
                    Button {
                        Haptics.light()
                        onBack()
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 15, weight: .black))
                            .foregroundStyle(WSColor.foreground)
                            .frame(width: 34, height: 34)
                            .background(Circle().fill(WSColor.backgroundElevated).shadow(color: .black.opacity(0.05), radius: 4, y: 2))
                    }
                    .buttonStyle(WSBouncyButtonStyle())
                }
                Text(flashcards.title ?? "Flashcards")
                    .wsBody(.large, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Spacer()
                Text("\(masteredIDs.count) / \(totalCards)")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .monospacedDigit()
            }
            WSProgressBar(fraction: Double(masteredIDs.count) / Double(totalCards),
                          tint: WSColor.duoPurple, height: 8)
        }
    }

    // MARK: - Card stack

    private var cardStack: some View {
        ZStack {
            ForEach(stackIndices, id: \.self) { idx in
                cardView(for: deck[idx], isTop: idx == 0)
                    .scaleEffect(scale(for: idx))
                    .rotationEffect(idx == 0 ? .degrees(Double(dragOffset.width / 22)) : .zero)
                    .offset(x: idx == 0 ? dragOffset.width : 0,
                            y: (idx == 0 ? dragOffset.height : 0) + yOffset(for: idx))
                    .zIndex(zIndex(for: idx))
                    .opacity(idx == 0 ? 1.0 : max(0, 0.9 - Double(idx) * 0.2))
                    .gesture(idx == 0 ? topDragGesture : nil)
                    .onTapGesture {
                        if idx == 0 { flip() }
                    }
            }

            if dragOffset.width >= 30 {
                tagHint(label: "Good", icon: "checkmark.circle.fill", color: WSColor.duoGreen)
                    .offset(x: -110, y: -170)
                    .opacity(min(1, Double(dragOffset.width) / 100))
            } else if dragOffset.width <= -30 {
                tagHint(label: "Again", icon: "arrow.counterclockwise.circle.fill", color: WSColor.duoPurple)
                    .offset(x: 110, y: -170)
                    .opacity(min(1, Double(-dragOffset.width) / 100))
            }
        }
        .padding(.horizontal, 24)
    }

    private var stackIndices: [Int] {
        let n = min(3, deck.count)
        return Array(0..<n).reversed()  // back-to-front
    }

    private func cardView(for card: Flashcard, isTop: Bool) -> some View {
        // Only the top card flips. During its flip we swap faces at the 90°
        // midpoint (showingBack) so no ghost text shows through.
        let showBack = isTop && showingBack
        return Group {
            if showBack {
                cardFace(text: card.back, eyebrow: "ANSWER", accent: WSColor.duoGreen)
                    .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
            } else {
                cardFace(text: card.front, eyebrow: "QUESTION", accent: WSColor.duoPurple)
            }
        }
        .rotation3DEffect(.degrees(isTop && topFlipped ? 180 : 0), axis: (x: 0, y: 1, z: 0))
    }

    private func cardFace(text: String, eyebrow: String, accent: Color) -> some View {
        VStack(spacing: 14) {
            HStack {
                Text(eyebrow)
                    .font(WSFont.sans(10, weight: .black))
                    .tracking(2.2)
                    .foregroundStyle(accent)
                Spacer()
                Image(systemName: "square.stack.3d.up.fill")
                    .foregroundStyle(accent.opacity(0.6))
                    .font(.system(size: 14, weight: .bold))
            }
            Spacer()
            Text(text)
                .font(WSFont.headline(22, weight: .black))
                .foregroundStyle(WSColor.foreground)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.55)
            Spacer()
            HStack(spacing: 6) {
                Image(systemName: "hand.tap.fill")
                Text("Tap to flip")
            }
            .font(WSFont.sans(11, weight: .bold))
            .foregroundStyle(WSColor.foregroundMuted)
        }
        .padding(28)
        .frame(maxWidth: .infinity)
        .frame(height: 400)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(WSColor.surfacePurple)
                .overlay(
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .stroke(WSColor.duoPurple.opacity(0.15), lineWidth: 1.5)
                )
                .shadow(color: WSColor.duoPurple.opacity(0.15), radius: 18, y: 8)
        )
    }

    private func tagHint(label: String, icon: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.system(size: 14, weight: .bold))
            Text(label)
                .font(WSFont.sans(13, weight: .bold))
                .foregroundStyle(WSColor.foreground)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
            Capsule().fill(WSColor.backgroundElevated)
                .overlay(Capsule().stroke(color, lineWidth: 2))
                .shadow(color: color.opacity(0.35), radius: 10, y: 3)
        )
    }

    // MARK: - Stack geometry

    private func scale(for idx: Int) -> CGFloat { 1.0 - CGFloat(idx) * 0.04 }
    private func yOffset(for idx: Int) -> CGFloat { CGFloat(idx) * 14 }
    private func zIndex(for idx: Int) -> Double { Double(stackIndices.count - idx) }

    // MARK: - Flip

    private func flip() {
        Haptics.light()
        let willFlip = !topFlipped
        withAnimation(.easeInOut(duration: 0.4)) { topFlipped = willFlip }
        // Swap the visible face exactly at the 90° midpoint.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            showingBack = willFlip
        }
    }

    // MARK: - Drag → grade

    private var topDragGesture: some Gesture {
        DragGesture()
            .onChanged { value in dragOffset = value.translation }
            .onEnded { value in
                if value.translation.width >= swipeThreshold {
                    grade(.good)
                } else if value.translation.width <= -swipeThreshold {
                    grade(.again)
                } else {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                        dragOffset = .zero
                    }
                }
            }
    }

    /// Apply a grade to the top card. `isAdvancing` guards against a
    /// rapid double-tap / swipe+tap removing two cards in one animation.
    private func grade(_ g: Grade) {
        guard !isAdvancing, let top = deck.first else { return }
        isAdvancing = true
        Haptics.success()

        let mastered = (g == .good || g == .easy)
        let direction: CGFloat = mastered ? 1 : -1
        withAnimation(.easeOut(duration: 0.28)) {
            dragOffset = CGSize(width: direction * 620, height: 40)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.26) {
            deck.removeFirst()
            if mastered {
                masteredIDs.insert(top.id)
            } else {
                // Re-queue: Again comes back soon, Hard a bit later.
                let insertAt = min(g == .again ? 2 : 5, deck.count)
                deck.insert(top, at: insertAt)
            }
            topFlipped = false
            showingBack = false
            dragOffset = .zero
            isAdvancing = false
        }
    }

    // MARK: - Action bar (Again · Hard · Good  +  wide Easy)

    private var actionBar: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                gradeButton(title: "Again", icon: "arrow.counterclockwise",
                            fg: WSColor.duoPurple, bg: WSColor.duoPurpleLight) { grade(.again) }
                gradeButton(title: "Hard", icon: "star.fill",
                            fg: WSColor.duoYellowDark, bg: WSColor.duoYellowLight) { grade(.hard) }
                gradeButton(title: "Good", icon: "checkmark",
                            fg: .white, bg: WSColor.duoGreen) { grade(.good) }
            }
            Button {
                grade(.easy)
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "hand.thumbsup.fill").font(.system(size: 14, weight: .bold))
                    Text("Easy").font(WSFont.sans(15, weight: .black))
                }
                .foregroundStyle(WSColor.duoGreenDark)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 13)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(WSColor.duoGreenLight)
                )
            }
            .buttonStyle(WSBouncyButtonStyle())
        }
    }

    private func gradeButton(title: String, icon: String, fg: Color, bg: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 15, weight: .bold))
                Text(title).font(WSFont.sans(13, weight: .black))
            }
            .foregroundStyle(fg)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous).fill(bg)
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    // MARK: - Empty / completed states

    private var emptyDeckState: some View {
        VStack(spacing: 14) {
            WSAnimatedImage(name: "mascot-study", ext: "webp")
                .frame(width: 130, height: 130)
            Text("No cards in this deck")
                .font(WSFont.headline(20, weight: .black))
                .foregroundStyle(WSColor.foreground)
            Text("This pack didn't include flashcards.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .padding(.horizontal, 32)
    }

    private var completedState: some View {
        VStack(spacing: 18) {
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 160, height: 160)
                .shadow(color: WSColor.duoGreen.opacity(0.3), radius: 20, y: 8)

            Text("Deck mastered! 🎉")
                .font(WSFont.headline(24, weight: .black))
                .foregroundStyle(WSColor.foreground)

            Text("You worked through all \(totalCards) card\(totalCards == 1 ? "" : "s").")
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)

            Button {
                deck = flashcards.cards
                masteredIDs = []
                topFlipped = false
                showingBack = false
                didAward = false
                Haptics.medium()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Study again")
                }
            }
            .buttonStyle(WSDuoSuccessButtonStyle(fullWidth: false))
            .padding(.top, 8)
        }
        .padding(.horizontal, 32)
        .onAppear {
            // Award XP + log to History exactly once per cleared deck.
            guard !didAward, masteredIDs.count > 0 else { return }
            didAward = true
            DailyGoalStore.shared.record(
                .flashcardsReviewed,
                title: flashcards.title ?? "Flashcards",
                subtitle: "\(masteredIDs.count) cards mastered"
            )
            StudyPackProgressStore.shared.recordCardsReviewed(masteredIDs.count)
        }
    }
}

#Preview {
    FlashcardsView(flashcards: Flashcards(
        title: "Photosynthesis",
        cards: [
            Flashcard(front: "What is glucose?", back: "A simple sugar produced by photosynthesis."),
            Flashcard(front: "Where does the Calvin cycle take place?", back: "In the stroma of the chloroplast."),
            Flashcard(front: "What does ATP stand for?", back: "Adenosine triphosphate.")
        ]
    ))
}
