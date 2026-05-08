//
//  FocusUnlockChallenge.swift
//  WriteScholar
//
//  The 5-question challenge sheet shown when the user wants to lift the
//  Focus shield. Modes:
//    • Quiz       — MCQ, single choice, instant feedback per question
//    • Flashcards — front shown, tap to flip, then "Got it" / "Missed it"
//
//  Settings:
//    • Standard difficulty: 5 questions, need 4 right, 30s per question
//    • Hard difficulty:     5 questions, need 5 right, 15s per question
//
//  On pass:  FocusManager.handleChallengeResult(.passed(...)) → unlock
//            window opens, sheet dismisses, success haptic + toast
//  On fail:  10-minute cooldown before another attempt
//

import SwiftUI

struct FocusUnlockChallenge: View {
    @ObservedObject var manager: FocusManager
    var onFinish: (FocusChallengeResult) -> Void

    @Environment(\.dismiss) private var dismiss

    // Loaded once when the view appears
    @State private var quizQuestions: [QuizQuestion] = []
    @State private var flashcards:    [Flashcard]    = []

    // Shared progress state
    @State private var index: Int = 0
    @State private var correctCount: Int = 0
    @State private var revealed: Bool = false
    @State private var pickedOption: String? = nil
    @State private var secondsLeft: Int = 30
    @State private var ticker: Timer? = nil

    // Final phase
    @State private var phase: Phase = .running

    enum Phase: Equatable {
        case running
        case results(FocusChallengeResult)
    }

