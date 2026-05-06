//
//  HomeTabView.swift
//  WriteScholar
//
//  The dashboard. Replaces the old Settings tab as the first bottom-bar
//  item. Settings now lives behind the profile avatar in the top-right.
//
//  Layout (top → bottom):
//    1. Top bar: search field + brand avatar (tap → SettingsSheet)
//    2. Greeting + animated streak flame card
//    3. "What shall we learn?" hero CTA
//    4. Quick-action grid (Paste / Upload / YouTube / Photo / Analyze / Study Pack)
//    5. Recent achievements row (horizontal scroll of unlocked badges)
//    6. Achievement progress card (XP + level)
//    7. Monthly usage card (analyses / study packs left this period)
//

import SwiftUI

struct HomeTabView: View {
    @EnvironmentObject var session: AuthSession
    @Binding var onboardingComplete: Bool
    /// Bound to the parent TabView so dashboard quick actions can hop tabs.
    @Binding var selectedTab: MainTabView.Tab

    @State private var searchText: String = ""
    @State private var showSettings = false
    @State private var streak: StreakAPI.StreakInfo?
    @State private var usage: UsageAPI.Usage?
    @State private var streakIsLoading = true
    @State private var usageIsLoading = true

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Soft brand orbs for depth
            Circle()
                .fill(WSColor.brandPrimary.opacity(0.10))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -160, y: -260)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xF59E0B).opacity(0.08))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: 200, y: 360)
                .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 22) {
                    topBar
                    greetingHeader
                    streakCard
                    quickStartHero
                    quickActionGrid
                    recentAchievementsBlock
                    levelProgressCard
                    usageCard
                    Spacer(minLength: 8)
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .scrollDismissesKeyboard(.interactively)
            .refreshable { await refreshAll() }
        }
        .task { await refreshAll() }
        .sheet(isPresented: $showSettings) {
            SettingsSheet(
                user: session.state.user ?? .localGuest,
                onboardingComplete: $onboardingComplete,
                onSignOut: { session.signOut() }
            )
            .presentationDetents([.large])
        }
    }

    // MARK: - Top bar

    private var topBar: some View {
        HStack(spacing: 12) {
            // Search field — placeholder for global search (recent packs / library)
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(WSColor.foregroundMuted)
                    .font(.system(size: 15, weight: .semibold))
                TextField("Search packs, analyses, decks…", text: $searchText)
                    .textFieldStyle(.plain)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                if !searchText.isEmpty {
                    Button {
                        searchText = ""
                        Haptics.light()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                Capsule()
                    .fill(WSColor.backgroundElevated)
                    .overlay(Capsule().stroke(WSColor.hairline, lineWidth: 1))
                    .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
            )

            // Profile avatar → SettingsSheet
            Button {
                Haptics.medium()
                showSettings = true
            } label: {
                ZStack {
                    Circle()
                        .fill(WSGradient.brand)
                        .frame(width: 42, height: 42)
                        .shadow(color: WSColor.brandPrimary.opacity(0.4), radius: 8, y: 3)
                    Text(initial)
                        .font(.system(size: 17, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Open settings")
        }
    }

    private var initial: String {
        let name = session.state.user?.displayName ?? "?"
        return String(name.first.map(String.init) ?? "?").uppercased()
    }

    // MARK: - Greeting

    private var greetingHeader: some View {
        let displayName = session.state.user?.displayName ?? "scholar"
        return HStack(alignment: .firstTextBaseline) {
            VStack(alignment: .leading, spacing: 4) {
                Text(timeBasedGreeting)
                    .wsBody(.small, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                Text("Hey \(displayName) 👋")
                    .wsHeadline(.large, weight: .semibold)
                    .foregroundStyle(WSColor.foreground)
            }
            Spacer()
        }
    }

    private var timeBasedGreeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12:  return "GOOD MORNING"
        case 12..<17: return "GOOD AFTERNOON"
        case 17..<22: return "GOOD EVENING"
        default:       return "STUDYING LATE?"
        }
    }

    // MARK: - Streak

    private var streakCard: some View {
        let count = streak?.currentStreak ?? 0
        let active = streak?.hasActivityToday ?? false
        return HStack(spacing: 16) {
            AnimatedFlame(active: active)
                .frame(width: 64, height: 64)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(count)-day streak")
                    .wsHeadline(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text(active ? "You're keeping it alive — nice." : "Open a study pack to keep your streak.")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)

                // Mini week-strip (last 7 days)
                HStack(spacing: 4) {
                    ForEach(0..<7, id: \.self) { i in
                        let activeOnDay = isDayActive(daysAgo: 6 - i)
                        Capsule()
                            .fill(activeOnDay ? Color(hex: 0xF59E0B) : WSColor.surface)
                            .frame(width: 14, height: 5)
                    }
                }
                .padding(.top, 6)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(WSColor.foregroundMuted)
                .font(.system(size: 12, weight: .bold))
        }
        .padding(14)
        .wsCard(elevation: .medium)
    }

    private func isDayActive(daysAgo: Int) -> Bool {
        guard let weekActivities = streak?.weekActivities else { return false }
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        let target = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date()) ?? Date()
        let key = f.string(from: target)
        return weekActivities.contains(key)
    }

    // MARK: - Quick start hero

    private var quickStartHero: some View {
        VStack(spacing: 10) {
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 130, height: 130)
                .shadow(color: WSColor.brandPrimary.opacity(0.30), radius: 18, y: 8)
            Text("What shall we learn?")
                .wsHeadline(.large, weight: .bold)
                .foregroundStyle(WSColor.foreground)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    // MARK: - Quick action grid

    private var quickActionGrid: some View {
        let cols = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]
        return LazyVGrid(columns: cols, spacing: 12) {
            quickActionCard(
                title: "Paste notes",
                icon: "doc.on.clipboard.fill",
                tint: WSColor.brandPrimary
            ) { selectedTab = .study }
            quickActionCard(
                title: "Analyze essay",
                icon: "doc.text.magnifyingglass",
                tint: Color(hex: 0xD946EF)
            ) { selectedTab = .analyze }
            quickActionCard(
                title: "Play a game",
                icon: "gamecontroller.fill",
                tint: Color(hex: 0xEF4444)
            ) { selectedTab = .games }
            quickActionCard(
                title: "Library",
                icon: "books.vertical.fill",
                tint: Color(hex: 0x6366F1)
            ) { selectedTab = .library }
        }
    }

    private func quickActionCard(title: String, icon: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            VStack(spacing: 10) {
                ZStack {
                    Circle()
                        .fill(tint.opacity(0.15))
                        .frame(width: 52, height: 52)
                    Image(systemName: icon)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(tint)
                }
                Text(title)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
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
        .buttonStyle(.plain)
    }

    // MARK: - Recent achievements (horizontal scroll)

    private var recentAchievementsBlock: some View {
        VStack(spacing: 10) {
            HStack {
                Text("Achievements")
                    .wsHeadline(.small, weight: .semibold)
                    .foregroundStyle(WSColor.foreground)
                Spacer()
                Text("\(session.unlockedBadgeIds.count) / \(AchievementCatalog.all.count)")
                    .wsBody(.caption, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(WSColor.surface))
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(displayBadges, id: \.id) { badge in
                        AchievementChip(
                            achievement: badge,
                            unlocked: session.unlockedBadgeIds.contains(badge.id),
                            progress: badge.progress(stats: session.achievementStats)
                        )
                    }
                }
            }
        }
    }

    /// Show unlocked first (newest first), then a few "next up" locked
    /// badges sorted by progress descending so the row tells a story.
    private var displayBadges: [Achievement] {
        let unlocked = AchievementCatalog.all.filter { session.unlockedBadgeIds.contains($0.id) }
        let lockedByProgress = AchievementCatalog.all
            .filter { !session.unlockedBadgeIds.contains($0.id) }
            .sorted { $0.progress(stats: session.achievementStats) > $1.progress(stats: session.achievementStats) }
        return Array(unlocked + lockedByProgress.prefix(8))
    }

    // MARK: - Level + XP card

    private var levelProgressCard: some View {
        let xp = AchievementCatalog.totalXP(unlockedIds: session.unlockedBadgeIds)
        let level = AchievementCatalog.currentLevel(forXP: xp)
        let progress = level.maxXP == .max ? 1.0 : min(1.0, Double(xp - level.minXP) / Double(max(1, level.maxXP - level.minXP)))
        let xpToNext = level.maxXP == .max ? 0 : (level.maxXP - xp)

        return HStack(spacing: 14) {
            ZStack {
                Circle()
                    .stroke(WSColor.surface, lineWidth: 6)
                    .frame(width: 64, height: 64)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(WSGradient.brand, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 64, height: 64)
                    .shadow(color: WSColor.brandPrimary.opacity(0.4), radius: 6, y: 1)
                Text("\(level.level)")
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(level.name)
                    .wsHeadline(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text("\(xp) XP")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.brandPrimary)
                if xpToNext > 0 {
                    Text("\(xpToNext) XP to \(nextLevelName(after: level.level))")
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                } else {
                    Text("Top tier — all done!")
                        .wsBody(.caption)
                        .foregroundStyle(Color(hex: 0xF59E0B))
                }
            }
            Spacer()
        }
        .padding(14)
        .wsCard(elevation: .low)
    }

    private func nextLevelName(after level: Int) -> String {
        AchievementCatalog.levels.first(where: { $0.level == level + 1 })?.name ?? "next"
    }

    // MARK: - Usage card

    private var usageCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "chart.bar.xaxis")
                    .foregroundStyle(WSColor.brandPrimary)
                Text("This month")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Spacer()
                if let usage = usage {
                    Text("Resets in \(usage.daysUntilReset)d")
                        .wsBody(.caption, weight: .semibold)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(WSColor.surface))
                }
            }

            if usageIsLoading {
                HStack {
                    ProgressView().controlSize(.small)
                    Text("Loading…")
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                .padding(.vertical, 4)
            } else if let usage = usage {
                if usage.isPaid {
                    usageRow(label: "Combined actions",
                             used: usage.combinedActionsUsed ?? 0,
                             remaining: usage.combinedActionsRemaining ?? 0,
                             color: WSColor.brandPrimary)
                } else {
                    usageRow(label: "Analyses", used: usage.documentsAnalyzed,    remaining: usage.analysesRemaining,    color: Color(hex: 0xD946EF))
                    usageRow(label: "Study packs", used: usage.studyPacksGenerated, remaining: usage.studyPacksRemaining, color: WSColor.brandPrimary)
                    usageRow(label: "Citations", used: usage.citationSearchesUsed, remaining: usage.citationsRemaining,  color: Color(hex: 0xF59E0B))
                }
                if !usage.isPaid {
                    Button {
                        Haptics.medium()
                        showSettings = true
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "crown.fill")
                            Text("Upgrade to Pro")
                            Spacer()
                            Image(systemName: "chevron.right")
                        }
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(
                            Capsule()
                                .fill(LinearGradient(colors: [Color(hex: 0xF59E0B), Color(hex: 0xEAB308)],
                                                     startPoint: .leading, endPoint: .trailing))
                                .shadow(color: Color(hex: 0xF59E0B).opacity(0.4), radius: 8, y: 3)
                        )
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 4)
                }
            } else {
                Text("Couldn't load usage. Pull to refresh.")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
        }
        .padding(14)
        .wsCard(elevation: .low)
    }

    private func usageRow(label: String, used: Int, remaining: Int, color: Color) -> some View {
        let total = used + remaining
        let frac = total > 0 ? Double(used) / Double(total) : 0
        return VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label)
                    .wsBody(.small, weight: .semibold)
                    .foregroundStyle(WSColor.foreground)
                Spacer()
                Text("\(used) / \(total == 0 ? used : total)")
                    .wsBody(.caption, weight: .bold)
                    .foregroundStyle(color)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(WSColor.surface).frame(height: 6)
                    Capsule()
                        .fill(color)
                        .frame(width: max(6, geo.size.width * frac), height: 6)
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - Refresh

    private func refreshAll() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await refreshStreak() }
            group.addTask { await refreshUsage() }
            group.addTask { await session.refreshAchievements() }
        }
    }

    private func refreshStreak() async {
        // Skip API for offline guest sessions
        if session.state.user?.isLocalGuestAccount == true {
            streak = StreakAPI.StreakInfo(currentStreak: 0, longestStreak: 0, totalActivityDays: 0, hasActivityToday: false, weekActivities: [])
            streakIsLoading = false
            return
        }
        streakIsLoading = true
        do {
            let result = try await StreakAPI.fetch()
            streak = result
        } catch {
            // Keep last known value
        }
        streakIsLoading = false
    }

    private func refreshUsage() async {
        if session.state.user?.isLocalGuestAccount == true {
            usage = nil
            usageIsLoading = false
            return
        }
        usageIsLoading = true
        do {
            let result = try await UsageAPI.fetch()
            usage = result
        } catch {
            // Keep last known value
        }
        usageIsLoading = false
    }
}

