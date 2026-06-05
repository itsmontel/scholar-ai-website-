//
//  WordTowerView.swift
//  WriteScholar
//
//  Native Word Tower — identical to desktop. Falling blocks from top,
//  paddle control at bottom, catch correct answers to build tower,
//  dodge wrong ones. 7 mistakes = tower collapses.
//

import SwiftUI

struct WordTowerView: View {
    let wordTower: WordTower

    // MARK: - Config (matches desktop)
    private let maxMistakes = 7
    private let baseFallDuration: Double = 7.8
    private let minFallDuration: Double = 4.6
    private let speedDecreasePerThree: Double = 0.115
    private let paddleWidthRatio: CGFloat = 0.26
    private let paddleHeight: CGFloat = 16
    private let blockWidth: CGFloat = 102
    private let blockHeight: CGFloat = 46
    private let spawnIntervalMs: Double = 3.15
    private let nextRoundDelayMs: Double = 1.7
    private let baseScore = 100
    private let speedBonusTopHalf = 50
    private let streakBonusPerStreak = 25
    private let visibleTowerCap = 8
    private let paddleBottomPx: CGFloat = 18
    private let laneCenters: [CGFloat] = [0.16, 0.38, 0.62, 0.84]

    // MARK: - State
    @State private var gameState: GameState = .playing
    @State private var qIndex = 0
    @State private var fallingBlocks: [FallingBlock] = []
    @State private var towerBlocks: [TowerBlock] = []
    @State private var collapsingBlocks: [CollapsingBlock] = []

    @State private var mistakes = 0
    @State private var score = 0
    @State private var streak = 0
    @State private var longestStreak = 0
    @State private var questionsAnswered = 0
    @State private var fallDuration: Double = 7.8

    @State private var paddleXRatio: CGFloat = 0.5
    @State private var screenFlash: Color? = nil
    @State private var paddleFlash: PaddleFlash? = nil
    @State private var wobbleAngle: Double = 0
    @State private var scorePopups: [ScorePopup] = []

    @State private var blocksThisRound = 0
    @State private var blocksResolvedThisRound = 0
    @State private var roundActive = false
    @State private var wrongShakeTrigger = 0

    private var question: WordTowerQuestion? {
        guard wordTower.questions.indices.contains(qIndex) else { return nil }
        return wordTower.questions[qIndex]
    }

    enum GameState { case playing, collapsing, gameover }
    enum PaddleFlash { case good, bad }

    struct FallingBlock: Identifiable {
        let id = UUID()
        let text: String
        let isCorrect: Bool
        let xRatio: CGFloat
        let fallDuration: Double
        let spawnTime: Date
        var status: BlockStatus = .falling
    }

    enum BlockStatus { case falling, caught, dodged, missed, wrongCaught }

    struct TowerBlock: Identifiable {
        let id = UUID()
        let text: String
    }

    struct CollapsingBlock: Identifiable {
        let id = UUID()
        let text: String
        let yOffset: CGFloat
        let xDrift: CGFloat
        let rotation: Double
        let delay: Double
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
                case .playing, .collapsing:
                    gameLayer(geo: geo)
                case .gameover:
                    endScreen
                }

