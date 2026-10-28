//
//  CraterBlastView.swift
//  WriteScholar
//
//  Native Crater Blast — identical to desktop. Four answer craters fall
//  from top, cannon at bottom fires projectiles. Hit the correct answer
//  before it lands. 3 lives, reaction-time scoring.
//

import SwiftUI

struct CraterBlastView: View {
    let craterBlast: CraterBlast

    // MARK: - Config (matches desktop)
    private let initialLives = 3
    private let baseFallDuration: Double = 12.0
    private let minFallDuration: Double = 6.0
    private let speedDecreasePerFive: Double = 0.6
    private let baseScore = 100
    private let maxReactionBonus = 200
    private let streakBonusPerStreak = 10
    private let craterSize: CGFloat = 96
    private let laneCenters: [CGFloat] = [0.14, 0.37, 0.63, 0.86]

    // MARK: - State
    @State private var gameState: GameState = .playing
    @State private var qIndex = 0
    @State private var craters: [Crater] = []
    @State private var lives = 3
    @State private var score = 0
    @State private var streak = 0
    @State private var correctCount = 0
    @State private var longestStreak = 0
    @State private var fallDuration: Double = 12.0

    @State private var cannonAngle: Double = 0
    @State private var projectile: Projectile? = nil
    @State private var explosions: [Explosion] = []
    @State private var scorePopups: [ScorePopup] = []
    @State private var screenFlash: Color? = nil
    @State private var roundStartTime: Date = Date()
    @State private var roundResolved = false
    @State private var wrongShakeTrigger = 0

    private var question: CraterBlastQuestion? {
        guard craterBlast.questions.indices.contains(qIndex) else { return nil }
        return craterBlast.questions[qIndex]
    }

    enum GameState { case playing, gameover }

    struct Crater: Identifiable {
        let id = UUID()
        let text: String
        let answerIndex: Int
        let isCorrect: Bool
        let xRatio: CGFloat
        let fallDuration: Double
        let spawnTime: Date
        var status: CraterStatus = .falling
        var frozenY: CGFloat? = nil
    }

    enum CraterStatus { case falling, correct, wrong, missed }

    struct Projectile: Identifiable {
        let id = UUID()
        let startX: CGFloat
        let startY: CGFloat
        let targetX: CGFloat
        let targetY: CGFloat
        var targetCrater: Crater?
        let startTime: Date
        let duration: Double
    }

    struct Explosion: Identifiable {
        let id = UUID()
        let x: CGFloat
        let y: CGFloat
        let isCorrect: Bool
    }

    struct ScorePopup: Identifiable {
        let id = UUID()
        let points: Int
        let x: CGFloat
        let y: CGFloat
    }

    // MARK: - Body

    var body: some View {
        GeometryReader { geo in
            ZStack {
                duoBackdrop

                switch gameState {
                case .playing:
                    gameLayer(geo: geo)
                case .gameover:
                    endScreen
                }

                if let flash = screenFlash {
                    flash.opacity(0.18)
                        .ignoresSafeArea()
                        .allowsHitTesting(false)
                        .transition(.opacity)
                }
            }
        }
        .onAppear { startRound() }
    }

    // MARK: - Duolingo-style backdrop (bold orange/red)

