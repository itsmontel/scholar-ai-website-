//
//  HomeTabView.swift
//  WriteScholar
//
//  Prototype dashboard (screen #1): a calm lavender page with —
//
//    • Greeting row — "Good evening, {name} 👋" + notification bell + avatar.
//    • Daily goal card — today's XP vs target with a progress bar + mascot.
//    • Stat chips — streak · this week · total XP.
//    • Continue studying — soft rows of recent library items.
//    • "What would you like to work on?" — opens the ⊕ tool picker.
//
//  Detail still lives one tap away in the existing sheets (Streak, Daily
//  Goal, Achievements, History, Settings).
//

import SwiftUI

struct HomeTabView: View {
    @EnvironmentObject var session: AuthSession
    @Binding var onboardingComplete: Bool
    /// Routes feature launches (Study Packs, Arcade, Focus, Library…) up to
    /// the shell, which decides whether to switch tab or present a screen.
    var onRoute: (AppRoute) -> Void = { _ in }
    /// Opens the ⊕ "what would you like to work on?" tool picker.
    var onOpenToolPicker: () -> Void = {}

    @State private var showSettings = false
    @State private var showStreakSheet = false
    @State private var showAchievementsSheet = false
    @State private var showDailyGoalSheet = false
    @State private var showHistorySheet = false
    @State private var celebrateGoalHit: Int = 0
    @State private var streak: StreakAPI.StreakInfo?
    @State private var hasUnseenActivity = false

    @StateObject private var dailyGoal = DailyGoalStore.shared
    @ObservedObject private var library = LibraryStore.shared

