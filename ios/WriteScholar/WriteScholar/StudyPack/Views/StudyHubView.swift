//
//  StudyHubView.swift
//  WriteScholar
//
//  New landing screen for the Study tab. Replaces the old "go straight
//  to paste" flow with a proper hub that surfaces every way to study:
//
//    1. Hero            — "What shall we study today?" + mascot
//    2. Recent pack     — quick re-open of the last pack (when persisted)
//    3. Generate        — Paste / Upload PDF / YouTube / Photo
//    4. Play            — Crater Blast + Word Tower (full word-bank,
//                          ported from desktop). Each game has its own
//                          mode picker (Play for fun / Mental math /
//                          Capitals / Flags).
//    5. Tools           — Quiz · Flashcards · Lesson · Crossword cards
//                          that explain what each output looks like
//                          and lead the user into the generate flow.
//    6. Focus shortcut  — Cross-link into the Focus tab.
//
//  The actual generate flow (paste → generating → study pack home)
//  still runs through StudyPackCoordinator + the existing input/
//  generating/home views, but now lives behind a sheet so the hub
//  remains the primary anchor for the tab.
//

import SwiftUI

struct StudyHubView: View {
    /// User taps "Paste your notes" → parent presents the paste sheet
    var onPaste: () -> Void
    /// User taps a game card → parent presents the game fullScreenCover
    var onPlayGame: (StudyHubGame) -> Void
    /// User taps the Focus shortcut → bubble up to MainTabView
    var onOpenFocus: () -> Void = {}
    /// User taps a saved pack → parent reopens it (coordinator → .home).
    var onOpenPack: (StudyPack) -> Void = { _ in }

    @ObservedObject private var library = LibraryStore.shared

    /// In-line mode pickers per game (mirrors GamesTabView UX)
    @State private var craterMode: CraterMode = .playForFun
    @State private var towerMode:  TowerMode  = .playForFun
    @State private var blitzMode:  TowerMode  = .playForFun

    enum CraterMode: String, CaseIterable, Identifiable, Hashable {
        case playForFun = "Play for Fun"
        case mentalMath = "Mental Math"
        case capitals   = "Capitals"
        case flags      = "Flags"
        var id: Self { self }
        var icon: String {
            switch self {
            case .playForFun: return "sparkles"
            case .mentalMath: return "function"
            case .capitals:   return "building.columns.fill"
            case .flags:      return "flag.fill"
            }
        }
    }

