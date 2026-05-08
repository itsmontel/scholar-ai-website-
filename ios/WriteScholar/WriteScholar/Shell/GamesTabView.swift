//
//  GamesTabView.swift
//  WriteScholar
//
//  Games hub with a per-game mode picker that mirrors desktop:
//    Crater Blast   → Play / Mental Math / Capitals / Flags
//    Word Tower     → Play / Mental Math
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

    /// Wraps the chosen game + freshly-built bank so the fullScreenCover
    /// can hand the pre-built questions to the game view.
    enum PresentedGame: Identifiable {
        case craterBlast(CraterBlast)
        case wordTower(WordTower)

        var id: String {
            switch self {
            case .craterBlast: return "crater"
            case .wordTower:   return "tower"
            }
        }
    }

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Multi-color brand orbs (red / amber / purple / mint) so the
            // games-tab background pops the same way Home does.
            Circle()
                .fill(Color(hex: 0xEF4444).opacity(0.18))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: -180, y: -300)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xF59E0B).opacity(0.16))
                .frame(width: 320, height: 320)
                .blur(radius: 80)
                .offset(x: 220, y: -140)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0x8B5CF6).opacity(0.14))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: -200, y: 320)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0x10B981).opacity(0.14))
                .frame(width: 320, height: 320)
                .blur(radius: 90)
                .offset(x: 220, y: 480)
                .ignoresSafeArea()

            // Faint sprinkle dots (settled confetti)
            Canvas { ctx, size in
                for i in 0..<32 {
                    let seed = Double(i) * 137.508
                    let x = ((seed * 7).truncatingRemainder(dividingBy: 100)) / 100 * size.width
                    let y = ((seed * 3).truncatingRemainder(dividingBy: 100)) / 100 * size.height
                    let r = (seed.truncatingRemainder(dividingBy: 2)) + 1.2
                    ctx.fill(
                        Path(ellipseIn: CGRect(x: x, y: y, width: r * 2, height: r * 2)),
                        with: .color(.white.opacity(0.30))
                    )
                }
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    headerBlock

                    gameSection(
                        title: "Crater Blast",
                        subtitle: "Boss-battle reflex quiz. Hit the falling answers before they land — 3 lives, react fast.",
                        gradient: [Color(hex: 0xEF4444), Color(hex: 0xB91C1C), Color(hex: 0x4C1D95)],
                        icon: "burst.fill",
                        accent: Color(hex: 0xFBBF24)
                    ) {
                        modePicker(modes: CraterMode.allCases, selected: $craterMode, tint: Color(hex: 0xFBBF24))
                        playButton(
                            label: craterMode == .myNotes ? "Pick a study pack" : "Play \(craterMode.rawValue)"
                        ) {
                            if craterMode == .myNotes {
                                pickerForGame = .craterBlast
                            } else {
                                launchCrater(mode: craterMode)
                            }
                        }
                    }

                    gameSection(
                        title: "Word Tower",
                        subtitle: "Catch the correct answers, dodge the wrong ones — build your tower across 7 lives.",
                        gradient: [Color(hex: 0x8B5CF6), Color(hex: 0x6D28D9), Color(hex: 0x1E1B4B)],
                        icon: "building.2.fill",
                        accent: Color(hex: 0xFDE68A)
                    ) {
                        modePicker(modes: TowerMode.allCases, selected: $towerMode, tint: Color(hex: 0xFDE68A))
                        playButton(
                            label: towerMode == .myNotes ? "Pick a study pack" : "Play \(towerMode.rawValue)"
                        ) {
                            if towerMode == .myNotes {
                                pickerForGame = .wordTower
                            } else {
                                launchTower(mode: towerMode)
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
                }

                Button {
                    Haptics.light()
                    presented = nil
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(10)
                        .background(Circle().fill(Color.black.opacity(0.45)))
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
                title: "Crater Blast · \(pack.displayTitle)",
                questions: cb.questions
            ))
        case .wordTower:
            guard let wt = pack.wordTower, !wt.questions.isEmpty else { return }
            presented = .wordTower(WordTower(
                title: "Word Tower · \(pack.displayTitle)",
                questions: wt.questions
            ))
        }
    }

    // MARK: - Header (Duolingo-style hero with mascot-dance + halo)

    private var headerBlock: some View {
        VStack(spacing: 12) {
            ZStack {
                // Pulsing red halo behind the mascot
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color(hex: 0xEF4444).opacity(0.55), .clear],
                            center: .center, startRadius: 8, endRadius: 110
                        )
                    )
                    .frame(width: 220, height: 220)
                    .blur(radius: 18)

                // Six sparkle satellites in warm tones
                ForEach(0..<6, id: \.self) { i in
                    let angle = Double(i) * (.pi * 2 / 6)
                    let radius: Double = 110
                    Image(systemName: i.isMultiple(of: 2) ? "sparkle" : "star.fill")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(gameSparkleColor(for: i))
                        .offset(x: CGFloat(cos(angle) * radius),
                                y: CGFloat(sin(angle) * radius))
                        .opacity(0.85)
                }

                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 170, height: 170)
                    .shadow(color: Color(hex: 0xEF4444).opacity(0.45), radius: 22, y: 12)
                    .wsBobbing(amount: 7, duration: 2.4)
            }

            // GAMES eyebrow chip + colorful headline
            VStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "gamecontroller.fill")
                        .font(.system(size: 11, weight: .heavy))
                    Text("GAMES")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .tracking(0.8)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(LinearGradient(colors: [Color(hex: 0xF87171), Color(hex: 0xEF4444)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .shadow(color: Color(hex: 0xEF4444).opacity(0.45), radius: 8, y: 3)
                )

                // Two-color gradient title — "Beat the boss" with the verb popping
                Text("Beat the ")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
                +
                Text("boss")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [Color(hex: 0xF87171), Color(hex: 0xDC2626)],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                +
                Text(" 🎮")
                    .font(.system(size: 28, weight: .black, design: .rounded))

                Text("Same physics + word banks as desktop. 750+ questions, two games, three lives — go.")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 6)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 6)
    }

    private func gameSparkleColor(for i: Int) -> Color {
        let palette: [Color] = [
            Color(hex: 0xFBBF24),  // gold
            Color(hex: 0xF472B6),  // pink
            Color(hex: 0x60A5FA),  // sky
            Color(hex: 0xFDA4AF),  // rose
            Color(hex: 0x34D399),  // mint
            Color(hex: 0xA78BFA),  // lavender
        ]
        return palette[i % palette.count]
    }

    // MARK: - Game section card (gradient banner + body)

    private func gameSection<Content: View>(
        title: String,
        subtitle: String,
        gradient: [Color],
        icon: String,
        accent: Color,
        @ViewBuilder body: () -> Content
    ) -> some View {
        VStack(spacing: 0) {
            // Banner — top half
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)

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
                            Circle()
                                .fill(Color.white.opacity(0.18))
                                .frame(width: 48, height: 48)
                            Image(systemName: icon)
                                .font(.system(size: 22, weight: .bold))
                                .foregroundStyle(accent)
                        }
                        Spacer()
                    }
                    Text(title)
                        .wsHeadline(.medium, weight: .bold)
                        .foregroundStyle(.white)
                    Text(subtitle)
                        .wsBody(.small)
                        .foregroundStyle(.white.opacity(0.85))
                }
                .padding(18)
            }
            .frame(height: 170)

            // Body (mode picker + play button) — bottom half
            VStack(spacing: 12) {
                body()
            }
            .frame(maxWidth: .infinity)
            .padding(16)
            .background(WSColor.backgroundElevated)
        }
        // Single rounded clip + border around the whole card
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(WSColor.hairline, lineWidth: 1)
        )
        .shadow(color: gradient.first?.opacity(0.30) ?? .clear, radius: 16, y: 8)
    }

    // MARK: - Mode picker (segmented, scrolls if it overflows)

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
                                .wsBody(.small, weight: .bold)
                        }
                        .foregroundStyle(active ? .white : WSColor.foreground)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(
                            Capsule()
                                .fill(active ? AnyShapeStyle(tint) : AnyShapeStyle(WSColor.surface))
                                .overlay(
                                    Capsule().stroke(active ? .clear : WSColor.hairline, lineWidth: 1)
                                )
                                .shadow(color: active ? tint.opacity(0.5) : .clear, radius: 8, y: 3)
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
        return "circle"
    }

    // MARK: - Play button

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
        .buttonStyle(WSPrimaryButtonStyle())
    }

    // MARK: - Library hint

    private var libraryHint: some View {
        HStack(spacing: 12) {
            Image(systemName: "books.vertical.fill")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color(hex: 0x6366F1))
            VStack(alignment: .leading, spacing: 2) {
                Text("Play with your own subjects")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text("Pick \"My Notes\" mode above to launch either game with questions from a study pack you've saved to your Library.")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(hex: 0x6366F1).opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color(hex: 0x6366F1).opacity(0.25), lineWidth: 1)
                )
        )
    }

    // MARK: - Launchers

    private func launchCrater(mode: CraterMode) {
        let questions: [CraterBlastQuestion] = {
            switch mode {
            case .playForFun: return CraterBlastBank.shuffledPool()
            case .mentalMath: return CraterBlastMentalMathBank.shuffledPool()
            case .capitals:   return CraterBlastCapitalsBank.allQuestions()
            case .flags:      return CraterBlastFlagsBank.allQuestions()
            // .myNotes is routed to the pack picker by the play button —
            // it should never reach here. Return an empty pool defensively
            // so a future caller never crashes the game.
            case .myNotes:    return []
            }
        }()
        guard !questions.isEmpty else { return }
        presented = .craterBlast(CraterBlast(title: "Crater Blast · \(mode.rawValue)", questions: questions))
    }

    private func launchTower(mode: TowerMode) {
        let questions: [WordTowerQuestion] = {
            switch mode {
            case .playForFun: return WordTowerBank.playForFun.shuffled()
            case .mentalMath: return WordTowerBank.mentalMath().shuffled()
            // Same as above — .myNotes goes through launchFromPack instead.
            case .myNotes:    return []
            }
        }()
        guard !questions.isEmpty else { return }
        presented = .wordTower(WordTower(title: "Word Tower · \(mode.rawValue)", questions: questions))
    }
}

#Preview {
    GamesTabView()
}
