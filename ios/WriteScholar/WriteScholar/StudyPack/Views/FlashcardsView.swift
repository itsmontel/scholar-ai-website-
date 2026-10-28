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
    /// Consecutive Good/Easy grades; resets on Again/Hard.
    @State private var combo = 0
    @State private var xpBurst = 0

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
                            .frame(width: 38, height: 38)
                            .wsStickerCircle(fill: WSColor.backgroundElevated)
                    }
                    .buttonStyle(WSStickerPressStyle())
                }
                Text(flashcards.title ?? "Flashcards")
                    .font(WSFont.headline(18, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Spacer()
                if combo >= 2 {
                    HStack(spacing: 4) {
                        WSFlameIcon(size: 14)
                        Text("x\(combo)")
                            .font(WSFont.headline(15, weight: .black))
                            .contentTransition(.numericText())
                    }
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .wsStickerCapsule(fill: WSColor.orange, depth: 2)
                    .transition(.scale.combined(with: .opacity))
                    .accessibilityLabel("Combo \(combo)")
                }
                Text("\(masteredIDs.count)/\(totalCards)")
                    .font(WSFont.headline(15, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .monospacedDigit()
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .wsStickerCapsule(fill: WSColor.lime, depth: 2)
            }
            .animation(.wsBouncePop, value: combo)
            WSStripeBar(fraction: Double(masteredIDs.count) / Double(totalCards), fill: WSColor.purple, height: 12)
        }
    }

    // MARK: - Card stack

    private var cardStack: some View {
        ZStack {
            ForEach(stackIndices, id: \.self) { idx in
                cardView(for: deck[idx], isTop: idx == 0)
                    .scaleEffect(scale(for: idx))
                    .rotationEffect(idx == 0 ? .degrees(Double(dragOffset.width / 22)) : .degrees(idx == 1 ? 3 : -4))
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
                tagHint(label: "Got it", icon: "checkmark", color: WSColor.lime)
                    .rotationEffect(.degrees(-8))
                    .offset(x: -100, y: -170)
                    .opacity(min(1, Double(dragOffset.width) / 100))
            } else if dragOffset.width <= -30 {
                tagHint(label: "Again", icon: "arrow.counterclockwise", color: WSColor.pink)
                    .rotationEffect(.degrees(8))
                    .offset(x: 100, y: -170)
                    .opacity(min(1, Double(-dragOffset.width) / 100))
            }

            WSFloatingXP(text: "+10 XP", trigger: xpBurst)
                .offset(y: -150)
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
                cardFace(text: card.back, eyebrow: "ANSWER", face: WSColor.lime, tag: WSColor.backgroundElevated, textColor: WSColor.inkText)
                    .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
            } else if isTop {
                cardFace(text: card.front, eyebrow: "QUESTION", face: WSColor.backgroundElevated, tag: WSColor.pink, textColor: WSColor.foreground)
            } else {
                cardFace(text: "", eyebrow: "", face: deck.firstIndex(where: { $0.id == card.id }) == 1 ? WSColor.sky : WSColor.pink,
                         tag: .clear, textColor: .clear)
            }
        }
        .rotation3DEffect(.degrees(isTop && topFlipped ? 180 : 0), axis: (x: 0, y: 1, z: 0))
    }

    private func cardFace(text: String, eyebrow: String, face: Color, tag: Color, textColor: Color) -> some View {
        VStack(spacing: 14) {
            HStack {
                if !eyebrow.isEmpty {
                    Text(eyebrow)
                        .font(WSFont.sans(11, weight: .black))
                        .tracking(1.4)
                        .foregroundStyle(WSColor.inkText)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 5)
                        .background(
                            ZStack {
                                RoundedRectangle(cornerRadius: 9).fill(tag)
                                RoundedRectangle(cornerRadius: 9).strokeBorder(WSColor.ink, lineWidth: 2)
                            }
                        )
                }
                Spacer()
            }
            Spacer()
            Text(text)
                .font(WSFont.headline(26, weight: .black))
                .tracking(-0.4)
                .foregroundStyle(textColor)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.5)
            Spacer()
            if !eyebrow.isEmpty {
                HStack(spacing: 6) {
                    Image(systemName: "hand.tap.fill")
                    Text(eyebrow == "QUESTION" ? "Tap to flip" : "Swipe right if you got it")
                }
                .font(WSFont.sans(12, weight: .heavy))
                .foregroundStyle(textColor.opacity(0.7))
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .frame(height: 400)
        .wsSticker(fill: face, radius: 30, depth: 6)
    }

    private func tagHint(label: String, icon: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .black))
            Text(label)
                .font(WSFont.headline(16, weight: .black))
        }
        .foregroundStyle(WSColor.inkText)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .wsStickerCapsule(fill: color)
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
        if mastered {
            combo += 1
            xpBurst += 1
        } else {
            combo = 0
        }
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
        HStack(spacing: 8) {
            gradeButton(title: "Again", icon: "arrow.counterclockwise", fill: WSColor.pink) { grade(.again) }
            gradeButton(title: "Hard", icon: "tortoise.fill", fill: WSColor.sun) { grade(.hard) }
            gradeButton(title: "Good", icon: "checkmark", fill: WSColor.lime) { grade(.good) }
            gradeButton(title: "Easy", icon: "bolt.fill", fill: WSColor.sky) { grade(.easy) }
        }
    }

    private func gradeButton(title: String, icon: String, fill: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 16, weight: .black))
                Text(title).font(WSFont.headline(14, weight: .black))
            }
        }
        .buttonStyle(WSStickerButtonStyle(fill: fill, foreground: WSColor.inkText, radius: 16, depth: 4,
                                          height: 62, font: WSFont.headline(14, weight: .black)))
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
                .frame(width: 170, height: 170)
                .wsMascotBob(amount: 6, rock: 3, duration: 0.9)

            Text("Deck cleared.")
                .font(WSFont.headline(40, weight: .black))
                .tracking(-1.4)
                .foregroundStyle(WSColor.foreground)

            Text("You worked through all \(totalCards) card\(totalCards == 1 ? "" : "s").")
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)

            Button {
                deck = flashcards.cards
                masteredIDs = []
                combo = 0
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