    private var duoBackdrop: some View {
        ZStack {
            // Arcade night, same as the Arcade hub.
            WSColor.arcadeNight
                .ignoresSafeArea()

            // Subtle star dots
            Canvas { ctx, size in
                for i in 0..<40 {
                    let seed = Double(i) * 137.508
                    let x = ((seed * 7).truncatingRemainder(dividingBy: 100)) / 100 * size.width
                    let y = ((seed * 3).truncatingRemainder(dividingBy: 75)) / 75 * size.height
                    let r = (seed.truncatingRemainder(dividingBy: 2)) + 1
                    let alpha = 0.15 + (seed.truncatingRemainder(dividingBy: 4)) * 0.1
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

    // MARK: - Game layer

    private func gameLayer(geo: GeometryProxy) -> some View {
        VStack(spacing: 0) {
            hudBar
                .padding(.leading, 62)   // clears the sticker close button
                .padding(.trailing, 16)
                .padding(.top, 14)

            duoProgressBar
                .padding(.horizontal, 16)
                .padding(.top, 10)

            if let q = question {
                questionCard(q.prompt)
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
            }

            playArea(geo: geo)
        }
    }

    // MARK: - HUD (sticker top bar)

    private var hudBar: some View {
        HStack(spacing: 8) {
            Text("Q\(qIndex + 1)/\(craterBlast.questions.count)")
                .font(WSFont.headline(14, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .wsStickerCapsule(fill: WSColor.sky, depth: 2)

            Spacer(minLength: 4)

            Text("\(score)")
                .font(WSFont.headline(30, weight: .black))
                .foregroundStyle(WSColor.lime)
                .contentTransition(.numericText())
                .animation(.wsBouncePop, value: score)

            Spacer(minLength: 4)

            if streak >= 2 {
                HStack(spacing: 3) {
                    WSFlameIcon(size: 13)
                    Text("x\(streak)")
                        .font(WSFont.headline(14, weight: .black))
                }
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, 9)
                .padding(.vertical, 5)
                .wsStickerCapsule(fill: WSColor.orange, depth: 2)
                .transition(.scale.combined(with: .opacity))
            }

            HStack(spacing: 2) {
                ForEach(0..<initialLives, id: \.self) { i in
                    Image(systemName: i < lives ? "heart.fill" : "heart")
                        .font(.system(size: 17, weight: .black))
                        .foregroundStyle(i < lives ? WSColor.pink : Color.white.opacity(0.3))
                        .scaleEffect(i < lives ? 1 : 0.85)
                }
            }
            .animation(.wsBouncePop, value: lives)
            .accessibilityLabel("\(lives) lives left")
        }
        .animation(.wsBouncePop, value: streak >= 2)
    }

    // MARK: - Fall timer bar

    private var duoProgressBar: some View {
        let elapsed = Date().timeIntervalSince(roundStartTime)
        let progress = min(elapsed / fallDuration, 1.0)
        return WSStripeBar(fraction: 1 - progress, fill: progressBarColor(for: progress),
                           track: Color.white.opacity(0.12), height: 14)
    }

    private func progressBarColor(for progress: Double) -> Color {
        if progress < 0.5 { return WSColor.lime }
        if progress < 0.75 { return WSColor.orange }
        return WSColor.pink
    }

    // MARK: - Question card

    private func questionCard(_ prompt: String) -> some View {
        Text(prompt)
            .font(WSFont.headline(19, weight: .black))
            .foregroundStyle(WSColor.inkText)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .wsSticker(fill: WSColor.lilac, radius: 18, depth: 4, stroke: .black)
    }

    // MARK: - Play area

    private func playArea(geo: GeometryProxy) -> some View {
        let areaHeight = geo.size.height - 220
        let areaWidth = geo.size.width

        // TimelineView(.animation) syncs the loop to the display refresh
        // (incl. 120Hz ProMotion) for smooth, judder-free motion.
        return TimelineView(.animation) { timeline in
            ZStack {
            Color.clear

            // Danger line near the bottom
            Path { p in
                p.move(to: CGPoint(x: 0, y: areaHeight - 70))
                p.addLine(to: CGPoint(x: areaWidth, y: areaHeight - 70))
            }
            .stroke(WSColor.pink.opacity(0.5), style: StrokeStyle(lineWidth: 2.5, dash: [10, 8]))

            ForEach(craters) { crater in
                craterView(crater: crater, areaWidth: areaWidth, areaHeight: areaHeight)
            }

            ForEach(explosions) { exp in
                explosionView(exp: exp)
            }

            ForEach(scorePopups) { popup in
                WSStickerBadge(text: "+\(popup.points)", fill: WSColor.lime, size: 16, depth: 2, radius: 10)
                    .position(x: popup.x, y: popup.y)
            }

            if let proj = projectile {
                projectileView(proj: proj, areaWidth: areaWidth, areaHeight: areaHeight)
            }

            cannonView(areaWidth: areaWidth, areaHeight: areaHeight)
        }
        .frame(height: areaHeight)
        .contentShape(Rectangle())
        .gesture(
            DragGesture(minimumDistance: 0)
                .onChanged { value in
                    updateCannonAngle(touchX: value.location.x, touchY: value.location.y,
                                      areaWidth: areaWidth, areaHeight: areaHeight)
                }
                .onEnded { value in
                    fireCannon(at: value.location, areaWidth: areaWidth, areaHeight: areaHeight)
                }
        )
        .onChange(of: timeline.date) { _, _ in
            updateProjectile(areaWidth: areaWidth, areaHeight: areaHeight)
            checkMissedCraters(areaHeight: areaHeight)
        }
        }
    }

    // MARK: - Crater view (chunky 3D answer buttons)

    private func craterView(crater: Crater, areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let yPos: CGFloat
        if let frozen = crater.frozenY {
            yPos = frozen
        } else {
            let elapsed = Date().timeIntervalSince(crater.spawnTime)
            let progress = min(elapsed / crater.fallDuration, 1.0)
            yPos = -craterSize / 2 + progress * (areaHeight + craterSize / 2)
        }
        let xPos = crater.xRatio * areaWidth

        let (topFill, textCol) = craterColors(for: crater.status)

        return ZStack {
            Circle()
                .fill(Color.black)
                .frame(width: craterSize, height: craterSize)
                .offset(y: crater.status == .falling ? 4 : 2)
            Circle()
                .fill(topFill)
                .frame(width: craterSize, height: craterSize)
                .overlay(Circle().strokeBorder(Color.black, lineWidth: WSSticker.stroke))

            Text(crater.text)
                .font(WSFont.headline(crater.text.count > 14 ? 10 : crater.text.count > 10 ? 11 : 13, weight: .black))
                .foregroundStyle(textCol)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.6)
                .frame(width: craterSize * 0.7)
        }
        .position(x: xPos, y: yPos)
        .opacity(crater.status == .missed ? 0.3 : 1)
        .scaleEffect(crater.status == .correct ? 1.2 : crater.status == .wrong ? 0.85 : 1)
        .wsWobble(trigger: crater.status == .wrong ? wrongShakeTrigger : 0)
        .animation(.spring(response: 0.3, dampingFraction: 0.55), value: crater.status)
    }

    /// Falling meteors rotate through the sticker palette so the field
    /// reads like the Arcade preview; hits flip lime, misses flip pink.
    private func craterColors(for status: CraterStatus) -> (Color, Color) {
        switch status {
        case .falling: return (Color.white, WSColor.inkText)
        case .correct: return (WSColor.lime, WSColor.inkText)
        case .wrong:   return (WSColor.pink, WSColor.inkText)
        case .missed:  return (Color(hex: 0x6B6290), Color.white.opacity(0.6))
        }
    }

    // MARK: - Explosion view

    private func explosionView(exp: Explosion) -> some View {
        ZStack {
            WSStarburst(points: 10, inset: 0.6)
                .fill(exp.isCorrect ? WSColor.lime : WSColor.pink)
                .overlay(WSStarburst(points: 10, inset: 0.6).stroke(Color.black, lineWidth: 2.5))
                .frame(width: 84, height: 84)
            Circle()
                .fill(WSColor.sun)
                .overlay(Circle().strokeBorder(Color.black, lineWidth: 2))
                .frame(width: 26, height: 26)
        }
        .position(x: exp.x, y: exp.y)
        .transition(.scale(scale: 0.3).combined(with: .opacity))
    }

    // MARK: - Projectile view (Duo orange/gold)

    private func projectileView(proj: Projectile, areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let elapsed = Date().timeIntervalSince(proj.startTime)
        let t = min(elapsed / proj.duration, 1.0)
        let x = proj.startX + (proj.targetX - proj.startX) * t
        let y = proj.startY + (proj.targetY - proj.startY) * t

        return Circle()
            .fill(WSColor.sun)
            .overlay(Circle().strokeBorder(Color.black, lineWidth: 2))
            .frame(width: 18, height: 18)
            .position(x: x, y: y)
    }

    // MARK: - Cannon view (Duo-orange themed)

    private func cannonView(areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let cannonX = areaWidth / 2
        let cannonY = areaHeight - 20

        return ZStack {
            VStack(spacing: 0) {
                // Barrel
                RoundedRectangle(cornerRadius: 5)
                    .fill(WSColor.lime)
                    .overlay(RoundedRectangle(cornerRadius: 5).strokeBorder(Color.black, lineWidth: 2.5))
                    .frame(width: 16, height: 52)
            }
            .rotationEffect(.degrees(cannonAngle), anchor: .bottom)
            .position(x: cannonX, y: cannonY - 26)

            // Base: the purple dome from the Arcade preview
            Ellipse()
                .fill(Color.black)
                .frame(width: 92, height: 50)
                .offset(y: 4)
                .position(x: cannonX, y: cannonY + 4)
            Ellipse()
                .fill(WSColor.purple)
                .overlay(Ellipse().strokeBorder(Color.black, lineWidth: 2.5))
                .frame(width: 92, height: 50)
                .position(x: cannonX, y: cannonY + 4)
        }
    }

    // MARK: - Cannon control

    private func updateCannonAngle(touchX: CGFloat, touchY: CGFloat, areaWidth: CGFloat, areaHeight: CGFloat) {
        let cannonX = areaWidth / 2
        let cannonY = areaHeight - 40
        let angle = atan2(touchX - cannonX, cannonY - touchY) * (180 / .pi)
        cannonAngle = max(-65, min(65, angle))
    }

    private func fireCannon(at point: CGPoint, areaWidth: CGFloat, areaHeight: CGFloat) {
        guard !roundResolved, projectile == nil, gameState == .playing else { return }

        let cannonX = areaWidth / 2
        let cannonY = areaHeight - 40

        var hitCrater: Crater? = nil
        var bestDist = craterSize * 1.2

        for crater in craters where crater.status == .falling {
            let elapsed = Date().timeIntervalSince(crater.spawnTime)
            let progress = min(elapsed / crater.fallDuration, 1.0)
            let craterY = -craterSize / 2 + progress * (areaHeight + craterSize / 2)
            let craterX = crater.xRatio * areaWidth

            let d = sqrt(pow(point.x - craterX, 2) + pow(point.y - craterY, 2))
            if d < bestDist {
                bestDist = d
                hitCrater = crater
            }
        }

        var targetX = point.x
        var targetY = point.y

        if let hit = hitCrater {
            let elapsed = Date().timeIntervalSince(hit.spawnTime)
            let progress = min(elapsed / hit.fallDuration, 1.0)
            targetY = -craterSize / 2 + progress * (areaHeight + craterSize / 2)
            targetX = hit.xRatio * areaWidth
        }

        let dist = sqrt(pow(targetX - cannonX, 2) + pow(targetY - cannonY, 2))
        let duration = max(0.12, dist * 0.0007)

        Haptics.light()

        projectile = Projectile(
            startX: cannonX,
            startY: cannonY - 30,
            targetX: targetX,
            targetY: targetY,
            targetCrater: hitCrater,
            startTime: Date(),
            duration: duration
        )
    }

    // MARK: - Projectile update

    private func updateProjectile(areaWidth: CGFloat, areaHeight: CGFloat) {
        guard let proj = projectile else { return }

        let elapsed = Date().timeIntervalSince(proj.startTime)
        let t = elapsed / proj.duration

        if t >= 1.0 {
            if let targetCrater = proj.targetCrater {
                handleHit(crater: targetCrater, hitX: proj.targetX, hitY: proj.targetY)
            }
            projectile = nil
        }
    }

    // MARK: - Hit handling

    private func handleHit(crater: Crater, hitX: CGFloat, hitY: CGFloat) {
        guard !roundResolved, gameState == .playing else { return }
        roundResolved = true

        let expId = UUID()
        explosions.append(Explosion(x: hitX, y: hitY, isCorrect: crater.isCorrect))
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            explosions.removeAll { $0.id == expId }
        }

        if crater.isCorrect {
            Haptics.success()
            streak += 1
            correctCount += 1
            if streak > longestStreak { longestStreak = streak }

            let reactionMs = Date().timeIntervalSince(roundStartTime) * 1000
            let reactionBonus = max(0, maxReactionBonus - Int(reactionMs / 25))
            let streakBonus = streak * streakBonusPerStreak
            let total = baseScore + reactionBonus + streakBonus
            score += total

            scorePopups.append(ScorePopup(points: total, x: hitX, y: hitY))
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.1) {
                scorePopups.removeAll { $0.points == total }
            }

            if correctCount % 5 == 0 {
                fallDuration = max(minFallDuration, fallDuration - speedDecreasePerFive)
            }

            withAnimation(.spring(response: 0.35, dampingFraction: 0.6)) {
                screenFlash = WSColor.duoGreen
            }

            for i in craters.indices {
                if craters[i].id == crater.id {
                    craters[i].status = .correct
                    craters[i].frozenY = hitY
                } else {
                    craters[i].status = .missed
                }
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation { screenFlash = nil }
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                advanceQuestion()
            }
        } else {
            Haptics.medium()
            streak = 0
            wrongShakeTrigger += 1

            withAnimation(.spring(response: 0.25, dampingFraction: 0.5)) {
                screenFlash = WSColor.duoRed
            }

            for i in craters.indices {
                if craters[i].id == crater.id {
                    craters[i].status = .wrong
                    craters[i].frozenY = hitY
                } else if craters[i].isCorrect {
                    craters[i].status = .correct
                } else {
                    craters[i].status = .missed
                }
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                withAnimation { screenFlash = nil }
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                loseLife()
            }
        }
    }

    private func checkMissedCraters(areaHeight: CGFloat) {
        guard !roundResolved, gameState == .playing else { return }

        for crater in craters where crater.status == .falling && crater.isCorrect {
            let elapsed = Date().timeIntervalSince(crater.spawnTime)
            let progress = elapsed / crater.fallDuration

            if progress >= 1.0 {
                roundResolved = true

                for i in craters.indices {
                    craters[i].status = .missed
                }

                loseLife()
                return
            }
        }
    }

    private func loseLife() {
        lives -= 1
        streak = 0

        if lives <= 0 {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                gameState = .gameover
            }
        } else {
            advanceQuestion()
        }
    }

    // MARK: - Round management

    private func startRound() {
        spawnRound(qIdx: qIndex)
    }

    private func spawnRound(qIdx: Int) {
        guard gameState == .playing else { return }
        guard let q = craterBlast.questions[safe: qIdx] else { return }

        roundResolved = false
        roundStartTime = Date()
        craters.removeAll()

        let answers = q.answers
        let correctIndex = q.correctIndex
        let lanes = laneCenters.shuffled()

        for (i, answer) in answers.enumerated() {
            let xRatio = lanes[i % lanes.count] + CGFloat.random(in: -0.02...0.02)

            let crater = Crater(
                text: answer,
                answerIndex: i,
                isCorrect: i == correctIndex,
                xRatio: min(max(xRatio, 0.08), 0.92),
                fallDuration: fallDuration + Double.random(in: -0.4...0.4),
                spawnTime: Date()
            )
            craters.append(crater)
        }
    }

    private func advanceQuestion() {
        qIndex = (qIndex + 1) % craterBlast.questions.count
        spawnRound(qIdx: qIndex)
    }

    // MARK: - End screen

    private var endScreen: some View {
        let totalAnswered = correctCount + (initialLives - lives)
        let accuracy = totalAnswered > 0 ? Int(Double(correctCount) / Double(totalAnswered) * 100) : 0

        return WSWinScreen(
            headline: correctCount >= 8 ? "CRATER\nCLEARED." : "GAME\nOVER.",
            subline: correctCount > 0 ? "\(correctCount) direct hits. Run it back and beat \(score)." : "The meteors won this round. Go again.",
            stats: [
                WSWinStat(label: "Score", value: "\(score)", fill: WSColor.lime),
                WSWinStat(label: "Hits", value: "\(correctCount)", fill: WSColor.sky),
                WSWinStat(label: "Accuracy", value: "\(accuracy)%", fill: WSColor.orange),
                WSWinStat(label: "Best streak", value: "x\(longestStreak)", fill: WSColor.pink),
            ]
        ) {
            Button {
                resetGame()
                Haptics.medium()
            } label: {
                Label("Play again", systemImage: "arrow.counterclockwise")
            }
            .buttonStyle(WSStickerButtonStyle(fill: WSColor.lime, foreground: WSColor.inkText, radius: 20, height: 60))
        }
        .onAppear {
            // Award + log exactly once per game. The end screen only
            // appears once per match (resetGame() rebuilds state).
            DailyGoalStore.shared.record(
                .craterBlastPlayed,
                title: craterBlast.title ?? "Crater Blast",
                subtitle: "Score \(score) \u{00B7} streak \(longestStreak)"
            )
        }
    }

    private func resetGame() {
        qIndex = 0
        craters.removeAll()
        lives = initialLives
        score = 0
        streak = 0
        correctCount = 0
        longestStreak = 0
        fallDuration = baseFallDuration
        cannonAngle = 0
        projectile = nil
        explosions.removeAll()
        scorePopups.removeAll()
        screenFlash = nil
        roundResolved = false
        wrongShakeTrigger = 0
        gameState = .playing
        startRound()
    }
}

private extension Array {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

#Preview {
    CraterBlastView(craterBlast: CraterBlast(
        title: "Cell Biology",
        questions: [
            try! JSONDecoder().decode(CraterBlastQuestion.self, from: Data("""
            {"id":"q1","prompt":"Which organelle is the powerhouse?","answers":["Mitochondria","Ribosome","Nucleus","Lysosome"],"correctIndex":0}
            """.utf8)),
            try! JSONDecoder().decode(CraterBlastQuestion.self, from: Data("""
            {"id":"q2","prompt":"What carries genetic information?","answers":["DNA","RNA","Protein","Lipid"],"correctIndex":0}
            """.utf8))
        ]
    ))
}
