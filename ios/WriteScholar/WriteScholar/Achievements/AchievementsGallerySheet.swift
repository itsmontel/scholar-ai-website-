//
//  AchievementsGallerySheet.swift
//  WriteScholar
//
//  Full-screen browser for the user's achievement collection. Opened
//  from the "View all" button on the Home tab achievements row.
//
//  Layout (top -> bottom):
//
//    1. Hero header        -- XP total, Level badge, % complete bar
//    2. Filter chips       -- All . Unlocked . Locked
//    3. Section list       -- One section per MobileGroup (Streaks /
//                             Study Packs / Quizzes / Games / Focus /
//                             Pro / Special / Getting Started). Each
//                             section: a section header + a 3-col grid
//                             of badge tiles.
//    4. Tap a tile         -- Pushes a detail sheet with the rule, XP,
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
                WSColor.duoSurface.ignoresSafeArea()

                VStack(spacing: 0) {
                    WSChunkyRibbon(color: WSColor.duoPurple)
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
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Your Badges")
                        .wsHeadline(.small, weight: .black)
                        .foregroundStyle(WSColor.duoText)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .font(WSFont.sans(15, weight: .bold))
                        .foregroundStyle(WSColor.duoPurple)
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
                WSLevelBadge(level: level.level, size: 64, tint: WSColor.duoPurple)
                VStack(alignment: .leading, spacing: 4) {
                    Text(level.name)
                        .wsHeadline(.medium, weight: .black)
                        .foregroundStyle(WSColor.duoText)
                    HStack(spacing: 6) {
                        WSGemChip(count: xp, icon: "bolt.fill", tint: WSColor.duoOrange)
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
                        .foregroundStyle(WSColor.duoGreen)
                }
                WSXPBar(xpInLevel: unlockedCount, xpForLevel: totalCount, tint: WSColor.duoGreen, height: 12, showsLabel: false)
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
                        .foregroundStyle(WSColor.duoOrange)
                }
                WSXPBar(xpInLevel: xpInLevel, xpForLevel: xpForLevel, tint: WSColor.duoOrange, height: 12, showsLabel: false)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 18, accent: WSColor.duoPurple)
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
                                    .fill(active ? Color.white.opacity(0.25) : WSColor.duoSurface)
                            )
                            .foregroundStyle(active ? .white : WSColor.foregroundMuted)
                    }
                    .foregroundStyle(active ? .white : WSColor.duoText)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(
                        Capsule()
                            .fill(active ? WSColor.duoPurple : WSColor.backgroundElevated)
                            .overlay(Capsule().stroke(active ? .clear : WSColor.duoBorder, lineWidth: 2))
                            .shadow(color: active ? WSColor.duoPurple.opacity(0.40) : .clear, radius: 8, y: 3)
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

    /// Maps rarity to Duolingo accent colors
    private static func rarityAccent(_ rarity: Achievement.Rarity) -> Color {
        switch rarity {
        case .common:    return WSColor.duoGreen
        case .uncommon:  return WSColor.duoBlue
        case .rare:      return WSColor.duoPurple
        case .epic:      return WSColor.duoOrange
        case .legendary: return WSColor.duoRed
        }
    }

    private func sectionBlock(group: Achievement.MobileGroup, items: [Achievement]) -> some View {
        let groupUnlocked = items.filter { unlocked.contains($0.id) }.count
        return VStack(alignment: .leading, spacing: 12) {
            // Colored pill header
            HStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: group.icon)
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(.white)
                    Text(group.label)
                        .font(.system(size: 14, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule().fill(group.tint)
                        .shadow(color: group.tint.opacity(0.35), radius: 4, y: 2)
                )

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

    /// Maps rarity to Duolingo accent colors
    private var rarityColor: Color {
        switch achievement.rarity {
        case .common:    return WSColor.duoGreen
        case .uncommon:  return WSColor.duoBlue
        case .rare:      return WSColor.duoPurple
        case .epic:      return WSColor.duoOrange
        case .legendary: return WSColor.duoRed
        }
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                // Outer ring
                Circle()
                    .fill(
                        unlocked
                            ? rarityColor
                            : WSColor.duoSurface
                    )
                    .frame(width: 64, height: 64)
                    .overlay(
                        Circle()
                            .stroke(
                                unlocked ? rarityColor.opacity(0.50) : WSColor.duoBorder,
                                lineWidth: unlocked ? 3 : 2
                            )
                    )
                    .shadow(color: unlocked ? rarityColor.opacity(0.45) : .clear, radius: 8, y: 3)

                Image(systemName: achievement.category.icon)
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(unlocked ? .white : WSColor.foregroundMuted)

                if !unlocked && progress > 0 {
                    Circle()
                        .trim(from: 0, to: max(0.001, min(1.0, CGFloat(progress))))
                        .stroke(rarityColor,
                                style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                        .frame(width: 64, height: 64)
                }

                if !unlocked {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 10, weight: .black))
                        .foregroundStyle(.white)
                        .padding(5)
                        .background(Circle().fill(Color(hex: 0x94A3B8)))
                        .offset(x: 22, y: 22)
                }
            }
            .frame(height: 70)

            Text(achievement.name)
                .font(.system(size: 11, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.duoText)
                .lineLimit(1)
                .truncationMode(.tail)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)

            Text(unlocked ? "+\(achievement.xp) XP" : achievement.conditionText)
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(unlocked ? rarityColor : WSColor.foregroundMuted)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity, minHeight: 24)
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 6)
        .frame(maxWidth: .infinity)
        .wsChunkyCard(
            cornerRadius: 16,
            horizontalPadding: 0,
            verticalPadding: 0,
            lipHeight: 4,
            accent: unlocked ? rarityColor : WSColor.duoBorder
        )
    }
}