    /// Bumped once on a passing result — fires the confetti overlay so
    /// the unlock feels like the celebration it is.
    @State private var celebrate: Int = 0

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Soft brand orbs to match the rest of the app
            Circle()
                .fill(manager.settings.challengeType.tint.opacity(0.12))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -180, y: -260)
                .ignoresSafeArea()
            Circle()
                .fill(WSColor.brandPrimary.opacity(0.10))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: 200, y: 320)
                .ignoresSafeArea()

            switch phase {
            case .running:
                runningBody
            case .results(let result):
                resultsBody(result)
            }

            // Confetti — fires only when a passing result lands.
            WSConfettiView(trigger: $celebrate)
                .allowsHitTesting(false)
        }
        .onAppear { startChallenge() }
        .onDisappear { ticker?.invalidate() }
        .interactiveDismissDisabled() // can't swipe away — must finish or tap "I'll wait"
    }

    // MARK: - Running

    private var runningBody: some View {
        VStack(spacing: 0) {
            header

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
                Text("UNLOCK CHALLENGE")
                    .wsEyebrow()
                    .foregroundStyle(manager.settings.challengeType.tint)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(manager.settings.challengeType.tint.opacity(0.14)))

                Spacer()

                // Score chip
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(WSColor.strong)
                    Text("\(correctCount)/\(manager.settings.difficulty.totalQuestions)")
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(WSColor.surface))

                // Timer chip
                HStack(spacing: 6) {
                    Image(systemName: "timer")
                        .foregroundStyle(secondsLeft <= 5 ? WSColor.concern : WSColor.foregroundMuted)
                    Text("\(secondsLeft)s")
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(secondsLeft <= 5 ? WSColor.concern : WSColor.foreground)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(WSColor.surface))
            }

            // Progress bar across the 5 questions
            HStack(spacing: 6) {
                ForEach(0..<manager.settings.difficulty.totalQuestions, id: \.self) { i in
                    Capsule()
                        .fill(barColor(for: i))
                        .frame(height: 6)
                }
            }
        }
    }

    private func barColor(for i: Int) -> Color {
        if i < index {
            // already answered — show pass/fail color (we don't have the
            // per-question outcome, so just use brand for "done")
            return manager.settings.challengeType.tint
        }
        if i == index { return manager.settings.challengeType.tint.opacity(0.45) }
        return WSColor.surface
    }

    // MARK: - Quiz mode

    private var currentQuiz: QuizQuestion? {
        guard quizQuestions.indices.contains(index) else { return nil }
        return quizQuestions[index]
    }

    private func quizQuestionView(_ q: QuizQuestion) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(q.question)
                .wsHeadline(.medium, weight: .bold)
                .foregroundStyle(WSColor.foreground)
                .padding(.top, 18)

            VStack(spacing: 10) {
                ForEach(shuffledOptions(for: q), id: \.self) { option in
                    Button {
                        pickQuizOption(option, correct: q.correctAnswer)
                    } label: {
                        optionRow(text: option,
                                  state: optionState(option, correct: q.correctAnswer))
                    }
                    .buttonStyle(.plain)
                    .disabled(revealed)
                }
            }
            .padding(.top, 6)

            if revealed, let explanation = q.explanation, !explanation.isEmpty {
                explanationCard(text: explanation, isCorrect: pickedOption == q.correctAnswer)
                    .padding(.top, 4)
            }
        }
    }

    private enum OptionState { case idle, picked, correct, wrong, missedCorrect }

    private func optionState(_ option: String, correct: String) -> OptionState {
        guard revealed else {
            return option == pickedOption ? .picked : .idle
        }
        if option == correct { return .correct }
        if option == pickedOption { return .wrong }
        return .idle
    }

    private func optionRow(text: String, state: OptionState) -> some View {
        let (bg, fg, border) = optionPalette(state)
        return HStack(spacing: 12) {
            Text(text)
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(fg)
                .frame(maxWidth: .infinity, alignment: .leading)

            switch state {
            case .correct, .missedCorrect:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(WSColor.strong)
            case .wrong:
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(WSColor.concern)
            default:
                EmptyView()
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(bg)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(border, lineWidth: 1.5)
                )
        )
    }

    private func optionPalette(_ state: OptionState) -> (Color, Color, Color) {
        switch state {
        case .idle:
            return (WSColor.backgroundElevated, WSColor.foreground, WSColor.hairline)
        case .picked:
            return (manager.settings.challengeType.tint.opacity(0.12),
                    WSColor.foreground,
                    manager.settings.challengeType.tint.opacity(0.55))
        case .correct, .missedCorrect:
            return (WSColor.strong.opacity(0.14), WSColor.foreground, WSColor.strong)
        case .wrong:
            return (WSColor.concern.opacity(0.14), WSColor.foreground, WSColor.concern)
        }
    }

    private func explanationCard(text: String, isCorrect: Bool) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: isCorrect ? "lightbulb.fill" : "info.circle.fill")
                .foregroundStyle(isCorrect ? WSColor.strong : WSColor.revise)
            Text(text)
                .wsBody(.small)
                .foregroundStyle(WSColor.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.surface)
        )
    }

    private func shuffledOptions(for q: QuizQuestion) -> [String] {
        // Stable per-question shuffle so taps don't reorder mid-question
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
        // Brief reveal pause then advance
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
                .foregroundStyle(manager.settings.challengeType.tint)
                .padding(.top, 24)

            Button {
                if !revealed {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.78)) {
                        revealed = true
                    }
                    Haptics.light()
                }
            } label: {
                ZStack {
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(WSColor.backgroundElevated)
                        .overlay(
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .stroke(WSColor.hairline, lineWidth: 1)
                        )
                        .shadow(color: manager.settings.challengeType.tint.opacity(0.15), radius: 16, y: 6)
                    Text(revealed ? card.back : card.front)
                        .wsHeadline(.medium, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                        .multilineTextAlignment(.center)
                        .padding(20)
                }
            }
            .buttonStyle(.plain)
            .frame(minHeight: 200)
            .padding(.horizontal, 4)

            if !revealed {
                Text("Tap the card to reveal the answer")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            } else {
                HStack(spacing: 10) {
                    Button {
                        gradeFlashcard(known: false)
                    } label: {
                        gradeButtonLabel(text: "Missed it", icon: "xmark.circle.fill", color: WSColor.concern)
                    }
                    .buttonStyle(.plain)

                    Button {
                        gradeFlashcard(known: true)
                    } label: {
                        gradeButtonLabel(text: "Got it", icon: "checkmark.circle.fill", color: WSColor.strong)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 6)
            }
        }
        .padding(.horizontal, 4)
    }

    private func gradeButtonLabel(text: String, icon: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
            Text(text).wsBody(.medium, weight: .bold)
        }
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            Capsule().fill(color)
                .shadow(color: color.opacity(0.40), radius: 8, y: 3)
        )
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

        // Inform the manager (it updates stats + opens unlock window on pass)
        manager.handleChallengeResult(result)

        // Switch to the results screen so the user sees what happened
        withAnimation(.easeInOut(duration: 0.35)) {
            phase = .results(result)
        }
        if result.didUnlock {
            Haptics.success()
            celebrate += 1     // 🎉 fire the confetti
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
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    Capsule().fill(WSColor.surface)
                )
        }
        .buttonStyle(.plain)
        .padding(.top, 12)
    }

    // MARK: - Results screen

    private func resultsBody(_ result: FocusChallengeResult) -> some View {
        VStack(spacing: 18) {
            Spacer(minLength: 8)

            ZStack {
                Circle()
                    .fill(result.didUnlock ? WSColor.strong.opacity(0.18) : WSColor.concern.opacity(0.18))
                    .frame(width: 120, height: 120)
                Image(systemName: result.didUnlock ? "lock.open.fill" : "lock.fill")
                    .font(.system(size: 50, weight: .heavy))
                    .foregroundStyle(result.didUnlock ? WSColor.strong : WSColor.concern)
            }

            Text(result.didUnlock ? "Unlocked" : "Not quite")
                .wsHeadline(.large, weight: .bold)
                .foregroundStyle(WSColor.foreground)

            Text(resultsBlurb(for: result))
                .wsBody(.medium)
                .multilineTextAlignment(.center)
                .foregroundStyle(WSColor.foregroundMuted)
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
                    .buttonStyle(WSPrimaryButtonStyle())
                } else {
                    Button {
                        // Reset and re-attempt
                        startChallenge()
                    } label: {
                        Label("Try again", systemImage: "arrow.clockwise")
                    }
                    .buttonStyle(WSPrimaryButtonStyle())

                    Button {
                        onFinish(result)
                        dismiss()
                    } label: {
                        Text("I can wait")
                            .wsBody(.small, weight: .bold)
                            .foregroundStyle(WSColor.foregroundMuted)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Capsule().fill(WSColor.surface))
                    }
                    .buttonStyle(.plain)
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
            scoreChip(label: "Correct",  value: "\(correctCount)/\(total)", tint: WSColor.strong)
            scoreChip(label: "Required", value: "\(needed)/\(total)",       tint: manager.settings.challengeType.tint)
        }
    }

    private func scoreChip(label: String, value: String, tint: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .wsHeadline(.medium, weight: .bold)
                .foregroundStyle(WSColor.foreground)
            Text(label)
                .wsBody(.caption, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(tint.opacity(0.10))
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(tint.opacity(0.35), lineWidth: 1)
                )
        )
    }

    // MARK: - Setup

    private func startChallenge() {
        // Reload pools — for now from the sample bank. Later this can
        // pull from the user's most-recent saved study pack.
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
                // Time-out — count as wrong + advance
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