// MARK: - Animated streak flame

private struct AnimatedFlame: View {
    let active: Bool
    @State private var pulse: CGFloat = 1.0

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: active
                            ? [Color(hex: 0xF59E0B).opacity(0.55), .clear]
                            : [Color(hex: 0x94A3B8).opacity(0.30), .clear],
                        center: .center, startRadius: 4, endRadius: 36
                    )
                )
                .scaleEffect(pulse)
                .blur(radius: 4)

            Image(systemName: "flame.fill")
                .font(.system(size: 38, weight: .black))
                .foregroundStyle(
                    active
                        ? LinearGradient(colors: [Color(hex: 0xFCD34D), Color(hex: 0xF59E0B), Color(hex: 0xEF4444)],
                                         startPoint: .top, endPoint: .bottom)
                        : LinearGradient(colors: [Color(hex: 0xCBD5E1), Color(hex: 0x94A3B8)],
                                         startPoint: .top, endPoint: .bottom)
                )
                .scaleEffect(pulse)
                .shadow(color: active ? Color(hex: 0xF59E0B).opacity(0.5) : .clear, radius: 6)
        }
        .onAppear {
            guard active else { return }
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                pulse = 1.12
            }
        }
    }
}

// MARK: - Achievement chip

private struct AchievementChip: View {
    let achievement: Achievement
    let unlocked: Bool
    let progress: Double

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(unlocked ? AnyShapeStyle(achievement.rarity.color) : AnyShapeStyle(WSColor.surface))
                    .frame(width: 58, height: 58)
                    .overlay(
                        Circle()
                            .stroke(achievement.rarity.color.opacity(unlocked ? 0.0 : 0.40), lineWidth: 1.5)
                    )
                    .shadow(color: unlocked ? achievement.rarity.color.opacity(0.5) : .clear, radius: 8, y: 3)

                Image(systemName: achievement.category.icon)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(unlocked ? .white : WSColor.foregroundMuted)

                if !unlocked && progress > 0 {
                    Circle()
                        .trim(from: 0, to: CGFloat(progress))
                        .stroke(achievement.rarity.color, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 58, height: 58)
                }
            }
            Text(achievement.name)
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.foreground)
                .lineLimit(1)
                .truncationMode(.tail)
                .frame(width: 76)
            Text(unlocked ? "+\(achievement.xp) XP" : achievement.conditionText)
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(unlocked ? achievement.rarity.color : WSColor.foregroundMuted)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(width: 76, height: 22)
        }
        .opacity(unlocked ? 1.0 : 0.85)
    }
}

#Preview {
    HomeTabView(
        onboardingComplete: .constant(true),
        selectedTab: .constant(.home)
    )
    .environmentObject(AuthSession())
}
