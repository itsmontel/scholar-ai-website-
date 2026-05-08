//
//  QuizView.swift
//  WriteScholar
//
//  Multiple-choice / true-false / fill-in-the-blank quiz player. Native
//  iOS feel with haptics on selection and an animated correct/wrong
//  feedback layer over the chosen option. Final score screen at the end.
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

            // Confetti — fires on a passing score (≥70%)
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

    // MARK: - Header

    private var progressHeader: some View {
        VStack(spacing: 8) {
            HStack {
                Text(quiz.title ?? "Quiz")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Spacer()
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(WSColor.strong)
                    Text("\(correctCount)/\(total)")
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(WSColor.surface))

                Text("\(qIndex + 1)/\(total)")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(WSColor.surface))
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(WSColor.surface).frame(height: 6)
                    Capsule()
                        .fill(WSGradient.brand)
                        .frame(width: max(6, geo.size.width * progressFraction), height: 6)
                        .shadow(color: WSColor.brandPrimary.opacity(0.5), radius: 6, y: 2)
                }
            }
            .frame(height: 6)
        }
    }

    private var progressFraction: CGFloat {
        guard total > 0 else { return 0 }
        return CGFloat(qIndex) / CGFloat(total)
    }

    // MARK: - Question card

    private var questionCard: some View {
        let q = questions[qIndex]
        return VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text((q.type?.rawValue ?? "question").replacingOccurrences(of: "_", with: " ").uppercased())
                    .wsEyebrow()
                    .foregroundStyle(WSColor.brandPrimary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(WSColor.brandSoft))
                Spacer()
            }

            Text(q.question)
                .wsHeadline(.small, weight: .semibold)
                .foregroundStyle(WSColor.foreground)

            VStack(spacing: 10) {
                if let opts = q.options, !opts.isEmpty {
                    ForEach(opts, id: \.self) { opt in
                        optionRow(opt, correctAnswer: q.correctAnswer)
                    }
                } else if q.type == .trueFalse {
                    optionRow("True", correctAnswer: q.correctAnswer)
                    optionRow("False", correctAnswer: q.correctAnswer)
                } else {
                    fillBlankInput(correct: q.correctAnswer)
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
                .shadow(color: WSColor.brandPrimary.opacity(0.18), radius: 18, y: 8)
        )
    }

    private func optionRow(_ option: String, correctAnswer: String) -> some View {
        let isSelected = selected == option
        let isCorrect = option.lowercased() == correctAnswer.lowercased()

        // Duolingo-style state palette
        let palette: (top: [Color], lip: Color, fg: Color, glow: Color) = {
            if !revealed {
                if isSelected {
                    return ([WSColor.brandSoft, WSColor.brandSoft],
                            WSColor.brandPrimary,
                            WSColor.brandPrimary,
                            WSColor.brandPrimary.opacity(0.30))
                }
                return ([WSColor.backgroundElevated, WSColor.backgroundElevated],
                        Color(hex: 0xCBD5E1),
                        WSColor.foreground,
                        .clear)
            }
            if isCorrect {
                return ([Color(hex: 0xD1FAE5), Color(hex: 0xA7F3D0)],
                        Color(hex: 0x047857),
                        Color(hex: 0x065F46),
                        Color(hex: 0x10B981).opacity(0.40))
            }
            if isSelected {
                return ([Color(hex: 0xFEE2E2), Color(hex: 0xFECACA)],
                        Color(hex: 0xB91C1C),
                        Color(hex: 0x991B1B),
                        Color(hex: 0xEF4444).opacity(0.40))
            }
            return ([WSColor.surface, WSColor.surface],
                    Color(hex: 0xCBD5E1),
                    WSColor.foregroundMuted,
                    .clear)
        }()

        return Button {
            guard !revealed else { return }
            selected = option
            Haptics.selection()
            withAnimation(.wsBouncePop) {
                revealed = true
            }
            if isCorrect {
                correctCount += 1
                Haptics.success()
            } else {
                Haptics.warning()
            }
        } label: {
            ZStack(alignment: .top) {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(palette.lip)
                    .padding(.top, 5)

                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .stroke(palette.fg.opacity(0.40), lineWidth: 1.5)
                            .frame(width: 26, height: 26)
                        if revealed && isCorrect {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 26, weight: .black))
                                .foregroundStyle(Color(hex: 0x10B981))
                        } else if revealed && isSelected && !isCorrect {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 26, weight: .black))
                                .foregroundStyle(Color(hex: 0xEF4444))
                        } else if isSelected {
                            Circle().fill(WSColor.brandPrimary).frame(width: 14, height: 14)
                        }
                    }
                    Text(option)
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundStyle(palette.fg)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(
                            LinearGradient(colors: palette.top,
                                           startPoint: .top, endPoint: .bottom)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(palette.lip.opacity(0.55), lineWidth: 1.5)
                        )
                )
            }
            .compositingGroup()
            .shadow(color: palette.glow, radius: 8, y: 3)
            .scaleEffect(isSelected && !revealed ? 1.015 : 1.0)
            .animation(.wsBounceTight, value: isSelected)
            .animation(.wsBouncePop, value: revealed)
        }
        .buttonStyle(.plain)
        .disabled(revealed)
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
            .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))
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
                            .foregroundStyle(isCorrect ? Color(hex: 0x10B981) : Color(hex: 0xEF4444))
                            .font(.system(size: 16, weight: .heavy))
                        VStack(alignment: .leading, spacing: 4) {
                            Text(isCorrect ? "Nice one!" : "Not quite")
                                .font(.system(size: 13, weight: .black, design: .rounded))
                                .foregroundStyle(isCorrect ? Color(hex: 0x047857) : Color(hex: 0xB91C1C))
                            Text(exp)
                                .wsBody(.small)
                                .foregroundStyle(WSColor.foreground)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(isCorrect ? Color(hex: 0x10B981).opacity(0.12) : Color(hex: 0xEF4444).opacity(0.12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(isCorrect ? Color(hex: 0x10B981).opacity(0.30) : Color(hex: 0xEF4444).opacity(0.30), lineWidth: 1)
                            )
                    )
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }

                if isCorrect {
                    Button { advanceQuestion() } label: {
                        HStack(spacing: 8) {
                            Text(qIndex == total - 1 ? "See score" : "Next question")
                            Image(systemName: "chevron.right")
                        }
                    }
                    .buttonStyle(WSDuoSuccessButtonStyle())
                } else {
                    Button { advanceQuestion() } label: {
                        HStack(spacing: 8) {
                            Text(qIndex == total - 1 ? "See score" : "Next question")
                            Image(systemName: "chevron.right")
                        }
                    }
                    .buttonStyle(WSDuoPrimaryButtonStyle())
                }
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
            if percentage == 100 { return ("crown.fill",            Color(hex: 0xF59E0B), "Perfect!",   "Every single one — you nailed it.") }
            if percentage >= 90  { return ("trophy.fill",           Color(hex: 0x10B981), "Outstanding", "Top-tier work. Treat yourself.") }
            if percentage >= 70  { return ("hand.thumbsup.fill",    WSColor.brandPrimary, "Solid",       "Most of it locked in.") }
            if percentage >= 50  { return ("flame.fill",            Color(hex: 0xF59E0B), "Keep going",  "More than halfway. One more pass.") }
            return ("arrow.counterclockwise.circle.fill",          Color(hex: 0xEF4444), "Try again",   "Re-read the lesson and give it another go.")
        }()

        return ScrollView {
            VStack(spacing: 22) {
                // Big medallion hero
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(colors: [palette.color.opacity(0.40), .clear],
                                           center: .center, startRadius: 6, endRadius: 130)
                        )
                        .frame(width: 280, height: 280)
                        .blur(radius: 14)

                    Circle()
                        .fill(LinearGradient(colors: [palette.color, palette.color.opacity(0.78)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 150, height: 150)
                        .overlay(Circle().stroke(.white.opacity(0.35), lineWidth: 3))
                        .shadow(color: palette.color.opacity(0.55), radius: 18, y: 8)

                    Image(systemName: palette.icon)
                        .font(.system(size: 60, weight: .heavy))
                        .foregroundStyle(.white)
                }
                .padding(.top, 8)

                VStack(spacing: 6) {
                    Text("\(percentage)%")
                        .font(.system(size: 64, weight: .black, design: .rounded))
                        .foregroundStyle(palette.color)
                        .contentTransition(.numericText())

                    Text(palette.label)
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.foreground)

                    Text(palette.blurb)
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }

                // Stat tiles row
                HStack(spacing: 10) {
                    statTile(label: "Correct",   value: "\(correctCount)",                tint: Color(hex: 0x10B981), icon: "checkmark.circle.fill")
                    statTile(label: "Total",     value: "\(total)",                        tint: WSColor.brandPrimary, icon: "list.number")
                    statTile(label: "XP earned", value: "+\(percentage == 100 ? 25 : 15)", tint: Color(hex: 0xF59E0B), icon: "bolt.fill")
                }
                .padding(.horizontal, 4)

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

    private func statTile(label: String, value: String, tint: Color, icon: String) -> some View {
        VStack(spacing: 6) {
            ZStack {
                Circle().fill(tint.opacity(0.18)).frame(width: 30, height: 30)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 13, weight: .heavy))
            }
            Text(value)
                .font(.system(size: 20, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.foreground)
            Text(label.uppercased())
                .font(.system(size: 9, weight: .black, design: .rounded))
                .tracking(0.6)
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(tint.opacity(0.20), lineWidth: 1)
                )
                .shadow(color: tint.opacity(0.10), radius: 6, y: 2)
        )
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
                explanation: "Glucose is the sugar produced from CO₂ and water using light energy."
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
