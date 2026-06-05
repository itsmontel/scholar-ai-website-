//
//  GamesTabView.swift
//  WriteScholar
//
//  Games hub with a per-game mode picker that mirrors desktop:
//    Crater Blast   -> Play / Mental Math / Capitals / Flags
//    Word Tower     -> Play / Mental Math
//
//  Each launch builds a fresh question pool from the ported desktop
//  word banks (CraterBlastBank, CraterBlastMentalMathBank,
//  CraterBlastCapitalsBank, CraterBlastFlagsBank, WordTowerBank).
//

import SwiftUI

struct GamesTabView: View {
    @State private var presented: PresentedGame? = nil
    @State private var craterMode: CraterMode = .playForFun
    @State private var towerMode: TowerMode  = .playForFun
    @State private var blitzMode: WordBlitzMode = .playForFun
    /// Drives the "My Notes" pack picker sheet. Set to `.craterBlast` or
    /// `.wordTower` to present, set back to nil on dismiss/cancel.
    @State private var pickerForGame: NotesPackPickerSheet.Game? = nil

    enum CraterMode: String, CaseIterable, Identifiable {
        case playForFun  = "Play for Fun"
        case myNotes     = "My Notes"
        case mentalMath  = "Mental Math"
        case capitals    = "Capitals"
        case flags       = "Flags"
        var id: Self { self }
        var icon: String {
            switch self {
            case .playForFun: return "sparkles"
            case .myNotes:    return "doc.text.fill"
            case .mentalMath: return "function"
            case .capitals:   return "building.columns.fill"
            case .flags:      return "flag.fill"
            }
        }
    }

    enum TowerMode: String, CaseIterable, Identifiable {
        case playForFun  = "Play for Fun"
        case myNotes     = "My Notes"
        case mentalMath  = "Mental Math"
        var id: Self { self }
        var icon: String {
            switch self {
            case .playForFun: return "sparkles"
            case .myNotes:    return "doc.text.fill"
            case .mentalMath: return "function"
            }
        }
    }

    enum WordBlitzMode: String, CaseIterable, Identifiable {
        case playForFun = "Play for Fun"
        case myNotes    = "My Notes"
        case mentalMath = "Mental Math"
        var id: Self { self }
        var icon: String {
            switch self {
            case .playForFun: return "sparkles"
            case .myNotes:    return "doc.text.fill"
            case .mentalMath: return "function"
            }
        }
    }

    /// Wraps the chosen game + freshly-built bank so the fullScreenCover
    /// can hand the pre-built questions to the game view.
    enum PresentedGame: Identifiable {
        case craterBlast(CraterBlast)
        case wordTower(WordTower)
        case wordBlitz(WordBlitz)

        var id: String {
            switch self {
            case .craterBlast: return "crater"
            case .wordTower:   return "tower"
            case .wordBlitz:   return "blitz"
            }
        }
    }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    headerBlock

                    // Crater Blast card -- orange accent
                    gameCard(
                        title: "Crater Blast",
                        subtitle: "Boss-battle reflex quiz. Hit the falling answers before they land -- 3 lives, react fast.",
                        icon: "burst.fill",
                        videoName: "game-crater-blast",
                        accent: WSColor.duoOrange,
                        accentDark: WSColor.duoOrangeDark,
                        accentLight: WSColor.duoOrangeLight
                    ) {
                        modePicker(modes: CraterMode.allCases, selected: $craterMode, palette: .warn)
                        playButton(
                            label: craterMode == .myNotes ? "Pick a study pack" : "Play \(craterMode.rawValue)",
                            palette: .warn
                        ) {
                            if craterMode == .myNotes {
                                pickerForGame = .craterBlast
                            } else {
                                launchCrater(mode: craterMode)
                            }
                        }
                    }

                    // Word Tower card -- blue accent
                    gameCard(
                        title: "Word Tower",
                        subtitle: "Catch the correct answers, dodge the wrong ones -- build your tower across 7 lives.",
                        icon: "building.2.fill",
                        videoName: "game-word-tower",
                        accent: WSColor.duoBlue,
                        accentDark: WSColor.duoBlueDark,
                        accentLight: WSColor.duoBlueLight
                    ) {
                        modePicker(modes: TowerMode.allCases, selected: $towerMode, palette: .info)
                        playButton(
                            label: towerMode == .myNotes ? "Pick a study pack" : "Play \(towerMode.rawValue)",
                            palette: .info
                        ) {
                            if towerMode == .myNotes {
                                pickerForGame = .wordTower
                            } else {
                                launchTower(mode: towerMode)
                            }
                        }
                    }

