//
//  HomeTabView.swift
//  WriteScholar
//
//  Duolingo-energy dashboard. The structure stays simple (one screen,
//  scrollable, six stops) but every surface is loud and chunky:
//
//    • Top bar     — History pill, live streak chip, XP gem chip, avatar.
//                    The user sees "I have a streak" + "I have XP" before
//                    they do anything else.
//    • Hero        — Big animated mascot inside a glowing brand halo,
//                    casual greeting, gradient headline, chunky "Let's
//                    go!" CTA with bottom lip.
//    • Quick grid  — 2×2 chunky cards, four bright colors, mini mascots
//                    on each. Tappable, bouncy, gradient surfaces.
//    • Jump back   — horizontal scroll of recent library items.
//    • Stats trio  — three big colorful chunky tiles (streak / goal /
//                    level) — each opens its own sheet for full detail.
//    • Achievements — single chunky pill row → gallery sheet.
//    • Desktop     — Essay Analyzer + Citation Finder web tiles.
//
//  Anything *not* visible here lives one tap away inside an existing
//  sheet (StreakInsightsSheet, DailyGoalSheet, AchievementsGallerySheet,
//  HistorySheet, SettingsSheet). The home page is intentionally sparse
//  in *what's* there — the loudness comes from how each surface looks.
//

import SwiftUI

struct HomeTabView: View {
    @EnvironmentObject var session: AuthSession
    @Binding var onboardingComplete: Bool
    /// Bound to the parent TabView so dashboard quick actions can hop tabs.
    @Binding var selectedTab: MainTabView.Tab

    @State private var showSettings = false
    @State private var showStreakSheet = false
    @State private var showAchievementsSheet = false
    @State private var showDailyGoalSheet = false
    @State private var showHistorySheet = false
    @State private var celebrateGoalHit: Int = 0
    @State private var streak: StreakAPI.StreakInfo?
    /// Drives the mascot's gentle scale pulse so it always feels alive.
    @State private var mascotPulse: CGFloat = 1.0

    @StateObject private var dailyGoal = DailyGoalStore.shared
    @ObservedObject private var library = LibraryStore.shared

