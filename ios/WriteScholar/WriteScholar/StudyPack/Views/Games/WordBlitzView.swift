//
//  WordBlitzView.swift
//  WriteScholar
//
//  Word Blitz — 60-second fill-in-the-blank speedrun (port of the web game).
//  Read the cloze sentence, tap the right word from four options. Correct =
//  +1 (+2 if answered within 2s); wrong = −1 and the streak resets. Game
//  ends when the clock hits zero.
//

import SwiftUI

struct WordBlitzView: View {
    let wordBlitz: WordBlitz

    @State private var queue: [WordBlitzQuestion] = []
    @State private var idx = 0
    @State private var options: [String] = []
    @State private var timeRemaining: Double = 60
    @State private var score = 0
    @State private var correct = 0
    @State private var wrong = 0
    @State private var streak = 0
    @State private var longestStreak = 0
    @State private var phase: Phase = .playing
    @State private var questionShownAt = Date()
    @State private var locked: String? = nil
    @State private var revealCorrect = false

    enum Phase { case playing, over }

    private let accent = WSColor.duoPink
    private let ticker = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()

    private var current: WordBlitzQuestion? {
        queue.indices.contains(idx) ? queue[idx] : nil
    }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()
            if phase == .over { gameOver } else { playing }
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
                sentenceCard(q)
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
                if streak >= 2 { statPill(icon: "flame.fill", value: "\(streak)", tint: WSColor.duoOrange) }
                Spacer()
                statPill(icon: "clock.fill",
                         value: "\(Int(ceil(timeRemaining)))s",
                         tint: timeRemaining <= 10 ? WSColor.duoRed : WSColor.duoBlue)
            }
            WSProgressBar(fraction: max(0, timeRemaining / 60), tint: accent, height: 10)
        }
    }

    private func statPill(icon: String, value: String, tint: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 13, weight: .bold))
            Text(value).wsBody(.medium, weight: .bold)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(Capsule().fill(tint.opacity(0.14)))
    }

    private func sentenceCard(_ q: WordBlitzQuestion) -> some View {
        let parts = q.sentence.components(separatedBy: "{{blank}}")
        let before = parts.first ?? ""
        let after = parts.count > 1 ? parts[1] : ""
        return (
            Text(before)
            + Text(revealCorrect ? q.correctAnswer : "______").foregroundColor(accent).bold()
            + Text(after)
        )
        .wsBody(.large, weight: .semibold)
        .foregroundStyle(WSColor.foreground)
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .padding(26)
        .wsChunkyCard(cornerRadius: 24)
    }

    private func optionsGrid(_ q: WordBlitzQuestion) -> some View {
        let cols = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
        return LazyVGrid(columns: cols, spacing: 12) {
            ForEach(options, id: \.self) { opt in
                Button { choose(opt, q: q) } label: {
                    Text(opt)
                        .wsBody(.large, weight: .bold)
                        .foregroundStyle(optionFg(opt, q))
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .padding(.horizontal, 8)
                        .background(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .fill(optionBg(opt, q))
                        )
                }
                .buttonStyle(.plain)
                .disabled(locked != nil)
            }
        }
    }

    /// 0 = idle, 1 = correct highlight, 2 = wrong highlight.
    private func optionState(_ opt: String, _ q: WordBlitzQuestion) -> Int {
        guard locked != nil else { return 0 }
        if opt == q.correctAnswer && (locked == opt || revealCorrect) { return 1 }
        if opt == locked && opt != q.correctAnswer { return 2 }
        return 0
    }
    private func optionBg(_ opt: String, _ q: WordBlitzQuestion) -> Color {
        switch optionState(opt, q) {
        case 1: return WSColor.duoGreen
        case 2: return WSColor.duoRed
        default: return WSColor.backgroundElevated
        }
    }
    private func optionFg(_ opt: String, _ q: WordBlitzQuestion) -> Color {
        optionState(opt, q) == 0 ? WSColor.foreground : .white
    }

    // MARK: - Game over

    private var gameOver: some View {
        VStack(spacing: 20) {
            Text("Time's up! ⏱️")
                .wsHeadline(.large, weight: .black)
                .foregroundStyle(WSColor.foreground)
            WSProgressRing(progress: 1, tint: accent, size: 150, lineWidth: 12, centerText: "\(score)")
            Text("\(score) point\(score == 1 ? "" : "s")")
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(WSColor.foregroundMuted)
            HStack(spacing: 10) {
                WSStatChip(icon: "checkmark.circle.fill", value: "\(correct)", label: "Correct",     tint: WSColor.duoGreen)
                WSStatChip(icon: "xmark.circle.fill",     value: "\(wrong)",   label: "Wrong",       tint: WSColor.duoRed)
                WSStatChip(icon: "flame.fill",            value: "\(longestStreak)", label: "Best streak", tint: WSColor.duoOrange)
            }
            Button { start() } label: {
                Label("Play again", systemImage: "arrow.counterclockwise").frame(maxWidth: .infinity)
            }
            .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
        }
        .padding(24)
    }

    // MARK: - Logic

    private func start() {
        queue = wordBlitz.questions.shuffled()
        idx = 0; score = 0; correct = 0; wrong = 0; streak = 0; longestStreak = 0
        timeRemaining = 60; phase = .playing; locked = nil; revealCorrect = false
        loadOptions()
        questionShownAt = Date()
        Haptics.medium()
    }

    private func tick() {
        guard phase == .playing else { return }
        timeRemaining -= 0.05
        if timeRemaining <= 0 {
            timeRemaining = 0
            phase = .over
            Haptics.success()
        }
    }

    private func loadOptions() {
        options = (current?.options ?? []).shuffled()
    }

    private func choose(_ opt: String, q: WordBlitzQuestion) {
        guard locked == nil, phase == .playing else { return }
        locked = opt
        if opt == q.correctAnswer {
            let fast = Date().timeIntervalSince(questionShownAt) < 2.0
            score += fast ? 2 : 1
            correct += 1
            streak += 1
            longestStreak = max(longestStreak, streak)
            Haptics.success()
        } else {
            score = max(0, score - 1)
            wrong += 1
            streak = 0
            revealCorrect = true
            Haptics.warning()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.32) {
            guard phase == .playing else { return }
            locked = nil
            revealCorrect = false
            advance()
        }
    }

    private func advance() {
        idx += 1
        if idx >= queue.count {
            queue.shuffle()
            idx = 0
        }
        loadOptions()
        questionShownAt = Date()
    }
}

#Preview {
    WordBlitzView(wordBlitz: WordBlitz(title: "Word Blitz", questions: WordBlitzBank.playForFun))
}
