//
//  FlashcardsView.swift
//  WriteScholar
//
//  Native iOS swipe-deck. Flagship interaction — has to feel better than
//  Quizlet's iOS app. Tap to flip; drag right = "Got it", drag left = "Try again".
//  Cards behind the top one are visible with a slight scale/offset stack.
//

import SwiftUI

struct FlashcardsView: View {
    let flashcards: Flashcards

    @State private var deck: [Flashcard] = []
    @State private var knownCount = 0
    @State private var reviewCount = 0
    @State private var dragOffset: CGSize = .zero
    @State private var topFlipped = false

    private let swipeThreshold: CGFloat = 90

    var body: some View {
        VStack(spacing: 0) {
            scoreboard
                .padding(.horizontal, 20)
                .padding(.top, 8)

            ZStack {
                if deck.isEmpty {
                    completedState
                } else {
                    cardStack
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            if !deck.isEmpty {
                actionBar
                    .padding(.horizontal, 20)
                    .padding(.bottom, 12)
            }
        }
        .onAppear {
            if deck.isEmpty { deck = flashcards.cards }
        }
    }

    // MARK: - Scoreboard

    private var scoreboard: some View {
        HStack(spacing: 12) {
            scorePill(label: "Got it",     count: knownCount,  color: WSColor.strong)
            scorePill(label: "Reviewing",  count: reviewCount, color: WSColor.revise)
            Spacer()
            Text("\(deck.count) left")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.foregroundMuted)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(
                    Capsule().fill(WSColor.surface)
                )
        }
    }

    private func scorePill(label: String, count: Int, color: Color) -> some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text("\(count)")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foreground)
            Text(label)
                .wsBody(.caption, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            Capsule().fill(color.opacity(0.14))
                .overlay(Capsule().stroke(color.opacity(0.3), lineWidth: 1))
        )
    }

    // MARK: - Card stack

    private var cardStack: some View {
        ZStack {
            // Up to 3 cards visible behind the top
            ForEach(stackIndices, id: \.self) { idx in
                cardView(for: deck[idx])
                    .scaleEffect(scale(for: idx))
                    .offset(y: yOffset(for: idx))
                    .zIndex(zIndex(for: idx))
                    .gesture(idx == 0 ? topDragGesture : nil)
                    .onTapGesture(count: 1) {
                        if idx == 0 {
                            withAnimation(.spring(response: 0.45, dampingFraction: 0.75)) {
                                topFlipped.toggle()
                            }
                            Haptics.light()
                        }
                    }
                    .rotationEffect(idx == 0 ? .degrees(Double(dragOffset.width / 22)) : .zero)
                    .offset(x: idx == 0 ? dragOffset.width : 0,
                            y: idx == 0 ? dragOffset.height + yOffset(for: idx) : yOffset(for: idx))
                    .opacity(idx == 0 ? 1.0 : 0.85 - Double(idx) * 0.15)
            }

            // Action hint chips that fade in based on drag direction
            if dragOffset.width >= 30 {
                tagHint(label: "Got it", icon: "checkmark.circle.fill", color: WSColor.strong)
                    .offset(x: -100, y: -150)
                    .opacity(min(1, Double(dragOffset.width) / 100))
            } else if dragOffset.width <= -30 {
                tagHint(label: "Review", icon: "arrow.uturn.backward.circle.fill", color: WSColor.revise)
                    .offset(x: 100, y: -150)
                    .opacity(min(1, Double(-dragOffset.width) / 100))
            }
        }
        .padding(.horizontal, 28)
    }

    /// Indices into deck for the visible stack (top + up to 2 behind).
    private var stackIndices: [Int] {
        let n = min(3, deck.count)
        return Array(0..<n).reversed()  // render back-to-front
    }

    private func cardView(for card: Flashcard) -> some View {
        let isTop = (deck.first?.id == card.id)
        return ZStack {
            // Front face
            cardFace(text: card.front, eyebrow: "QUESTION", accent: WSColor.brandPrimary)
                .opacity(isTop && topFlipped ? 0 : 1)
            // Back face
            cardFace(text: card.back, eyebrow: "ANSWER", accent: WSColor.strong)
                .rotation3DEffect(.degrees(180), axis: (x: 0, y: 1, z: 0))
                .opacity(isTop && topFlipped ? 1 : 0)
        }
        .rotation3DEffect(
            .degrees(isTop && topFlipped ? 180 : 0),
            axis: (x: 0, y: 1, z: 0)
        )
    }

    private func cardFace(text: String, eyebrow: String, accent: Color) -> some View {
        VStack(spacing: 14) {
            HStack {
                Text(eyebrow)
                    .wsEyebrow()
                    .foregroundStyle(accent)
                Spacer()
                Image(systemName: "square.stack.3d.up.fill")
                    .foregroundStyle(accent.opacity(0.7))
                    .font(.system(size: 14, weight: .bold))
            }
            Spacer()
            Text(text)
                .wsHeadline(.small, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.6)
            Spacer()
            HStack(spacing: 6) {
                Image(systemName: "hand.point.up.left.fill")
                Text("Tap to flip")
            }
            .wsBody(.caption, weight: .semibold)
            .foregroundStyle(WSColor.foregroundMuted)
        }
        .padding(24)
        .frame(width: 280, height: 360)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .stroke(accent.opacity(0.30), lineWidth: 1)
                )
                .shadow(color: accent.opacity(0.30), radius: 22, y: 12)
        )
    }

    private func tagHint(label: String, icon: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.system(size: 14, weight: .bold))
            Text(label)
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foreground)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
            Capsule().fill(WSColor.backgroundElevated)
                .overlay(Capsule().stroke(color.opacity(0.5), lineWidth: 1.5))
                .shadow(color: color.opacity(0.4), radius: 12, y: 4)
        )
    }

    // MARK: - Stack geometry

    private func scale(for idx: Int) -> CGFloat { 1.0 - CGFloat(idx) * 0.04 }
    private func yOffset(for idx: Int) -> CGFloat { CGFloat(idx) * 14 }
    private func zIndex(for idx: Int) -> Double { Double(stackIndices.count - idx) }

    // MARK: - Drag

    private var topDragGesture: some Gesture {
        DragGesture()
            .onChanged { value in dragOffset = value.translation }
            .onEnded { value in
                if value.translation.width >= swipeThreshold {
                    advance(known: true)
                } else if value.translation.width <= -swipeThreshold {
                    advance(known: false)
                } else {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                        dragOffset = .zero
                    }
                }
            }
    }

    private func advance(known: Bool) {
        Haptics.success()
        let direction: CGFloat = known ? 1 : -1
        withAnimation(.easeOut(duration: 0.3)) {
            dragOffset = CGSize(width: direction * 600, height: 60)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.28) {
            if !deck.isEmpty {
                if known { knownCount += 1 } else { reviewCount += 1 }
                deck.removeFirst()
                topFlipped = false
                dragOffset = .zero
            }
        }
    }

    // MARK: - Action bar

    private var actionBar: some View {
        HStack(spacing: 12) {
            actionButton(
                title: "Review",
                icon: "arrow.uturn.backward",
                color: WSColor.revise
            ) {
                advance(known: false)
            }
            actionButton(
                title: "Flip",
                icon: "arrow.left.arrow.right",
                color: WSColor.brandPrimary
            ) {
                withAnimation(.spring(response: 0.45, dampingFraction: 0.75)) {
                    topFlipped.toggle()
                }
                Haptics.light()
            }
            actionButton(
                title: "Got it",
                icon: "checkmark",
                color: WSColor.strong
            ) {
                advance(known: true)
            }
        }
    }

    private func actionButton(title: String, icon: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(color)
                Text(title)
                    .wsBody(.caption, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(color.opacity(0.3), lineWidth: 1)
                    )
                    .shadow(color: color.opacity(0.18), radius: 10, y: 4)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Completed state

    private var completedState: some View {
        VStack(spacing: 18) {
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 160, height: 160)
                .shadow(color: WSColor.brandPrimary.opacity(0.3), radius: 20, y: 8)

            Text("Deck cleared")
                .wsHeadline(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foreground)

            Text("\(knownCount) known · \(reviewCount) for review")
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)

            Button {
                deck = flashcards.cards
                knownCount = 0
                reviewCount = 0
                topFlipped = false
                Haptics.medium()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Restart deck")
                }
            }
            .buttonStyle(WSPrimaryButtonStyle(fullWidth: false))
            .padding(.top, 10)
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
