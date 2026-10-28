//
//  QuizView.swift
//  WriteScholar
//
//  Multiple-choice / true-false / fill-in-the-blank quiz player
//  (prototype screens #9 + #10). Selected option = purple fill + white
//  text + trailing check; the primary CTA is pinned full-width at the
//  bottom. The complete screen shows an 8/10 ring, a percentile line,
//  Correct/Incorrect/Time stats and a Review-answers walkthrough.
//

import SwiftUI

struct QuizView: View {
    let quiz: Quiz

    @State private var qIndex = 0
    @State private var selected: String? = nil
    @State private var revealed = false
    @State private var lastAnswerCorrect = false
    @State private var correctCount = 0
    @State private var fillBlankAnswer: String = ""
    @State private var answers: [Int: String] = [:]        // qIndex → chosen
    @State private var didAwardCompletion = false
    @State private var startedAt = Date()
    @State private var finalElapsed: String = ""
    @State private var reviewing = false
    @State private var combo = 0
    @State private var bestCombo = 0

    private var questions: [QuizQuestion] { quiz.questions }
    private var total: Int { questions.count }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            if questions.isEmpty {
                EmptyStateView(
                    icon: "checkmark.bubble",
                    title: "No quiz",
                    message: "This study pack didn't include a quiz. Try regenerating with longer notes."
                )
            } else if qIndex >= total {
                if reviewing {
                    reviewScreen
                } else {
                    scoreScreen.onAppear { awardCompletionIfNeeded() }
                }
            } else {
                questionScreen
            }

        }
    }

    // MARK: - Question screen (scroll + pinned CTA)

    private var questionScreen: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 16) {
                    progressHeader
                    questionCard
                        .id(qIndex)
                        .transition(.asymmetric(
                            insertion: .move(edge: .trailing).combined(with: .opacity),
                            removal: .move(edge: .leading).combined(with: .opacity)))
                    if revealed, let exp = questions[qIndex].explanation, !exp.isEmpty {
                        explanationBanner(exp)
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
            }
            .scrollDismissesKeyboard(.interactively)

            bottomCTA
        }
    }

    /// Called once when the score screen first appears.
    private func awardCompletionIfNeeded() {
        guard !didAwardCompletion else { return }
        didAwardCompletion = true
        finalElapsed = elapsedString
        let percent = total == 0 ? 0 : Int(round(Double(correctCount) / Double(total) * 100))
        let title = quiz.title ?? "Quiz"
        DailyGoalStore.shared.record(.quizCompleted, title: title,
                                     subtitle: "\(correctCount)/\(total) · \(percent)%")
        if percent == 100 {
            DailyGoalStore.shared.record(.quizPerfectScore, title: title, subtitle: "100%, perfect run")
        }
        StudyPackProgressStore.shared.recordQuizScore(correct: correctCount)
        // The win screen runs its own confetti + slam on appear.
    }

    // MARK: - Header

    private var progressHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text("Q\(qIndex + 1)")
                    .font(WSFont.headline(15, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .wsStickerCapsule(fill: WSColor.lime, depth: 2)
                Text("of \(total)")
                    .font(WSFont.sans(14, weight: .heavy))
                    .foregroundStyle(WSColor.foregroundMuted)
                Spacer()
                if combo >= 2 {
                    HStack(spacing: 4) {
                        WSFlameIcon(size: 14)
                        Text("x\(combo) combo")
                            .font(WSFont.headline(14, weight: .black))
                            .contentTransition(.numericText())
                    }
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .wsStickerCapsule(fill: WSColor.orange, depth: 2)
                    .transition(.scale.combined(with: .opacity))
                }
            }
            .animation(.wsBouncePop, value: combo)
            // Fills as each question is answered so bar and label stay in sync.
            WSStripeBar(fraction: Double(qIndex + (revealed ? 1 : 0)) / Double(max(total, 1)),
                        fill: WSColor.purple, height: 14)
        }
    }

    // MARK: - Question card

    private var questionCard: some View {
        let q = questions[qIndex]
        return VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text((q.type?.rawValue ?? "question").replacingOccurrences(of: "_", with: " ").uppercased())
                    .font(WSFont.sans(11, weight: .black))
                    .tracking(1.3)
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        ZStack {
                            Capsule().fill(WSColor.pink)
                            Capsule().strokeBorder(WSColor.ink, lineWidth: 2)
                        }
                    )
                Spacer()
            }

            Text(q.question)
                .font(WSFont.headline(24, weight: .black))
                .tracking(-0.4)
                .foregroundStyle(WSColor.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 10) {
                if let opts = q.options, !opts.isEmpty {
                    ForEach(Array(opts.enumerated()), id: \.offset) { (i, opt) in
                        answerRow(opt, index: i, correctAnswer: q.correctAnswer)
                    }
                } else if q.type == .trueFalse {
                    answerRow("True", index: 0, correctAnswer: q.correctAnswer)
                    answerRow("False", index: 1, correctAnswer: q.correctAnswer)
                } else {
                    fillBlankInput()
                }
            }
        }
        .padding(.vertical, 6)
    }

    private func optionState(option: String, correctAnswer: String) -> WSChunkyOptionState {
        let isSelected = (selected == option)
        let isCorrect = option.lowercased() == correctAnswer.lowercased()
        if !revealed { return isSelected ? .selected : .idle }
        if isCorrect { return .correct }
        if isSelected { return .wrong }
        return .disabled
    }

    private func answerRow(_ option: String, index: Int, correctAnswer: String) -> some View {
        let state = optionState(option: option, correctAnswer: correctAnswer)
        let letters = ["A", "B", "C", "D", "E", "F"]
        let letter = index < letters.count ? letters[index] : ""
        let filled = (state == .selected || state == .correct || state == .wrong)

        return WSChunkyOption(
            label: option,
            state: state,
            action: { handleAnswerTap(option: option, correctAnswer: correctAnswer) },
            accessory: {
                WSChunkyOptionLetter(
                    letter: letter,
                    fillColor: filled ? Color.white : WSColor.lilacDeep,
                    foreground: WSColor.inkText,
                    strokeColor: WSColor.ink
                )
            }
        )
        .wsStaggerEntry(index, unit: 0.04)
    }

    private func handleAnswerTap(option: String, correctAnswer: String) {
        guard !revealed else { return }
        selected = option
        answers[qIndex] = option
        Haptics.selection()
        lastAnswerCorrect = option.lowercased() == correctAnswer.lowercased()
        withAnimation(.wsBouncePop) { revealed = true }
        if lastAnswerCorrect { correctCount += 1; Haptics.success() } else { Haptics.warning() }
        bumpCombo()
    }

    private func bumpCombo() {
        if lastAnswerCorrect {
            combo += 1
            bestCombo = max(bestCombo, combo)
        } else {
            combo = 0
        }
    }

    private func fillBlankInput() -> some View {
        WSTextField(placeholder: "Your answer", icon: "pencil.line", text: $fillBlankAnswer)
            .disabled(revealed)
    }

    private func checkFillBlank() {
        guard !revealed else { return }
        let q = questions[qIndex]
        selected = fillBlankAnswer
        answers[qIndex] = fillBlankAnswer
        lastAnswerCorrect = fillBlankAnswer.trimmingCharacters(in: .whitespacesAndNewlines)
            .caseInsensitiveCompare(q.correctAnswer.trimmingCharacters(in: .whitespacesAndNewlines)) == .orderedSame
        if lastAnswerCorrect { correctCount += 1; Haptics.success() } else { Haptics.warning() }
        bumpCombo()
        withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) { revealed = true }
    }

    private func explanationBanner(_ exp: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: lastAnswerCorrect ? "checkmark" : "xmark")
                .font(.system(size: 16, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 38, height: 38)
                .wsStickerCircle(fill: .white)
            VStack(alignment: .leading, spacing: 4) {
                Text(lastAnswerCorrect ? "Nailed it." : "Not quite.")
                    .font(WSFont.headline(20, weight: .black))
                Text(exp)
                    .font(WSFont.sans(14, weight: .bold))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .foregroundStyle(WSColor.inkText)
        .padding(14)
        .wsSticker(fill: lastAnswerCorrect ? WSColor.lime : WSColor.pinkSoft, radius: 20)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    // MARK: - Bottom CTA (pinned)

    @ViewBuilder
    private var bottomCTA: some View {
        let q = questions[qIndex]
        let isFillBlank = (q.options?.isEmpty ?? true) && q.type != .trueFalse

        if revealed {
            pinned {
                Button { advanceQuestion() } label: {
                    HStack(spacing: 8) {
                        Text(qIndex == total - 1 ? "See score" : "Next question")
                        Image(systemName: "chevron.right")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(WSStickerButtonStyle(fill: WSColor.inkText, foreground: .white))
            }
        } else if isFillBlank {
            pinned {
                Button { checkFillBlank() } label: {
                    Text("Check answer").frame(maxWidth: .infinity)
                }
                .buttonStyle(WSStickerButtonStyle(fill: WSColor.purple, foreground: .white))
                .disabled(fillBlankAnswer.isEmpty)
                .opacity(fillBlankAnswer.isEmpty ? 0.5 : 1)
            }
        }
        // MC/TF before reveal: tapping an option is the action — no bar.
    }

    private func pinned<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        content()
            .padding(.horizontal, 20)
            .padding(.top, 10)
            .padding(.bottom, 8)
            .background(WSColor.background.ignoresSafeArea(edges: .bottom))
    }

    private func advanceQuestion() {
        Haptics.light()
        withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
            qIndex += 1
            selected = nil
            revealed = false
            fillBlankAnswer = ""
        }
    }

    // MARK: - Score screen

    private var scoreScreen: some View {
        let percentage = total == 0 ? 0 : Int(round(Double(correctCount) / Double(total) * 100))
        let xp = DailyGoalStore.Activity.quizCompleted.xp
            + (percentage == 100 ? DailyGoalStore.Activity.quizPerfectScore.xp : 0)
        let title = quiz.title ?? "Quiz"
        return WSWinScreen(
            headline: percentage >= 80 ? "LOCKED\nIN." : (percentage >= 50 ? "NICE\nRUN." : "RUN IT\nBACK."),
            subline: percentage >= 80 ? "\(title) done. Scholar is proud of you."
                   : percentage >= 50 ? "\(title) done. A retake gets you over the line."
                   : "\(title) done. Review the misses, then go again.",
            stats: [
                WSWinStat(label: "XP earned", value: "+\(xp)", fill: WSColor.lime),
                WSWinStat(label: "Score", value: "\(correctCount)/\(total)", fill: WSColor.orange),
                WSWinStat(label: "Accuracy", value: "\(percentage)%", fill: WSColor.sky),
                WSWinStat(label: "Best combo", value: "x\(bestCombo)", fill: WSColor.pink),
            ]
        ) {
            Button {
                Haptics.medium()
                reviewing = true
            } label: {
                Label("Review answers", systemImage: "list.bullet.rectangle.portrait")
            }
            .buttonStyle(WSStickerButtonStyle(fill: .white, foreground: WSColor.inkText, radius: 20, height: 60))

            Button {
                restart()
            } label: {
                Label("Run it again", systemImage: "arrow.counterclockwise")
            }
            .buttonStyle(WSStickerButtonStyle(fill: WSColor.lime, foreground: WSColor.inkText, radius: 20, height: 60))
        }
    }

    private func restart() {
        qIndex = 0
        correctCount = 0
        selected = nil
        revealed = false
        fillBlankAnswer = ""
        answers = [:]
        combo = 0
        bestCombo = 0
        didAwardCompletion = false
        reviewing = false
        startedAt = Date()
        Haptics.medium()
    }

    // MARK: - Review answers

    private var reviewScreen: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Button {
                        Haptics.light()
                        reviewing = false
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 16, weight: .black))
                            .foregroundStyle(WSColor.foreground)
                            .frame(width: 38, height: 38)
                            .wsStickerCircle(fill: WSColor.backgroundElevated)
                    }
                    .buttonStyle(WSStickerPressStyle())
                    Spacer()
                    Text("Review answers")
                        .wsHeadline(.small, weight: .black)
                        .foregroundStyle(WSColor.foreground)
                    Spacer()
                    Color.clear.frame(width: 38, height: 38)
                }

                ForEach(Array(questions.enumerated()), id: \.offset) { (i, q) in
                    reviewCard(index: i, q: q)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }

    private func reviewCard(index: Int, q: QuizQuestion) -> some View {
        let userAnswer = answers[index]
        let wasCorrect = userAnswer?.lowercased() == q.correctAnswer.lowercased()
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: wasCorrect ? "checkmark" : "xmark")
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 24, height: 24)
                    .wsStickerCircle(fill: wasCorrect ? WSColor.lime : WSColor.pink)
                Text("Question \(index + 1)")
                    .font(WSFont.sans(11, weight: .black))
                    .tracking(0.6)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Text(q.question)
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(WSColor.foreground)

            if !wasCorrect, let ua = userAnswer, !ua.isEmpty {
                answerLine(label: "Your answer", value: ua, color: WSColor.pinkSoft)
            }
            answerLine(label: "Correct answer", value: q.correctAnswer, color: WSColor.lime)

            if let exp = q.explanation, !exp.isEmpty {
                Text(exp)
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.top, 2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 18)
    }

    private func answerLine(label: String, value: String, color: Color) -> some View {
        HStack(spacing: 8) {
            Text(label)
                .font(WSFont.sans(11, weight: .black))
                .frame(width: 108, alignment: .leading)
            Text(value)
                .wsBody(.small, weight: .bold)
            Spacer(minLength: 0)
        }
        .foregroundStyle(WSColor.inkText)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(color))
        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(WSColor.ink, lineWidth: 2))
    }

    private var elapsedString: String {
        let secs = max(0, Int(Date().timeIntervalSince(startedAt)))
        return String(format: "%dm %02ds", secs / 60, secs % 60)
    }
}

#Preview {
    QuizView(quiz: Quiz(
        title: "Photosynthesis",
        questions: [
            QuizQuestion(
                id: 1, type: .multipleChoice,
                question: "Which molecule is the primary product of photosynthesis?",
                options: ["Oxygen", "Glucose", "Carbon Dioxide", "ATP"],
                correctAnswer: "Glucose",
                explanation: "Glucose is the sugar produced from CO2 and water using light energy."
            ),
            QuizQuestion(
                id: 2, type: .trueFalse,
                question: "Photosynthesis happens only in green plants.",
                options: nil,
                correctAnswer: "False",
                explanation: "Many bacteria and algae also photosynthesize."
            )
        ]
    ))
}
