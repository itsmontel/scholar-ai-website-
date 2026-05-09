//
//  QuizView.swift
//  WriteScholar
//
//  Multiple-choice / true-false / fill-in-the-blank quiz player. Native
//  iOS feel with haptics on selection and an animated correct/wrong
//  feedback layer over the chosen option. Final score screen at the end.
//
//  Shares chunky 3D primitives with the rest of the app (`WSChunkyOption`,
//  `WSProgressBar`, `WSChunkyStat`) so a Quiz answer row, a Focus Unlock
//  answer row, and a Lesson knowledge-check row all look identical.
//

import SwiftUI

struct QuizView: View {
    let quiz: Quiz

    @State private var qIndex = 0
    @State private var selected: String? = nil
    @State private var revealed = false
    @State private var correctCount = 0
    @State private var fillBlankAnswer: String = ""
    @State private var didAwardCompletion = false
    @State private var celebrate: Int = 0

    private var questions: [QuizQuestion] { quiz.questions }
    private var total: Int { questions.count }

    var body: some View {
        ZStack {
            if questions.isEmpty {
                EmptyStateView(
                    icon: "checkmark.bubble",
                    title: "No quiz",
                    message: "This study pack didn't include a quiz — try regenerating with longer notes."
                )
            } else if qIndex >= total {
                scoreScreen
                    .onAppear { awardCompletionIfNeeded() }
            } else {
                ScrollView {
                    VStack(spacing: 16) {
                        progressHeader
                        questionCard
                        feedbackOrNextButton
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .scrollDismissesKeyboard(.interactively)
            }

            // Confetti — fires on a passing score (>=70%)
            WSConfettiView(trigger: $celebrate)
                .allowsHitTesting(false)
        }
    }

    /// Called once when the score screen first appears. Awards XP into
    /// the daily-goal store and fires confetti for great scores.
    private func awardCompletionIfNeeded() {
        guard !didAwardCompletion else { return }
        didAwardCompletion = true
        let percent = total == 0 ? 0 : Int(round(Double(correctCount) / Double(total) * 100))
        // Pass a title + subtitle so the History sheet shows
        // "Photosynthesis · 8/10 · 80%" instead of bare "Quiz finished".
        let title = quiz.title ?? "Quiz"
        DailyGoalStore.shared.record(
            .quizCompleted,
            title: title,
            subtitle: "\(correctCount)/\(total) · \(percent)%"
        )
        if percent == 100 {
            DailyGoalStore.shared.record(
                .quizPerfectScore,
                title: title,
                subtitle: "100% — perfect run"
            )
        }
        if percent >= 70 {
            celebrate += 1
        }
    }

    // MARK: - Header with Duolingo green progress bar

    private var progressHeader: some View {
        VStack(spacing: 10) {
            HStack {
                Text(quiz.title ?? "Quiz")
                    .font(WSFont.sans(15, weight: .bold))
                    .foregroundStyle(WSColor.duoText)
                    .lineLimit(1)
                Spacer()
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(WSColor.duoGreen)
                    Text("\(correctCount)/\(total)")
                        .font(WSFont.sans(11, weight: .bold))
                        .foregroundStyle(WSColor.duoText)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(WSColor.duoGreenLight)
                    .overlay(Capsule().stroke(WSColor.duoGreen.opacity(0.3), lineWidth: 2)))

                Text("\(qIndex + 1)/\(total)")
                    .font(WSFont.sans(11, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(WSColor.backgroundElevated)
                        .overlay(Capsule().stroke(WSColor.duoBorder, lineWidth: 2)))
            }

            WSProgressBar(fraction: progressFraction, tint: WSColor.duoGreen, height: 14)
        }
    }

    private var progressFraction: Double {
        guard total > 0 else { return 0 }
        return Double(qIndex) / Double(total)
    }

    // MARK: - Question card (chunky Duo card)

    private var questionCard: some View {
        let q = questions[qIndex]
        return VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text((q.type?.rawValue ?? "question").replacingOccurrences(of: "_", with: " ").uppercased())
                    .font(WSFont.sans(10, weight: .black))
                    .tracking(2.2)
                    .textCase(.uppercase)
                    .foregroundStyle(WSColor.duoPurple)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        Capsule()
                            .fill(WSColor.duoPurpleLight)
                            .overlay(Capsule().stroke(WSColor.duoPurple.opacity(0.35), lineWidth: 1.5))
                    )
                Spacer()
            }

            Text(q.question)
                .font(WSFont.headline(18, weight: .black))
                .foregroundStyle(WSColor.duoText)
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
                    fillBlankInput(correct: q.correctAnswer)
                }
            }
        }
        .padding(20)
        .wsChunkyCard(accent: WSColor.duoPurple)
    }

    /// Determine the visual state for an answer option based on
    /// `selected` / `revealed` / correctness. Mirrors the desktop's
    /// state machine for the QuizViewer.
    private func optionState(option: String, correctAnswer: String) -> WSChunkyOptionState {
        let isSelected = (selected == option)
        let isCorrect = option.lowercased() == correctAnswer.lowercased()
        if !revealed {
            return isSelected ? .selected : .idle
        }
        if isCorrect { return .correct }
        if isSelected { return .wrong }
        return .disabled
    }

    private func answerRow(_ option: String, index: Int, correctAnswer: String) -> some View {
        let state = optionState(option: option, correctAnswer: correctAnswer)
        let letters = ["A", "B", "C", "D", "E", "F"]
        let letter = index < letters.count ? letters[index] : ""

        return WSChunkyOption(
            label: option,
            state: state,
            action: {
                handleAnswerTap(option: option, correctAnswer: correctAnswer)
            },
            accessory: {
                WSChunkyOptionLetter(
                    letter: letter,
                    fillColor: letterFillColor(for: state),
                    foreground: letterForeground(for: state)
                )
            }
        )
        .wsStaggerEntry(index, unit: 0.04)
    }

    private func letterFillColor(for state: WSChunkyOptionState) -> Color {
        switch state {
        case .selected: return WSColor.duoBlue.opacity(0.18)
        case .correct:  return Color.white.opacity(0.25)
        case .wrong:    return Color.white.opacity(0.25)
        case .disabled: return WSColor.duoSurface
        case .idle:     return WSColor.duoSurface
        }
    }

    private func letterForeground(for state: WSChunkyOptionState) -> Color {
        switch state {
        case .selected: return WSColor.duoBlueDark
        case .correct, .wrong: return Color.white
        default:        return WSColor.duoText.opacity(0.65)
        }
    }

    private func handleAnswerTap(option: String, correctAnswer: String) {
        guard !revealed else { return }
        selected = option
        Haptics.selection()
        let isCorrect = option.lowercased() == correctAnswer.lowercased()
        withAnimation(.wsBouncePop) {
            revealed = true
        }
        if isCorrect {
            correctCount += 1
            Haptics.success()
        } else {
            Haptics.warning()
        }
    }

    private func fillBlankInput(correct: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            WSTextField(
                placeholder: "Your answer",
                icon: "pencil.line",
                text: $fillBlankAnswer
            )
            Button {
                guard !revealed else { return }
                selected = fillBlankAnswer
                let isCorrect = fillBlankAnswer.trimmingCharacters(in: .whitespacesAndNewlines)
                    .caseInsensitiveCompare(correct.trimmingCharacters(in: .whitespacesAndNewlines)) == .orderedSame
                if isCorrect {
                    correctCount += 1
                    Haptics.success()
                } else {
                    Haptics.medium()
                }
                withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                    revealed = true
                }
            } label: {
                Text("Check answer")
            }
            .buttonStyle(WSDuoInfoButtonStyle(fullWidth: true))
            .disabled(revealed || fillBlankAnswer.isEmpty)
        }
    }

    // MARK: - Feedback / next

    @ViewBuilder
    private var feedbackOrNextButton: some View {
        if revealed {
            let isCorrect = (selected?.lowercased() == questions[qIndex].correctAnswer.lowercased())

            VStack(spacing: 12) {
                if let exp = questions[qIndex].explanation, !exp.isEmpty {
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: isCorrect ? "lightbulb.fill" : "info.circle.fill")
                            .foregroundStyle(isCorrect ? WSColor.duoGreen : WSColor.duoRed)
                            .font(.system(size: 18, weight: .heavy))
                        VStack(alignment: .leading, spacing: 4) {
                            Text(isCorrect ? "Nice one!" : "Not quite")
                                .font(WSFont.sans(13, weight: .black))
                                .foregroundStyle(isCorrect ? WSColor.duoGreenDark : WSColor.duoRedDark)
                            Text(exp)
                                .font(WSFont.sans(13, weight: .bold))
                                .foregroundStyle(WSColor.duoText)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(isCorrect ? WSColor.duoGreenLight : WSColor.duoRedLight)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(isCorrect ? WSColor.duoGreen.opacity(0.30) : WSColor.duoRed.opacity(0.30), lineWidth: 2)
                            )
                    )
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }

                Button { advanceQuestion() } label: {
                    HStack(spacing: 8) {
                        Text(qIndex == total - 1 ? "See score" : "Next question")
                        Image(systemName: "chevron.right")
                    }
                }
                .buttonStyle(isCorrect ? AnyButtonStyle(WSDuoSuccessButtonStyle())
                                       : AnyButtonStyle(WSDuoPrimaryButtonStyle()))
            }
        }
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
        let palette: (icon: String, color: Color, label: String, blurb: String) = {
            if percentage == 100 { return ("crown.fill",            WSColor.duoOrange, "Perfect!",   "Every single one — you nailed it.") }
            if percentage >= 90  { return ("trophy.fill",           WSColor.duoGreen, "Outstanding", "Top-tier work. Treat yourself.") }
            if percentage >= 70  { return ("hand.thumbsup.fill",    WSColor.duoPurple, "Solid",       "Most of it locked in.") }
            if percentage >= 50  { return ("flame.fill",            WSColor.duoOrange, "Keep going",  "More than halfway. One more pass.") }
            return ("arrow.counterclockwise.circle.fill",          WSColor.duoRed, "Try again",   "Re-read the lesson and give it another go.")
        }()

        return ScrollView {
            VStack(spacing: 22) {
                // Big medallion hero — chunky circle
                ZStack {
                    Circle()
                        .fill(palette.color.opacity(0.15))
                        .frame(width: 200, height: 200)

                    // 3D circle
                    ZStack(alignment: .top) {
                        Circle()
                            .fill(palette.color.opacity(0.4))
                            .frame(width: 150, height: 150)
                            .offset(y: 6)
                        Circle()
                            .fill(palette.color)
                            .frame(width: 150, height: 150)
                            .overlay(Circle().stroke(.white.opacity(0.25), lineWidth: 3))
                    }

                    Image(systemName: palette.icon)
                        .font(.system(size: 60, weight: .heavy))
                        .foregroundStyle(.white)
                }
                .padding(.top, 8)
                .wsBobbing(amount: 5, duration: 2.6)

                VStack(spacing: 6) {
                    Text("\(percentage)%")
                        .font(WSFont.headline(64, weight: .black))
                        .foregroundStyle(palette.color)
                        .contentTransition(.numericText())

                    Text(palette.label)
                        .font(WSFont.headline(22, weight: .black))
                        .foregroundStyle(WSColor.duoText)

                    Text(palette.blurb)
                        .font(WSFont.sans(14, weight: .bold))
                        .foregroundStyle(WSColor.foregroundMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }

                // Stat tiles row — chunky cards
                HStack(spacing: 10) {
                    WSChunkyStat(icon: "checkmark.circle.fill",
                                 value: "\(correctCount)",
                                 label: "Correct",
                                 tint: WSColor.duoGreen)
                    WSChunkyStat(icon: "list.number",
                                 value: "\(total)",
                                 label: "Total",
                                 tint: WSColor.duoBlue)
                    WSChunkyStat(icon: "bolt.fill",
                                 value: "+\(percentage == 100 ? 25 : 15)",
                                 label: "XP earned",
                                 tint: WSColor.duoOrange)
                }

                // CTA
                Button {
                    qIndex = 0
                    correctCount = 0
                    selected = nil
                    revealed = false
                    fillBlankAnswer = ""
                    didAwardCompletion = false
                    Haptics.medium()
                } label: {
                    Label("Retake quiz", systemImage: "arrow.counterclockwise")
                }
                .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: false))
                .padding(.top, 8)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 24)
        }
    }
}

// MARK: - AnyButtonStyle eraser (lets us pick a style at runtime)

/// Tiny type-eraser so `Button(...).buttonStyle(isCorrect ? A() : B())`
/// type-checks. Used in the feedback section above to pick a primary
/// vs success palette based on whether the user got it right.
struct AnyButtonStyle: ButtonStyle {
    private let _make: (Configuration) -> AnyView

    init<S: ButtonStyle>(_ style: S) {
        _make = { cfg in AnyView(style.makeBody(configuration: cfg)) }
    }

    func makeBody(configuration: Configuration) -> some View {
        _make(configuration)
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
