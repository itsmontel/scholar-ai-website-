//
//  GamesTabView.swift
//  WriteScholar
//
//  Arcade: a dark neon room. "ARCADE_" header, a daily pick banner, a
//  2x2 grid of game cards with live looping previews, and a wide Quiz Run
//  card. Tapping a card opens the mode sheet; picking a mode builds the
//  pool and launches the game. High scores persist in GameScoreStore.
//

import SwiftUI
import ImageIO

struct GamesTabView: View {
    @StateObject private var scores = GameScoreStore.shared

    @State private var launchTarget: ArcadeGame? = nil
    @State private var presented: PresentedGame? = nil
    @State private var pickerForGame: NotesPackPickerSheet.Game? = nil

    /// Wraps a game + its freshly-built pool for the fullScreenCover.
    enum PresentedGame: Identifiable {
        case craterBlast(CraterBlast)
        case wordTower(WordTower)
        case wordBlitz(WordBlitz)
        case memoryMatch(title: String, pairs: [MemoryPair])
        case quizRun(title: String, questions: [QuizQuestion])

        var id: String {
            switch self {
            case .craterBlast: return "crater"
            case .wordTower:   return "tower"
            case .wordBlitz:   return "blitz"
            case .memoryMatch: return "memory"
            case .quizRun:     return "quizrun"
            }
        }
    }

    /// Mockup row order.
    private let rows: [ArcadeGame] = [.wordBlitz, .craterBlast, .memoryMatch, .quizRun, .wordTower]

    @StateObject private var dailyGoal = DailyGoalStore.shared

