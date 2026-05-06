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
                spaceBackdrop

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

    // MARK: - Space backdrop (matches desktop dark blue/purple)

    private var spaceBackdrop: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: 0x0F172A), Color(hex: 0x1E293B), Color(hex: 0x334155)],
                startPoint: .top, endPoint: .bottom
            )
            .ignoresSafeArea()

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
                .padding(.horizontal, 16)
                .padding(.top, 8)

            timerBar
                .frame(height: 4)
                .padding(.top, 4)

            if let q = question {
                questionCard(q.prompt)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
            }

            playArea(geo: geo)
        }
    }

    // MARK: - HUD

    private var hudBar: some View {
        HStack(spacing: 10) {
            Text("Q\(qIndex + 1)/\(craterBlast.questions.count)")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(Color(hex: 0x94A3B8))

            Text("✅ \(correctCount)")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(Color(hex: 0x4ADE80))

            Spacer()

            Text("\(score)")
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Spacer()

            if streak >= 3 {
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill").foregroundStyle(Color(hex: 0x8B5CF6))
                    Text("\(streak)x")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Capsule().fill(Color(hex: 0x8B5CF6).opacity(0.20)))
            }

            HStack(spacing: 2) {
                ForEach(0..<initialLives, id: \.self) { i in
                    Text("❤️")
                        .font(.system(size: 14))
                        .opacity(i < lives ? 1 : 0.2)
                        .grayscale(i < lives ? 0 : 1)
                }
            }
        }
    }

    // MARK: - Timer bar

    private var timerBar: some View {
        GeometryReader { geo in
            let elapsed = Date().timeIntervalSince(roundStartTime)
            let progress = min(elapsed / fallDuration, 1.0)

            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color(hex: 0x1E293B))

                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [Color(hex: 0x22C55E), Color(hex: 0xEAB308), Color(hex: 0xEF4444)],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .frame(width: geo.size.width * (1 - progress))
            }
        }
    }

    // MARK: - Question card

    private func questionCard(_ prompt: String) -> some View {
        Text(prompt)
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color(hex: 0x1E293B).opacity(0.95))
            )
    }

    // MARK: - Play area

    private func playArea(geo: GeometryProxy) -> some View {
        let areaHeight = geo.size.height - 220
        let areaWidth = geo.size.width

        return ZStack {
            Color.clear

            Rectangle()
                .fill(
                    LinearGradient(colors: [.clear, Color(hex: 0xEF4444).opacity(0.12)],
                                   startPoint: .top, endPoint: .bottom)
                )
                .frame(height: 80)
                .position(x: areaWidth / 2, y: areaHeight - 40)

            ForEach(craters) { crater in
                craterView(crater: crater, areaWidth: areaWidth, areaHeight: areaHeight)
            }

            ForEach(explosions) { exp in
                explosionView(exp: exp)
            }

            ForEach(scorePopups) { popup in
                Text("+\(popup.points)")
                    .font(.system(size: 20, weight: .black))
                    .foregroundStyle(Color(hex: 0x4ADE80))
                    .shadow(color: .black.opacity(0.6), radius: 4)
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
        .onReceive(Timer.publish(every: 0.016, on: .main, in: .common).autoconnect()) { _ in
            updateProjectile(areaWidth: areaWidth, areaHeight: areaHeight)
            checkMissedCraters(areaHeight: areaHeight)
        }
    }

    // MARK: - Crater view

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

        let (bg, borderColor, glowColor, textColor) = craterColors(for: crater.status)

        return ZStack {
            Circle()
                .fill(bg)
                .frame(width: craterSize, height: craterSize)
                .overlay(
                    Circle()
                        .stroke(borderColor, lineWidth: 3)
                )
                .shadow(color: glowColor, radius: crater.status == .falling ? 6 : 12)

            Circle()
                .stroke(Color.white.opacity(crater.status == .correct ? 0.25 : crater.status == .wrong ? 0.2 : 0.06), lineWidth: 1.5)
                .frame(width: craterSize - 12, height: craterSize - 12)

            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [Color.white.opacity(crater.status == .correct ? 0.35 : crater.status == .wrong ? 0.3 : 0.12), .clear],
                        center: .center, startRadius: 0, endRadius: 12
                    )
                )
                .frame(width: 18, height: 10)
                .offset(x: -15, y: -20)

            Text(crater.text)
                .font(.system(size: crater.text.count > 14 ? 9 : crater.text.count > 10 ? 10 : 12, weight: .bold))
                .foregroundStyle(textColor)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.6)
                .frame(width: craterSize * 0.68)
                .shadow(color: .black.opacity(0.6), radius: 2)
        }
        .position(x: xPos, y: yPos)
        .opacity(crater.status == .missed ? 0.3 : 1)
        .scaleEffect(crater.status == .correct ? 1.1 : crater.status == .wrong ? 0.9 : 1)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: crater.status)
    }

    private func craterColors(for status: CraterStatus) -> (RadialGradient, Color, Color, Color) {
        switch status {
        case .falling:
            return (
                RadialGradient(colors: [Color(hex: 0x64748B), Color(hex: 0x475569), Color(hex: 0x334155), Color(hex: 0x1E293B)],
                               center: UnitPoint(x: 0.38, y: 0.32), startRadius: 0, endRadius: 50),
                Color(hex: 0x64748B).opacity(0.5),
                Color.black.opacity(0.5),
                Color(hex: 0xE2E8F0)
            )
        case .correct:
            return (
                RadialGradient(colors: [Color(hex: 0x86EFAC), Color(hex: 0x4ADE80), Color(hex: 0x22C55E), Color(hex: 0x15803D)],
                               center: UnitPoint(x: 0.38, y: 0.32), startRadius: 0, endRadius: 50),
                Color(hex: 0x22C55E).opacity(0.8),
                Color(hex: 0x22C55E).opacity(0.6),
                .white
            )
        case .wrong:
            return (
                RadialGradient(colors: [Color(hex: 0xFCA5A5), Color(hex: 0xF87171), Color(hex: 0xEF4444), Color(hex: 0xB91C1C)],
                               center: UnitPoint(x: 0.38, y: 0.32), startRadius: 0, endRadius: 50),
                Color(hex: 0xEF4444).opacity(0.8),
                Color(hex: 0xEF4444).opacity(0.6),
                .white
            )
        case .missed:
            return (
                RadialGradient(colors: [Color(hex: 0x64748B), Color(hex: 0x475569), Color(hex: 0x334155)],
                               center: UnitPoint(x: 0.38, y: 0.32), startRadius: 0, endRadius: 50),
                Color(hex: 0x64748B).opacity(0.3),
                .clear,
                Color(hex: 0xE2E8F0).opacity(0.5)
            )
        }
    }

    // MARK: - Explosion view

    private func explosionView(exp: Explosion) -> some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: exp.isCorrect
                            ? [Color(hex: 0x22C55E).opacity(0.9), Color(hex: 0x22C55E).opacity(0.3), .clear]
                            : [Color(hex: 0xEF4444).opacity(0.9), Color(hex: 0xEF4444).opacity(0.3), .clear],
                        center: .center, startRadius: 0, endRadius: 35
                    )
                )
                .frame(width: 70, height: 70)

            Circle()
                .stroke(exp.isCorrect ? Color(hex: 0x22C55E).opacity(0.7) : Color(hex: 0xEF4444).opacity(0.7), lineWidth: 2)
                .frame(width: 50, height: 50)
        }
        .position(x: exp.x, y: exp.y)
    }

    // MARK: - Projectile view

    private func projectileView(proj: Projectile, areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let elapsed = Date().timeIntervalSince(proj.startTime)
        let t = min(elapsed / proj.duration, 1.0)
        let x = proj.startX + (proj.targetX - proj.startX) * t
        let y = proj.startY + (proj.targetY - proj.startY) * t

        return Circle()
            .fill(
                RadialGradient(
                    colors: [Color(hex: 0xFEF08A), Color(hex: 0xFBBF24), Color(hex: 0xF59E0B), Color(hex: 0xD97706)],
                    center: .center, startRadius: 0, endRadius: 10
                )
            )
            .frame(width: 16, height: 16)
            .shadow(color: Color(hex: 0xFBBF24), radius: 12)
            .shadow(color: Color(hex: 0xF59E0B).opacity(0.5), radius: 24)
            .position(x: x, y: y)
    }

    // MARK: - Cannon view

    private func cannonView(areaWidth: CGFloat, areaHeight: CGFloat) -> some View {
        let cannonX = areaWidth / 2
        let cannonY = areaHeight - 20

        return ZStack {
            VStack(spacing: 0) {
                Rectangle()
                    .fill(
                        LinearGradient(colors: [Color(hex: 0x374151), Color(hex: 0x6B7280), Color(hex: 0x9CA3AF), Color(hex: 0x6B7280), Color(hex: 0x374151)],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                    .frame(width: 10, height: 50)
                    .clipShape(RoundedRectangle(cornerRadius: 4))

                Rectangle()
                    .fill(
                        LinearGradient(colors: [Color(hex: 0x1F2937), Color(hex: 0x4B5563), Color(hex: 0x1F2937)],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                    .frame(width: 16, height: 6)
                    .clipShape(RoundedRectangle(cornerRadius: 3))
            }
            .rotationEffect(.degrees(cannonAngle), anchor: .bottom)
            .position(x: cannonX, y: cannonY - 25)

            VStack(spacing: -1) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(colors: [Color(hex: 0x6B7280), Color(hex: 0x4B5563), Color(hex: 0x374151), Color(hex: 0x1F2937)],
                                       startPoint: .top, endPoint: .bottom)
                    )
                    .frame(width: 50, height: 22)
                    .shadow(color: .black.opacity(0.6), radius: 8)

                Rectangle()
                    .fill(
                        LinearGradient(colors: [Color(hex: 0x4B5563), Color(hex: 0x1F2937)],
                                       startPoint: .top, endPoint: .bottom)
                    )
                    .frame(width: 70, height: 10)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            }
            .position(x: cannonX, y: cannonY)
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
                screenFlash = Color(hex: 0x10B981)
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

            withAnimation(.spring(response: 0.25, dampingFraction: 0.5)) {
                screenFlash = Color(hex: 0xEF4444)
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

        return VStack(spacing: 22) {
            WSAnimatedImage(name: "mascot-study", ext: "webp")
                .frame(width: 160, height: 160)
                .shadow(color: Color(hex: 0xEF4444).opacity(0.5), radius: 22, y: 8)

            VStack(spacing: 6) {
                Text("Game Over")
                    .wsHeadline(.large, weight: .bold)
                    .foregroundStyle(.white)
                Text("Score \(score)")
                    .font(.system(size: 36, weight: .black))
                    .foregroundStyle(.white)
            }

            HStack(spacing: 16) {
                statBox(value: "\(correctCount)", label: "Hits", color: Color(hex: 0x22C55E))
                statBox(value: "\(longestStreak)", label: "Best Streak", color: Color(hex: 0x8B5CF6))
                statBox(value: "\(accuracy)%", label: "Accuracy", color: Color(hex: 0x6366F1))
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
            .buttonStyle(WSPrimaryButtonStyle(fullWidth: false))
        }
        .padding()
    }

    private func statBox(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(color)
            Text(label)
                .wsBody(.caption, weight: .medium)
                .foregroundStyle(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.08))
        )
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
