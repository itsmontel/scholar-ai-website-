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

    enum CraterMode: String, CaseIterable, Identifiable {
        case playForFun  = "Play for Fun"
        case mentalMath  = "Mental Math"
        case capitals    = "Capitals"
        case flags       = "Flags"
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

    enum TowerMode: String, CaseIterable, Identifiable {
        case playForFun  = "Play for Fun"
        case mentalMath  = "Mental Math"
        var id: Self { self }
        var icon: String {
            switch self {
            case .playForFun: return "sparkles"
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

            // Soft brand orbs
            Circle()
                .fill(Color(hex: 0xEF4444).opacity(0.10))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -180, y: -260)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0x10B981).opacity(0.10))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: 200, y: 320)
                .ignoresSafeArea()

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
                        playButton(label: "Play \(craterMode.rawValue)") {
                            launchCrater(mode: craterMode)
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
                        playButton(label: "Play \(towerMode.rawValue)") {
                            launchTower(mode: towerMode)
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
    }

    // MARK: - Header

    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Text("GAMES")
                    .wsEyebrow()
                    .foregroundStyle(Color(hex: 0xEF4444))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(Color(hex: 0xEF4444).opacity(0.15)))
                Spacer()
                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 56, height: 56)
                    .shadow(color: Color(hex: 0xD946EF).opacity(0.30), radius: 8, y: 4)
            }
            Text("Beat the boss. Build the tower.")
                .wsHeadline(.large, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
            Text("Same physics, scoring, and full word bank as desktop — over 750 questions across both games.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
        }
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

    // MARK: - Library hint (Chapter 6)

    private var libraryHint: some View {
        HStack(spacing: 12) {
            Image(systemName: "books.vertical.fill")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color(hex: 0x6366F1))
            VStack(alignment: .leading, spacing: 2) {
                Text("Play with your own subjects")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text("Generate a study pack on the Study tab to get personalised questions on your notes. Saved-pack library lands in Chapter 6.")
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
            }
        }()
        presented = .craterBlast(CraterBlast(title: "Crater Blast · \(mode.rawValue)", questions: questions))
    }

    private func launchTower(mode: TowerMode) {
        let questions: [WordTowerQuestion] = {
            switch mode {
            case .playForFun: return WordTowerBank.playForFun.shuffled()
            case .mentalMath: return WordTowerBank.mentalMath().shuffled()
            }
        }()
        presented = .wordTower(WordTower(title: "Word Tower · \(mode.rawValue)", questions: questions))
    }
}

#Preview {
    GamesTabView()
}