    /// Stamp for the bell's unread dot — set when the History sheet opens.
    private static let lastSeenKey = "ws.history.lastSeenAt"

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    greetingRow.wsStaggerEntry(0)
                    dailyGoalCard.wsStaggerEntry(1)
                    statChips.wsStaggerEntry(2)
                    continueStudying.wsStaggerEntry(3)
                    workOnCTA.wsStaggerEntry(4)
                    Spacer(minLength: 8)
                }
                .padding(.horizontal, 18)
                .padding(.top, 6)
                .padding(.bottom, 28)
            }
            .refreshable { await refreshAll() }

            WSConfettiView(trigger: $celebrateGoalHit)
                .allowsHitTesting(false)
        }
        .task {
            computeUnseenActivity()
            await refreshAll()
        }
        .onChange(of: dailyGoal.goalJustHit) { _, newValue in
            if newValue != nil {
                celebrateGoalHit += 1
                NotificationService.shared.refreshAll()
            }
        }
        .onChange(of: showHistorySheet) { _, open in
            if open {
                UserDefaults.standard.set(Date(), forKey: Self.lastSeenKey)
            } else {
                computeUnseenActivity()
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

    // MARK: - Greeting row

    private var greetingRow: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("\(timeGreeting) \(firstName) 👋")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                Text("Let's make today productive!")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            Button {
                Haptics.light()
                showHistorySheet = true
            } label: {
                Image(systemName: "bell.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(WSColor.duoPurple)
                    .frame(width: 44, height: 44)
                    .background(
                        Circle()
                            .fill(WSColor.backgroundElevated)
                            .shadow(color: Color.black.opacity(0.05), radius: 6, y: 2)
                    )
                    .overlay(alignment: .topTrailing) {
                        if hasUnseenActivity {
                            Circle()
                                .fill(WSColor.duoRed)
                                .frame(width: 10, height: 10)
                                .overlay(Circle().stroke(WSColor.backgroundElevated, lineWidth: 2))
                                .offset(x: -4, y: 4)
                        }
                    }
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Recent activity")

            Button {
                Haptics.medium()
                showSettings = true
            } label: {
                Circle()
                    .fill(WSColor.duoPurpleLight)
                    .frame(width: 46, height: 46)
                    .overlay(
                        WSAnimatedImage(name: "mascot-study", ext: "webp")
                            .frame(width: 38, height: 38)
                            .clipShape(Circle())
                    )
                    .overlay(Circle().stroke(WSColor.duoPurple.opacity(0.25), lineWidth: 1.5))
                    .shadow(color: WSColor.duoPurple.opacity(0.25), radius: 6, y: 3)
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Open settings")
        }
        .padding(.top, 4)
    }

    private func computeUnseenActivity() {
        let lastSeen = UserDefaults.standard.object(forKey: Self.lastSeenKey) as? Date ?? .distantPast
        let newest = dailyGoal.todayLog.entries.map(\.at).max() ?? .distantPast
        hasUnseenActivity = newest > lastSeen
    }

    // MARK: - Daily goal card

    private var dailyGoalCard: some View {
        let frac = dailyGoal.target.xp > 0
            ? min(1.0, Double(dailyGoal.todayXP) / Double(dailyGoal.target.xp))
            : 0
        // Purple gradient hero (mockup): all-white text, white progress
        // bar, mascot perched on the card's trailing edge.
        return Button {
            Haptics.light()
            showDailyGoalSheet = true
        } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Daily goal")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(Color.white.opacity(0.85))
                    Text("\(dailyGoal.todayXP) / \(dailyGoal.target.xp) XP")
                        .wsHeadline(.medium, weight: .black)
                        .foregroundStyle(.white)
                    WSProgressBar(fraction: frac,
                                  tint: .white,
                                  height: 12,
                                  showsShimmer: false,
                                  trackColor: Color.white.opacity(0.25))
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                WSAnimatedImage(name: "mascot-study", ext: "webp")
                    .frame(width: 84, height: 84)
                    .wsBobbing()
                    .offset(x: 4, y: 8)
            }
            .padding(18)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(WSGradient.brand)
                    .shadow(color: WSColor.duoPurple.opacity(0.35), radius: 16, y: 8)
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    // MARK: - Stat chips

    private var statChips: some View {
        HStack(spacing: 10) {
            Button { Haptics.light(); showStreakSheet = true } label: {
                WSStatChip(icon: "flame.fill",
                           value: "\(streak?.currentStreak ?? 0)",
                           label: "day streak",
                           tint: WSColor.duoOrange)
            }
            .buttonStyle(WSBouncyButtonStyle())

            Button { Haptics.light(); showDailyGoalSheet = true } label: {
                WSStatChip(icon: "clock.fill",
                           value: studyTimeLabel,
                           label: "study time",
                           tint: WSColor.duoBlue)
            }
            .buttonStyle(WSBouncyButtonStyle())

            Button { Haptics.light(); showAchievementsSheet = true } label: {
                WSStatChip(icon: "star.fill",
                           value: formatted(totalXP),
                           label: "XP earned",
                           tint: WSColor.duoYellowDark)
            }
            .buttonStyle(WSBouncyButtonStyle())
        }
    }

    /// Today's accumulated study time as "2h 15m" / "45m".
    private var studyTimeLabel: String {
        let secs = dailyGoal.todayStudySeconds
        let h = secs / 3600
        let m = (secs % 3600) / 60
        if h > 0 { return "\(h)h \(m)m" }
        return "\(m)m"
    }

    private func formatted(_ n: Int) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return f.string(from: NSNumber(value: n)) ?? "\(n)"
    }

    // MARK: - Continue studying

    @ViewBuilder
    private var continueStudying: some View {
        let recent = Array(library.items
            .sorted { ($0.lastOpenedAt ?? $0.createdAt) > ($1.lastOpenedAt ?? $1.createdAt) }
            .prefix(4))

        VStack(alignment: .leading, spacing: 12) {
            WSSectionHeader(title: "Continue studying",
                            actionTitle: "View all",
                            action: { Haptics.light(); onRoute(.library) })

            if recent.isEmpty {
                // First-run: friendly empty card instead of a vanished section.
                Button {
                    Haptics.medium()
                    onOpenToolPicker()
                } label: {
                    HStack(spacing: 14) {
                        WSAnimatedImage(name: "mascot-paper", ext: "webp")
                            .frame(width: 52, height: 52)
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Nothing here yet")
                                .wsBody(.large, weight: .bold)
                                .foregroundStyle(WSColor.foreground)
                            Text("Create your first study pack to get going")
                                .wsBody(.small)
                                .foregroundStyle(WSColor.foregroundMuted)
                        }
                        Spacer(minLength: 8)
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(WSColor.duoPurple)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .wsChunkyCard(cornerRadius: 20)
                }
                .buttonStyle(WSBouncyButtonStyle())
            } else {
                ForEach(recent) { item in
                    Button {
                        Haptics.medium()
                        library.markOpened(item.id)
                        library.pendingOpenItemID = item.id
                        onRoute(.library)
                    } label: {
                        WSListRowCard(icon: item.kind.icon,
                                      iconTint: item.kind.tint,
                                      title: item.title,
                                      subtitle: rowMeta(for: item)) {
                            if let progress = item.progress {
                                WSProgressRing(progress: progress,
                                               tint: item.kind.tint,
                                               size: 46, lineWidth: 5)
                            } else {
                                WSChevron()
                            }
                        }
                    }
                    .buttonStyle(WSBouncyButtonStyle())
                }
            }
        }
    }

    /// "Edited 2h ago · 45 cards" — relative recency + the item's first chip.
    private func rowMeta(for item: LibraryItem) -> String {
        var parts = ["Edited \(relativeDate(item.lastOpenedAt ?? item.createdAt))"]
        if let chip = item.chips.first {
            parts.append(chip.label)
        }
        return parts.joined(separator: " · ")
    }

    // MARK: - "What would you like to work on?" CTA

    private var workOnCTA: some View {
        // Mockup: copy on the left, glowing lightbulb illustration on the
        // right. Tapping opens the ⊕ tool picker.
        Button {
            Haptics.medium()
            onOpenToolPicker()
        } label: {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("What would you like to work on?")
                        .wsHeadline(.small, weight: .black)
                        .foregroundStyle(WSColor.foreground)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text("Pick a tool to get started")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer(minLength: 8)
                ZStack {
                    Circle()
                        .fill(WSColor.duoYellow.opacity(0.18))
                        .frame(width: 64, height: 64)
                    Circle()
                        .fill(WSColor.duoYellow.opacity(0.28))
                        .frame(width: 46, height: 46)
                    Image(systemName: "lightbulb.max.fill")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(WSColor.duoYellowDark)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .wsChunkyCard(cornerRadius: 22)
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    // MARK: - Derived values

    private var initial: String {
        let name = session.state.user?.displayName ?? "?"
        return String(name.prefix(1)).uppercased()
    }

    private var firstName: String {
        let name = session.state.user?.displayName ?? ""
        let f = name.split(separator: " ").first.map(String.init) ?? name
        return f.isEmpty || f == "?" ? "there" : f
    }

    private var timeGreeting: String {
        switch Calendar.current.component(.hour, from: Date()) {
        case 0..<12:  return "Good morning,"
        case 12..<17: return "Good afternoon,"
        default:      return "Good evening,"
        }
    }

    private var totalXP: Int {
        AchievementCatalog.totalXP(unlockedIds: session.unlockedBadgeIds)
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

    // MARK: - Refresh

    private func refreshAll() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await refreshStreak() }
            group.addTask { await session.refreshAchievements() }
            group.addTask { await LibraryStore.shared.syncFromBackend() }
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
            streak = try await StreakAPI.fetch()
        } catch {
            // Keep last known value
        }
    }
}

#Preview {
    HomeTabView(onboardingComplete: .constant(true))
        .environmentObject(AuthSession())
}