    var body: some View {
        ZStack {
            WSColor.arcadeNight.ignoresSafeArea()
            ArcadeGrid().ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    dailyPick.wsPop(delay: 0.05)
                    Text("Pick a game")
                        .font(WSFont.headline(22, weight: .black))
                        .foregroundStyle(.white)
                        .padding(.top, 2)
                        .padding(.bottom, -4)
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                        gameCard(.craterBlast, fill: WSColor.sky, delay: 0.12)
                        gameCard(.wordTower, fill: WSColor.lime, delay: 0.18)
                        gameCard(.wordBlitz, fill: WSColor.orange, delay: 0.24)
                        gameCard(.memoryMatch, fill: WSColor.pink, delay: 0.30)
                    }
                    quizRunCard.wsPop(delay: 0.36)
                }
                .padding(.horizontal, 20)
                .padding(.top, 14)
                .padding(.bottom, 28)
            }
        }
        .environment(\.colorScheme, .dark)
        .sheet(item: $launchTarget) { game in
            GameLaunchSheet(game: game, modes: modes(for: game)) { mode in
                pick(mode, for: game)
            }
        }
        .sheet(item: $pickerForGame) { game in
            NotesPackPickerSheet(game: game) { pack in
                launchFromPack(pack, game: game)
            }
            .presentationDetents([.large, .medium])
        }
        .fullScreenCover(item: $presented) { game in
            ZStack(alignment: .topLeading) {
                switch game {
                case .craterBlast(let p): CraterBlastView(craterBlast: p)
                case .wordTower(let p):   WordTowerView(wordTower: p)
                case .wordBlitz(let p):   WordBlitzView(wordBlitz: p)
                case .memoryMatch(let t, let pairs): MemoryMatchView(title: t, pairs: pairs)
                case .quizRun(let t, let qs):        QuizRunView(title: t, questions: qs)
                }
                WSGameCloseButton { presented = nil }
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 0) {
                    Text("ARCADE")
                    BlinkingCursor()
                }
                .font(WSFont.headline(48, weight: .black))
                .tracking(-1.4)
                .foregroundStyle(WSColor.lime)
                Text("Every game runs on your notes.")
                    .font(WSFont.sans(14.5, weight: .bold))
                    .foregroundStyle(Color(hex: 0xD9D2F2))
            }
            Spacer()
            HStack(spacing: 6) {
                Image(systemName: "star.fill")
                    .font(.system(size: 13, weight: .black))
                Text("\(dailyGoal.todayXP) XP")
                    .font(WSFont.headline(16, weight: .black))
                    .contentTransition(.numericText())
            }
            .foregroundStyle(WSColor.inkText)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(
                ZStack {
                    Capsule().fill(Color.black).offset(y: 3)
                    Capsule().fill(Color(hex: 0xFFC93D))
                    Capsule().strokeBorder(Color.black, lineWidth: WSSticker.stroke)
                }
            )
            .padding(.top, 8)
            .wsPop(delay: 0.1)
            .accessibilityLabel("\(dailyGoal.todayXP) XP today")
        }
    }

    // MARK: - Daily pick

    /// Rotates through the five games, one per day.
    private var todaysPick: ArcadeGame {
        let day = Calendar.current.ordinality(of: .day, in: .era, for: Date()) ?? 0
        return rows[day % rows.count]
    }

    private var dailyPick: some View {
        let game = todaysPick
        let best = scores.highScore(for: game)
        return Button {
            Haptics.medium()
            launchTarget = game
        } label: {
            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("TODAY'S PICK")
                        .font(WSFont.sans(11, weight: .black))
                        .tracking(1.5)
                        .foregroundStyle(WSColor.lime)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 4)
                        .background(RoundedRectangle(cornerRadius: 8).fill(WSColor.inkText))
                    Text(game.title)
                        .font(WSFont.headline(27, weight: .black))
                        .tracking(-0.5)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    Text(best > 0 ? "Your best: \(formatted(best)). Beat it." : game.blurb)
                        .font(WSFont.sans(13, weight: .heavy))
                        .lineLimit(2)
                    HStack(spacing: 6) {
                        Image(systemName: "play.fill").font(.system(size: 12, weight: .black))
                        Text("Play now").font(WSFont.headline(16, weight: .black))
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 12).fill(Color.black).offset(y: 3)
                            RoundedRectangle(cornerRadius: 12).fill(WSColor.lime)
                            RoundedRectangle(cornerRadius: 12).strokeBorder(Color.black, lineWidth: WSSticker.stroke)
                        }
                    )
                    .padding(.top, 6)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                WSAnimatedImage(name: "mascot-juggling", ext: "webp")
                    .frame(width: 124, height: 124)
                    .wsMascotBob(amount: 5, rock: 4, duration: 1.1)
                    .padding(.vertical, -14)
                    .padding(.trailing, -10)
                    .accessibilityHidden(true)
            }
            .foregroundStyle(WSColor.inkText)
            .padding(16)
            .wsSticker(fill: WSColor.pink, radius: 26, depth: 6, stroke: .black)
        }
        .buttonStyle(WSStickerPressStyle())
    }

    // MARK: - Game cards

    private func gameCard(_ game: ArcadeGame, fill: Color, delay: Double) -> some View {
        let high = scores.highScore(for: game)
        return Button {
            Haptics.medium()
            launchTarget = game
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                ArcadePreview(game: game)
                    .frame(height: 96)
                    .frame(maxWidth: .infinity)
                    .background(WSColor.arcadeNight)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Color.black, lineWidth: 2))
                Text(game.title)
                    .font(WSFont.headline(18, weight: .black))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Text(high > 0 ? "Best \(formatted(high))" : "New. Try it")
                    .font(WSFont.sans(12.5, weight: .heavy))
            }
            .foregroundStyle(WSColor.inkText)
            .padding(.horizontal, 10)
            .padding(.top, 10)
            .padding(.bottom, 12)
            .wsSticker(fill: fill, radius: 22, depth: 5, stroke: .black)
        }
        .buttonStyle(WSStickerPressStyle())
        .wsPop(delay: delay)
        .accessibilityLabel("\(game.title). \(high > 0 ? "Best \(high)" : "Not played yet")")
    }

    private var quizRunCard: some View {
        let high = scores.highScore(for: .quizRun)
        return Button {
            Haptics.medium()
            launchTarget = .quizRun
        } label: {
            HStack(spacing: 14) {
                ArcadePreview(game: .quizRun)
                    .frame(width: 130, height: 80)
                    .background(WSColor.arcadeNight)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Color.black, lineWidth: 2))
                VStack(alignment: .leading, spacing: 4) {
                    Text("Quiz Run")
                        .font(WSFont.headline(20, weight: .black))
                        .foregroundStyle(.white)
                    Text("Answer to jump. Miss and you trip.")
                        .font(WSFont.sans(13, weight: .bold))
                        .foregroundStyle(Color(hex: 0xF3EEFF))
                        .fixedSize(horizontal: false, vertical: true)
                    Text(high > 0 ? "Best \(formatted(high))" : "New. Try it")
                        .font(WSFont.sans(12.5, weight: .heavy))
                        .foregroundStyle(WSColor.lime)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(12)
            .wsSticker(fill: WSColor.purple, radius: 22, depth: 5, stroke: .black)
        }
        .buttonStyle(WSStickerPressStyle())
    }

    private func formatted(_ n: Int) -> String {
        let f = NumberFormatter(); f.numberStyle = .decimal
        return f.string(from: NSNumber(value: n)) ?? "\(n)"
    }

    // MARK: - Modes per game

    private func modes(for game: ArcadeGame) -> [GameMode] {
        switch game {
        case .wordBlitz:
            return [.init(label: "Play for Fun", icon: "sparkles", source: .builtIn("playForFun")),
                    .init(label: "My Notes", icon: "doc.text.fill", source: .myNotes),
                    .init(label: "Mental Math", icon: "function", source: .builtIn("mentalMath"))]
        case .craterBlast:
            return [.init(label: "Play for Fun", icon: "sparkles", source: .builtIn("playForFun")),
                    .init(label: "My Notes", icon: "doc.text.fill", source: .myNotes),
                    .init(label: "Mental Math", icon: "function", source: .builtIn("mentalMath")),
                    .init(label: "Capitals", icon: "building.columns.fill", source: .builtIn("capitals")),
                    .init(label: "Flags", icon: "flag.fill", source: .builtIn("flags"))]
        case .wordTower:
            return [.init(label: "Play for Fun", icon: "sparkles", source: .builtIn("playForFun")),
                    .init(label: "My Notes", icon: "doc.text.fill", source: .myNotes),
                    .init(label: "Mental Math", icon: "function", source: .builtIn("mentalMath"))]
        case .memoryMatch:
            return [.init(label: "Play for Fun", icon: "sparkles", source: .builtIn("playForFun")),
                    .init(label: "My Notes", icon: "doc.text.fill", source: .myNotes)]
        case .quizRun:
            return [.init(label: "Play for Fun", icon: "sparkles", source: .builtIn("playForFun")),
                    .init(label: "My Notes", icon: "doc.text.fill", source: .myNotes),
                    .init(label: "Science", icon: "atom", source: .builtIn("science")),
                    .init(label: "History", icon: "clock.arrow.circlepath", source: .builtIn("history")),
                    .init(label: "Geography", icon: "globe.americas.fill", source: .builtIn("geography")),
                    .init(label: "Vocabulary", icon: "textformat.abc", source: .builtIn("vocabulary"))]
        }
    }

    // MARK: - Launch

    private func pick(_ mode: GameMode, for game: ArcadeGame) {
        if case .myNotes = mode.source {
            switch game {
            case .craterBlast: pickerForGame = .craterBlast
            case .wordTower:   pickerForGame = .wordTower
            case .wordBlitz:   pickerForGame = .wordBlitz
            case .memoryMatch: pickerForGame = .memoryMatchNotes
            case .quizRun:     pickerForGame = .quizRunNotes
            }
            return
        }
        guard case let .builtIn(key) = mode.source else { return }
        launchBuiltIn(game, key: key)
    }

    private func launchBuiltIn(_ game: ArcadeGame, key: String) {
        switch game {
        case .wordBlitz:
            let qs = key == "mentalMath" ? WordBlitzBank.mentalMath().shuffled() : WordBlitzBank.playForFun.shuffled()
            guard !qs.isEmpty else { return }
            presented = .wordBlitz(WordBlitz(title: "Word Blitz", questions: qs))
        case .craterBlast:
            let qs: [CraterBlastQuestion] = {
                switch key {
                case "mentalMath": return CraterBlastMentalMathBank.shuffledPool()
                case "capitals":   return CraterBlastCapitalsBank.allQuestions()
                case "flags":      return CraterBlastFlagsBank.allQuestions()
                default:           return CraterBlastBank.shuffledPool()
                }
            }()
            guard !qs.isEmpty else { return }
            presented = .craterBlast(CraterBlast(title: "Crater Blast", questions: qs))
        case .wordTower:
            let qs = key == "mentalMath" ? WordTowerBank.mentalMath().shuffled() : WordTowerBank.playForFun.shuffled()
            guard !qs.isEmpty else { return }
            presented = .wordTower(WordTower(title: "Word Tower", questions: qs))
        case .memoryMatch:
            presented = .memoryMatch(title: "Memory Match", pairs: MemoryMatchBank.general)
        case .quizRun:
            let qs = quizRunPool(for: key)
            guard !qs.isEmpty else { return }
            presented = .quizRun(title: "Quiz Run", questions: qs)
        }
    }

    private func quizRunPool(for key: String) -> [QuizQuestion] {
        let topic: FocusTopic?
        switch key {
        case "science":    topic = .science
        case "history":    topic = .history
        case "geography":  topic = .geography
        case "vocabulary": topic = .vocabulary
        default:           topic = nil
        }
        if let topic {
            return FocusQuestionRegistry.questions(for: topic).shuffled()
        }
        // Play for Fun — a mixed pool across every topic.
        return FocusTopic.allCases
            .flatMap { FocusQuestionRegistry.questions(for: $0) }
            .shuffled()
    }

    private func launchFromPack(_ pack: StudyPack, game: NotesPackPickerSheet.Game) {
        switch game {
        case .craterBlast:
            guard let cb = pack.craterBlast, !cb.questions.isEmpty else { return }
            presented = .craterBlast(CraterBlast(title: "Crater Blast · \(pack.displayTitle)", questions: cb.questions))
        case .wordTower:
            guard let wt = pack.wordTower, !wt.questions.isEmpty else { return }
            presented = .wordTower(WordTower(title: "Word Tower · \(pack.displayTitle)", questions: wt.questions))
        case .wordBlitz:
            guard let wb = pack.wordBlitz, !wb.questions.isEmpty else { return }
            presented = .wordBlitz(WordBlitz(title: "Word Blitz · \(pack.displayTitle)", questions: wb.questions))
        case .memoryMatchNotes:
            guard let f = pack.flashcards, !f.cards.isEmpty else { return }
            let pairs = f.cards.map { MemoryPair(term: $0.front, definition: $0.back) }
            presented = .memoryMatch(title: "Memory Match · \(pack.displayTitle)", pairs: pairs)
        case .quizRunNotes:
            guard let q = pack.quiz, !q.questions.isEmpty else { return }
            presented = .quizRun(title: "Quiz Run · \(pack.displayTitle)", questions: q.questions)
        }
    }
}