                if let flash = screenFlash {
                    flash.opacity(0.2)
                        .ignoresSafeArea()
                        .allowsHitTesting(false)
                        .transition(.opacity)
                }
            }
        }
        .onAppear { startRound() }
    }

    // MARK: - Duolingo-style backdrop (blue-tinted dark)

    private var duoBackdrop: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(hex: 0x0F1A2E),
                    WSColor.duoBlueDark.opacity(0.20),
                    Color(hex: 0x0F1A2E)
                ],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

            // Subtle star dots
            Canvas { ctx, size in
                for i in 0..<50 {
                    let seed = Double(i) * 137.508
                    let x = (sin(seed * 7).truncatingRemainder(dividingBy: 1) + 1) / 2 * size.width
                    let y = (cos(seed * 3).truncatingRemainder(dividingBy: 1) + 1) / 2 * size.height * 0.7
                    let r = (sin(seed * 4.14) + 1) / 2 * 1.4 + 0.5
                    let alpha = (cos(seed * 1.7) + 1) / 2 * 0.7 + 0.3
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
                .padding(.horizontal, 16)
                .padding(.top, 8)

            if let q = question {
                questionCard(q.prompt)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
            }

            playArea(geo: geo)
        }
    }

    // MARK: - HUD (Duolingo-style)

    private var hudBar: some View {
        HStack(spacing: 10) {
            // Question counter pill
            HStack(spacing: 4) {
                Image(systemName: "questionmark.circle.fill")
                    .foregroundStyle(WSColor.duoBlue)
                Text("Q\(qIndex + 1)/\(wordTower.questions.count)")
                    .font(WSFont.sans(12, weight: .bold))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                Capsule().fill(Color.white.opacity(0.12))
                    .overlay(Capsule().stroke(Color.white.opacity(0.08), lineWidth: 1))
            )

            // Tower floor counter
            HStack(spacing: 4) {
                Image(systemName: "building.2.fill").foregroundStyle(WSColor.duoGreen)
                Text("\(towerBlocks.count)")
                    .font(WSFont.sans(13, weight: .bold))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                Capsule().fill(Color.white.opacity(0.12))
                    .overlay(Capsule().stroke(WSColor.duoGreen.opacity(0.2), lineWidth: 1))
            )

            Spacer()

            // Score
            Text("\(score)")
                .font(WSFont.headline(28, weight: .black))
                .foregroundStyle(WSColor.duoBlue)
                .shadow(color: WSColor.duoBlue.opacity(0.4), radius: 8)

            Spacer()

            // Streak flame
            if streak >= 3 {
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill").foregroundStyle(WSColor.duoOrange)
                    Text("\(streak)x")
                        .font(WSFont.sans(13, weight: .bold))
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    Capsule().fill(WSColor.duoOrange.opacity(0.25))
                        .overlay(Capsule().stroke(WSColor.duoOrange.opacity(0.4), lineWidth: 1))
                )
            }

            // Mistakes / lives (hearts-style)
            HStack(spacing: 3) {
                ForEach(0..<maxMistakes, id: \.self) { i in
                    Circle()
                        .fill(i < mistakes
                              ? WSColor.duoRed
                              : Color.white.opacity(0.15))
                        .frame(width: 8, height: 8)
                        .overlay(
                            Circle()
                                .stroke(i < mistakes ? WSColor.duoRedDark : Color.white.opacity(0.08), lineWidth: 1)
                        )
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(
                Capsule().fill(Color.white.opacity(0.08))
                    .overlay(Capsule().stroke(Color.white.opacity(0.06), lineWidth: 1))
            )
        }
    }

    // MARK: - Question card (Duo-style, no serif)

    private func questionCard(_ prompt: String) -> some View {
        Text(prompt)
            .font(WSFont.sans(18, weight: .bold))
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(
                ZStack(alignment: .top) {
                    // Bottom lip
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Color.white.opacity(0.06))
                        .padding(.top, 4)
                    // Top face
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Color.white.opacity(0.10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(Color.white.opacity(0.10), lineWidth: 1.5)
                        )
                }
            )
    }

    // MARK: - Play area

    private func playArea(geo: GeometryProxy) -> some View {
        let areaHeight = geo.size.height - 200
        let areaWidth = geo.size.width

        // TimelineView(.animation) drives the loop in sync with the display
        // refresh — including 120Hz ProMotion — so motion is smooth and
        // judder-free, unlike a fixed 60fps Timer. Physics runs once per frame.
        return TimelineView(.animation) { timeline in
            ZStack {
                Color.clear

                ForEach(fallingBlocks) { block in
                    fallingBlockView(block: block, areaWidth: areaWidth, areaHeight: areaHeight)
                }

                if gameState != .collapsing {
                    towerView(areaWidth: areaWidth, areaHeight: areaHeight)
                } else {
                    collapsingTowerView(areaWidth: areaWidth, areaHeight: areaHeight)
                }

                ForEach(scorePopups) { popup in
                    Text("+\(popup.points)")
                        .font(WSFont.headline(18, weight: .black))
                        .foregroundStyle(WSColor.duoGreen)
                        .shadow(color: .black.opacity(0.6), radius: 4)
                        .position(x: popup.x, y: popup.y)
                        .transition(.opacity)
                }

                paddleView(areaWidth: areaWidth, areaHeight: areaHeight)
            }
            .frame(height: areaHeight)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        let xRatio = value.location.x / areaWidth
                        let halfPaddle = paddleWidthRatio / 2
                        paddleXRatio = min(max(xRatio, halfPaddle), 1 - halfPaddle)
                        checkCollisions(areaWidth: areaWidth, areaHeight: areaHeight)
                    }
            )
            .onChange(of: timeline.date) { _, _ in
                guard gameState == .playing else { return }
                updateWobble()
                checkCollisions(areaWidth: areaWidth, areaHeight: areaHeight)
                checkMissedBlocks(areaHeight: areaHeight)
            }
        }
    }

    // MARK: - Falling block view (chunky 3D Duo-blue tiles)

    private func fallingBlockView(block: FallingBlock, areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let elapsed = Date().timeIntervalSince(block.spawnTime)
        let progress = min(elapsed / block.fallDuration, 1.0)
        let yPos = -blockHeight + progress * (areaHeight + blockHeight)
        let xPos = block.xRatio * areaWidth

        return ZStack(alignment: .top) {
            // Bottom lip (3D base)
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.duoBlueDark)
                .frame(width: blockWidth, height: blockHeight)
                .offset(y: 4)

            // Top face
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.duoBlue)
                .frame(width: blockWidth, height: blockHeight)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.white.opacity(0.20), lineWidth: 1)
                )

            // Text
            Text(block.text)
                .font(WSFont.sans(block.text.count > 12 ? 11 : block.text.count > 8 ? 12 : 13, weight: .bold))
                .foregroundStyle(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .multilineTextAlignment(.center)
                .frame(width: blockWidth - 16, height: blockHeight - 8)
        }
        .frame(width: blockWidth, height: blockHeight + 4)
        .shadow(color: WSColor.duoBlue.opacity(0.35), radius: 6, y: 3)
        .position(x: xPos, y: yPos)
        .opacity(block.status == .falling ? 1 : 0)
    }

    // MARK: - Tower view (Duo green built levels)

    private func towerView(areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let towerBottom = areaHeight - paddleBottomPx - paddleHeight - 12
        let visible = towerBlocks.suffix(visibleTowerCap)

        return VStack(spacing: 2) {
            ForEach(visible.reversed()) { block in
                ZStack(alignment: .top) {
                    // Bottom lip
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(WSColor.duoGreenDark)
                        .frame(width: blockWidth, height: blockHeight)
                        .offset(y: 3)

                    // Top face
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(WSColor.duoGreen)
                        .frame(width: blockWidth, height: blockHeight)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(Color.white.opacity(0.20), lineWidth: 1)
                        )

                    Text(block.text)
                        .font(WSFont.sans(block.text.count > 12 ? 10 : 12, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .frame(width: blockWidth - 12, height: blockHeight - 8)
                }
                .frame(width: blockWidth, height: blockHeight + 3)
            }
        }
        .rotationEffect(.degrees(wobbleAngle), anchor: .bottom)
        .position(x: areaWidth / 2, y: towerBottom - CGFloat(visible.count) * (blockHeight + 5) / 2)
        .shadow(color: towerGlowColor.opacity(0.5), radius: CGFloat(mistakes) * 3)
    }

    private var towerGlowColor: Color {
        if mistakes <= 2 { return .clear }
        if mistakes <= 4 { return WSColor.duoOrange }
        if mistakes <= 6 { return WSColor.duoOrange }
        return WSColor.duoRed
    }

    // MARK: - Collapsing tower

    private func collapsingTowerView(areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let towerBottom = areaHeight - paddleBottomPx - paddleHeight - 12

        return ZStack {
            ForEach(collapsingBlocks) { block in
                ZStack(alignment: .top) {
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(WSColor.duoGreenDark)
                        .frame(width: blockWidth, height: blockHeight)
                        .offset(y: 3)
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(WSColor.duoGreen)
                        .frame(width: blockWidth, height: blockHeight)

                    Text(block.text)
                        .font(WSFont.sans(12, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: blockWidth - 12, height: blockHeight - 8)
                }
                .frame(width: blockWidth, height: blockHeight + 3)
                .offset(x: block.xDrift, y: block.yOffset)
                .rotationEffect(.degrees(block.rotation))
                .position(x: areaWidth / 2, y: towerBottom)
            }
        }
    }

    // MARK: - Paddle (Duo blue themed)

    private func paddleView(areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let paddleY = areaHeight - paddleBottomPx - paddleHeight / 2
        let paddleW = areaWidth * paddleWidthRatio

        let topColor: Color = {
            switch paddleFlash {
            case .good:  return WSColor.duoGreen
            case .bad:   return WSColor.duoRed
            case .none:  return WSColor.duoBlue
            }
        }()

        let baseColor: Color = {
            switch paddleFlash {
            case .good:  return WSColor.duoGreenDark
            case .bad:   return WSColor.duoRedDark
            case .none:  return WSColor.duoBlueDark
            }
        }()

        return ZStack(alignment: .top) {
            // Bottom lip
            Capsule()
                .fill(baseColor)
                .frame(width: max(80, min(paddleW, 240)), height: paddleHeight)
                .offset(y: 4)

            // Top face
            Capsule()
                .fill(topColor)
                .frame(width: max(80, min(paddleW, 240)), height: paddleHeight)
                .overlay(
                    Capsule()
                        .stroke(Color.white.opacity(0.25), lineWidth: 1)
                )
        }
        .shadow(color: topColor.opacity(0.5), radius: 10)
        .position(x: paddleXRatio * areaWidth, y: paddleY)
    }

    // MARK: - Wobble

    private func updateWobble() {
        guard gameState == .playing else { return }
        let amp = mistakes <= 2 ? 1.0 : min(8.0, Double(mistakes) * 1.3)
        let period = max(0.6, 2.0 - Double(mistakes) * 0.2)
        let phase = Date().timeIntervalSince1970.truncatingRemainder(dividingBy: period) / period
        wobbleAngle = amp * sin(phase * .pi * 2)
    }

    // MARK: - Collision detection

    private func checkCollisions(areaWidth: CGFloat, areaHeight: CGFloat) {
        guard gameState == .playing else { return }

        let paddleY = areaHeight - paddleBottomPx - paddleHeight / 2
        let halfPaddle = paddleWidthRatio / 2
        let padLeft = paddleXRatio - halfPaddle
        let padRight = paddleXRatio + halfPaddle

        for i in fallingBlocks.indices {
            guard fallingBlocks[i].status == .falling else { continue }

            let block = fallingBlocks[i]
            let elapsed = Date().timeIntervalSince(block.spawnTime)
            let progress = elapsed / block.fallDuration
            let yPos = -blockHeight + progress * (areaHeight + blockHeight)
            let blockCenterY = yPos + blockHeight / 2

            if blockCenterY >= paddleY - 6 && blockCenterY <= paddleY + paddleHeight {
                if block.xRatio >= padLeft && block.xRatio <= padRight {
                    resolveBlock(index: i, caught: true, hitYRatio: progress, areaWidth: areaWidth, areaHeight: areaHeight)
                }
            }
        }
    }

    private func checkMissedBlocks(areaHeight: CGFloat) {
        guard gameState == .playing else { return }

        for i in fallingBlocks.indices {
            guard fallingBlocks[i].status == .falling else { continue }

            let block = fallingBlocks[i]
            let elapsed = Date().timeIntervalSince(block.spawnTime)
            let progress = elapsed / block.fallDuration

            if progress >= 1.02 {
                resolveBlock(index: i, caught: false, hitYRatio: 1, areaWidth: 0, areaHeight: areaHeight)
            }
        }
    }

    private func resolveBlock(index: Int, caught: Bool, hitYRatio: Double, areaWidth: CGFloat, areaHeight: CGFloat) {
        guard gameState == .playing, index < fallingBlocks.count else { return }

        var block = fallingBlocks[index]
        guard block.status == .falling else { return }

        if caught && block.isCorrect {
            block.status = .caught
            handleCorrect(block: block, hitYRatio: hitYRatio, areaWidth: areaWidth, areaHeight: areaHeight)
        } else if caught && !block.isCorrect {
            block.status = .wrongCaught
            handleMistake()
        } else if !caught && block.isCorrect {
            block.status = .missed
            handleMistake()
        } else {
            block.status = .dodged
            handleDodge(block: block)
        }

        fallingBlocks[index] = block
        blocksResolvedThisRound += 1

        if blocksResolvedThisRound >= blocksThisRound && mistakes < maxMistakes {
            DispatchQueue.main.asyncAfter(deadline: .now() + nextRoundDelayMs) {
                advanceQuestion()
            }
        }
    }

    private func handleCorrect(block: FallingBlock, hitYRatio: Double, areaWidth: CGFloat, areaHeight: CGFloat) {
        Haptics.success()
        streak += 1
        if streak > longestStreak { longestStreak = streak }

        var pts = baseScore
        if hitYRatio < 0.5 { pts += speedBonusTopHalf }
        pts += streak * streakBonusPerStreak
        score += pts

        towerBlocks.append(TowerBlock(text: block.text))

        let popupX = block.xRatio * areaWidth
        let popupY = areaHeight - paddleBottomPx - paddleHeight - 30
        scorePopups.append(ScorePopup(points: pts, x: popupX, y: popupY))
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.1) {
            scorePopups.removeAll { $0.points == pts }
        }

        paddleFlash = .good
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { paddleFlash = nil }

        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
            screenFlash = WSColor.duoGreen
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            withAnimation { screenFlash = nil }
        }
    }

    private func handleDodge(block: FallingBlock) {
        Haptics.light()
        streak += 1
        if streak > longestStreak { longestStreak = streak }
        let pts = baseScore + streak * streakBonusPerStreak
        score += pts
    }

    private func handleMistake() {
        Haptics.medium()
        mistakes += 1
        streak = 0
        wrongShakeTrigger += 1

        paddleFlash = .bad
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { paddleFlash = nil }

        withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
            screenFlash = WSColor.duoRed
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            withAnimation { screenFlash = nil }
        }

        if mistakes >= maxMistakes {
            triggerCollapse()
        }
    }

    // MARK: - Collapse

    private func triggerCollapse() {
        gameState = .collapsing
        fallingBlocks.removeAll()

        let visible = towerBlocks.suffix(visibleTowerCap)
        collapsingBlocks = visible.enumerated().map { idx, block in
            CollapsingBlock(
                text: block.text,
                yOffset: -CGFloat(visible.count - 1 - idx) * blockHeight,
                xDrift: CGFloat.random(in: -100...100),
                rotation: Double.random(in: -90...90),
                delay: Double(idx) * 0.06
            )
        }

        Haptics.medium()

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
            gameState = .gameover
            collapsingBlocks.removeAll()
        }
    }

    // MARK: - Round management

    private func startRound() {
        spawnRound(qIdx: qIndex)
    }

    private func spawnRound(qIdx: Int) {
        guard gameState == .playing else { return }
        guard let q = wordTower.questions[safe: qIdx] else { return }

        let items = q.items.shuffled()
        blocksThisRound = items.count
        blocksResolvedThisRound = 0

        let lanes = laneCenters.shuffled()

        for (i, item) in items.enumerated() {
            let lane = lanes[i % lanes.count]
            let xRatio = min(max(lane + CGFloat.random(in: -0.03...0.03), 0.08), 0.92)

            DispatchQueue.main.asyncAfter(deadline: .now() + Double(i) * spawnIntervalMs) {
                guard self.gameState == .playing else { return }
                let block = FallingBlock(
                    text: item.text,
                    isCorrect: item.isCorrect,
                    xRatio: xRatio,
                    fallDuration: self.fallDuration,
                    spawnTime: Date()
                )
                self.fallingBlocks.append(block)
            }
        }
    }

    private func advanceQuestion() {
        guard gameState == .playing else { return }

        fallingBlocks.removeAll { $0.status != .falling }
        questionsAnswered += 1

        if questionsAnswered % 3 == 0 {
            fallDuration = max(minFallDuration, fallDuration - speedDecreasePerThree)
        }

        qIndex = (qIndex + 1) % wordTower.questions.count
        if qIndex == 0 {
            // Reshuffle would happen here if we had mutable questions
        }

        spawnRound(qIdx: qIndex)
    }

    // MARK: - End screen (Duolingo celebration)

    private var endScreen: some View {
        VStack(spacing: 22) {
            WSAnimatedImage(name: "mascot-study", ext: "webp")
                .frame(width: 160, height: 160)
                .shadow(color: WSColor.duoBlue.opacity(0.5), radius: 22, y: 8)

            VStack(spacing: 6) {
                Text("Tower Fell at Floor \(towerBlocks.count)")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(.white)
                Text("\(score)")
                    .font(WSFont.headline(44, weight: .black))
                    .foregroundStyle(WSColor.duoBlue)
                    .shadow(color: WSColor.duoBlue.opacity(0.5), radius: 12)
                Text("TOTAL SCORE")
                    .font(WSFont.sans(11, weight: .black))
                    .tracking(1.5)
                    .foregroundStyle(.white.opacity(0.5))
            }

            HStack(spacing: 12) {
                duoStatBox(value: "\(towerBlocks.count)", label: "Floor", color: WSColor.duoGreen)
                duoStatBox(value: "\(longestStreak)", label: "Best Streak", color: WSColor.duoOrange)
                duoStatBox(value: "\(questionsAnswered)", label: "Questions", color: WSColor.duoBlue)
            }
            .padding(.horizontal, 24)

            Button {
                resetGame()
                Haptics.medium()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Play again")
                }
            }
            .buttonStyle(WSDuoInfoButtonStyle(fullWidth: false))
        }
        .padding()
        .onAppear {
            // Award + log exactly once per game.
            DailyGoalStore.shared.record(
                .wordTowerPlayed,
                title: wordTower.title ?? "Word Tower",
                subtitle: "Floor \(towerBlocks.count) \u{00B7} score \(score)"
            )
        }
    }

    private func duoStatBox(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(WSFont.headline(24, weight: .black))
                .foregroundStyle(color)
            Text(label)
                .font(WSFont.sans(11, weight: .bold))
                .foregroundStyle(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            ZStack(alignment: .top) {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(color.opacity(0.08))
                    .padding(.top, 3)
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color.white.opacity(0.08))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(color.opacity(0.25), lineWidth: 1.5)
                    )
            }
        )
    }

    private func resetGame() {
        qIndex = 0
        fallingBlocks.removeAll()
        towerBlocks.removeAll()
        collapsingBlocks.removeAll()
        mistakes = 0
        score = 0
        streak = 0
        longestStreak = 0
        questionsAnswered = 0
        fallDuration = baseFallDuration
        paddleXRatio = 0.5
        screenFlash = nil
        paddleFlash = nil
        wobbleAngle = 0
        scorePopups.removeAll()
        blocksThisRound = 0
        blocksResolvedThisRound = 0
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
    WordTowerView(wordTower: WordTower(
        title: "Cell Biology",
        questions: [
            try! JSONDecoder().decode(WordTowerQuestion.self, from: Data("""
            {
              "id":"q1",
              "prompt":"Which are organelles?",
              "items":[
                {"text":"Nucleus","isCorrect":true},
                {"text":"Mitochondria","isCorrect":true},
                {"text":"Polygon","isCorrect":false},
                {"text":"Lysosome","isCorrect":true}
              ]
            }
            """.utf8))
        ]
    ))
}
