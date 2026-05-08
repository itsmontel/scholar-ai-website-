//
//  AchievementsGallerySheet.swift
//  WriteScholar
//
//  Full-screen browser for the user's achievement collection. Opened
//  from the "View all" button on the Home tab achievements row.
//
//  Layout (top → bottom):
//
//    1. Hero header        — XP total, Level badge, % complete bar
//    2. Filter chips       — All · Unlocked · Locked
//    3. Section list       — One section per MobileGroup (Streaks /
//                             Study Packs / Quizzes / Games / Focus /
//                             Pro / Special / Getting Started). Each
//                             section: a section header + a 3-col grid
//                             of badge tiles.
//    4. Tap a tile         — Pushes a detail sheet with the rule, XP,
//                             progress, and a flavor description.
//

import SwiftUI

struct AchievementsGallerySheet: View {
    let unlocked: Set<String>
    let stats: AchievementStats

    @Environment(\.dismiss) private var dismiss

    @State private var filter: GalleryFilter = .all
    @State private var detailItem: Achievement? = nil

    enum GalleryFilter: String, CaseIterable, Identifiable {
        case all, unlocked, locked
        var id: String { rawValue }
        var label: String {
            switch self {
            case .all:      return "All"
            case .unlocked: return "Unlocked"
            case .locked:   return "Locked"
            }
        }
        var icon: String {
            switch self {
            case .all:      return "square.stack.3d.up.fill"
            case .unlocked: return "checkmark.seal.fill"
            case .locked:   return "lock.fill"
            }
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                WSGradient.heroBackdrop.ignoresSafeArea()

                // Decorative orbs
                Circle()
                    .fill(WSColor.brandPrimary.opacity(0.10))
                    .frame(width: 360, height: 360)
                    .blur(radius: 80)
                    .offset(x: -200, y: -300)
                    .ignoresSafeArea()
                Circle()
                    .fill(Color(hex: 0xF59E0B).opacity(0.10))
                    .frame(width: 320, height: 320)
                    .blur(radius: 80)
                    .offset(x: 200, y: 320)
                    .ignoresSafeArea()

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 22, pinnedViews: []) {
                        heroHeader
                        filterChips
                        sectionsList
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 14)
                    .padding(.bottom, 32)
                }
            }
            .navigationTitle("Achievements")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
            .sheet(item: $detailItem) { item in
                AchievementDetailSheet(
                    achievement: item,
                    isUnlocked: unlocked.contains(item.id),
                    progress: item.progress(stats: stats)
                )
                .presentationDetents([.medium, .large])
            }
        }
    }

    // MARK: - Hero header

    private var heroHeader: some View {
        let xp = AchievementCatalog.totalXP(unlockedIds: unlocked)
        let level = AchievementCatalog.currentLevel(forXP: xp)
        let unlockedCount = unlocked.intersection(Set(AchievementCatalog.all.map(\.id))).count
        let totalCount = AchievementCatalog.all.count
        let percent = Double(unlockedCount) / Double(max(1, totalCount))
        let xpInLevel = xp - level.minXP
        let xpForLevel = level.maxXP == .max ? max(1, xpInLevel) : (level.maxXP - level.minXP)

        return VStack(spacing: 16) {
            HStack(alignment: .top, spacing: 14) {
                WSLevelBadge(level: level.level, size: 64, tint: WSColor.brandPrimary)
                VStack(alignment: .leading, spacing: 4) {
                    Text(level.name)
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.foreground)
                    HStack(spacing: 6) {
                        WSGemChip(count: xp, icon: "bolt.fill", tint: Color(hex: 0xF59E0B))
                        Text("\(unlockedCount)/\(totalCount) badges")
                            .wsBody(.caption, weight: .bold)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                }
                Spacer(minLength: 0)
            }

            // Collection progress bar
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("COLLECTION")
                        .font(.system(size: 9, weight: .black, design: .rounded))
                        .tracking(0.7)
                        .foregroundStyle(WSColor.foregroundMuted)
                    Spacer()
                    Text("\(Int(percent * 100))%")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.brandPrimary)
                }
                WSXPBar(xpInLevel: unlockedCount, xpForLevel: totalCount, tint: WSColor.brandPrimary, height: 12, showsLabel: false)
            }

            // XP-to-next-level
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("LEVEL \(level.level) PROGRESS")
                        .font(.system(size: 9, weight: .black, design: .rounded))
                        .tracking(0.7)
                        .foregroundStyle(WSColor.foregroundMuted)
                    Spacer()
                    Text(level.maxXP == .max ? "Top tier" : "\(xp - level.minXP)/\(xpForLevel) XP")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(Color(hex: 0xF59E0B))
                }
                WSXPBar(xpInLevel: xpInLevel, xpForLevel: xpForLevel, tint: Color(hex: 0xF59E0B), height: 12, showsLabel: false)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 18, accent: WSColor.brandPrimary)
    }

    // MARK: - Filter chips

    private var filterChips: some View {
        HStack(spacing: 8) {
            ForEach(GalleryFilter.allCases) { f in
                let active = filter == f
                Button {
                    Haptics.selection()
                    withAnimation(.wsBouncePop) { filter = f }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: f.icon).font(.system(size: 11, weight: .bold))
                        Text(f.label)
                            .wsBody(.small, weight: .black)
                        Text("\(matchCount(f))")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(
                                Capsule()
                                    .fill(active ? Color.white.opacity(0.25) : WSColor.surface)
                            )
                            .foregroundStyle(active ? .white : WSColor.foregroundMuted)
                    }
                    .foregroundStyle(active ? .white : WSColor.foreground)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(
                        Capsule()
                            .fill(active ? AnyShapeStyle(WSColor.brandPrimary) : AnyShapeStyle(WSColor.backgroundElevated))
                            .overlay(Capsule().stroke(active ? .clear : WSColor.hairline, lineWidth: 1))
                            .shadow(color: active ? WSColor.brandPrimary.opacity(0.40) : .clear, radius: 8, y: 3)
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func matchCount(_ f: GalleryFilter) -> Int {
        switch f {
        case .all:      return AchievementCatalog.all.count
        case .unlocked: return unlocked.intersection(Set(AchievementCatalog.all.map(\.id))).count
        case .locked:   return AchievementCatalog.all.count - unlocked.intersection(Set(AchievementCatalog.all.map(\.id))).count
        }
    }

    // MARK: - Sections list

    private var sectionsList: some View {
        VStack(spacing: 22) {
            ForEach(Achievement.MobileGroup.allCases) { group in
                let items = filteredItems(for: group)
                if !items.isEmpty {
                    sectionBlock(group: group, items: items)
                }
            }
        }
    }

    private func filteredItems(for group: Achievement.MobileGroup) -> [Achievement] {
        let inGroup = AchievementCatalog.all.filter { $0.mobileGroup == group }
        switch filter {
        case .all:
            return inGroup
        case .unlocked:
            return inGroup.filter { unlocked.contains($0.id) }
        case .locked:
            return inGroup.filter { !unlocked.contains($0.id) }
        }
    }

    private func sectionBlock(group: Achievement.MobileGroup, items: [Achievement]) -> some View {
        let groupUnlocked = items.filter { unlocked.contains($0.id) }.count
        return VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(group.tint.opacity(0.16))
                        .frame(width: 28, height: 28)
                    Image(systemName: group.icon)
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(group.tint)
                }
                Text(group.label)
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
                Spacer()
                Text("\(groupUnlocked) / \(items.count)")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundStyle(group.tint)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(group.tint.opacity(0.13)))
            }

            let cols = [GridItem(.flexible(), spacing: 10),
                        GridItem(.flexible(), spacing: 10),
                        GridItem(.flexible(), spacing: 10)]
            LazyVGrid(columns: cols, spacing: 12) {
                ForEach(items) { item in
                    Button {
                        Haptics.medium()
                        detailItem = item
                    } label: {
                        AchievementTile(
                            achievement: item,
                            unlocked: unlocked.contains(item.id),
                            progress: item.progress(stats: stats)
                        )
                    }
                    .buttonStyle(WSBouncyButtonStyle())
                }
            }
        }
    }
}

