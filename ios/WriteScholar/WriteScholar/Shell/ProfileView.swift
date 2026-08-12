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
    /// The top level uses a sentinel max (Int.max) — treat it as "maxed"
    /// so the XP line doesn't render 9,223,372,036,854,775,807.
    private var isMaxLevel: Bool { level.maxXP - level.minXP > 500_000 || level.maxXP <= level.minXP }
    private var levelFraction: Double {
        if isMaxLevel { return 1 }
        let span = max(1, level.maxXP - level.minXP)
        return min(1, max(0, Double(totalXP - level.minXP) / Double(span)))
    }
    /// First four catalog badges with their real earned state (locked
    /// badges render as locked hexagons, not falsely earned).
    private var displayBadges: [Achievement] {
        Array(AchievementCatalog.all.prefix(4))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                header.wsStaggerEntry(0)
                achievementsCard.wsStaggerEntry(1)
                settingsList.wsStaggerEntry(2)
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
                .fill(.white)
                .frame(width: 88, height: 88)
                .overlay(
                    WSAnimatedImage(name: "mascot-study", ext: "webp")
                        .frame(width: 72, height: 72)
                        .clipShape(Circle())
                )
                .shadow(color: Color.black.opacity(0.15), radius: 10, y: 5)

            Text(user.displayName)
                .wsHeadline(.medium, weight: .black)
                .foregroundStyle(.white)

            Text("Level \(level.level) · \(level.name)")
                .font(WSFont.sans(12, weight: .black))
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 5)
                .background(Capsule().fill(.white.opacity(0.22)))

            VStack(spacing: 6) {
                HStack {
                    Text("\(formatted(totalXP)) XP")
                        .wsBody(.small, weight: .black)
                        .foregroundStyle(.white)
                    Spacer()
                    Text(isMaxLevel ? "Max level" : "\(formatted(totalXP)) / \(formatted(level.maxXP))")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(.white.opacity(0.9))
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(.white.opacity(0.25)).frame(height: 12)
                        Capsule().fill(.white)
                            .frame(width: max(12, geo.size.width * levelFraction), height: 12)
                    }
                }
                .frame(height: 12)
            }
            .padding(.horizontal, 24)
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 30)
        .padding(.horizontal, 16)
        .background(WSGradient.brand)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .shadow(color: WSColor.duoPurple.opacity(0.3), radius: 16, y: 8)
    }

    private func formatted(_ n: Int) -> String {
        let f = NumberFormatter(); f.numberStyle = .decimal
        return f.string(from: NSNumber(value: n)) ?? "\(n)"
    }

    // MARK: - Achievements

    private var achievementsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            WSSectionHeader(title: "Achievements",
                            actionTitle: "View all",
                            action: { Haptics.light(); showAchievements = true })
            HStack(spacing: 14) {
                ForEach(Array(displayBadges.enumerated()), id: \.offset) { _, badge in
                    let earned = session.unlockedBadgeIds.contains(badge.id)
                    Button {
                        Haptics.light()
                        showAchievements = true
                    } label: {
                        WSHexBadge(icon: badge.category.icon,
                                   tint: badge.rarity.color,
                                   earned: earned,
                                   size: 58)
                    }
                    .buttonStyle(WSBouncyButtonStyle())
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
            }.buttonStyle(WSBouncyButtonStyle())

            Button { Haptics.light(); showStreak = true } label: {
                WSListRowCard(icon: "clock.fill", iconTint: WSColor.duoOrange,
                              title: "Study streak") {
                    Text("\(streak?.currentStreak ?? 0) days 🔥")
                        .wsBody(.small, weight: .black)
                        .foregroundStyle(WSColor.duoOrange)
                }
            }.buttonStyle(WSBouncyButtonStyle())

            Button { Haptics.light(); showSettings = true } label: {
                WSListRowCard(icon: "gearshape.fill", iconTint: WSColor.foregroundMuted, title: "Settings")
            }.buttonStyle(WSBouncyButtonStyle())

            Button {
                Haptics.light()
                if let u = URL(string: "https://writescholar.com/help") { UIApplication.shared.open(u) }
            } label: {
                WSListRowCard(icon: "questionmark.circle.fill", iconTint: WSColor.duoGreen, title: "Help & support")
            }.buttonStyle(WSBouncyButtonStyle())
        }
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