    var body: some View {
        ZStack {
            colorfulBackdrop

            ScrollView {
                VStack(spacing: 22) {
                    topBar
                    heroBlock
                    quickActionsGrid
                    jumpBackInRow
                    statsTrio
                    achievementsPeek
                    desktopFeaturesCard
                    Spacer(minLength: 4)
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .scrollDismissesKeyboard(.interactively)
            .refreshable { await refreshAll() }

            // Goal-completion confetti — fires when DailyGoalStore flips
            WSConfettiView(trigger: $celebrateGoalHit)
                .allowsHitTesting(false)
        }
        .task { await refreshAll() }
        .onAppear {
            // Subtle living-mascot heartbeat. Bobbing handles vertical
            // motion; this adds a slow scale wobble for extra life.
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                mascotPulse = 1.04
            }
        }
        .onChange(of: dailyGoal.goalJustHit) { _, newValue in
            if newValue != nil {
                celebrateGoalHit += 1
                NotificationService.shared.refreshAll()
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsSheet(
                user: session.state.user ?? .localGuest,
                onboardingComplete: $onboardingComplete,
                onSignOut: { session.signOut() }
            )
            .presentationDetents([.large])
        }
        .sheet(isPresented: $showStreakSheet) {
            StreakInsightsSheet(streak: streak, stats: session.achievementStats)
        }
        .sheet(isPresented: $showAchievementsSheet) {
            AchievementsGallerySheet(
                unlocked: session.unlockedBadgeIds,
                stats: session.achievementStats
            )
        }
        .sheet(isPresented: $showDailyGoalSheet) {
            DailyGoalSheet(store: dailyGoal)
                .presentationDetents([.large])
        }
        .sheet(isPresented: $showHistorySheet) {
            HistorySheet()
                .presentationDetents([.large, .medium])
        }
    }

    // MARK: - Backdrop (4 brand-orb glows + faint dot pattern)

    /// Stacks the standard hero gradient with four soft, blurred color
    /// orbs (purple / amber / pink / cyan) and a faint dot pattern. The
    /// orbs give every section a different ambient cast as the user
    /// scrolls — Duolingo-style "the world is colorful" feel.
    private var colorfulBackdrop: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            Circle()
                .fill(WSColor.brandPrimary.opacity(0.18))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: -180, y: -300)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xF59E0B).opacity(0.16))
                .frame(width: 320, height: 320)
                .blur(radius: 80)
                .offset(x: 200, y: -120)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xD946EF).opacity(0.14))
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

            // Faint sprinkle of dots, like confetti at rest
            Canvas { ctx, size in
                let dotCount = 38
                for i in 0..<dotCount {
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
        }
    }

    // MARK: - Top bar (history · streak · xp · avatar)

    private var topBar: some View {
        HStack(spacing: 8) {
            // History pill
            Button {
                Haptics.light()
                showHistorySheet = true
            } label: {
                ZStack {
                    Circle()
                        .fill(WSColor.backgroundElevated)
                        .overlay(Circle().stroke(WSColor.hairline, lineWidth: 1))
                        .frame(width: 42, height: 42)
                        .shadow(color: .black.opacity(0.06), radius: 6, y: 3)
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(WSColor.brandPrimary)
                }
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Recent activity")

            Spacer()

            // Live streak chip — orange/red gradient with flame
            topChip(
                icon: "flame.fill",
                value: "\(streak?.currentStreak ?? 0)",
                gradient: [Color(hex: 0xFB923C), Color(hex: 0xEF4444)],
                action: {
                    Haptics.light()
                    showStreakSheet = true
                }
            )

            // Live XP chip — gold gradient with bolt
            topChip(
                icon: "bolt.fill",
                value: "\(totalXP)",
                gradient: [Color(hex: 0xFBBF24), Color(hex: 0xF59E0B)],
                action: {
                    Haptics.light()
                    showAchievementsSheet = true
                }
            )

            // Profile avatar
            Button {
                Haptics.medium()
                showSettings = true
            } label: {
                ZStack {
                    Circle()
                        .fill(WSGradient.brand)
                        .frame(width: 44, height: 44)
                        .shadow(color: WSColor.brandPrimary.opacity(0.45), radius: 10, y: 4)
                    Circle()
                        .stroke(.white.opacity(0.35), lineWidth: 1.5)
                        .frame(width: 44, height: 44)
                    Text(initial)
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                }
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Open settings")
        }
    }

    private func topChip(icon: String, value: String, gradient: [Color], action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .heavy))
                Text(value)
                    .font(.system(size: 14, weight: .black, design: .rounded))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 11)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(LinearGradient(colors: gradient,
                                         startPoint: .topLeading,
                                         endPoint: .bottomTrailing))
                    .overlay(Capsule().stroke(.white.opacity(0.30), lineWidth: 1))
                    .shadow(color: gradient[1].opacity(0.45), radius: 8, y: 3)
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    private var initial: String {
        let name = session.state.user?.displayName ?? "?"
        return String(name.first.map(String.init) ?? "?").uppercased()
    }

    private var totalXP: Int {
        AchievementCatalog.totalXP(unlockedIds: session.unlockedBadgeIds)
    }

    // MARK: - Hero (glow halo + bobbing mascot + chunky CTA)

    private var heroBlock: some View {
        VStack(spacing: 16) {
            ZStack {
                // Pulsing brand halo behind the mascot
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [WSColor.brandPrimary.opacity(0.55), .clear],
                            center: .center,
                            startRadius: 10,
                            endRadius: 140
                        )
                    )
                    .frame(width: 280, height: 280)
                    .blur(radius: 20)
                    .scaleEffect(mascotPulse)

                // Decorative sparkles around the mascot
                ForEach(0..<6, id: \.self) { i in
                    let angle = Double(i) * (.pi * 2 / 6)
                    let radius: Double = 130
                    Image(systemName: i.isMultiple(of: 2) ? "sparkle" : "star.fill")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(sparkleColor(for: i))
                        .offset(x: CGFloat(cos(angle) * radius),
                                y: CGFloat(sin(angle) * radius))
                        .opacity(0.85)
                        .scaleEffect(mascotPulse)
                }

                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 220, height: 220)
                    .shadow(color: WSColor.brandPrimary.opacity(0.45), radius: 26, y: 14)
                    .wsBobbing(amount: 7, duration: 2.6)
            }

            VStack(spacing: 8) {
                Text(casualGreeting)
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.brandPrimary)
                    .textCase(.uppercase)
                    .tracking(0.8)

                // Headline with a colorful gradient on the verb so it
                // pops without an extra accent line.
                Text("What shall we ")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
                +
                Text("learn")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [Color(hex: 0xD946EF), Color(hex: 0x7C3AED)],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                +
                Text("?")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
            }
            .multilineTextAlignment(.center)

            Button {
                Haptics.medium()
                selectedTab = .study
            } label: {
                Label("Let's go!", systemImage: "sparkles")
            }
            .buttonStyle(WSDuoPrimaryButtonStyle())
            .padding(.horizontal, 18)
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 6)
    }

    /// Colors used for the halo sparkles. Cycles through brand-adjacent
    /// hues so the hero feels alive without going circus.
    private func sparkleColor(for i: Int) -> Color {
        let palette: [Color] = [
            Color(hex: 0xFBBF24),  // gold
            Color(hex: 0xD946EF),  // pink
            Color(hex: 0x60A5FA),  // sky
            Color(hex: 0xF87171),  // coral
            Color(hex: 0x34D399),  // mint
            Color(hex: 0xA78BFA),  // lavender
        ]
        return palette[i % palette.count]
    }

    private var casualGreeting: String {
        let name = session.state.user?.displayName ?? ""
        let trimmed = name.split(separator: " ").first.map(String.init) ?? name
        if trimmed.isEmpty || trimmed == "?" {
            return "Hey, what's the move? 👀"
        }
        return "Yo \(trimmed) 👋"
    }

    // MARK: - Quick Actions (2×2 chunky grid)

    private var quickActionsGrid: some View {
        let cols = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
        return LazyVGrid(columns: cols, spacing: 12) {
            chunkyAction(
                title: "Paste",
                subtitle: "Notes → pack",
                icon: "doc.on.clipboard.fill",
                mascot: "mascot-paper",
                gradient: [Color(hex: 0x8B5CF6), Color(hex: 0x6D28D9)]
            ) { selectedTab = .study }

            chunkyAction(
                title: "Games",
                subtitle: "Play & blast",
                icon: "gamecontroller.fill",
                mascot: "mascot-dance",
                gradient: [Color(hex: 0xF87171), Color(hex: 0xDC2626)]
            ) { selectedTab = .games }

            chunkyAction(
                title: "Focus",
                subtitle: "Block & study",
                icon: "shield.lefthalf.filled",
                mascot: "mascot-study",
                gradient: [Color(hex: 0x34D399), Color(hex: 0x059669)]
            ) { selectedTab = .focus }

            chunkyAction(
                title: "Library",
                subtitle: "Your shelf",
                icon: "books.vertical.fill",
                mascot: "mascot-laptop",
                gradient: [Color(hex: 0x60A5FA), Color(hex: 0x4338CA)]
            ) { selectedTab = .library }
        }
    }

    private func chunkyAction(title: String, subtitle: String, icon: String, mascot: String,
                              gradient: [Color], action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            ZStack(alignment: .topTrailing) {
                LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)

                // Subtle dot pattern decoration so the gradient doesn't
                // look like a flat solid swatch.
                Canvas { ctx, size in
                    for i in 0..<10 {
                        let seed = Double(i) * 73.91
                        let x = ((seed * 7).truncatingRemainder(dividingBy: 100)) / 100 * size.width
                        let y = ((seed * 5).truncatingRemainder(dividingBy: 100)) / 100 * size.height
                        ctx.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: 3, height: 3)),
                            with: .color(.white.opacity(0.35))
                        )
                    }
                }
                .allowsHitTesting(false)

                // Mascot peeks from the corner — small, decorative.
                WSAnimatedImage(name: mascot, ext: "webp")
                    .frame(width: 64, height: 64)
                    .opacity(0.85)
                    .offset(x: 8, y: -8)
                    .wsBobbing(amount: 3, duration: 2.4)

                VStack(alignment: .leading, spacing: 6) {
                    Spacer()
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.22))
                            .frame(width: 38, height: 38)
                            .overlay(Circle().stroke(.white.opacity(0.35), lineWidth: 1))
                        Image(systemName: icon)
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                    Text(title)
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text(subtitle)
                        .font(.system(size: 12, weight: .black, design: .rounded))
                        .foregroundStyle(.white.opacity(0.85))
                }
                .padding(14)
            }
            .frame(height: 150)
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(.white.opacity(0.30), lineWidth: 1)
            )
            .wsChunkyCard(
                cornerRadius: 22,
                horizontalPadding: 0,
                verticalPadding: 0,
                lipHeight: 6,
                accent: gradient[1]
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    // MARK: - Jump back in (recent library items, horizontal)

    @ViewBuilder
    private var jumpBackInRow: some View {
        let recent = Array(library.items
            .sorted { ($0.lastOpenedAt ?? $0.createdAt) > ($1.lastOpenedAt ?? $1.createdAt) }
            .prefix(6))

        if !recent.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("Jump back in")
                        .font(.system(size: 19, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.foreground)
                    Spacer()
                    Button {
                        Haptics.light()
                        selectedTab = .library
                    } label: {
                        HStack(spacing: 4) {
                            Text("View all")
                                .font(.system(size: 12, weight: .black, design: .rounded))
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .heavy))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(WSGradient.brand)
                                .shadow(color: WSColor.brandPrimary.opacity(0.4), radius: 6, y: 2)
                        )
                    }
                    .buttonStyle(WSBouncyButtonStyle())
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(recent) { item in
                            jumpBackCard(item: item)
                        }
                    }
                    .padding(.horizontal, 2)
                    .padding(.vertical, 6)
                }
                .padding(.horizontal, -18)
                .padding(.horizontal, 18)
            }
        }
    }

    private func jumpBackCard(item: LibraryItem) -> some View {
        Button {
            Haptics.medium()
            selectedTab = .library
        } label: {
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: item.kind.heroGradient,
                               startPoint: .topLeading, endPoint: .bottomTrailing)

                // Decorative dots for texture
                Canvas { ctx, size in
                    for i in 0..<8 {
                        let seed = Double(i) * 91.7
                        let x = ((seed * 7).truncatingRemainder(dividingBy: 100)) / 100 * size.width
                        let y = ((seed * 5).truncatingRemainder(dividingBy: 100)) / 100 * size.height
                        ctx.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: 3, height: 3)),
                            with: .color(.white.opacity(0.30))
                        )
                    }
                }
                .allowsHitTesting(false)

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        ZStack {
                            Circle()
                                .fill(.white.opacity(0.22))
                                .frame(width: 32, height: 32)
                            Image(systemName: item.kind.icon)
                                .font(.system(size: 14, weight: .heavy))
                                .foregroundStyle(.white)
                        }
                        Spacer()
                        Text(item.kind.label.uppercased())
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .tracking(0.6)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Capsule().fill(.white.opacity(0.22)))
                    }

                    Text(item.title)
                        .font(.system(size: 15, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    if let subtitle = item.subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(.white.opacity(0.85))
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                    Text(relativeDate(item.lastOpenedAt ?? item.createdAt))
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.80))
                }
                .padding(14)
            }
            .frame(width: 210, height: 160)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(.white.opacity(0.25), lineWidth: 1)
            )
            .wsChunkyCard(
                cornerRadius: 18,
                horizontalPadding: 0,
                verticalPadding: 0,
                lipHeight: 6,
                accent: item.kind.tint
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    private func relativeDate(_ date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        if interval < 60 { return "just now" }
        if interval < 3600 { return "\(Int(interval / 60))m ago" }
        if interval < 86_400 { return "\(Int(interval / 3600))h ago" }
        let days = Int(interval / 86_400)
        if days < 7 { return "\(days)d ago" }
        let f = DateFormatter()
        f.dateStyle = .medium
        return f.string(from: date)
    }

    // MARK: - Stats trio (3 vivid chunky tiles)

    /// Three chunky color-coded tiles in a row. Each opens its own
    /// detailed sheet; the home page only shows a one-glance summary.
    private var statsTrio: some View {
        HStack(spacing: 10) {
            chunkyStat(
                tint: Color(hex: 0xF59E0B),
                gradient: [Color(hex: 0xFB923C), Color(hex: 0xEF4444)],
                icon: "flame.fill",
                value: "\(streak?.currentStreak ?? 0)",
                title: "Streak",
                subtitle: (streak?.currentStreak ?? 0) == 1 ? "day" : "days",
                action: { showStreakSheet = true }
            )
            chunkyStat(
                tint: WSColor.brandPrimary,
                gradient: [Color(hex: 0xA78BFA), Color(hex: 0x7C3AED)],
                icon: "target",
                value: "\(dailyGoal.todayXP)",
                title: "Goal",
                subtitle: "/ \(dailyGoal.target.xp) XP",
                progress: dailyGoal.target.xp > 0
                    ? min(1.0, Double(dailyGoal.todayXP) / Double(dailyGoal.target.xp))
                    : 0,
                action: { showDailyGoalSheet = true }
            )
            chunkyStat(
                tint: Color(hex: 0xD946EF),
                gradient: [Color(hex: 0xF472B6), Color(hex: 0xD946EF)],
                icon: "rosette",
                value: "\(AchievementCatalog.currentLevel(forXP: totalXP).level)",
                title: "Level",
                subtitle: AchievementCatalog.currentLevel(forXP: totalXP).name,
                action: { showAchievementsSheet = true }
            )
        }
    }

    private func chunkyStat(tint: Color, gradient: [Color], icon: String,
                            value: String, title: String, subtitle: String,
                            progress: Double? = nil,
                            action: @escaping () -> Void) -> some View {
        Button {
            Haptics.light()
            action()
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    ZStack {
                        Circle()
                            .fill(.white.opacity(0.22))
                            .frame(width: 24, height: 24)
                        Image(systemName: icon)
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                    Text(title)
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(.white.opacity(0.92))
                        .textCase(.uppercase)
                        .tracking(0.4)
                }
                Text(value)
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Text(subtitle)
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.85))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                if let progress {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(.white.opacity(0.22)).frame(height: 6)
                            Capsule()
                                .fill(.white)
                                .frame(width: max(6, geo.size.width * progress), height: 6)
                        }
                    }
                    .frame(height: 6)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(
                LinearGradient(colors: gradient,
                               startPoint: .topLeading, endPoint: .bottomTrailing)
            )
            .overlay(
                Canvas { ctx, size in
                    for i in 0..<6 {
                        let seed = Double(i) * 91.7
                        let x = ((seed * 7).truncatingRemainder(dividingBy: 100)) / 100 * size.width
                        let y = ((seed * 5).truncatingRemainder(dividingBy: 100)) / 100 * size.height
                        ctx.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: 2, height: 2)),
                            with: .color(.white.opacity(0.30))
                        )
                    }
                }
                .allowsHitTesting(false)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(.white.opacity(0.30), lineWidth: 1)
            )
            .wsChunkyCard(
                cornerRadius: 18,
                horizontalPadding: 0,
                verticalPadding: 0,
                lipHeight: 5,
                accent: tint
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    // MARK: - Achievements peek (single chunky pill)

    private var achievementsPeek: some View {
        let unlockedCount = session.unlockedBadgeIds.intersection(Set(AchievementCatalog.all.map(\.id))).count
        let totalCount = AchievementCatalog.all.count

        return Button {
            Haptics.medium()
            showAchievementsSheet = true
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(LinearGradient(colors: [Color(hex: 0xFBBF24), Color(hex: 0xF59E0B)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 44, height: 44)
                        .overlay(Circle().stroke(.white.opacity(0.35), lineWidth: 1))
                        .shadow(color: Color(hex: 0xF59E0B).opacity(0.45), radius: 8, y: 3)
                    Image(systemName: "star.circle.fill")
                        .foregroundStyle(.white)
                        .font(.system(size: 22, weight: .heavy))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Achievements")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.foreground)
                    Text("\(unlockedCount) of \(totalCount) unlocked · keep collecting!")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(WSColor.foregroundMuted)
                        .lineLimit(1)
                }
                Spacer()
                HStack(spacing: -10) {
                    ForEach(Array(sneakPeekBadges.prefix(3).enumerated()), id: \.offset) { _, badge in
                        miniBadge(badge: badge)
                    }
                }
                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(12)
            .frame(maxWidth: .infinity)
            .wsChunkyCard(
                cornerRadius: 18,
                horizontalPadding: 0,
                verticalPadding: 0,
                lipHeight: 5,
                accent: Color(hex: 0xF59E0B)
            )
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(WSColor.backgroundElevated)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    private func miniBadge(badge: Achievement) -> some View {
        let unlocked = session.unlockedBadgeIds.contains(badge.id)
        return ZStack {
            Circle()
                .fill(unlocked
                      ? AnyShapeStyle(LinearGradient(colors: [badge.rarity.color, badge.rarity.color.opacity(0.78)],
                                                     startPoint: .topLeading, endPoint: .bottomTrailing))
                      : AnyShapeStyle(WSColor.surface))
                .frame(width: 30, height: 30)
                .overlay(Circle().stroke(WSColor.backgroundElevated, lineWidth: 2))
            Image(systemName: unlocked ? badge.category.icon : "lock.fill")
                .foregroundStyle(unlocked ? .white : WSColor.foregroundMuted)
                .font(.system(size: 12, weight: .heavy))
        }
    }

    private var sneakPeekBadges: [Achievement] {
        let unlocked = AchievementCatalog.all.filter { session.unlockedBadgeIds.contains($0.id) }
        let lockedByProgress = AchievementCatalog.all
            .filter { !session.unlockedBadgeIds.contains($0.id) }
            .sorted { $0.progress(stats: session.achievementStats) > $1.progress(stats: session.achievementStats) }
        return Array((unlocked + lockedByProgress).prefix(3))
    }

    // MARK: - Desktop-only features card

    private var desktopFeaturesCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "macbook.and.iphone")
                    .foregroundStyle(WSColor.brandPrimary)
                Text("Also on desktop")
                    .wsBody(.medium, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Spacer()
                Text("Web only")
                    .wsBody(.caption, weight: .black)
                    .foregroundStyle(WSColor.brandPrimary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(WSColor.brandSoft))
            }

            HStack(spacing: 10) {
                desktopFeatureTile(
                    title: "Essay Analyzer",
                    blurb: "Professor-style feedback + rubric",
                    imageName: "screenshot-analyse",
                    color: Color(hex: 0xD946EF),
                    url: "https://writescholar.com/analysis"
                )
                desktopFeatureTile(
                    title: "Citation Finder",
                    blurb: "APA · MLA · Chicago · Harvard",
                    imageName: "screenshot-citations",
                    color: Color(hex: 0x10B981),
                    url: "https://writescholar.com/tools/citation-generator"
                )
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.05), radius: 8, y: 3)
        )
    }

    private func desktopFeatureTile(title: String, blurb: String, imageName: String,
                                    color: Color, url: String) -> some View {
        Button {
            Haptics.medium()
            if let u = URL(string: url) { UIApplication.shared.open(u) }
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                ZStack {
                    Image(imageName)
                        .resizable()
                        .scaledToFill()
                        .frame(height: 72)
                        .clipped()
                    LinearGradient(
                        colors: [color.opacity(0.0), color.opacity(0.45)],
                        startPoint: .top, endPoint: .bottom
                    )
                }
                .frame(height: 72)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                Text(title)
                    .wsBody(.small, weight: .black)
                    .foregroundStyle(WSColor.foreground)

                Text(blurb)
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(spacing: 4) {
                    Text("Open on web")
                        .wsBody(.caption, weight: .black)
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 9, weight: .black))
                }
                .foregroundStyle(color)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(WSColor.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(color.opacity(0.30), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Refresh

    private func refreshAll() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await refreshStreak() }
            group.addTask { await session.refreshAchievements() }
        }
    }

    private func refreshStreak() async {
        if session.state.user?.isLocalGuestAccount == true {
            streak = StreakAPI.StreakInfo(currentStreak: 0, longestStreak: 0,
                                          totalActivityDays: 0, hasActivityToday: false,
                                          weekActivities: [])
            return
        }
        do {
            let result = try await StreakAPI.fetch()
            streak = result
        } catch {
            // Keep last known value
        }
    }
}

#Preview {
    HomeTabView(
        onboardingComplete: .constant(true),
        selectedTab: .constant(.home)
    )
    .environmentObject(AuthSession())
}
