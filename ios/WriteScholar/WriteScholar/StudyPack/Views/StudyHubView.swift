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

    /// In-line mode pickers per game (mirrors GamesTabView UX)
    @State private var craterMode: CraterMode = .playForFun
    @State private var towerMode:  TowerMode  = .playForFun

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
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Multi-color brand orbs (purple / pink / amber / mint)
            Circle()
                .fill(WSColor.brandPrimary.opacity(0.18))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: -180, y: -300)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xD946EF).opacity(0.16))
                .frame(width: 320, height: 320)
                .blur(radius: 80)
                .offset(x: 220, y: -120)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xF59E0B).opacity(0.14))
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

            // Faint sprinkle dots
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
        VStack(spacing: 12) {
            ZStack {
                // Pulsing brand-purple halo
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [WSColor.brandPrimary.opacity(0.55), .clear],
                            center: .center, startRadius: 8, endRadius: 110
                        )
                    )
                    .frame(width: 220, height: 220)
                    .blur(radius: 18)

                // Six sparkle satellites
                ForEach(0..<6, id: \.self) { i in
                    let angle = Double(i) * (.pi * 2 / 6)
                    let radius: Double = 110
                    Image(systemName: i.isMultiple(of: 2) ? "sparkle" : "star.fill")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(studySparkleColor(for: i))
                        .offset(x: CGFloat(cos(angle) * radius),
                                y: CGFloat(sin(angle) * radius))
                        .opacity(0.85)
                }

                WSAnimatedImage(name: "mascot-study", ext: "webp")
                    .frame(width: 170, height: 170)
                    .shadow(color: WSColor.brandPrimary.opacity(0.45), radius: 22, y: 12)
                    .wsBobbing(amount: 6, duration: 2.6)
            }

            VStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "graduationcap.fill")
                        .font(.system(size: 11, weight: .heavy))
                    Text("STUDY HUB")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .tracking(0.8)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(LinearGradient(colors: [Color(hex: 0xA78BFA), WSColor.brandPrimary],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .shadow(color: WSColor.brandPrimary.opacity(0.45), radius: 8, y: 3)
                )

                Text("What shall we ")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
                +
                Text("study")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [Color(hex: 0xD946EF), WSColor.brandPrimary],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                +
                Text(" today? ✏️")
                    .font(.system(size: 28, weight: .black, design: .rounded))

                Text("Generate a fresh pack from your notes — or jump into a game with desktop word banks loaded.")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 6)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    private func studySparkleColor(for i: Int) -> Color {
        let palette: [Color] = [
            Color(hex: 0xFBBF24),  // gold
            Color(hex: 0xD946EF),  // pink
            Color(hex: 0x60A5FA),  // sky
            Color(hex: 0xA78BFA),  // lavender
            Color(hex: 0x34D399),  // mint
            Color(hex: 0xF472B6),  // rose
        ]
        return palette[i % palette.count]
    }

    // MARK: - Generate (paste / upload / youtube / photo)

    private var generateGrid: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(title: "Start a new pack",
                          tint: WSColor.brandPrimary,
                          icon: "wand.and.stars")

            let cols = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
            LazyVGrid(columns: cols, spacing: 10) {
                generateCard(
                    title: "Paste notes",
                    subtitle: "Type or paste up to 10k words.",
                    icon: "doc.on.clipboard.fill",
                    tint: WSColor.brandPrimary,
                    badge: nil
                ) { onPaste() }

                generateCard(
                    title: "Upload PDF",
                    subtitle: "Lecture slides, textbooks, handouts.",
                    icon: "doc.fill",
                    tint: Color(hex: 0xD946EF),
                    badge: "Soon"
                ) { Haptics.light() }

                generateCard(
                    title: "YouTube link",
                    subtitle: "Turn a video lecture into a pack.",
                    icon: "play.rectangle.fill",
                    tint: Color(hex: 0xEF4444),
                    badge: "Soon"
                ) { Haptics.light() }

                generateCard(
                    title: "Photo of notes",
                    subtitle: "Snap a page, we'll OCR it.",
                    icon: "camera.fill",
                    tint: Color(hex: 0xF59E0B),
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
                    // Chunky gradient icon tile
                    ZStack {
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(LinearGradient(colors: [tint, tint.opacity(0.78)],
                                                 startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 46, height: 46)
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(.white.opacity(0.30), lineWidth: 1)
                            )
                            .shadow(color: tint.opacity(0.40), radius: 6, y: 3)
                        Image(systemName: icon)
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                    if let badge {
                        Text(badge.uppercased())
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .foregroundStyle(WSColor.foregroundMuted)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Capsule().fill(WSColor.surface))
                    }
                }
                Text(title)
                    .wsBody(.medium, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text(subtitle)
                    .wsBody(.caption)
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
                          tint: Color(hex: 0xEF4444),
                          icon: "gamecontroller.fill",
                          rightCaption: "Desktop word banks · 750+ qs")

            gameCard(
                title: "Crater Blast",
                subtitle: "Boss-battle reflex quiz — hit the falling answers before they land.",
                gradient: [Color(hex: 0xEF4444), Color(hex: 0xB91C1C), Color(hex: 0x4C1D95)],
                icon: "burst.fill",
                accent: Color(hex: 0xFBBF24)
            ) {
                modePicker(modes: CraterMode.allCases, selected: $craterMode, tint: Color(hex: 0xFBBF24))
                playButton(label: "Play \(craterMode.rawValue)") {
                    onPlayGame(.craterBlast(buildCraterBlast()))
                }
            }

            gameCard(
                title: "Word Tower",
                subtitle: "Catch the correct answers, dodge the wrong ones — build your tower across 7 lives.",
                gradient: [Color(hex: 0x8B5CF6), Color(hex: 0x6D28D9), Color(hex: 0x1E1B4B)],
                icon: "building.2.fill",
                accent: Color(hex: 0xFDE68A)
            ) {
                modePicker(modes: TowerMode.allCases, selected: $towerMode, tint: Color(hex: 0xFDE68A))
                playButton(label: "Play \(towerMode.rawValue)") {
                    onPlayGame(.wordTower(buildWordTower()))
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
                    Text(title).wsHeadline(.medium, weight: .bold).foregroundStyle(.white)
                    Text(subtitle).wsBody(.small).foregroundStyle(.white.opacity(0.85))
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
                .stroke(WSColor.hairline, lineWidth: 1)
        )
        .shadow(color: gradient.first?.opacity(0.30) ?? .clear, radius: 16, y: 8)
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
        .buttonStyle(WSDuoPrimaryButtonStyle())
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

    // MARK: - Tools (info cards)

    private var toolsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(title: "What you can build",
                          tint: Color(hex: 0x6366F1),
                          icon: "sparkles")

            let cols = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
            LazyVGrid(columns: cols, spacing: 10) {
                toolInfoCard(title: "Quiz",        icon: "checkmark.bubble.fill",    tint: Color(hex: 0xD946EF), blurb: "Multiple-choice with explanations.")
                toolInfoCard(title: "Flashcards",  icon: "rectangle.on.rectangle.angled.fill", tint: Color(hex: 0x7C3AED), blurb: "Front + back, swipeable.")
                toolInfoCard(title: "Lesson",      icon: "book.pages.fill",          tint: Color(hex: 0x6366F1), blurb: "Slide-by-slide breakdown.")
                toolInfoCard(title: "Crossword",   icon: "grid",                     tint: Color(hex: 0xF59E0B), blurb: "Custom-built from your terms.")
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
                        .fill(LinearGradient(colors: [tint, tint.opacity(0.78)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 38, height: 38)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(.white.opacity(0.30), lineWidth: 1)
                        )
                        .shadow(color: tint.opacity(0.30), radius: 4, y: 2)
                    Image(systemName: icon)
                        .foregroundStyle(.white)
                        .font(.system(size: 15, weight: .heavy))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).wsBody(.medium, weight: .black).foregroundStyle(WSColor.foreground)
                    Text(blurb).wsBody(.caption).foregroundStyle(WSColor.foregroundMuted).lineLimit(2)
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
                    Circle().fill(Color(hex: 0x10B981).opacity(0.18)).frame(width: 42, height: 42)
                    Image(systemName: "shield.lefthalf.filled")
                        .foregroundStyle(Color(hex: 0x10B981))
                        .font(.system(size: 17, weight: .bold))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Need to lock in?")
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                    Text("Use Focus mode to shield distracting apps. Pass a quick quiz to unlock.")
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
                Image(systemName: "arrow.right.circle.fill")
                    .foregroundStyle(Color(hex: 0x10B981))
                    .font(.system(size: 22))
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(Color(hex: 0x10B981).opacity(0.08))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(Color(hex: 0x10B981).opacity(0.30), lineWidth: 1)
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
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(WSColor.foreground)
            Spacer()
            if let cap = rightCaption {
                Text(cap)
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(WSColor.surface))
            }
        }
    }
}

// MARK: - PresentedGame (lifted to module scope so the container can use it too)

enum StudyHubGame: Identifiable {
    case craterBlast(CraterBlast)
    case wordTower(WordTower)

    var id: String {
        switch self {
        case .craterBlast: return "crater"
        case .wordTower:   return "tower"
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