// MARK: - Detail sheet

struct AchievementDetailSheet: View {
    let achievement: Achievement
    let isUnlocked: Bool
    let progress: Double

    @Environment(\.dismiss) private var dismiss

    /// Maps rarity to Duolingo accent colors
    private var rarityColor: Color {
        switch achievement.rarity {
        case .common:    return WSColor.duoGreen
        case .uncommon:  return WSColor.duoBlue
        case .rare:      return WSColor.duoPurple
        case .epic:      return WSColor.duoOrange
        case .legendary: return WSColor.duoRed
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.duoSurface.ignoresSafeArea()

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
                        .font(WSFont.sans(15, weight: .bold))
                        .foregroundStyle(WSColor.duoPurple)
                }
            }
        }
    }

    private var bigBadge: some View {
        ZStack {
            Circle()
                .fill(
                    isUnlocked
                        ? rarityColor
                        : WSColor.duoSurface
                )
                .frame(width: 140, height: 140)
                .overlay(
                    Circle().stroke(
                        isUnlocked ? rarityColor.opacity(0.50) : WSColor.duoBorder,
                        lineWidth: 4
                    )
                )
                .shadow(color: isUnlocked ? rarityColor.opacity(0.45) : .clear, radius: 22, y: 8)

            Image(systemName: achievement.category.icon)
                .font(.system(size: 56, weight: .heavy))
                .foregroundStyle(isUnlocked ? .white : WSColor.foregroundMuted)

            if isUnlocked {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 28, weight: .black))
                    .foregroundStyle(.white)
                    .padding(8)
                    .background(Circle().fill(WSColor.duoGreen))
                    .offset(x: 50, y: 50)
            } else {
                Image(systemName: "lock.fill")
                    .font(.system(size: 20, weight: .black))
                    .foregroundStyle(.white)
                    .padding(10)
                    .background(Circle().fill(Color(hex: 0x94A3B8)))
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
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 5)
                .background(Capsule().fill(rarityColor))

            Text(achievement.name)
                .wsHeadline(.large, weight: .black)
                .foregroundStyle(WSColor.duoText)
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
                    .foregroundStyle(rarityColor)
                Text("PROGRESS")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .tracking(0.7)
                    .foregroundStyle(WSColor.foregroundMuted)
                Spacer()
                Text("\(Int(progress * 100))%")
                    .font(.system(size: 12, weight: .black, design: .rounded))
                    .foregroundStyle(rarityColor)
            }
            WSXPBar(xpInLevel: Int(progress * 100), xpForLevel: 100, tint: rarityColor, height: 12, showsLabel: false)
            Text(achievement.conditionText)
                .wsBody(.small, weight: .semibold)
                .foregroundStyle(WSColor.duoText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: rarityColor)
    }

    private var rewardCard: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(WSColor.duoOrangeLight).frame(width: 44, height: 44)
                Image(systemName: "bolt.fill").foregroundStyle(WSColor.duoOrange).font(.system(size: 18, weight: .heavy))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(isUnlocked ? "Earned" : "Reward")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .tracking(0.5)
                    .foregroundStyle(WSColor.foregroundMuted)
                Text("+\(achievement.xp) XP")
                    .wsHeadline(.medium, weight: .black)
                    .foregroundStyle(WSColor.duoText)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: WSColor.duoOrange)
    }

    private var flavorCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "info.circle.fill")
                    .foregroundStyle(WSColor.duoBlue)
                Text("ABOUT")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .tracking(0.7)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Text(achievement.description)
                .wsBody(.medium)
                .foregroundStyle(WSColor.duoText)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: WSColor.duoBlue)
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
