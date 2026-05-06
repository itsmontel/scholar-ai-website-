//
//  CraterBlastView.swift
//  WriteScholar
//
//  Native Crater Blast — boss-battle quiz arcade. Built entirely in
//  SwiftUI (no SpriteKit) since the gameplay is tap-driven. The visual
//  style mirrors the web game's screenshot: starry violet sky, glowing
//  red boss, four answer tiles below.
//

import SwiftUI

struct CraterBlastView: View {
    let craterBlast: CraterBlast

    @State private var qIndex = 0
    @State private var shuffledAnswers: [(text: String, isCorrect: Bool)] = []
    @State private var bossHP: Int = 100
    @State private var playerHP: Int = 3
    @State private var score: Int = 0
    @State private var streak: Int = 0
    @State private var status: GameStatus = .playing
    @State private var feedback: FeedbackKind? = nil
    @State private var bossShake: CGFloat = 0
    @State private var screenFlash: Color? = nil

    enum GameStatus { case playing, victory, defeat }
    enum FeedbackKind { case correct, wrong }

    var body: some View {
        ZStack {
            spaceBackdrop

            switch status {
            case .playing:  gameLayer
            case .victory:  endScreen(victory: true)
            case .defeat:   endScreen(victory: false)
            }

            // Screen flash on hit / damage
            if let color = screenFlash {
                color.opacity(0.18)
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
                    .transition(.opacity)
            }
        }
        .onAppear { resetIfNeeded() }
    }

    // MARK: - Game layer

    private var gameLayer: some View {
        VStack(spacing: 14) {
            scoreHeader
                .padding(.horizontal, 16)
                .padding(.top, 8)

            bossArea
                .frame(height: 170)

            questionCard
                .padding(.horizontal, 16)

            answerGrid
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
        }
    }

    // MARK: - Backdrop

