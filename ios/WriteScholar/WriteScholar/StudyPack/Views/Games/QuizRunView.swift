//
//  QuizRunView.swift
//  WriteScholar
//
//  Quiz Run — answer as many multiple-choice questions as you can in 60
//  seconds. Fast correct answers score more and build a streak multiplier;
//  wrong answers cost 3 seconds. Questions come from a study pack's quiz
//  ("My Notes") or the general-knowledge banks.
//

import SwiftUI

struct QuizRunView: View {
    let title: String
    let questions: [QuizQuestion]

    @State private var queue: [QuizQuestion] = []
    @State private var idx = 0
    @State private var timeRemaining: Double = 60
    @State private var score = 0
    @State private var correct = 0
    @State private var wrong = 0
    @State private var streak = 0
    @State private var bestStreak = 0
    @State private var phase: Phase = .playing
    @State private var shownAt = Date()
    @State private var locked: String? = nil
    @State private var isNewHigh = false
    @State private var celebrate = 0

    enum Phase { case playing, over }

    private let accent = WSColor.duoYellowDark
    private let ticker = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()

    private var current: QuizQuestion? { queue.indices.contains(idx) ? queue[idx] : nil }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()
            if phase == .over { gameOver } else { playing }
            WSConfettiView(trigger: $celebrate).allowsHitTesting(false)
        }
        .onAppear(perform: start)
        .onReceive(ticker) { _ in tick() }
    }

    // MARK: - Playing

    private var playing: some View {
        VStack(spacing: 18) {
            header
            Spacer(minLength: 0)
            if let q = current {
                questionCard(q)
                optionsGrid(q)
            }
            Spacer(minLength: 0)
        }
        .padding(20)
    }

    private var header: some View {
        VStack(spacing: 10) {
            HStack {
                statPill(icon: "star.fill", value: "\(score)", tint: accent)
                Spacer()
                if streak >= 2 {
                    statPill(icon: "flame.fill", value: "x\(streakMultiplier)", tint: WSColor.duoOrange)
                }
                Spacer()
                statPill(icon: "clock.fill", value: "\(Int(ceil(timeRemaining)))s",
                         tint: timeRemaining <= 10 ? WSColor.duoRed : WSColor.duoBlue)
            }
            WSProgressBar(fraction: max(0, timeRemaining / 60), tint: accent, height: 10)
        }
    }

    private func statPill(icon: String, value: String, tint: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 12, weight: .black))
            Text(value).font(WSFont.sans(15, weight: .black)).monospacedDigit()
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 12).padding(.vertical, 7)
        .background(Capsule().fill(tint.opacity(0.14)))
    }

    private func questionCard(_ q: QuizQuestion) -> some View {
        Text(q.question)
            .font(WSFont.headline(19, weight: .black))
            .foregroundStyle(WSColor.foreground)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(22)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(WSColor.surfacePurple)
                    .shadow(color: Color.black.opacity(0.06), radius: 10, y: 4)
            )
    }

    private func optionsGrid(_ q: QuizQuestion) -> some View {
        let opts = (q.options?.isEmpty ?? true) ? ["True", "False"] : q.options!
        return VStack(spacing: 10) {
            ForEach(Array(opts.enumerated()), id: \.offset) { (_, opt) in
                Button { choose(opt, q: q) } label: {
                    Text(opt)
                        .font(WSFont.sans(16, weight: .heavy))
                        .foregroundStyle(fg(opt, q))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(bg(opt, q))
                                .shadow(color: Color.black.opacity(0.05), radius: 6, y: 3)
                        )
                }
                .buttonStyle(WSBouncyButtonStyle())
                .disabled(locked != nil)
            }
        }
    }

    private func bg(_ opt: String, _ q: QuizQuestion) -> Color {
        guard let locked else { return WSColor.backgroundElevated }
        if opt.lowercased() == q.correctAnswer.lowercased() { return WSColor.duoGreen }
        if opt == locked { return WSColor.duoRed }
        return WSColor.backgroundElevated
    }

    private func fg(_ opt: String, _ q: QuizQuestion) -> Color {
        guard let locked else { return WSColor.foreground }
        if opt.lowercased() == q.correctAnswer.lowercased() { return .white }
        if opt == locked { return .white }
        return WSColor.foregroundMuted
    }

    // MARK: - Game over

    private var gameOver: some View {
        VStack(spacing: 20) {
            Text("Time's up! ⏱️")
                .wsHeadline(.large, weight: .black)
                .foregroundStyle(WSColor.foreground)
            WSProgressRing(progress: 1, tint: accent, size: 150, lineWidth: 12,
                           centerTitle: "\(score)", centerSubtitle: "points")
            if isNewHigh {
                Text("New high score! 🏆")
                    .wsBody(.medium, weight: .black)
                    .foregroundStyle(WSColor.duoYellowDark)
            }
            HStack(spacing: 10) {
                WSStatChip(icon: "checkmark.circle.fill", value: "\(correct)", label: "Correct", tint: WSColor.duoGreen)
                WSStatChip(icon: "xmark.circle.fill", value: "\(wrong)", label: "Wrong", tint: WSColor.duoRed)
                WSStatChip(icon: "flame.fill", value: "\(bestStreak)", label: "Best streak", tint: WSColor.duoOrange)
            }
            Button { start() } label: {
                Label("Play again", systemImage: "arrow.counterclockwise").frame(maxWidth: .infinity)
            }
            .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
        }
        .padding(24)
    }

    // MARK: - Logic

    private var streakMultiplier: Int { min(4, 1 + streak / 3) }

    private func start() {
        queue = questions.shuffled()
        idx = 0; timeRemaining = 60; score = 0; correct = 0; wrong = 0
        streak = 0; bestStreak = 0; phase = .playing; locked = nil; isNewHigh = false
        shownAt = Date()
        Haptics.medium()
    }

    private func tick() {
        guard phase == .playing else { return }
        timeRemaining -= 0.05
        if timeRemaining <= 0 {
            timeRemaining = 0
            endGame()
        }
    }

    private func choose(_ opt: String, q: QuizQuestion) {
        guard locked == nil, phase == .playing else { return }
        locked = opt
        if opt.lowercased() == q.correctAnswer.lowercased() {
            let fast = Date().timeIntervalSince(shownAt) < 2.5
            score += (fast ? 15 : 10) * streakMultiplier
            correct += 1
            streak += 1
            bestStreak = max(bestStreak, streak)
            Haptics.success()
        } else {
            wrong += 1
            streak = 0
            timeRemaining = max(0, timeRemaining - 3)   // wrong costs time
            Haptics.warning()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            guard phase == .playing else { return }
            locked = nil
            advance()
        }
    }

    private func advance() {
        idx += 1
        if idx >= queue.count { queue = questions.shuffled(); idx = 0 }  // loop the pool
        shownAt = Date()
    }

    private func endGame() {
        guard phase == .playing else { return }
        phase = .over
        isNewHigh = GameScoreStore.shared.submit(score, for: .quizRun)
        DailyGoalStore.shared.record(.quizRunPlayed, title: "Quiz Run",
                                     subtitle: "\(correct) correct · \(score) pts")
        if isNewHigh { celebrate += 1 }
        Haptics.success()
    }
}

#Preview {
    QuizRunView(title: "Quiz Run", questions: [
        QuizQuestion(id: 1, type: .multipleChoice, question: "Capital of France?",
                     options: ["Paris", "Rome", "Berlin", "Madrid"], correctAnswer: "Paris", explanation: nil),
        QuizQuestion(id: 2, type: .multipleChoice, question: "2 + 2 × 2 = ?",
                     options: ["6", "8", "4", "10"], correctAnswer: "6", explanation: nil)
    ])
}
