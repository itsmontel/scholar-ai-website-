//
//  DailyGoalSheet.swift
//  WriteScholar
//
//  Tap the daily-goal card on Home -> this sheet pops up with:
//
//    1. Hero ring     -- Big animated XP ring for today
//    2. Picker        -- Casual / Regular / Serious / Intense (chunky
//                        cards with emoji + blurb + XP target)
//    3. Today's log   -- Per-activity rows with the XP earned
//    4. 7-day strip   -- Mini bar chart of the past week's progress
//    5. How XP works  -- Cheat sheet showing what awards how much XP
//
//  All persistence flows through DailyGoalStore.
//

import SwiftUI

struct DailyGoalSheet: View {
    @ObservedObject var store: DailyGoalStore

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    ScrollView {
                        VStack(spacing: 22) {
                            heroRing
                            picker
                            todayLogCard
                            weekStrip
                            xpCheatSheet
                            Spacer(minLength: 12)
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
                    WSKicker(text: "Daily goal")
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .font(WSFont.sans(15, weight: .heavy))
                        .foregroundStyle(WSColor.purpleInk)
                }
            }
        }
    }

    // MARK: - Hero ring

    private var heroRing: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .stroke(WSColor.lilacDeep, lineWidth: 18)
                    .frame(width: 170, height: 170)

                Circle()
                    .trim(from: 0, to: max(0.001, min(1.0, store.todayFraction)))
                    .stroke(
                        WSColor.lime,
                        style: StrokeStyle(lineWidth: 18, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .frame(width: 170, height: 170)
                    .animation(.wsBouncePop, value: store.todayFraction)
                Circle().strokeBorder(WSColor.ink, lineWidth: 2.5).frame(width: 190, height: 190)
                Circle().strokeBorder(WSColor.ink, lineWidth: 2.5).frame(width: 150, height: 150)

                if store.todayIsComplete {
                    VStack(spacing: 4) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 30, weight: .black))
                            .foregroundStyle(WSColor.inkText)
                            .frame(width: 64, height: 64)
                            .wsStickerCircle(fill: WSColor.lime, depth: 3)
                        Text("Done.")
                            .font(WSFont.headline(22, weight: .black))
                            .foregroundStyle(WSColor.foreground)
                    }
                } else {
                    VStack(spacing: 2) {
                        Text("\(store.todayXP)")
                            .font(WSFont.headline(48, weight: .black))
                            .foregroundStyle(WSColor.foreground)
                            .contentTransition(.numericText())
                        Text("of \(store.todayLog.target) XP")
                            .font(WSFont.headline(12, weight: .black))
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                }
            }
            .padding(.top, 8)

            VStack(spacing: 4) {
                Text(store.todayIsComplete ? "Goal complete for today" : "\(max(0, store.todayLog.target - store.todayXP)) XP to go")
                    .font(WSFont.headline(24, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                Text(store.todayIsComplete
                    ? "That's \(store.consecutiveCompletedDays) goal days in a row. See you tomorrow."
                    : "Pick a study activity to add XP toward today's goal.")
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .wsChunkyCard(verticalPadding: 0)
    }

    // MARK: - Picker

    private var picker: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(label: "TARGET", systemIcon: "target", tint: WSColor.duoGreen)
            VStack(spacing: 8) {
                ForEach(DailyGoalStore.Target.allCases) { t in
                    targetRow(t)
                }
            }
        }
    }

    private func targetRow(_ t: DailyGoalStore.Target) -> some View {
        let active = (store.target == t)
        return Button {
            Haptics.selection()
            withAnimation(.wsBouncePop) {
                store.setTarget(t)
            }
        } label: {
            HStack(spacing: 14) {
                Text(t.emoji)
                    .font(.system(size: 22))
                    .frame(width: 46, height: 46)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 14, style: .continuous).fill(active ? WSColor.backgroundElevated : WSColor.lilacDeep)
                            RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(WSColor.ink, lineWidth: 2)
                        }
                    )

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(t.label)
                            .font(WSFont.headline(17, weight: .black))
                            .foregroundStyle(active ? WSColor.inkText : WSColor.foreground)
                        Text("\(t.xp) XP")
                            .font(WSFont.headline(11, weight: .black))
                            .foregroundStyle(WSColor.inkText)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(Capsule().fill(active ? Color.white : WSColor.lime))
                            .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 1.5))
                    }
                    Text(t.blurb)
                        .wsBody(.caption, weight: .semibold)
                        .foregroundStyle(active ? WSColor.inkMuted : WSColor.foregroundMuted)
                }
                Spacer()
                Image(systemName: active ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(active ? WSColor.inkText : WSColor.foregroundMuted)
                    .font(.system(size: 22, weight: .bold))
            }
            .padding(12)
            .wsSticker(fill: active ? WSColor.lime : WSColor.backgroundElevated, radius: 18, depth: active ? 4 : 2)
        }
        .buttonStyle(WSStickerPressStyle())
    }

    // MARK: - Today log

    private var todayLogCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(label: "TODAY", systemIcon: "list.bullet.clipboard.fill", tint: WSColor.duoPurple)

            if store.todayLog.entries.isEmpty {
                HStack(spacing: 10) {
                    Image(systemName: "moon.zzz.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(WSColor.foregroundMuted)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Nothing yet today")
                            .font(WSFont.headline(16, weight: .black))
                            .foregroundStyle(WSColor.foreground)
                        Text("Finish a quiz, clear a deck, play a game or answer a Study Mode question to earn XP.")
                            .wsBody(.caption)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    Spacer()
                }
                .padding(14)
                .wsSticker(radius: 18, depth: 3)
            } else {
                VStack(spacing: 6) {
                    // Newest first
                    ForEach(store.todayLog.entries.sorted(by: { $0.at > $1.at })) { entry in
                        logRow(entry)
                    }
                }
            }
        }
    }

    private func logRow(_ entry: DailyGoalStore.DayLog.Entry) -> some View {
        HStack(spacing: 12) {
            Image(systemName: entry.activity.icon)
                .font(.system(size: 13, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 34, height: 34)
                .wsStickerCircle(fill: WSColor.sky)
            VStack(alignment: .leading, spacing: 1) {
                Text(entry.activity.label)
                    .font(WSFont.headline(16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                Text(formatTime(entry.at))
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            Text("+\(entry.xp) XP")
                .font(WSFont.headline(13, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Capsule().fill(WSColor.lime))
                .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .wsSticker(radius: 16, depth: 3)
    }

    private func formatTime(_ date: Date) -> String {
        let f = DateFormatter()
        f.timeStyle = .short
        return f.string(from: date)
    }

    // MARK: - Week strip (mini bar chart)

    private var weekStrip: some View {
        let days = store.lastDays(7).reversed().map { $0 }    // oldest -> newest
        let maxXP = max(days.map(\.xp).max() ?? 1, store.target.xp)

        return VStack(alignment: .leading, spacing: 12) {
            sectionHeader(label: "LAST 7 DAYS", systemIcon: "chart.bar.fill", tint: WSColor.duoOrange)

            HStack(alignment: .bottom, spacing: 8) {
                ForEach(days) { log in
                    weekBar(log: log, maxXP: maxXP)
                }
            }
            .frame(height: 110)
            .frame(maxWidth: .infinity)
        }
        .wsChunkyCard(verticalPadding: 14)
    }

    private func weekBar(log: DailyGoalStore.DayLog, maxXP: Int) -> some View {
        let frac = max(0.04, min(1.0, Double(log.xp) / Double(max(1, maxXP))))
        let isToday = Calendar.current.isDateInToday(log.date)
        let met = log.isComplete
        let color = met ? WSColor.lime : (isToday ? WSColor.sky : WSColor.purple.opacity(0.35))
        return VStack(spacing: 6) {
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                    .fill(WSColor.lilacDeep)
                    .frame(maxWidth: .infinity)
                    .frame(height: 80)
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                    .fill(color)
                    .overlay(RoundedRectangle(cornerRadius: 7, style: .continuous).strokeBorder(WSColor.ink, lineWidth: 2))
                    .frame(height: 80 * frac)
                    .frame(maxWidth: .infinity)
                if met {
                    Image(systemName: "checkmark")
                        .font(.system(size: 9, weight: .black))
                        .foregroundStyle(WSColor.inkText)
                        .offset(y: -(80 * frac) + 8)
                }
            }

            Text(weekdayShort(log.date))
                .font(WSFont.headline(10, weight: .black))
                .foregroundStyle(isToday ? WSColor.foreground : WSColor.foregroundMuted)
        }
    }

    private func weekdayShort(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "EEE"
        return String(f.string(from: date).prefix(2))
    }

    // MARK: - XP cheat sheet

    private var xpCheatSheet: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader(label: "HOW XP WORKS", systemIcon: "info.circle.fill", tint: WSColor.duoBlue)

            VStack(spacing: 6) {
                if DailyGoalStore.Activity.studyPackGenerated.xp > 0 { xpRow(.studyPackGenerated) }
                xpRow(.quizCompleted)
                xpRow(.quizPerfectScore)
                xpRow(.flashcardsReviewed)
                xpRow(.craterBlastPlayed)
                xpRow(.focusUnlock)
            }
        }
        .wsChunkyCard(verticalPadding: 14)
    }

    private func xpRow(_ activity: DailyGoalStore.Activity) -> some View {
        HStack(spacing: 10) {
            Image(systemName: activity.icon)
                .foregroundStyle(WSColor.purple)
                .font(.system(size: 12, weight: .heavy))
                .frame(width: 18)
            Text(activity.label)
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foreground)
            Spacer()
            Text("+\(activity.xp) XP")
                .font(WSFont.headline(13, weight: .black))
                .foregroundStyle(WSColor.foreground)
        }
    }

    // MARK: - Section header helper

    private func sectionHeader(label: String, systemIcon: String, tint: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: systemIcon)
                .foregroundStyle(WSColor.foreground)
                .font(.system(size: 12, weight: .black))
            Text(label)
                .font(WSFont.sans(11, weight: .black))
                .tracking(1.3)
                .foregroundStyle(WSColor.foregroundMuted)
        }
    }
}

#Preview {
    DailyGoalSheet(store: DailyGoalStore.shared)
}