    private var spaceBackdrop: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x1E1B4B), Color(hex: 0x312E81), Color(hex: 0x4C1D95)],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // Stars
            Canvas { ctx, size in
                let count = 80
                for i in 0..<count {
                    let x = (sin(Double(i) * 13.37) + 1) / 2 * size.width
                    let y = (cos(Double(i) * 7.91)  + 1) / 2 * size.height
                    let r = (sin(Double(i) * 3.14) + 1) / 2 * 1.6 + 0.6
                    let alpha = (cos(Double(i) * 1.7) + 1) / 2 * 0.7 + 0.3
                    ctx.fill(
                        Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)),
                        with: .color(.white.opacity(alpha))
                    )
                }
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)
        }
    }

    // MARK: - Score header

    private var scoreHeader: some View {
        HStack(spacing: 10) {
            HStack(spacing: 4) {
                Image(systemName: "star.fill").foregroundStyle(Color(hex: 0xFBBF24))
                Text("\(score)")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(Color.white.opacity(0.10)))

            if streak >= 2 {
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill").foregroundStyle(Color(hex: 0xF97316))
                    Text("x\(streak)")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Capsule().fill(Color(hex: 0xF97316).opacity(0.20)))
            }

            Spacer()

            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Image(systemName: i < playerHP ? "heart.fill" : "heart")
                        .foregroundStyle(i < playerHP ? Color(hex: 0xEF4444) : Color.white.opacity(0.30))
                        .font(.system(size: 14, weight: .bold))
                }
            }

            Text("Q\(qIndex + 1)/\(craterBlast.questions.count)")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Capsule().fill(Color.white.opacity(0.10)))
        }
    }

    // MARK: - Boss

    private var bossArea: some View {
        ZStack {
            // Glow halo
            Circle()
                .fill(
                    RadialGradient(
                        colors: [Color(hex: 0xEF4444).opacity(0.55), .clear],
                        center: .center, startRadius: 10, endRadius: 140
                    )
                )
                .frame(width: 280, height: 280)
                .blur(radius: 22)

            VStack(spacing: 10) {
                ZStack {
                    Image(systemName: "smallcircle.filled.circle.fill")
                        .font(.system(size: 96, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(colors: [Color(hex: 0xF87171), Color(hex: 0xDC2626)],
                                           startPoint: .top, endPoint: .bottom)
                        )
                        .shadow(color: Color(hex: 0xEF4444).opacity(0.6), radius: 20)
                    // Eyes
                    HStack(spacing: 16) {
                        Circle().fill(Color.black.opacity(0.85)).frame(width: 8, height: 8)
                        Circle().fill(Color.black.opacity(0.85)).frame(width: 8, height: 8)
                    }
                    .offset(y: -8)
                }
                .offset(x: bossShake)

                bossHPBar
                    .frame(width: 180, height: 8)
            }
        }
    }

    private var bossHPBar: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.white.opacity(0.18))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: 0xF87171), Color(hex: 0xDC2626)],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .frame(width: max(0, geo.size.width * CGFloat(bossHP) / 100))
                    .shadow(color: Color(hex: 0xEF4444).opacity(0.5), radius: 6, y: 1)
            }
        }
    }

    // MARK: - Question

    private var questionCard: some View {
        let q = craterBlast.questions[qIndex]
        return VStack(alignment: .leading, spacing: 6) {
            Text("INCOMING QUESTION")
                .wsEyebrow()
                .foregroundStyle(Color(hex: 0xFBBF24))
            Text(q.prompt)
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color.white.opacity(0.10))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color.white.opacity(0.20), lineWidth: 1)
                )
        )
    }

    // MARK: - Answers

    private var answerGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            ForEach(Array(shuffledAnswers.enumerated()), id: \.offset) { idx, answer in
                answerTile(answer.text, isCorrect: answer.isCorrect, index: idx)
            }
        }
    }

    private func answerTile(_ text: String, isCorrect: Bool, index: Int) -> some View {
        let isFeedbackTile = (feedback == .correct && isCorrect) || (feedback == .wrong && !isCorrect)
        let bg: AnyShapeStyle = {
            if feedback != nil && isFeedbackTile && isCorrect {
                return AnyShapeStyle(LinearGradient(colors: [Color(hex: 0x10B981), Color(hex: 0x059669)],
                                                    startPoint: .top, endPoint: .bottom))
            }
            if feedback != nil && isFeedbackTile && !isCorrect {
                return AnyShapeStyle(LinearGradient(colors: [Color(hex: 0xEF4444), Color(hex: 0xB91C1C)],
                                                    startPoint: .top, endPoint: .bottom))
            }
            return AnyShapeStyle(LinearGradient(colors: [Color.white.opacity(0.12), Color.white.opacity(0.06)],
                                                startPoint: .top, endPoint: .bottom))
        }()

        return Button {
            handleTap(isCorrect: isCorrect)
        } label: {
            Text(text)
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 18)
                .padding(.horizontal, 8)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(bg)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(Color.white.opacity(0.25), lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.30), radius: 10, y: 5)
                )
        }
        .buttonStyle(.plain)
        .scaleEffect(isFeedbackTile ? 1.06 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: feedback)
        .disabled(feedback != nil)
    }

    // MARK: - Tap handler

    private func handleTap(isCorrect: Bool) {
        guard feedback == nil else { return }

        feedback = isCorrect ? .correct : .wrong
        if isCorrect {
            Haptics.success()
            streak += 1
            score += 100 + (streak * 10)
            let damage = 100 / max(craterBlast.questions.count, 1)
            withAnimation(.spring(response: 0.35, dampingFraction: 0.6)) {
                bossHP = max(0, bossHP - damage)
                screenFlash = Color(hex: 0x10B981)
                bossShake = -6
            }
        } else {
            Haptics.medium()
            streak = 0
            playerHP = max(0, playerHP - 1)
            withAnimation(.spring(response: 0.25, dampingFraction: 0.5)) {
                screenFlash = Color(hex: 0xEF4444)
                bossShake = 6
            }
        }

        // Settle visuals, then advance
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            withAnimation(.easeOut(duration: 0.3)) {
                screenFlash = nil
                bossShake = 0
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.85) {
            advance()
        }
    }

    private func advance() {
        feedback = nil
        if bossHP <= 0 {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                status = .victory
            }
            return
        }
        if playerHP <= 0 {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                status = .defeat
            }
            return
        }
        if qIndex + 1 >= craterBlast.questions.count {
            // Out of questions — judge by remaining boss HP
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7)) {
                status = bossHP < 50 ? .victory : .defeat
            }
            return
        }
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            qIndex += 1
            shuffleCurrent()
        }
    }

    // MARK: - End screen

    private func endScreen(victory: Bool) -> some View {
        VStack(spacing: 22) {
            WSAnimatedImage(name: victory ? "mascot-dance" : "mascot-study", ext: "webp")
                .frame(width: 160, height: 160)
                .shadow(color: (victory ? Color(hex: 0xFBBF24) : Color(hex: 0xEF4444)).opacity(0.5),
                        radius: 22, y: 8)

            VStack(spacing: 6) {
                Text(victory ? "Boss defeated!" : "Out of HP")
                    .wsHeadline(.large, weight: .bold)
                    .foregroundStyle(.white)
                Text("Score \(score)  ·  Streak \(streak)x")
                    .wsBody(.medium, weight: .semibold)
                    .foregroundStyle(.white.opacity(0.85))
            }

            Button {
                resetGame()
                Haptics.medium()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.counterclockwise")
                    Text(victory ? "Play again" : "Try again")
                }
            }
            .buttonStyle(WSPrimaryButtonStyle(fullWidth: false))
        }
        .padding()
    }

    // MARK: - Setup

    private func resetIfNeeded() {
        if shuffledAnswers.isEmpty { shuffleCurrent() }
    }

    private func shuffleCurrent() {
        let q = craterBlast.questions[qIndex]
        let zipped = q.answers.enumerated().map { (idx, text) in
            (text: text, isCorrect: idx == q.correctIndex)
        }
        shuffledAnswers = zipped.shuffled()
    }

    private func resetGame() {
        qIndex = 0
        bossHP = 100
        playerHP = 3
        score = 0
        streak = 0
        status = .playing
        feedback = nil
        shuffleCurrent()
    }
}

#Preview {
    CraterBlastView(craterBlast: CraterBlast(
        title: "Cell Biology",
        questions: [
            previewCraterQ("Which organelle is the powerhouse?", correct: "Mitochondria", wrong: ["Ribosome", "Nucleus", "Lysosome"]),
            previewCraterQ("What carries genetic information?", correct: "DNA", wrong: ["RNA", "Protein", "Lipid"]),
            previewCraterQ("What does ATP stand for?", correct: "Adenosine TP", wrong: ["Active TP", "ATP molecule", "Acid TP"]),
            previewCraterQ("Cell membrane is mostly:", correct: "Phospholipids", wrong: ["Sugars", "Carbohydrates", "RNA"])
        ]
    ))
}

private func previewCraterQ(_ prompt: String, correct: String, wrong: [String]) -> CraterBlastQuestion {
    let answers = [correct] + wrong
    let answersJSON = (try? String(data: JSONSerialization.data(withJSONObject: answers), encoding: .utf8)) ?? "[]"
    let json = """
    {"id":"\(UUID().uuidString)","prompt":"\(prompt)","answers":\(answersJSON),"correctIndex":0}
    """
    return try! JSONDecoder().decode(CraterBlastQuestion.self, from: Data(json.utf8))
}