// MARK: - Tile

struct AchievementTile: View {
    let achievement: Achievement
    let unlocked: Bool
    let progress: Double

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                // Halo when unlocked
                if unlocked {
                    Circle()
                        .fill(
                            RadialGradient(colors: [achievement.rarity.color.opacity(0.40), .clear],
                                           center: .center, startRadius: 6, endRadius: 50)
                        )
                        .frame(width: 90, height: 90)
                        .blur(radius: 6)
                }

                // Outer ring
                Circle()
                    .fill(
                        unlocked
                            ? AnyShapeStyle(LinearGradient(colors: [achievement.rarity.color, achievement.rarity.color.opacity(0.78)],
                                                           startPoint: .topLeading, endPoint: .bottomTrailing))
                            : AnyShapeStyle(WSColor.surface)
                    )
                    .frame(width: 64, height: 64)
                    .overlay(
                        Circle()
                            .stroke(unlocked ? .white.opacity(0.30) : achievement.rarity.color.opacity(0.35),
                                    lineWidth: unlocked ? 2 : 1.5)
                    )
                    .shadow(color: unlocked ? achievement.rarity.color.opacity(0.55) : .clear, radius: 8, y: 3)

                Image(systemName: achievement.category.icon)
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(unlocked ? .white : WSColor.foregroundMuted)

                if !unlocked && progress > 0 {
                    Circle()
                        .trim(from: 0, to: max(0.001, min(1.0, CGFloat(progress))))
                        .stroke(achievement.rarity.color,
                                style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 64, height: 64)
                }

