//
//  HistorySheet.swift
//  WriteScholar
//
//  Tap the history button on Home -> this sheet pops up with a flat
//  reverse-chronological log of every recent thing the user did on
//  this device. No backend calls -- just reads `DailyGoalStore.history`
//  and projects the per-day entries into a Today / Yesterday / Earlier
//  timeline.
//
//  Sections (top -> bottom):
//
//    1. Hero strip   -- "Today" XP earned + entry count.
//    2. Timeline     -- Bucketed (Today / Yesterday / This week / Earlier),
//                       each row shows activity icon, title, time-ago,
//                       and the XP awarded (with a "capped" pill if the
//                       row earned 0 XP because of the daily cap).
//    3. Empty state  -- Mascot + "Start studying and your activity will
//                       show up here."
//
//  Cap-aware: rows that hit the per-activity daily cap show "capped" +
//  the XP is rendered as `+0 XP` rather than hidden, so the user can
//  see *why* their goal didn't move on the last attempt.
//

import SwiftUI

struct HistorySheet: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var goal = DailyGoalStore.shared

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    WSChunkyRibbon(color: WSColor.duoBlue)
                    if flattenedEntries.isEmpty {
                        emptyState
                    } else {
                        listBody
                    }
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    WSKicker(text: "Recent activity")
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .font(WSFont.sans(15, weight: .heavy))
                        .foregroundStyle(WSColor.purpleInk)
                }
            }
        }
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 18) {
            Spacer()
            WSMascotHero(asset: "mascot-thinking", size: 120, haloTint: WSColor.lime)
            Text("Nothing here yet")
                .font(WSFont.headline(24, weight: .black))
                .foregroundStyle(WSColor.foreground)
            Text("Finish a quiz, play a game or make a study pack and it shows up here.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
    }

    // MARK: - Body

    private var listBody: some View {
        ScrollView {
            VStack(spacing: 14) {
                heroStrip

                ForEach(groupedSections, id: \.title) { section in
                    sectionHeader(section.title)
                    VStack(spacing: 8) {
                        ForEach(section.entries) { entry in
                            row(for: entry)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
    }

    private var heroStrip: some View {
        HStack(spacing: 10) {
            heroTile(value: "+\(goal.todayXP)", label: "XP today", color: WSColor.duoGreen)
            heroTile(value: "\(goal.todayLog.entries.count)", label: "Activities today", color: WSColor.duoOrange)
        }
    }

    private func heroTile(value: String, label: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(WSFont.headline(24, weight: .black))
                .foregroundStyle(color)
            Text(label)
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.foregroundMuted)
                .textCase(.uppercase)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(
            cornerRadius: 14,
            horizontalPadding: 12,
            verticalPadding: 12,
            lipHeight: 4,
            accent: color
        )
    }

    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title.uppercased())
                .wsEyebrow()
                .foregroundStyle(WSColor.foregroundMuted)
            Spacer()
        }
        .padding(.top, 10)
        .padding(.bottom, 0)
    }

    private func row(for entry: DailyGoalStore.DayLog.Entry) -> some View {
        let activity = entry.activity
        let nominal = activity.xp
        let capped = entry.xp == 0 && nominal > 0   // earned nothing despite a non-zero base

        return HStack(spacing: 14) {
            Image(systemName: activity.icon)
                .font(.system(size: 16, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 42, height: 42)
                .wsStickerCircle(fill: WSStickerTint.face(for: activityTint(activity)))

            VStack(alignment: .leading, spacing: 2) {
                Text(entry.title ?? activity.label)
                    .font(WSFont.headline(16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(2)
                if let sub = entry.subtitle, !sub.isEmpty {
                    Text(sub)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .lineLimit(1)
                } else if entry.title != nil {
                    Text(activity.label)
                        .wsBody(.caption, weight: .semibold)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("+\(entry.xp) XP")
                    .font(WSFont.headline(13, weight: .black))
                    .foregroundStyle(entry.xp > 0 ? WSColor.inkText : WSColor.foregroundMuted)
                    .padding(.horizontal, entry.xp > 0 ? 8 : 0)
                    .padding(.vertical, entry.xp > 0 ? 2 : 0)
                    .background(Capsule().fill(entry.xp > 0 ? WSColor.lime : .clear))
                    .overlay(Capsule().strokeBorder(entry.xp > 0 ? WSColor.ink : .clear, lineWidth: 1.5))
                if capped {
                    Text("DAILY CAP")
                        .font(WSFont.sans(9, weight: .black))
                        .foregroundStyle(WSColor.inkText)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(WSColor.orange))
                }
                Text(timeAgo(entry.at))
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
        }
        .padding(12)
        .wsSticker(radius: 18, depth: 3)
    }

    /// Per-activity tint using Duolingo palette colors.
    private func activityTint(_ activity: DailyGoalStore.Activity) -> Color {
        switch activity {
        case .studyPackGenerated, .lessonRead: return WSColor.duoPurple
        case .quizCompleted, .quizPerfectScore: return WSColor.duoBlue
        case .flashcardsReviewed:               return WSColor.duoPurple
        case .craterBlastPlayed:                return WSColor.duoRed
        case .wordTowerPlayed:                  return WSColor.duoGreen
        case .wordBlitzPlayed:                  return WSColor.duoBlue
        case .memoryMatchPlayed:                return WSColor.duoPurple
        case .quizRunPlayed:                    return WSColor.duoYellowDark
        case .focusUnlock:                      return WSColor.duoOrange
        case .dailyOpen:                        return WSColor.foregroundMuted
        }
    }

    // MARK: - Grouping

    private struct Section { let title: String; let entries: [DailyGoalStore.DayLog.Entry] }

    /// Buckets all entries into Today / Yesterday / This week / Earlier
    /// so the timeline reads at a glance instead of being a flat dump.
    private var groupedSections: [Section] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        let yesterday = cal.date(byAdding: .day, value: -1, to: today)!
        let weekAgo  = cal.date(byAdding: .day, value: -7, to: today)!

        var todayItems: [DailyGoalStore.DayLog.Entry] = []
        var yItems:     [DailyGoalStore.DayLog.Entry] = []
        var weekItems:  [DailyGoalStore.DayLog.Entry] = []
        var earlier:    [DailyGoalStore.DayLog.Entry] = []

        for entry in flattenedEntries {
            let day = cal.startOfDay(for: entry.at)
            if day == today        { todayItems.append(entry) }
            else if day == yesterday { yItems.append(entry) }
            else if day > weekAgo    { weekItems.append(entry) }
            else                     { earlier.append(entry) }
        }

        var sections: [Section] = []
        if !todayItems.isEmpty { sections.append(Section(title: "Today",     entries: todayItems)) }
        if !yItems.isEmpty     { sections.append(Section(title: "Yesterday", entries: yItems)) }
        if !weekItems.isEmpty  { sections.append(Section(title: "This week", entries: weekItems)) }
        if !earlier.isEmpty    { sections.append(Section(title: "Earlier",   entries: earlier)) }
        return sections
    }

    /// Newest entries first across every day in the goal-store history.
    /// We exclude `dailyOpen` because it'd otherwise dominate the top of
    /// the list every morning ("Daily check-in" 25 times in a row).
    private var flattenedEntries: [DailyGoalStore.DayLog.Entry] {
        goal.history
            .flatMap { $0.entries }
            .filter { $0.activity != .dailyOpen }
            .sorted { $0.at > $1.at }
    }

    // MARK: - Formatting

    private func timeAgo(_ date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        if interval < 60 { return "just now" }
        if interval < 3600 { return "\(Int(interval / 60))m" }
        if interval < 86_400 { return "\(Int(interval / 3600))h" }
        let days = Int(interval / 86_400)
        if days < 7 { return "\(days)d" }
        let f = DateFormatter()
        f.dateStyle = .medium
        return f.string(from: date)
    }
}

#Preview {
    HistorySheet()
}
