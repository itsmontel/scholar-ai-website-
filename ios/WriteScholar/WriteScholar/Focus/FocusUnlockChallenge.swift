//
//  FocusUnlockChallenge.swift
//  WriteScholar
//
//  The 5-question challenge sheet — Duolingo lesson style.
//  Modes:
//    * Quiz       -- MCQ, single choice, instant feedback per question
//    * Flashcards -- front shown, tap to flip, then "Got it" / "Missed it"
//
//  Settings:
//    * Standard difficulty: 5 questions, need 4 right, 30s per question
//    * Hard difficulty:     5 questions, need 5 right, 15s per question
//
//  On pass:  FocusManager.handleChallengeResult(.passed(...)) -> unlock
//            window opens, sheet dismisses, success haptic + toast
//  On fail:  10-minute cooldown before another attempt
//

import SwiftUI

struct FocusUnlockChallenge: View {
    @ObservedObject var manager: FocusManager
    var onFinish: (FocusChallengeResult) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var quizQuestions: [QuizQuestion] = []
    @State private var flashcards:    [Flashcard]    = []

    @State private var index: Int = 0
    @State private var correctCount: Int = 0
    @State private var revealed: Bool = false
    @State private var pickedOption: String? = nil
    @State private var secondsLeft: Int = 30
    @State private var ticker: Timer? = nil

    @State private var phase: Phase = .running

    enum Phase: Equatable {
        case running
        case results(FocusChallengeResult)
    }

    @State private var celebrate: Int = 0

    private var totalQuestions: Int {
        manager.settings.difficulty.totalQuestions
    }

    /// Hearts = allowed mistakes. E.g. standard: 5 total, need 4, so 1 heart spare.
    private var totalHearts: Int {
        totalQuestions - manager.settings.difficulty.requiredCorrect
    }

    private var mistakesSoFar: Int {
        max(0, (index + (revealed ? 1 : 0)) - correctCount - (revealed && pickedOption != nil ? 0 : 0))
    }

    var body: some View {
        ZStack {
            WSColor.duoSurface.ignoresSafeArea()

            switch phase {
            case .running:
                runningBody
            case .results(let result):
                resultsBody(result)
            }

            WSConfettiView(trigger: $celebrate)
                .allowsHitTesting(false)
        }
        .onAppear { startChallenge() }
        .onDisappear { ticker?.invalidate() }
        .interactiveDismissDisabled()
    }

    // MARK: - Running

    private var runningBody: some View {
        VStack(spacing: 0) {
            header

            ScrollView {
                switch manager.settings.challengeType {
                case .quiz:
                    if let q = currentQuiz {
                        quizQuestionView(q)
                    }
                case .flashcards:
                    if let c = currentFlashcard {
                        flashcardView(c)
                    }
                }
            }

            Spacer(minLength: 0)

            footer
        }
        .padding(.horizontal, 18)
        .padding(.top, 14)
        .padding(.bottom, 18)
    }

    private var header: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                // Close button
                Button {
                    ticker?.invalidate()
                    onFinish(.bailedOut)
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(WSColor.duoText.opacity(0.4))
                }

                // Progress bar across the questions
                WSProgressBar(
                    fraction: Double(index) / Double(max(1, totalQuestions)),
                    tint: WSColor.duoGreen,
                    height: 14
                )
                .animation(.spring(response: 0.35), value: index)

                // Hearts row (lives)
                HStack(spacing: 2) {
                    let missed = max(0, index - correctCount)
                    ForEach(0..<max(1, totalHearts + 1), id: \.self) { i in
                        Image(systemName: i < (totalHearts + 1 - missed) ? "heart.fill" : "heart")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(i < (totalHearts + 1 - missed) ? WSColor.duoRed : WSColor.duoBorder)
                    }
                }

