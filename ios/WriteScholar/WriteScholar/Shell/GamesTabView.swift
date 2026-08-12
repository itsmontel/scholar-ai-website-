//
//  GamesTabView.swift
//  WriteScholar
//
//  Arcade Mode (prototype screen #11): a lavender hero + compact game
//  rows (tile · name · desc · high score · Play pill). Tapping Play opens
//  a mode sheet; picking a mode builds the pool and launches the game.
//  High scores persist in GameScoreStore.
//

import SwiftUI

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

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    heroCard.wsStaggerEntry(0)

                    VStack(spacing: 12) {
                        ForEach(Array(rows.enumerated()), id: \.element.id) { (i, game) in
                            gameRow(game).wsStaggerEntry(i + 1)
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 16)
            }
        }
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
                closeButton
            }
        }
    }

    private var closeButton: some View {
        Button {
            Haptics.light()
            presented = nil
        } label: {
            Image(systemName: "xmark")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(WSColor.foreground)
                .padding(10)
                .background(Circle().fill(WSColor.backgroundElevated))
                .overlay(Circle().stroke(WSColor.hairline, lineWidth: 1))
                .shadow(color: Color.black.opacity(0.1), radius: 6, y: 2)
        }
        .buttonStyle(.plain)
        .padding(.top, 14)
        .padding(.leading, 14)
    }

    // MARK: - Hero

    private var heroCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Arcade Mode")
                        .wsHeadline(.large, weight: .black)
                        .foregroundStyle(WSColor.foreground)
                    Text("Learn by playing fun games!")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
            }
            controllerIllustration
                .frame(height: 120)
                .frame(maxWidth: .infinity)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(WSColor.surfacePurple)
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(WSColor.duoPurple.opacity(0.15), lineWidth: 1.5)
                )
        )
    }

    /// A layered controller illustration with floating doodles — stands in
    /// for the mockup's game-controller art without a bespoke asset.
    private var controllerIllustration: some View {
        ZStack {
            Circle().fill(WSColor.duoPurple.opacity(0.14)).frame(width: 108, height: 108)
            Image(systemName: "gamecontroller.fill")
                .font(.system(size: 52, weight: .bold))
                .foregroundStyle(WSColor.duoPurple)
                .rotationEffect(.degrees(-8))
                .shadow(color: WSColor.duoPurple.opacity(0.3), radius: 10, y: 6)

            doodle("plus", tint: WSColor.duoGreen, size: 16, x: -74, y: -36, delay: 0)
            doodle("puzzlepiece.fill", tint: WSColor.duoOrange, size: 18, x: 78, y: -28, delay: 0.5)
            doodle("star.fill", tint: WSColor.duoYellowDark, size: 14, x: 66, y: 40, delay: 1.0)
            doodle("bolt.fill", tint: WSColor.duoPink, size: 15, x: -70, y: 34, delay: 0.3)
        }
    }

    private func doodle(_ symbol: String, tint: Color, size: CGFloat, x: CGFloat, y: CGFloat, delay: Double) -> some View {
        Image(systemName: symbol)
            .font(.system(size: size, weight: .bold))
            .foregroundStyle(tint.opacity(0.8))
            .offset(x: x, y: y)
            .wsBobbing(amount: 5, duration: 2.6 + delay)
    }

    // MARK: - Game row

    private func gameRow(_ game: ArcadeGame) -> some View {
        let high = scores.highScore(for: game)
        return HStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(game.tint.opacity(0.14))
                .frame(width: 48, height: 48)
                .overlay(
                    Image(systemName: game.icon)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(game.tint)
                )
            VStack(alignment: .leading, spacing: 3) {
                Text(game.title)
                    .wsBody(.large, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Text(game.blurb)
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .lineLimit(1)
                Text(high > 0 ? "High score: \(formatted(high))" : "Not played yet")
                    .wsBody(.caption, weight: .bold)
                    .foregroundStyle(high > 0 ? game.tint : WSColor.foregroundMuted.opacity(0.7))
            }
            Spacer(minLength: 8)
            Button {
                Haptics.medium()
                launchTarget = game
            } label: {
                HStack(spacing: 5) {
                    Image(systemName: "play.fill").font(.system(size: 11, weight: .black))
                    Text("Play").font(WSFont.sans(14, weight: .black))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 9)
                .background(Capsule().fill(WSColor.duoPurple).shadow(color: WSColor.duoPurple.opacity(0.35), radius: 6, y: 3))
            }
            .buttonStyle(WSBouncyButtonStyle())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 20)
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
