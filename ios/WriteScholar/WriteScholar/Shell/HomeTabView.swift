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

    /// Clean white backdrop with a subtle green tint at the top, matching
    /// Duolingo's flat, bright home screen feel.
    private var colorfulBackdrop: some View {
        ZStack {
            Color.white.ignoresSafeArea()

            VStack {
                WSColor.duoGreenLight.opacity(0.35)
                    .frame(height: 280)
                    .blur(radius: 50)
                Spacer()
            }
            .ignoresSafeArea()
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
                        .overlay(Circle().stroke(WSColor.duoBorder, lineWidth: 2))
                        .frame(width: 44, height: 44)
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(WSColor.duoGreen)
                }
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Recent activity")

            Spacer()

            // Live streak chip — solid orange with flame
            topChip(
                icon: "flame.fill",
                value: "\(streak?.currentStreak ?? 0)",
                color: WSColor.duoOrange,
                action: {
                    Haptics.light()
                    showStreakSheet = true
                }
            )

            // Live XP chip — solid purple with bolt
            topChip(
                icon: "bolt.fill",
                value: "\(totalXP)",
                color: WSColor.duoPurple,
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
                        .fill(WSColor.duoGreen)
                        .frame(width: 44, height: 44)
                    Circle()
                        .stroke(WSColor.duoGreenDark, lineWidth: 2)
                        .frame(width: 44, height: 44)
                    Text(initial)
                        .font(WSFont.headline(18, weight: .black))
                        .foregroundStyle(.white)
                }
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Open settings")
        }
    }

    private func topChip(icon: String, value: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .heavy))
                Text(value)
                    .font(WSFont.headline(14, weight: .black))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(color)
                    .overlay(Capsule().stroke(color.opacity(0.3), lineWidth: 2))
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    private var initial: String {
        let name = session.state.user?.displayName ?? "?"
        return String(name.prefix(1)).uppercased()
    }

    private var totalXP: Int {
        AchievementCatalog.totalXP(unlockedIds: session.unlockedBadgeIds)
    }

    // MARK: - Hero (glow halo + bobbing mascot + chunky CTA)

    private var heroBlock: some View {
        VStack(spacing: 16) {
            ZStack {
                // Clean green halo behind the mascot
                Circle()
                    .fill(WSColor.duoGreenLight)
                    .frame(width: 200, height: 200)
                    .scaleEffect(mascotPulse)

                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 180, height: 180)
                    .wsBobbing(amount: 6, duration: 2.6)
            }

            VStack(spacing: 8) {
                Text(casualGreeting)
                    .font(WSFont.headline(13, weight: .black))
                    .foregroundStyle(WSColor.duoGreen)
                    .textCase(.uppercase)
                    .tracking(0.8)

                // Bold Nunito Black headline — solid green on the verb,
                // with a hand-drawn squiggly underline under it (matching
                // the desktop hero accent pattern).
                ZStack(alignment: .bottom) {
                    Text("What shall we ")
                        .font(WSFont.headline(32, weight: .black))
                        .foregroundStyle(WSColor.duoText)
                    +
                    Text("learn")
                        .font(WSFont.headline(32, weight: .black))
                        .foregroundStyle(WSColor.duoGreen)
                    +
                    Text("?")
                        .font(WSFont.headline(32, weight: .black))
                        .foregroundStyle(WSColor.duoText)
                }

                // Hand-drawn underline accent — only sits beneath "learn"
                WSSquigglyUnderline(color: WSColor.duoGreen.opacity(0.85), lineWidth: 3.5)
                    .frame(width: 96, height: 8)
                    .offset(y: -4)
            }
            .multilineTextAlignment(.center)

            Button {
                Haptics.medium()
                selectedTab = .study
            } label: {
                Label("Let's go!", systemImage: "sparkles")
            }
            .buttonStyle(WSDuoSuccessButtonStyle())
            .padding(.horizontal, 18)
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 6)
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
                color: WSColor.duoPurple,
                darkColor: WSColor.duoPurpleDark
            ) { selectedTab = .study }
            .wsStaggerEntry(0, unit: 0.08)

            chunkyAction(
                title: "Games",
                subtitle: "Play & blast",
                icon: "gamecontroller.fill",
                mascot: "mascot-dance",
                color: WSColor.duoOrange,
                darkColor: WSColor.duoOrangeDark
            ) { selectedTab = .games }
            .wsStaggerEntry(1, unit: 0.08)

            chunkyAction(
                title: "Focus",
                subtitle: "Block & study",
                icon: "shield.lefthalf.filled",
                mascot: "mascot-study",
                color: WSColor.duoGreen,
                darkColor: WSColor.duoGreenDark
            ) { selectedTab = .focus }
            .wsStaggerEntry(2, unit: 0.08)

            chunkyAction(
                title: "Library",
                subtitle: "Your shelf",
                icon: "books.vertical.fill",
                mascot: "mascot-laptop",
                color: WSColor.duoBlue,
                darkColor: WSColor.duoBlueDark
            ) { selectedTab = .library }
            .wsStaggerEntry(3, unit: 0.08)
        }
    }

    private func chunkyAction(title: String, subtitle: String, icon: String, mascot: String,
                              color: Color, darkColor: Color, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            ZStack(alignment: .topTrailing) {
                color

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
                        Image(systemName: icon)
                            .font(.system(size: 18, weight: .heavy))
                            .foregroundStyle(.white)
                    }
                    Text(title)
                        .font(WSFont.headline(22, weight: .black))
                        .foregroundStyle(.white)
                    Text(subtitle)
                        .font(WSFont.headline(12, weight: .black))
                        .foregroundStyle(.white.opacity(0.85))
                }
                .padding(14)
            }
            .frame(height: 150)
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .wsChunkyCard(
                cornerRadius: 22,
                horizontalPadding: 0,
                verticalPadding: 0,
                lipHeight: 6,
                accent: darkColor
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
                        .font(WSFont.headline(19, weight: .black))
                        .foregroundStyle(WSColor.duoText)
                    Spacer()
                    Button {
                        Haptics.light()
                        selectedTab = .library
                    } label: {
                        HStack(spacing: 4) {
                            Text("View all")
                                .font(WSFont.headline(12, weight: .black))
                            Image(systemName: "chevron.right")
                                .font(.system(size: 11, weight: .heavy))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(WSColor.duoBlue)
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
                item.kind.tint

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
                            .font(WSFont.headline(9, weight: .black))
                            .tracking(0.6)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Capsule().fill(.white.opacity(0.22)))
                    }

                    Text(item.title)
                        .font(WSFont.headline(15, weight: .black))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    if let subtitle = item.subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .font(WSFont.sans(11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.85))
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                    Text(relativeDate(item.lastOpenedAt ?? item.createdAt))
                        .font(WSFont.sans(11, weight: .bold))
                        .foregroundStyle(.white.opacity(0.80))
                }
                .padding(14)
            }
            .frame(width: 210, height: 160)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
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
                color: WSColor.duoOrange,
                darkColor: WSColor.duoOrangeDark,
                icon: "flame.fill",
                value: "\(streak?.currentStreak ?? 0)",
                title: "Streak",
                subtitle: (streak?.currentStreak ?? 0) == 1 ? "day" : "days",
                action: { showStreakSheet = true }
            )
            chunkyStat(
                color: WSColor.duoGreen,
                darkColor: WSColor.duoGreenDark,
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
                color: WSColor.duoPurple,
                darkColor: WSColor.duoPurpleDark,
                icon: "rosette",
                value: "\(AchievementCatalog.currentLevel(forXP: totalXP).level)",
                title: "Level",
                subtitle: AchievementCatalog.currentLevel(forXP: totalXP).name,
                action: { showAchievementsSheet = true }
            )
        }
    }

    private func chunkyStat(color: Color, darkColor: Color, icon: String,
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
                        .font(WSFont.headline(11, weight: .black))
                        .foregroundStyle(.white.opacity(0.92))
                        .textCase(.uppercase)
                        .tracking(0.4)
                }
                Text(value)
                    .font(WSFont.headline(32, weight: .black))
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Text(subtitle)
                    .font(WSFont.sans(11, weight: .bold))
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
            .background(color)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .wsChunkyCard(
                cornerRadius: 18,
                horizontalPadding: 0,
                verticalPadding: 0,
                lipHeight: 5,
                accent: darkColor
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
                        .fill(WSColor.duoOrange)
                        .frame(width: 44, height: 44)
                    Image(systemName: "star.circle.fill")
                        .foregroundStyle(.white)
                        .font(.system(size: 22, weight: .heavy))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Achievements")
                        .font(WSFont.headline(16, weight: .black))
                        .foregroundStyle(WSColor.duoText)
                    Text("\(unlockedCount) of \(totalCount) unlocked · keep collecting!")
                        .font(WSFont.sans(11, weight: .bold))
                        .foregroundStyle(WSColor.duoText.opacity(0.55))
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
                    .foregroundStyle(WSColor.duoBorder)
            }
            .padding(12)
            .frame(maxWidth: .infinity)
            .wsChunkyCard(
                cornerRadius: 18,
                horizontalPadding: 0,
                verticalPadding: 0,
                lipHeight: 5,
                accent: WSColor.duoOrange
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    private func miniBadge(badge: Achievement) -> some View {
        let unlocked = session.unlockedBadgeIds.contains(badge.id)
        return ZStack {
            Circle()
                .fill(unlocked
                      ? AnyShapeStyle(badge.rarity.color)
                      : AnyShapeStyle(WSColor.duoSurface))
                .frame(width: 30, height: 30)
                .overlay(Circle().stroke(Color.white, lineWidth: 2))
            Image(systemName: unlocked ? badge.category.icon : "lock.fill")
                .foregroundStyle(unlocked ? .white : WSColor.duoBorder)
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
                    .foregroundStyle(WSColor.duoBlue)
                Text("Also on desktop")
                    .font(WSFont.headline(15, weight: .black))
                    .foregroundStyle(WSColor.duoText)
                Spacer()
                Text("Web only")
                    .font(WSFont.headline(11, weight: .black))
                    .foregroundStyle(WSColor.duoBlue)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(WSColor.duoBlueLight))
            }

            HStack(spacing: 10) {
                desktopFeatureTile(
                    title: "Essay Analyzer",
                    blurb: "Professor-style feedback + rubric",
                    imageName: "screenshot-analyse",
                    color: WSColor.duoPurple,
                    url: "https://writescholar.com/analysis"
                )
                desktopFeatureTile(
                    title: "Citation Finder",
                    blurb: "APA · MLA · Chicago · Harvard",
                    imageName: "screenshot-citations",
                    color: WSColor.duoGreen,
                    url: "https://writescholar.com/tools/citation-generator"
                )
            }
        }
        .wsChunkyCard(accent: WSColor.duoBlue)
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
                }
                .frame(height: 72)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(WSColor.duoBorder, lineWidth: 1)
                )

                Text(title)
                    .font(WSFont.headline(13, weight: .black))
                    .foregroundStyle(WSColor.duoText)

                Text(blurb)
                    .font(WSFont.sans(11, weight: .semibold))
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(spacing: 4) {
                    Text("Open on web")
                        .font(WSFont.headline(11, weight: .black))
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 9, weight: .black))
                }
                .foregroundStyle(color)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(WSColor.duoSurface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(WSColor.duoBorder, lineWidth: 1)
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