#Preview {
    GamesTabView()
}

// MARK: - Arcade backdrop + previews

/// Faint purple graph-paper grid behind the arcade.
private struct ArcadeGrid: View {
    var body: some View {
        Canvas { ctx, size in
            var p = Path()
            stride(from: 0, through: size.width, by: 32).forEach { x in
                p.move(to: CGPoint(x: x, y: 0)); p.addLine(to: CGPoint(x: x, y: size.height))
            }
            stride(from: 0, through: size.height, by: 32).forEach { y in
                p.move(to: CGPoint(x: 0, y: y)); p.addLine(to: CGPoint(x: size.width, y: y))
            }
            ctx.stroke(p, with: .color(WSColor.purple.opacity(0.16)), lineWidth: 1.5)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

private struct BlinkingCursor: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.5)) { ctx in
            let on = reduceMotion || Int(ctx.date.timeIntervalSinceReferenceDate * 2) % 2 == 0
            Text("_").opacity(on ? 1 : 0)
        }
        .accessibilityHidden(true)
    }
}

/// Tiny looping animation of each game, drawn in its dark well.
struct ArcadePreview: View {
    let game: ArcadeGame
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { ctx in
            let t = reduceMotion ? 0.6 : ctx.date.timeIntervalSinceReferenceDate
            GeometryReader { geo in
                content(t: t, size: geo.size)
            }
        }
        .accessibilityHidden(true)
    }

    @ViewBuilder
    private func content(t: Double, size: CGSize) -> some View {
        switch game {
        case .craterBlast: meteors(t: t, size: size)
        case .wordTower:   tower(t: t, size: size)
        case .wordBlitz:   blitz(t: t)
        case .memoryMatch: memory(t: t)
        case .quizRun:     run(t: t, size: size)
        }
    }

    private func phase(_ t: Double, period: Double, offset: Double = 0) -> Double {
        let v = (t + offset).truncatingRemainder(dividingBy: period) / period
        return v < 0 ? v + 1 : v
    }

    private func meteors(t: Double, size: CGSize) -> some View {
        let colors = [WSColor.orange, WSColor.pink, WSColor.lime]
        let xs: [CGFloat] = [0.22, 0.5, 0.78]
        return ZStack {
            ForEach(0..<3, id: \.self) { i in
                let ph = phase(t, period: 1.8, offset: Double(i) * 0.6)
                Circle()
                    .fill(colors[i])
                    .overlay(Circle().strokeBorder(Color.black, lineWidth: 2))
                    .frame(width: 18, height: 18)
                    .position(x: size.width * xs[i], y: -12 + (size.height + 24) * ph)
                    .opacity(ph > 0.85 ? (1 - ph) / 0.15 : 1)
            }
            Ellipse()
                .fill(WSColor.purple)
                .overlay(Ellipse().strokeBorder(Color.black, lineWidth: 2))
                .frame(width: 80, height: 44)
                .position(x: size.width / 2, y: size.height + 6)
        }
    }

    private func tower(t: Double, size: CGSize) -> some View {
        let colors = [WSColor.orange, WSColor.sky, WSColor.pink, Color.white]
        let widths: [CGFloat] = [70, 58, 46, 34]
        let ph = phase(t, period: 3.2)
        return ZStack {
            ForEach(0..<4, id: \.self) { i in
                let start = Double(i) * 0.2
                let local = min(1, max(0, (ph - start) / 0.12))
                RoundedRectangle(cornerRadius: 4)
                    .fill(colors[i])
                    .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(Color.black, lineWidth: 2))
                    .frame(width: widths[i], height: 16)
                    .position(x: size.width / 2, y: (size.height - 14 - CGFloat(i) * 18) * local - 20 * (1 - local))
                    .opacity(ph > 0.92 ? 0 : (local > 0 ? 1 : 0))
            }
        }
    }

    private func blitz(t: Double) -> some View {
        let letters = Array("BLITZ")
        return HStack(spacing: 4) {
            ForEach(0..<5, id: \.self) { i in
                let ph = phase(t, period: 1.6, offset: -Double(i) * 0.2)
                let hop = ph < 0.25 ? sin(ph / 0.25 * .pi) : 0
                Text(String(letters[i]))
                    .font(WSFont.headline(15, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 22, height: 26)
                    .background(RoundedRectangle(cornerRadius: 5).fill(Color.white))
                    .overlay(RoundedRectangle(cornerRadius: 5).strokeBorder(Color.black, lineWidth: 2))
                    .offset(y: -10 * hop)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func memory(t: Double) -> some View {
        HStack(spacing: 8) {
            ForEach(0..<3, id: \.self) { i in
                let ph = phase(t, period: 2.4, offset: -Double(i) * 0.35)
                let angle = ph < 0.5 ? 0 : (ph < 0.6 ? (ph - 0.5) / 0.1 * 180 : (ph < 0.85 ? 180 : 180 + (ph - 0.85) / 0.15 * 180))
                let faceUp = angle > 90 && angle < 270
                RoundedRectangle(cornerRadius: 6)
                    .fill(faceUp ? WSColor.lime : WSColor.purple)
                    .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(Color.black, lineWidth: 2))
                    .overlay(
                        Image(systemName: faceUp ? "star.fill" : "questionmark")
                            .font(.system(size: 13, weight: .black))
                            .foregroundStyle(faceUp ? WSColor.inkText : Color.white)
                            .scaleEffect(x: faceUp ? -1 : 1)
                    )
                    .frame(width: 30, height: 42)
                    .rotation3DEffect(.degrees(angle), axis: (x: 0, y: 1, z: 0), perspective: 0.6)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func run(t: Double, size: CGSize) -> some View {
        let ph = phase(t, period: 0.9)
        let dash = CGFloat(phase(t, period: 0.5)) * 20
        return ZStack {
            Path { p in
                var x = -dash
                while x < size.width {
                    p.move(to: CGPoint(x: x, y: size.height - 10))
                    p.addLine(to: CGPoint(x: x + 10, y: size.height - 10))
                    x += 20
                }
            }
            .stroke(WSColor.lime, style: StrokeStyle(lineWidth: 4, lineCap: .round))
            Image(uiImage: ArcadePreview.mascotStill ?? UIImage())
                .resizable()
                .scaledToFit()
                .frame(width: 52, height: 52)
                .position(x: size.width * 0.38, y: size.height - 38 - 22 * sin(ph * .pi))
        }
    }

    /// First frame of the jumping mascot, decoded once.
    static let mascotStill: UIImage? = {
        guard let url = Bundle.main.url(forResource: "mascot-jumping-joy", withExtension: "webp"),
              let src = CGImageSourceCreateWithURL(url as CFURL, nil),
              let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { return nil }
        return UIImage(cgImage: cg)
    }()
}

/// Sticker close button pinned over full-screen games.
struct WSGameCloseButton: View {
    var action: () -> Void
    var body: some View {
        Button {
            Haptics.light()
            action()
        } label: {
            Image(systemName: "xmark")
                .font(.system(size: 14, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 38, height: 38)
                .wsStickerCircle(fill: .white, depth: 3)
        }
        .buttonStyle(WSStickerPressStyle())
        .padding(.top, 14)
        .padding(.leading, 14)
        .accessibilityLabel("Close game")
    }
}
