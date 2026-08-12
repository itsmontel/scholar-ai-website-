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
    @State private var celebrate: Int = 0
    @State private var startedAt = Date()
    @State private var finalElapsed: String = ""
    @State private var ringProgress: Double = 0
    @State private var reviewing = false

    private var questions: [QuizQuestion] { quiz.questions }
    private var total: Int { questions.count }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            if questions.isEmpty {
                EmptyStateView(
                    icon: "checkmark.bubble",
                    title: "No quiz",
                    message: "This study pack didn't include a quiz — try regenerating with longer notes."
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

            WSConfettiView(trigger: $celebrate)
                .allowsHitTesting(false)
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
                .padding(.horizontal, 16)
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
            DailyGoalStore.shared.record(.quizPerfectScore, title: title, subtitle: "100% — perfect run")
        }
        StudyPackProgressStore.shared.recordQuizScore(correct: correctCount)
        // Always celebrate finishing — a bigger burst for a strong score.
        celebrate += 1
        // Sweep the ring from 0 → final.
        ringProgress = 0
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            withAnimation(.spring(response: 0.9, dampingFraction: 0.8)) {
                ringProgress = total == 0 ? 0 : Double(correctCount) / Double(total)
            }
        }
    }

    // MARK: - Header

    private var progressHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(quiz.title ?? "Quiz")
                    .wsBody(.large, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Spacer()
                Text("Question \(qIndex + 1) of \(total)")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            // Fills as each question is answered so bar and label stay in sync.
            WSProgressBar(fraction: Double(qIndex + (revealed ? 1 : 0)) / Double(max(total, 1)),
                          tint: WSColor.duoPurple, height: 12)
        }
    }

    // MARK: - Question card

    private var questionCard: some View {
        let q = questions[qIndex]
        return VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text((q.type?.rawValue ?? "question").replacingOccurrences(of: "_", with: " ").uppercased())
                    .font(WSFont.sans(10, weight: .black))
                    .tracking(2.2)
                    .foregroundStyle(WSColor.duoPurple)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        Capsule().fill(WSColor.duoPurpleLight)
                            .overlay(Capsule().stroke(WSColor.duoPurple.opacity(0.35), lineWidth: 1.5))
                    )
                Spacer()
            }

            Text(q.question)
                .font(WSFont.headline(18, weight: .black))
                .foregroundStyle(WSColor.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)

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
        .padding(20)
        .wsChunkyCard(cornerRadius: 22)
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
                    fillColor: filled ? Color.white.opacity(0.22) : WSColor.surface,
                    foreground: filled ? .white : WSColor.foregroundMuted,
                    strokeColor: filled ? Color.white.opacity(0.3) : WSColor.duoBorder
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
        withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) { revealed = true }
    }

    private func explanationBanner(_ exp: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: lastAnswerCorrect ? "lightbulb.fill" : "info.circle.fill")
                .foregroundStyle(lastAnswerCorrect ? WSColor.duoGreen : WSColor.duoRed)
                .font(.system(size: 18, weight: .heavy))
            VStack(alignment: .leading, spacing: 4) {
                Text(lastAnswerCorrect ? "Nice one!" : "Not quite")
                    .font(WSFont.sans(13, weight: .black))
                    .foregroundStyle(lastAnswerCorrect ? WSColor.duoGreenDark : WSColor.duoRedDark)
                Text(exp)
                    .font(WSFont.sans(13, weight: .bold))
                    .foregroundStyle(WSColor.foreground)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(lastAnswerCorrect ? WSColor.duoGreenLight : WSColor.duoRedLight)
        )
        .transition(.opacity.combined(with: .move(edge: .bottom)))
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
                .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
            }
        } else if isFillBlank {
            pinned {
                Button { checkFillBlank() } label: {
                    Text("Check answer").frame(maxWidth: .infinity)
                }
                .buttonStyle(WSDuoInfoButtonStyle(fullWidth: true))
                .disabled(fillBlankAnswer.isEmpty)
            }
        }
        // MC/TF before reveal: tapping an option is the action — no bar.
    }

    private func pinned<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        content()
            .padding(.horizontal, 16)
            .padding(.top, 12)
            .padding(.bottom, 8)
            .background(
                WSColor.backgroundElevated
                    .shadow(color: Color.black.opacity(0.06), radius: 10, y: -3)
                    .ignoresSafeArea(edges: .bottom)
            )
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
        let incorrect = max(0, total - correctCount)
        let percentile = min(96, Int(Double(percentage) * 0.95))

        return ScrollView {
            VStack(spacing: 20) {
                Text("Quiz complete! 🎉")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                    .padding(.top, 14)

                WSProgressRing(progress: ringProgress,
                               tint: WSColor.duoPurple,
                               size: 176, lineWidth: 14,
                               centerTitle: "\(correctCount) / \(total)",
                               centerSubtitle: "\(percentage)%")
                    .padding(.vertical, 4)

                VStack(spacing: 6) {
                    Text("Great job!")
                        .wsHeadline(.small, weight: .black)
                        .foregroundStyle(WSColor.foreground)
                    if percentile > 0 {
                        Text("You scored higher than \(percentile)% of students")
                            .wsBody(.medium, weight: .semibold)
                            .foregroundStyle(WSColor.foregroundMuted)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 24)

                HStack(spacing: 10) {
                    WSStatChip(icon: "checkmark.circle.fill", value: "\(correctCount)", label: "Correct",   tint: WSColor.duoGreen)
                    WSStatChip(icon: "xmark.circle.fill",     value: "\(incorrect)",    label: "Incorrect", tint: WSColor.duoRed)
                    WSStatChip(icon: "clock.fill",            value: finalElapsed,      label: "Time",      tint: WSColor.duoBlue)
                }

                VStack(spacing: 10) {
                    Button {
                        Haptics.medium()
                        reviewing = true
                    } label: {
                        Label("Review answers", systemImage: "list.bullet.rectangle.portrait")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))

                    Button {
                        restart()
                    } label: {
                        Label("Retake quiz", systemImage: "arrow.counterclockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))
                }
                .padding(.top, 6)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 24)
        }
    }

    private func restart() {
        qIndex = 0
        correctCount = 0
        selected = nil
        revealed = false
        fillBlankAnswer = ""
        answers = [:]
        didAwardCompletion = false
        reviewing = false
        ringProgress = 0
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
                            .background(Circle().fill(WSColor.backgroundElevated).shadow(color: .black.opacity(0.05), radius: 5, y: 2))
                    }
                    .buttonStyle(WSBouncyButtonStyle())
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
                Image(systemName: wasCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                    .foregroundStyle(wasCorrect ? WSColor.duoGreen : WSColor.duoRed)
                    .font(.system(size: 16, weight: .bold))
                Text("Question \(index + 1)")
                    .font(WSFont.sans(11, weight: .black))
                    .tracking(0.6)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Text(q.question)
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(WSColor.foreground)

            if !wasCorrect, let ua = userAnswer, !ua.isEmpty {
                answerLine(label: "Your answer", value: ua, color: WSColor.duoRed)
            }
            answerLine(label: "Correct answer", value: q.correctAnswer, color: WSColor.duoGreen)

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
                .foregroundStyle(color)
                .frame(width: 108, alignment: .leading)
            Text(value)
                .wsBody(.small, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(color.opacity(0.10)))
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