                if !unlocked {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 10, weight: .black))
                        .foregroundStyle(.white)
                        .padding(5)
                        .background(Circle().fill(WSColor.foregroundMuted))
                        .offset(x: 22, y: 22)
                }
            }
            .frame(height: 70)

            Text(achievement.name)
                .font(.system(size: 11, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.foreground)
                .lineLimit(1)
                .truncationMode(.tail)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)

            Text(unlocked ? "+\(achievement.xp) XP" : achievement.conditionText)
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(unlocked ? achievement.rarity.color : WSColor.foregroundMuted)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity, minHeight: 24)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 6)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(unlocked ? achievement.rarity.color.opacity(0.30) : WSColor.hairline,
                                lineWidth: 1)
                )
                .shadow(color: unlocked ? achievement.rarity.color.opacity(0.18) : .black.opacity(0.04),
                        radius: 8, y: 3)
        )
    }
}

// MARK: - Detail sheet

struct AchievementDetailSheet: View {
    let achievement: Achievement
    let isUnlocked: Bool
    let progress: Double

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                WSGradient.heroBackdrop.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 18) {
                        bigBadge
                        headerInfo
                        if !isUnlocked { progressCard }
                        rewardCard
                        flavorCard
                        Spacer(minLength: 16)
                    }
                    .padding(.horizontal, 22)
                    .padding(.vertical, 18)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
        }
    }

    private var bigBadge: some View {
        ZStack {
            if isUnlocked {
                Circle()
                    .fill(
                        RadialGradient(colors: [achievement.rarity.color.opacity(0.45), .clear],
                                       center: .center, startRadius: 6, endRadius: 130)
                    )
                    .frame(width: 280, height: 280)
                    .blur(radius: 12)
            }

            Circle()
                .fill(
                    isUnlocked
                        ? AnyShapeStyle(LinearGradient(colors: [achievement.rarity.color, achievement.rarity.color.opacity(0.75)],
                                                       startPoint: .topLeading, endPoint: .bottomTrailing))
                        : AnyShapeStyle(WSColor.surface)
                )
                .frame(width: 140, height: 140)
                .overlay(
                    Circle().stroke(isUnlocked ? .white.opacity(0.40) : achievement.rarity.color.opacity(0.35), lineWidth: 3)
                )
                .shadow(color: isUnlocked ? achievement.rarity.color.opacity(0.55) : .clear, radius: 22, y: 8)

            Image(systemName: achievement.category.icon)
                .font(.system(size: 56, weight: .heavy))
                .foregroundStyle(isUnlocked ? .white : WSColor.foregroundMuted)

            if isUnlocked {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(.white)
                    .padding(8)
                    .background(Circle().fill(Color(hex: 0x10B981)))
                    .offset(x: 50, y: 50)
            } else {
                Image(systemName: "lock.fill")
                    .font(.system(size: 20, weight: .black))
                    .foregroundStyle(.white)
                    .padding(10)
                    .background(Circle().fill(WSColor.foregroundMuted))
                    .offset(x: 50, y: 50)
            }
        }
        .padding(.top, 8)
    }

    private var headerInfo: some View {
        VStack(spacing: 6) {
            Text(achievement.rarity.label.uppercased())
                .font(.system(size: 10, weight: .black, design: .rounded))
                .tracking(0.8)
                .foregroundStyle(achievement.rarity.color)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(Capsule().fill(achievement.rarity.color.opacity(0.16)))

            Text(achievement.name)
                .font(.system(size: 26, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.foreground)
                .multilineTextAlignment(.center)

            Text("Meet \(achievement.creatureName)")
                .wsBody(.caption, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
        }
    }

    private var progressCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "hourglass")
                    .foregroundStyle(achievement.rarity.color)
                Text("PROGRESS")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .tracking(0.7)
                    .foregroundStyle(WSColor.foregroundMuted)
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.system(size: 12, weight: .black, design: .rounded))
                    .foregroundStyle(achievement.rarity.color)
            }
            WSXPBar(xpInLevel: Int(progress * 100), xpForLevel: 100, tint: achievement.rarity.color, height: 12, showsLabel: false)
            Text(achievement.conditionText)
                .wsBody(.small, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: achievement.rarity.color)
    }

    private var rewardCard: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(Color(hex: 0xF59E0B).opacity(0.16)).frame(width: 44, height: 44)
                Image(systemName: "bolt.fill").foregroundStyle(Color(hex: 0xF59E0B)).font(.system(size: 18, weight: .heavy))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(isUnlocked ? "Earned" : "Reward")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .tracking(0.5)
                    .foregroundStyle(WSColor.foregroundMuted)
                Text("+\(achievement.xp) XP")
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: Color(hex: 0xF59E0B))
    }

    private var flavorCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(WSColor.foregroundMuted)
                Text("ABOUT")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .tracking(0.7)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Text(achievement.description)
                .wsBody(.medium)
                .foregroundStyle(WSColor.foreground)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .wsCard(elevation: .low)
    }
}

// MARK: - Preview

#Preview("Gallery (mostly locked)") {
    AchievementsGallerySheet(
        unlocked: ["first_login", "explorer", "study_pack_pioneer", "streak_starter", "crater_rookie"],
        stats: {
            var s = AchievementStats()
            s.studyPacksCount = 2
            s.longestStreak = 4
            s.craterBlastGames = 3
            s.quickReviewCount = 0
            return s
        }()
    )
}