                    // Word Blitz card -- pink accent
                    gameCard(
                        title: "Word Blitz",
                        subtitle: "60-second fill-in-the-blank speedrun. Read the sentence, tap the right word -- how many can you get in a minute?",
                        icon: "bolt.fill",
                        videoName: "game-word-blitz",
                        accent: WSColor.duoPink,
                        accentDark: WSColor.duoPinkDark,
                        accentLight: WSColor.duoPinkLight
                    ) {
                        modePicker(modes: WordBlitzMode.allCases, selected: $blitzMode, palette: .pink)
                        playButton(
                            label: blitzMode == .myNotes ? "Pick a study pack" : "Play \(blitzMode.rawValue)",
                            palette: .pink
                        ) {
                            if blitzMode == .myNotes {
                                pickerForGame = .wordBlitz
                            } else {
                                launchBlitz(mode: blitzMode)
                            }
                        }
                    }

                    libraryHint
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 18)
            }
        }
        .fullScreenCover(item: $presented) { game in
            ZStack(alignment: .topLeading) {
                switch game {
                case .craterBlast(let pack): CraterBlastView(craterBlast: pack)
                case .wordTower(let pack):   WordTowerView(wordTower: pack)
                case .wordBlitz(let pack):   WordBlitzView(wordBlitz: pack)
                }

                Button {
                    Haptics.light()
                    presented = nil
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(WSColor.duoText)
                        .padding(10)
                        .background(Circle().fill(Color.white.opacity(0.9)))
                        .overlay(Circle().stroke(WSColor.duoBorder, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .padding(.top, 14)
                .padding(.leading, 14)
            }
        }
        .sheet(item: $pickerForGame) { game in
            NotesPackPickerSheet(game: game) { pack in
                launchFromPack(pack, game: game)
            }
            .presentationDetents([.large, .medium])
        }
    }

    /// Launches the chosen game with question banks pulled from the
    /// user's saved study pack instead of the desktop-ported word banks.
    private func launchFromPack(_ pack: StudyPack, game: NotesPackPickerSheet.Game) {
        switch game {
        case .craterBlast:
            guard let cb = pack.craterBlast, !cb.questions.isEmpty else { return }
            presented = .craterBlast(CraterBlast(
                title: "Crater Blast \u{00B7} \(pack.displayTitle)",
                questions: cb.questions
            ))
        case .wordTower:
            guard let wt = pack.wordTower, !wt.questions.isEmpty else { return }
            presented = .wordTower(WordTower(
                title: "Word Tower \u{00B7} \(pack.displayTitle)",
                questions: wt.questions
            ))
        case .wordBlitz:
            guard let wb = pack.wordBlitz, !wb.questions.isEmpty else { return }
            presented = .wordBlitz(WordBlitz(
                title: "Word Blitz \u{00B7} \(pack.displayTitle)",
                questions: wb.questions
            ))
        }
    }

    // MARK: - Header (Duolingo-style hero)

    private var headerBlock: some View {
        HStack(alignment: .center, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Arcade Mode")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text("Learn by playing fun games!")
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer(minLength: 8)
            ZStack {
                Circle().fill(WSColor.duoPink.opacity(0.14)).frame(width: 76, height: 76)
                Image(systemName: "gamecontroller.fill")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(WSColor.duoPink)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 2)
    }

    // MARK: - Game card (chunky 3D card with icon banner)

    private func gameCard<Content: View>(
        title: String,
        subtitle: String,
        icon: String,
        videoName: String,
        accent: Color,
        accentDark: Color,
        accentLight: Color,
        @ViewBuilder body: () -> Content
    ) -> some View {
        VStack(spacing: 0) {
            // Looping video preview banner
            LoopingVideoView(resourceName: videoName)
                .frame(height: 150)
                .frame(maxWidth: .infinity)
                .background(accentLight)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(WSColor.duoBorder, lineWidth: 1)
                )
                .padding(.bottom, 12)

            // Title row with a small accent icon badge
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(accent).frame(width: 40, height: 40)
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .wsHeadline(.medium, weight: .black)
                        .foregroundStyle(WSColor.duoText)
                    Text(subtitle)
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .lineLimit(2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 14)

            // Body (mode picker + play button)
            VStack(spacing: 12) {
                body()
            }
            .frame(maxWidth: .infinity)
        }
        .wsChunkyCard(accent: accent)
    }

    // MARK: - Mode picker (Duo pill buttons)

    private func modePicker<M: Identifiable & CaseIterable & Hashable>(
        modes: M.AllCases,
        selected: Binding<M>,
        palette: WSDuoPalette
    ) -> some View where M: RawRepresentable, M.RawValue == String, M.AllCases: RandomAccessCollection {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(modes), id: \.self) { mode in
                    let active = (selected.wrappedValue == mode)
                    Button {
                        Haptics.selection()
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            selected.wrappedValue = mode
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: modeIcon(mode))
                                .font(.system(size: 12, weight: .bold))
                            Text(mode.rawValue)
                                .font(WSFont.sans(13, weight: .bold))
                        }
                        .foregroundStyle(active ? .white : WSColor.duoText)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            ZStack(alignment: .top) {
                                if active {
                                    // 3D pressed pill
                                    RoundedRectangle(cornerRadius: 999, style: .continuous)
                                        .fill(palette.baseColor)
                                        .padding(.top, 3)
                                    RoundedRectangle(cornerRadius: 999, style: .continuous)
                                        .fill(palette.topColor)
                                } else {
                                    // Flat outline pill
                                    RoundedRectangle(cornerRadius: 999, style: .continuous)
                                        .fill(WSColor.backgroundElevated)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 999, style: .continuous)
                                                .stroke(WSColor.duoBorder, lineWidth: 2)
                                        )
                                }
                            }
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    /// SF Symbol per mode using each enum's own icon helper.
    private func modeIcon<M: Hashable>(_ mode: M) -> String {
        if let m = mode as? CraterMode { return m.icon }
        if let m = mode as? TowerMode  { return m.icon }
        if let m = mode as? WordBlitzMode { return m.icon }
        return "circle"
    }

    // MARK: - Play button (Duo 3D button)

    private func playButton(label: String, palette: WSDuoPalette = .success, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "play.fill")
                Text(label)
            }
        }
        .buttonStyle(WSDuoButtonStyle(palette: palette))
    }

    // MARK: - Library hint (chunky card with purple accent)

    private var libraryHint: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(WSColor.duoPurple)
                    .frame(width: 44, height: 44)
                Image(systemName: "books.vertical.fill")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("Play with your own subjects")
                    .font(WSFont.sans(14, weight: .bold))
                    .foregroundStyle(WSColor.duoText)
                Text("Pick \"My Notes\" mode above to launch either game with questions from a study pack you've saved to your Library.")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
        .wsChunkyCard(accent: WSColor.duoPurple)
    }

    // MARK: - Launchers

    private func launchCrater(mode: CraterMode) {
        let questions: [CraterBlastQuestion] = {
            switch mode {
            case .playForFun: return CraterBlastBank.shuffledPool()
            case .mentalMath: return CraterBlastMentalMathBank.shuffledPool()
            case .capitals:   return CraterBlastCapitalsBank.allQuestions()
            case .flags:      return CraterBlastFlagsBank.allQuestions()
            // .myNotes is routed to the pack picker by the play button --
            // it should never reach here. Return an empty pool defensively
            // so a future caller never crashes the game.
            case .myNotes:    return []
            }
        }()
        guard !questions.isEmpty else { return }
        presented = .craterBlast(CraterBlast(title: "Crater Blast \u{00B7} \(mode.rawValue)", questions: questions))
    }

    private func launchTower(mode: TowerMode) {
        let questions: [WordTowerQuestion] = {
            switch mode {
            case .playForFun: return WordTowerBank.playForFun.shuffled()
            case .mentalMath: return WordTowerBank.mentalMath().shuffled()
            // Same as above -- .myNotes goes through launchFromPack instead.
            case .myNotes:    return []
            }
        }()
        guard !questions.isEmpty else { return }
        presented = .wordTower(WordTower(title: "Word Tower \u{00B7} \(mode.rawValue)", questions: questions))
    }

    private func launchBlitz(mode: WordBlitzMode) {
        let questions: [WordBlitzQuestion] = {
            switch mode {
            case .playForFun: return WordBlitzBank.playForFun.shuffled()
            case .mentalMath: return WordBlitzBank.mentalMath().shuffled()
            // .myNotes routes through the pack picker → launchFromPack.
            case .myNotes:    return []
            }
        }()
        guard !questions.isEmpty else { return }
        presented = .wordBlitz(WordBlitz(title: "Word Blitz \u{00B7} \(mode.rawValue)", questions: questions))
    }
}

#Preview {
    GamesTabView()
}
