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

    @StateObject private var dailyGoal = DailyGoalStore.shared
    @ObservedObject private var library = LibraryStore.shared

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    greetingRow
                    dailyGoalCard
                    statChips
                    continueStudying
                    workOnCTA
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
        .task { await refreshAll() }
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

    // MARK: - Greeting row

    private var greetingRow: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(timeGreeting)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
                Text("\(firstName) 👋")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.foreground)
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
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Recent activity")

            Button {
                Haptics.medium()
                showSettings = true
            } label: {
                Circle()
                    .fill(WSColor.duoPurple)
                    .frame(width: 46, height: 46)
                    .overlay(
                        Text(initial)
                            .font(WSFont.headline(18, weight: .black))
                            .foregroundStyle(.white)
                    )
                    .shadow(color: WSColor.duoPurple.opacity(0.3), radius: 6, y: 3)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Open settings")
        }
        .padding(.top, 4)
    }

    // MARK: - Daily goal card

    private var dailyGoalCard: some View {
        let frac = dailyGoal.target.xp > 0
            ? min(1.0, Double(dailyGoal.todayXP) / Double(dailyGoal.target.xp))
            : 0
        return Button {
            Haptics.light()
            showDailyGoalSheet = true
        } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Daily goal")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.foregroundMuted)
                    Text("\(dailyGoal.todayXP) / \(dailyGoal.target.xp) XP")
                        .wsHeadline(.medium, weight: .black)
                        .foregroundStyle(WSColor.foreground)
                    WSProgressBar(fraction: frac, tint: WSColor.duoPurple, height: 12)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                WSMascotHero(asset: "mascot-study", size: 64, haloTint: WSColor.duoPurple)
            }
            .padding(18)
            .frame(maxWidth: .infinity)
            .wsChunkyCard(cornerRadius: 24)
        }
        .buttonStyle(.plain)
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
            .buttonStyle(.plain)

            Button { Haptics.light(); showStreakSheet = true } label: {
                WSStatChip(icon: "calendar",
                           value: "\(streak?.weekActivities.count ?? 0)",
                           label: "this week",
                           tint: WSColor.duoBlue)
            }
            .buttonStyle(.plain)

            Button { Haptics.light(); showAchievementsSheet = true } label: {
                WSStatChip(icon: "bolt.fill",
                           value: "\(totalXP)",
                           label: "total XP",
                           tint: WSColor.duoPurple)
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Continue studying

    @ViewBuilder
    private var continueStudying: some View {
        let recent = Array(library.items
            .sorted { ($0.lastOpenedAt ?? $0.createdAt) > ($1.lastOpenedAt ?? $1.createdAt) }
            .prefix(4))

        if !recent.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                WSSectionHeader(title: "Continue studying",
                                actionTitle: "View all",
                                action: { Haptics.light(); onRoute(.library) })
                ForEach(recent) { item in
                    Button {
                        Haptics.medium()
                        onRoute(.library)
                    } label: {
                        WSListRowCard(icon: item.kind.icon,
                                      iconTint: item.kind.tint,
                                      title: item.title,
                                      subtitle: item.subtitle ?? relativeDate(item.lastOpenedAt ?? item.createdAt))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - "What would you like to work on?" CTA

    private var workOnCTA: some View {
        Button {
            Haptics.medium()
            onOpenToolPicker()
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(WSColor.duoPurple.opacity(0.15))
                        .frame(width: 48, height: 48)
                    Image(systemName: "lightbulb.fill")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(WSColor.duoPurple)
                }
                VStack(alignment: .leading, spacing: 3) {
                    Text("What would you like to work on?")
                        .wsBody(.large, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text("Pick a tool to get started")
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer(minLength: 8)
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(WSColor.duoPurple)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .wsChunkyCard(cornerRadius: 22)
        }
        .buttonStyle(.plain)
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