                // Timer chip
                HStack(spacing: 4) {
                    Image(systemName: "timer")
                        .font(.system(size: 11, weight: .bold))
                    Text("\(secondsLeft)s")
                        .font(WSFont.sans(12, weight: .bold))
                }
                .foregroundStyle(secondsLeft <= 5 ? WSColor.duoRed : WSColor.duoText.opacity(0.55))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    Capsule()
                        .fill(secondsLeft <= 5 ? WSColor.duoRedLight : WSColor.backgroundElevated)
                        .overlay(Capsule().stroke(secondsLeft <= 5 ? WSColor.duoRed : WSColor.duoBorder, lineWidth: 2))
                )
            }
        }
    }

    // MARK: - Quiz mode

    private var currentQuiz: QuizQuestion? {
        guard quizQuestions.indices.contains(index) else { return nil }
        return quizQuestions[index]
    }

    private func quizQuestionView(_ q: QuizQuestion) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(q.question)
                .wsHeadline(.medium, weight: .black)
                .foregroundStyle(WSColor.duoText)
                .padding(.top, 18)

            VStack(spacing: 10) {
                let options = shuffledOptions(for: q)
                ForEach(Array(options.enumerated()), id: \.offset) { (i, option) in
                    let letters = ["A", "B", "C", "D", "E", "F"]
                    let letter = i < letters.count ? letters[i] : ""
                    let state = chunkyState(option, correct: q.correctAnswer)
                    WSChunkyOption(
                        label: option,
                        state: state,
                        action: {
                            pickQuizOption(option, correct: q.correctAnswer)
                        },
                        accessory: {
                            WSChunkyOptionLetter(
                                letter: letter,
                                fillColor: letterFill(for: state),
                                foreground: letterForeground(for: state)
                            )
                        }
                    )
                    .wsStaggerEntry(i, unit: 0.04)
                }
            }
            .padding(.top, 6)

            if revealed, let explanation = q.explanation, !explanation.isEmpty {
                explanationCard(text: explanation, isCorrect: pickedOption == q.correctAnswer)
                    .padding(.top, 4)
            }
        }
    }

    /// Translate the local picked/revealed/correct state into the shared
    /// `WSChunkyOptionState` used across Quiz / Lesson / Focus answer rows.
    private func chunkyState(_ option: String, correct: String) -> WSChunkyOptionState {
        guard revealed else {
            return option == pickedOption ? .selected : .idle
        }
        if option == correct { return .correct }
        if option == pickedOption { return .wrong }
        return .disabled
    }

    private func letterFill(for state: WSChunkyOptionState) -> Color {
        switch state {
        case .selected: return WSColor.duoBlue.opacity(0.18)
        case .correct, .wrong: return Color.white.opacity(0.25)
        default:        return WSColor.duoSurface
        }
    }

    private func letterForeground(for state: WSChunkyOptionState) -> Color {
        switch state {
        case .selected: return WSColor.duoBlueDark
        case .correct, .wrong: return Color.white
        default:        return WSColor.duoText.opacity(0.65)
        }
    }

    private func explanationCard(text: String, isCorrect: Bool) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: isCorrect ? "lightbulb.fill" : "info.circle.fill")
                .foregroundStyle(isCorrect ? WSColor.duoGreen : WSColor.duoOrange)
            Text(text)
                .wsBody(.small)
                .foregroundStyle(WSColor.duoText)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(isCorrect ? WSColor.duoGreenLight : WSColor.duoOrangeLight)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(isCorrect ? WSColor.duoGreen.opacity(0.3) : WSColor.duoOrange.opacity(0.3), lineWidth: 1)
                )
        )
    }

    private func shuffledOptions(for q: QuizQuestion) -> [String] {
        guard let opts = q.options, !opts.isEmpty else { return [q.correctAnswer] }
        var rng = SeededGenerator(seed: UInt64(abs((q.id ?? 0)) &+ 7919))
        return opts.shuffled(using: &rng)
    }

    private func pickQuizOption(_ option: String, correct: String) {
        guard !revealed else { return }
        pickedOption = option
        revealed = true
        if option == correct {
            correctCount += 1
            Haptics.success()
        } else {
            Haptics.warning()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
            advanceQuestion()
        }
    }

    // MARK: - Flashcard mode

    private var currentFlashcard: Flashcard? {
        guard flashcards.indices.contains(index) else { return nil }
        return flashcards[index]
    }

    private func flashcardView(_ card: Flashcard) -> some View {
        VStack(spacing: 14) {
            Text(revealed ? "ANSWER" : "RECALL THE ANSWER")
                .wsEyebrow()
                .foregroundStyle(WSColor.duoPurple)
                .padding(.top, 24)

            Button {
                if !revealed {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.78)) {
                        revealed = true
                    }
                    Haptics.light()
                }
            } label: {
                Text(revealed ? card.back : card.front)
                    .wsHeadline(.medium, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                    .multilineTextAlignment(.center)
                    .padding(20)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.plain)
            .frame(minHeight: 200)
            .wsChunkyCard(accent: WSColor.duoPurple)
            .padding(.horizontal, 4)

            if !revealed {
                Text("Tap the card to reveal the answer")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
            } else {
                HStack(spacing: 10) {
                    Button {
                        gradeFlashcard(known: false)
                    } label: {
                        Label("Missed it", systemImage: "xmark.circle.fill")
                    }
                    .buttonStyle(WSDuoDangerButtonStyle())

                    Button {
                        gradeFlashcard(known: true)
                    } label: {
                        Label("Got it", systemImage: "checkmark.circle.fill")
                    }
                    .buttonStyle(WSDuoSuccessButtonStyle())
                }
                .padding(.top, 6)
            }
        }
        .padding(.horizontal, 4)
    }

    private func gradeFlashcard(known: Bool) {
        guard revealed else { return }
        if known { correctCount += 1; Haptics.success() }
        else     { Haptics.warning() }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            advanceQuestion()
        }
    }

    // MARK: - Progression

    private func advanceQuestion() {
        let total = manager.settings.difficulty.totalQuestions
        if index + 1 >= total {
            finishRound()
        } else {
            withAnimation(.easeInOut(duration: 0.25)) {
                index += 1
                revealed = false
                pickedOption = nil
                secondsLeft = manager.settings.difficulty.secondsPerQuestion
            }
        }
    }

    private func finishRound() {
        ticker?.invalidate()
        let needed = manager.settings.difficulty.requiredCorrect
        let total = manager.settings.difficulty.totalQuestions
        let result: FocusChallengeResult = correctCount >= needed
            ? .passed(score: correctCount, of: total)
            : .failed(score: correctCount, of: total, cooldown: 10 * 60)

        manager.handleChallengeResult(result)

        withAnimation(.easeInOut(duration: 0.35)) {
            phase = .results(result)
        }
        if result.didUnlock {
            Haptics.success()
            celebrate += 1
        } else {
            Haptics.warning()
        }
    }

    // MARK: - Footer (always visible during running phase)

    private var footer: some View {
        Button {
            ticker?.invalidate()
            onFinish(.bailedOut)
            dismiss()
        } label: {
            Text("I'll wait — close this")
        }
        .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))
        .padding(.top, 12)
    }

    // MARK: - Results screen

    private func resultsBody(_ result: FocusChallengeResult) -> some View {
        VStack(spacing: 18) {
            Spacer(minLength: 8)

            ZStack {
                Circle()
                    .fill(result.didUnlock ? WSColor.duoGreenLight : WSColor.duoRedLight)
                    .frame(width: 120, height: 120)
                Image(systemName: result.didUnlock ? "lock.open.fill" : "lock.fill")
                    .font(.system(size: 50, weight: .heavy))
                    .foregroundStyle(result.didUnlock ? WSColor.duoGreen : WSColor.duoRed)
            }

            Text(result.didUnlock ? "Unlocked!" : "Not quite")
                .wsHeadline(.large, weight: .black)
                .foregroundStyle(WSColor.duoText)

            Text(resultsBlurb(for: result))
                .wsBody(.medium)
                .multilineTextAlignment(.center)
                .foregroundStyle(WSColor.duoText.opacity(0.65))
                .padding(.horizontal, 24)

            scoreSummary(for: result)
                .padding(.top, 4)

            VStack(spacing: 10) {
                if result.didUnlock {
                    Button {
                        onFinish(result)
                        dismiss()
                    } label: {
                        Label("Apps unlocked — done", systemImage: "checkmark.circle.fill")
                    }
                    .buttonStyle(WSDuoSuccessButtonStyle())
                } else {
                    Button {
                        startChallenge()
                    } label: {
                        Label("Try again", systemImage: "arrow.clockwise")
                    }
                    .buttonStyle(WSDuoPrimaryButtonStyle())

                    Button {
                        onFinish(result)
                        dismiss()
                    } label: {
                        Text("I can wait")
                    }
                    .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))
                }
            }
            .padding(.horizontal, 4)
            .padding(.top, 14)

            Spacer(minLength: 8)
        }
        .padding(.horizontal, 22)
        .padding(.vertical, 24)
    }

    private func resultsBlurb(for result: FocusChallengeResult) -> String {
        switch result {
        case .passed:
            return "Apps are unlocked for the next \(manager.settings.unlockDuration.label). They'll relock automatically."
        case .failed(_, _, let cooldown):
            let mins = Int(cooldown / 60)
            return "Got \(correctCount) of \(manager.settings.difficulty.totalQuestions). You can try again in \(mins) min — or close this and stay focused."
        case .bailedOut:
            return ""
        }
    }

    @ViewBuilder
    private func scoreSummary(for result: FocusChallengeResult) -> some View {
        let total = manager.settings.difficulty.totalQuestions
        let needed = manager.settings.difficulty.requiredCorrect
        HStack(spacing: 14) {
            scoreChip(label: "Correct",  value: "\(correctCount)/\(total)", tint: WSColor.duoGreen)
            scoreChip(label: "Required", value: "\(needed)/\(total)",       tint: WSColor.duoPurple)
        }
    }

    private func scoreChip(label: String, value: String, tint: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(WSFont.headline(22))
                .foregroundStyle(WSColor.duoText)
            Text(label)
                .font(WSFont.sans(11, weight: .bold))
                .foregroundStyle(WSColor.duoText.opacity(0.55))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .wsChunkyCard(cornerRadius: 14, horizontalPadding: 0, verticalPadding: 12, lipHeight: 4, accent: tint)
    }

    // MARK: - Setup

    private func startChallenge() {
        quizQuestions = FocusSampleQuestions.randomQuizSet()
        flashcards    = FocusSampleQuestions.randomFlashcardSet()
        index = 0
        correctCount = 0
        revealed = false
        pickedOption = nil
        secondsLeft = manager.settings.difficulty.secondsPerQuestion
        phase = .running
        startTicker()
    }

    private func startTicker() {
        ticker?.invalidate()
        ticker = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            Task { @MainActor in
                guard case .running = phase else { return }
                if secondsLeft > 0 {
                    secondsLeft -= 1
                    return
                }
                if !revealed {
                    Haptics.warning()
                    revealed = true
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    advanceQuestion()
                }
            }
        }
    }
}

// MARK: - Tiny seeded RNG for stable shuffles

private struct SeededGenerator: RandomNumberGenerator {
    var state: UInt64
    init(seed: UInt64) { self.state = seed == 0 ? 0xdeadbeef : seed }
    mutating func next() -> UInt64 {
        state = state &* 6364136223846793005 &+ 1442695040888963407
        return state
    }
}

#Preview {
    FocusUnlockChallenge(manager: .shared) { _ in }
}
