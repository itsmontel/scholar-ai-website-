//
//  ProfileView.swift
//  WriteScholar
//
//  The "Profile" tab (prototype screen #12): purple gradient header with
//  avatar, level + XP bar; an achievements row; and a settings list. Pulls
//  real level/XP/badges from AchievementCatalog + the AuthSession, and opens
//  the existing detail sheets.
//

import SwiftUI

struct ProfileView: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    @EnvironmentObject var session: AuthSession

    @State private var streak: StreakAPI.StreakInfo?
    @State private var showAchievements = false
    @State private var showStreak = false
    @State private var showSettings = false
    @State private var showHistory = false

    private var totalXP: Int { AchievementCatalog.totalXP(unlockedIds: session.unlockedBadgeIds) }
    private var level: (level: Int, name: String, minXP: Int, maxXP: Int) {
        AchievementCatalog.currentLevel(forXP: totalXP)
    }
    private var levelFraction: Double {
        let span = max(1, level.maxXP - level.minXP)
        return min(1, max(0, Double(totalXP - level.minXP) / Double(span)))
    }
    private var displayBadges: [Achievement] {
        let unlocked = AchievementCatalog.all.filter { session.unlockedBadgeIds.contains($0.id) }
        return Array((unlocked.isEmpty ? AchievementCatalog.all : unlocked).prefix(5))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                header
                achievementsCard
                settingsList
                signOutButton
            }
            .padding(20)
        }
        .background(WSColor.background.ignoresSafeArea())
        .task { await loadStreak() }
        .sheet(isPresented: $showAchievements) {
            AchievementsGallerySheet(unlocked: session.unlockedBadgeIds, stats: session.achievementStats)
        }
        .sheet(isPresented: $showStreak) {
            StreakInsightsSheet(streak: streak, stats: session.achievementStats)
        }
        .sheet(isPresented: $showHistory) {
            HistorySheet().presentationDetents([.large, .medium])
        }
        .sheet(isPresented: $showSettings) {
            SettingsSheet(user: user, onboardingComplete: $onboardingComplete, onSignOut: onSignOut)
                .presentationDetents([.large])
        }
    }

    // MARK: - Gradient header

    private var header: some View {
        VStack(spacing: 12) {
            Circle()
                .fill(.white.opacity(0.25))
                .frame(width: 84, height: 84)
                .overlay(
                    Text(initials).wsHeadline(.medium, weight: .black).foregroundStyle(.white)
                )
            Text(user.displayName)
                .wsHeadline(.medium, weight: .black)
                .foregroundStyle(.white)
            Text("Level \(level.level) · \(level.name)")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(.white.opacity(0.9))

            VStack(spacing: 5) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(.white.opacity(0.25)).frame(height: 10)
                        Capsule().fill(.white)
                            .frame(width: max(10, geo.size.width * levelFraction), height: 10)
                    }
                }
                .frame(height: 10)
                Text("\(totalXP) XP / \(level.maxXP)")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(.white.opacity(0.9))
            }
            .padding(.horizontal, 24)
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
        .padding(.horizontal, 16)
        .background(WSGradient.brand)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
    }

    // MARK: - Achievements

    private var achievementsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            WSSectionHeader(title: "Achievements",
                            actionTitle: "View all",
                            action: { Haptics.light(); showAchievements = true })
            HStack(spacing: 12) {
                ForEach(Array(displayBadges.enumerated()), id: \.offset) { _, badge in
                    ZStack {
                        Circle().fill(badge.rarity.color).frame(width: 46, height: 46)
                        Image(systemName: badge.category.icon)
                            .foregroundStyle(.white)
                            .font(.system(size: 18, weight: .bold))
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    // MARK: - Settings list

    private var settingsList: some View {
        VStack(spacing: 12) {
            Button { Haptics.light(); showHistory = true } label: {
                WSListRowCard(icon: "chart.bar.fill", iconTint: WSColor.duoBlue,
                              title: "Statistics", subtitle: "Your study insights")
            }.buttonStyle(.plain)

            Button { Haptics.light(); showStreak = true } label: {
                WSListRowCard(icon: "flame.fill", iconTint: WSColor.duoOrange,
                              title: "Study streak",
                              subtitle: "\(streak?.currentStreak ?? 0) day streak")
            }.buttonStyle(.plain)

            Button { Haptics.light(); showSettings = true } label: {
                WSListRowCard(icon: "gearshape.fill", iconTint: WSColor.foregroundMuted, title: "Settings")
            }.buttonStyle(.plain)

            Button {
                Haptics.light()
                if let u = URL(string: "https://writescholar.com/help") { UIApplication.shared.open(u) }
            } label: {
                WSListRowCard(icon: "questionmark.circle.fill", iconTint: WSColor.duoGreen, title: "Help & support")
            }.buttonStyle(.plain)
        }
    }

    private var signOutButton: some View {
        Button { onSignOut() } label: {
            Text("Sign out").frame(maxWidth: .infinity)
        }
        .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))
        .padding(.top, 6)
    }

    private var initials: String {
        String(user.displayName.prefix(1)).uppercased()
    }

    private func loadStreak() async {
        do { streak = try await StreakAPI.fetch() } catch { /* keep nil */ }
    }
}

#Preview {
    ProfileView(
        user: WSUser(
            id: "1", email: "you@school.edu", username: "you",
            firstName: "Ava", lastName: "Johnson",
            subscriptionPlan: "free", subscriptionStatus: "active",
            emailVerified: true, onboardingCompleted: true, welcomeTutorialCompleted: true
        ),
        onboardingComplete: .constant(true),
        onSignOut: {}
    )
    .environmentObject(AuthSession())
}
