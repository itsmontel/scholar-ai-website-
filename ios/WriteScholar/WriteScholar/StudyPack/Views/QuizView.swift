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

    private var questions: [QuizQuestion] { quiz.questions }
    private var total: Int { questions.count }

    var body: some View {
        if questions.isEmpty {
            EmptyStateView(
                icon: "checkmark.bubble",
                title: "No quiz",
                message: "This study pack didn't include a quiz — try regenerating with longer notes."
            )
        } else if qIndex >= total {
            scoreScreen
        } else {
            VStack(spacing: 16) {
                progressHeader
                questionCard
                feedbackOrNextButton
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
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
        let outline: Color = {
            if !revealed { return isSelected ? WSColor.brandPrimary : WSColor.hairline }
            if isCorrect { return WSColor.strong }
            if isSelected { return WSColor.concern }
            return WSColor.hairline
        }()
        let bg: Color = {
            if !revealed { return isSelected ? WSColor.brandSoft : WSColor.surface }
            if isCorrect { return WSColor.strong.opacity(0.16) }
            if isSelected { return WSColor.concern.opacity(0.16) }
            return WSColor.surface
        }()

        return Button {
            guard !revealed else { return }
            selected = option
            Haptics.selection()
            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                revealed = true
            }
            if isCorrect {
                correctCount += 1
                Haptics.success()
            } else {
                Haptics.medium()
            }
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .stroke(outline, lineWidth: 1.5)
                        .frame(width: 22, height: 22)
                    if revealed && isCorrect {
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(WSColor.strong)
                    } else if revealed && isSelected && !isCorrect {
                        Image(systemName: "xmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(WSColor.concern)
                    } else if isSelected {
                        Circle().fill(WSColor.brandPrimary).frame(width: 10, height: 10)
                    }
                }
                Text(option)
                    .wsBody(.medium, weight: revealed && isCorrect ? .bold : .semibold)
                    .foregroundStyle(WSColor.foreground)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(bg)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(outline, lineWidth: 1.5)
                    )
            )
        }
        .buttonStyle(.plain)
        .scaleEffect(isSelected && !revealed ? 1.02 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
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
            .buttonStyle(WSSecondaryButtonStyle(fullWidth: true))
            .disabled(revealed || fillBlankAnswer.isEmpty)
        }
    }

    // MARK: - Feedback / next

    @ViewBuilder
    private var feedbackOrNextButton: some View {
        if revealed {
            VStack(spacing: 12) {
                if let exp = questions[qIndex].explanation, !exp.isEmpty {
                    HStack(alignment: .top, spacing: 10) {
                        Image(systemName: "lightbulb.fill")
                            .foregroundStyle(WSColor.revise)
                        Text(exp)
                            .wsBody(.small)
                            .foregroundStyle(WSColor.foreground)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(WSColor.revise.opacity(0.10))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(WSColor.revise.opacity(0.30), lineWidth: 1)
                            )
                    )
                }

                Button {
                    advanceQuestion()
                } label: {
                    HStack(spacing: 8) {
                        Text(qIndex == total - 1 ? "See score" : "Next question")
                        Image(systemName: "chevron.right")
                    }
                }
                .buttonStyle(WSPrimaryButtonStyle())
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
        let palette: (icon: String, color: Color, label: String) = {
            if percentage >= 90 { return ("trophy.fill",          WSColor.strong,  "Outstanding") }
            if percentage >= 70 { return ("hand.thumbsup.fill",   WSColor.brandPrimary, "Solid") }
            if percentage >= 50 { return ("flame.fill",           WSColor.revise,  "Keep going") }
            return ("arrow.counterclockwise.circle.fill", WSColor.concern, "Try again")
        }()

        return VStack(spacing: 22) {
            WSAnimatedImage(name: percentage >= 70 ? "mascot-dance" : "mascot-study", ext: "webp")
                .frame(width: 160, height: 160)
                .shadow(color: palette.color.opacity(0.3), radius: 20, y: 8)

            VStack(spacing: 4) {
                Text("\(percentage)%")
                    .wsHeadline(.huge, weight: .bold)
                    .foregroundStyle(palette.color)
                Text(palette.label)
                    .wsHeadline(.small, weight: .semibold)
                    .foregroundStyle(WSColor.foreground)
            }

            Text("\(correctCount) of \(total) correct.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)

            Button {
                qIndex = 0
                correctCount = 0
                selected = nil
                revealed = false
                fillBlankAnswer = ""
                Haptics.medium()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Retake quiz")
                }
            }
            .buttonStyle(WSPrimaryButtonStyle(fullWidth: false))
            .padding(.top, 8)
        }
        .padding(20)
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