    enum TowerMode: String, CaseIterable, Identifiable, Hashable {
        case playForFun = "Play for Fun"
        case mentalMath = "Mental Math"
        var id: Self { self }
        var icon: String {
            switch self {
            case .playForFun: return "sparkles"
            case .mentalMath: return "function"
            }
        }
    }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    headerBlock
                    yourPacksSection
                    generateGrid
                    playSection
                    toolsSection
                    focusShortcut
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)
                .padding(.bottom, 28)
            }
        }
    }

    // MARK: - Header (Duolingo-energy hero with mascot-study)

    private var headerBlock: some View {
        HStack(alignment: .center, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Study Packs")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text("Turn your notes into flashcards, quizzes & lessons.")
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer(minLength: 8)
            WSMascotHero(asset: "mascot-study", size: 60, haloTint: WSColor.duoOrange)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 2)
    }

    // MARK: - Your saved packs (reopen from on-device store)

    @ViewBuilder
    private var yourPacksSection: some View {
        let packs = library.items
            .filter { $0.kind == .studyPack }
            .sorted { ($0.lastOpenedAt ?? $0.createdAt) > ($1.lastOpenedAt ?? $1.createdAt) }
        if !packs.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionHeader(title: "Your packs",
                              tint: WSColor.duoPurple,
                              icon: "square.stack.3d.up.fill")
                ForEach(packs) { item in
                    Button {
                        Haptics.medium()
                        if let pack = StudyPackPersistence.shared.loadPack(for: item.id) {
                            onOpenPack(pack)
                        } else {
                            onPaste()   // pre-store item: can't reopen, start fresh
                        }
                    } label: {
                        WSListRowCard(icon: "square.stack.3d.up.fill",
                                      iconTint: WSColor.duoPurple,
                                      title: item.title,
                                      subtitle: item.subtitle)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Generate (paste / upload / youtube / photo)

    private var generateGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(title: "Start a new pack",
                          tint: WSColor.duoOrange,
                          icon: "wand.and.stars")

            let cols = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
            LazyVGrid(columns: cols, spacing: 10) {
                generateCard(
                    title: "Paste notes",
                    subtitle: "Type or paste up to 10k words.",
                    icon: "doc.on.clipboard.fill",
                    tint: WSColor.duoPurple,
                    badge: nil
                ) { onPaste() }

                generateCard(
                    title: "Upload PDF",
                    subtitle: "Lecture slides, textbooks, handouts.",
                    icon: "doc.fill",
                    tint: WSColor.duoBlue,
                    badge: "Soon"
                ) { Haptics.light() }

                generateCard(
                    title: "YouTube link",
                    subtitle: "Turn a video lecture into a pack.",
                    icon: "play.rectangle.fill",
                    tint: WSColor.duoRed,
                    badge: "Soon"
                ) { Haptics.light() }

                generateCard(
                    title: "Photo of notes",
                    subtitle: "Snap a page, we'll OCR it.",
                    icon: "camera.fill",
                    tint: WSColor.duoOrange,
                    badge: "Soon"
                ) { Haptics.light() }
            }
        }
    }

    private func generateCard(title: String, subtitle: String, icon: String, tint: Color, badge: String?, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    // Chunky icon tile
                    ZStack {
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(tint)
                            .frame(width: 46, height: 46)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(.white.opacity(0.20), lineWidth: 1)
                            )
                            .shadow(color: tint.opacity(0.35), radius: 4, y: 2)
                        Image(systemName: icon)
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                    if let badge {
                        Text(badge.uppercased())
                            .font(WSFont.sans(9, weight: .black))
                            .tracking(1.0)
                            .foregroundStyle(WSColor.foregroundMuted)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Capsule().fill(WSColor.duoSurface)
                                .overlay(Capsule().stroke(WSColor.duoBorder, lineWidth: 1)))
                    }
                }
                Text(title)
                    .font(WSFont.sans(15, weight: .black))
                    .foregroundStyle(WSColor.duoText)
                Text(subtitle)
                    .font(WSFont.sans(11))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .lineLimit(2)
                    .frame(minHeight: 28, alignment: .topLeading)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .wsChunkyCard(
                cornerRadius: 18,
                horizontalPadding: 14,
                verticalPadding: 14,
                lipHeight: 5,
                accent: tint
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    // MARK: - Play (games)

    private var playSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(title: "Play",
                          tint: WSColor.duoOrange,
                          icon: "gamecontroller.fill",
                          rightCaption: "Desktop word banks / 750+ qs")

            gameCard(
                title: "Crater Blast",
                subtitle: "Boss-battle reflex quiz — hit the falling answers before they land.",
                gradient: [WSColor.duoOrange, WSColor.duoOrangeDark, WSColor.duoRed],
                icon: "burst.fill",
                accent: Color.white
            ) {
                modePicker(modes: CraterMode.allCases, selected: $craterMode, tint: WSColor.duoOrange)
                playButton(label: "Play \(craterMode.rawValue)") {
                    onPlayGame(.craterBlast(buildCraterBlast()))
                }
            }

            gameCard(
                title: "Word Tower",
                subtitle: "Catch the correct answers, dodge the wrong ones — build your tower across 7 lives.",
                gradient: [WSColor.duoPurple, WSColor.duoPurpleDark, Color(hex: 0x1E1B4B)],
                icon: "building.2.fill",
                accent: Color.white
            ) {
                modePicker(modes: TowerMode.allCases, selected: $towerMode, tint: WSColor.duoPurple)
                playButton(label: "Play \(towerMode.rawValue)") {
                    onPlayGame(.wordTower(buildWordTower()))
                }
            }

            gameCard(
                title: "Word Blitz",
                subtitle: "60-second fill-in-the-blank speedrun — read the sentence, tap the right word.",
                gradient: [WSColor.duoPink, WSColor.duoPinkDark, Color(hex: 0x7A1E50)],
                icon: "bolt.fill",
                accent: Color.white
            ) {
                modePicker(modes: TowerMode.allCases, selected: $blitzMode, tint: WSColor.duoPink)
                playButton(label: "Play \(blitzMode.rawValue)") {
                    onPlayGame(.wordBlitz(buildWordBlitz()))
                }
            }
        }
    }

    private func gameCard<Content: View>(
        title: String,
        subtitle: String,
        gradient: [Color],
        icon: String,
        accent: Color,
        @ViewBuilder body: () -> Content
    ) -> some View {
        VStack(spacing: 0) {
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)

                // Star sparkle field
                Canvas { ctx, size in
                    for i in 0..<14 {
                        let x = (sin(Double(i) * 6.31) + 1) / 2 * size.width
                        let y = (cos(Double(i) * 4.21) + 1) / 2 * size.height
                        ctx.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: 2, height: 2)),
                            with: .color(.white.opacity(0.5))
                        )
                    }
                }
                .allowsHitTesting(false)

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        ZStack {
                            Circle().fill(Color.white.opacity(0.18)).frame(width: 48, height: 48)
                            Image(systemName: icon).font(.system(size: 22, weight: .bold)).foregroundStyle(accent)
                        }
                        Spacer()
                    }
                    Text(title).font(WSFont.headline(22, weight: .black)).foregroundStyle(.white)
                    Text(subtitle).font(WSFont.sans(13)).foregroundStyle(.white.opacity(0.85))
                }
                .padding(18)
            }
            .frame(height: 160)

            VStack(spacing: 10) {
                body()
            }
            .frame(maxWidth: .infinity)
            .padding(14)
            .background(WSColor.backgroundElevated)
        }
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(WSColor.duoBorder, lineWidth: 2)
        )
        .shadow(color: gradient.first?.opacity(0.20) ?? .clear, radius: 12, y: 6)
    }

    private func modePicker<M: Identifiable & CaseIterable & Hashable>(
        modes: M.AllCases,
        selected: Binding<M>,
        tint: Color
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
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(
                            Capsule()
                                .fill(active ? tint : WSColor.backgroundElevated)
                                .overlay(
                                    Capsule().stroke(active ? .clear : WSColor.duoBorder, lineWidth: 2)
                                )
                                .shadow(color: active ? tint.opacity(0.4) : .clear, radius: 6, y: 2)
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func modeIcon<M: Hashable>(_ mode: M) -> String {
        if let m = mode as? CraterMode { return m.icon }
        if let m = mode as? TowerMode  { return m.icon }
        return "circle"
    }

    private func playButton(label: String, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "play.fill")
                Text(label)
            }
        }
        .buttonStyle(WSDuoSuccessButtonStyle())
    }

    private func buildCraterBlast() -> CraterBlast {
        let questions: [CraterBlastQuestion] = {
            switch craterMode {
            case .playForFun: return CraterBlastBank.shuffledPool()
            case .mentalMath: return CraterBlastMentalMathBank.shuffledPool()
            case .capitals:   return CraterBlastCapitalsBank.allQuestions()
            case .flags:      return CraterBlastFlagsBank.allQuestions()
            }
        }()
        return CraterBlast(title: "Crater Blast · \(craterMode.rawValue)", questions: questions)
    }

    private func buildWordTower() -> WordTower {
        let questions: [WordTowerQuestion] = {
            switch towerMode {
            case .playForFun: return WordTowerBank.playForFun.shuffled()
            case .mentalMath: return WordTowerBank.mentalMath().shuffled()
            }
        }()
        return WordTower(title: "Word Tower · \(towerMode.rawValue)", questions: questions)
    }

    private func buildWordBlitz() -> WordBlitz {
        let questions: [WordBlitzQuestion] = {
            switch blitzMode {
            case .playForFun: return WordBlitzBank.playForFun.shuffled()
            case .mentalMath: return WordBlitzBank.mentalMath().shuffled()
            }
        }()
        return WordBlitz(title: "Word Blitz · \(blitzMode.rawValue)", questions: questions)
    }

    // MARK: - Tools (info cards)

    private var toolsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(title: "What you can build",
                          tint: WSColor.duoBlue,
                          icon: "sparkles")

            let cols = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
            LazyVGrid(columns: cols, spacing: 10) {
                toolInfoCard(title: "Quiz",        icon: "checkmark.bubble.fill",    tint: WSColor.duoPurple, blurb: "Multiple-choice with explanations.")
                toolInfoCard(title: "Flashcards",  icon: "rectangle.on.rectangle.angled.fill", tint: WSColor.duoBlue, blurb: "Front + back, swipeable.")
                toolInfoCard(title: "Lesson",      icon: "book.pages.fill",          tint: WSColor.duoGreen, blurb: "Slide-by-slide breakdown.")
                toolInfoCard(title: "Crossword",   icon: "grid",                     tint: WSColor.duoOrange, blurb: "Custom-built from your terms.")
            }
        }
    }

    private func toolInfoCard(title: String, icon: String, tint: Color, blurb: String) -> some View {
        Button {
            Haptics.light()
            onPaste() // funnels users into the generator
        } label: {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(tint)
                        .frame(width: 38, height: 38)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(.white.opacity(0.20), lineWidth: 1)
                        )
                        .shadow(color: tint.opacity(0.30), radius: 4, y: 2)
                    Image(systemName: icon)
                        .foregroundStyle(.white)
                        .font(.system(size: 15, weight: .heavy))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(WSFont.sans(15, weight: .black)).foregroundStyle(WSColor.duoText)
                    Text(blurb).font(WSFont.sans(11)).foregroundStyle(WSColor.foregroundMuted).lineLimit(2)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .wsChunkyCard(
                cornerRadius: 14,
                horizontalPadding: 12,
                verticalPadding: 12,
                lipHeight: 4,
                accent: tint
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    // MARK: - Focus shortcut

    private var focusShortcut: some View {
        Button {
            Haptics.medium()
            onOpenFocus()
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(WSColor.duoGreenLight).frame(width: 42, height: 42)
                    Image(systemName: "shield.lefthalf.filled")
                        .foregroundStyle(WSColor.duoGreen)
                        .font(.system(size: 17, weight: .bold))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Need to lock in?")
                        .font(WSFont.sans(15, weight: .bold))
                        .foregroundStyle(WSColor.duoText)
                    Text("Use Focus mode to shield distracting apps. Pass a quick quiz to unlock.")
                        .font(WSFont.sans(11))
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
                Image(systemName: "arrow.right.circle.fill")
                    .foregroundStyle(WSColor.duoGreen)
                    .font(.system(size: 22))
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(WSColor.duoGreenLight)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(WSColor.duoGreen.opacity(0.30), lineWidth: 2)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Section header helper

    private func sectionHeader(title: String, tint: Color, icon: String, rightCaption: String? = nil) -> some View {
        HStack(alignment: .center, spacing: 8) {
            Image(systemName: icon).foregroundStyle(tint).font(.system(size: 14, weight: .bold))
            Text(title)
                .font(WSFont.sans(15, weight: .bold))
                .foregroundStyle(WSColor.duoText)
            Spacer()
            if let cap = rightCaption {
                Text(cap)
                    .font(WSFont.sans(11, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(WSColor.backgroundElevated)
                        .overlay(Capsule().stroke(WSColor.duoBorder, lineWidth: 1)))
            }
        }
    }
}

// MARK: - PresentedGame (lifted to module scope so the container can use it too)

enum StudyHubGame: Identifiable {
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

#Preview {
    StudyHubView(
        onPaste: {},
        onPlayGame: { _ in },
        onOpenFocus: {}
    )
}
