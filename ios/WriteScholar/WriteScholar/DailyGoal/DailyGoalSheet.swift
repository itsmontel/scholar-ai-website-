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
                    WSChunkyRibbon(color: WSColor.duoGreen)
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
                    Text("Daily Goal")
                        .wsHeadline(.small, weight: .black)
                        .foregroundStyle(WSColor.duoText)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .font(WSFont.sans(15, weight: .bold))
                        .foregroundStyle(WSColor.duoPurple)
                }
            }
        }
    }

    // MARK: - Hero ring

    private var heroRing: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .stroke(WSColor.duoSurface, lineWidth: 14)
                    .frame(width: 170, height: 170)

                Circle()
                    .trim(from: 0, to: max(0.001, min(1.0, store.todayFraction)))
                    .stroke(
                        WSColor.duoGreen,
                        style: StrokeStyle(lineWidth: 14, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .frame(width: 170, height: 170)
                    .shadow(color: WSColor.duoGreen.opacity(0.45), radius: 8, y: 2)
                    .animation(.wsBouncePop, value: store.todayFraction)

                if store.todayIsComplete {
                    VStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 50, weight: .black))
                            .foregroundStyle(WSColor.duoGreen)
                        Text("Done!")
                            .wsHeadline(.small, weight: .black)
                            .foregroundStyle(WSColor.duoText)
                    }
                } else {
                    VStack(spacing: 2) {
                        Text("\(store.todayXP)")
                            .font(.system(size: 44, weight: .black, design: .rounded))
                            .foregroundStyle(WSColor.duoText)
                            .contentTransition(.numericText())
                        Text("of \(store.todayLog.target) XP")
                            .font(.system(size: 12, weight: .black, design: .rounded))
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                }
            }
            .padding(.top, 8)

            VStack(spacing: 4) {
                Text(store.todayIsComplete ? "Goal complete for today" : "\(max(0, store.todayLog.target - store.todayXP)) XP to go")
                    .wsHeadline(.medium, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                Text(store.todayIsComplete
                    ? "You earned the \(store.consecutiveCompletedDays)-day goal streak. Come back tomorrow!"
                    : "Pick a study activity to add XP toward today's goal.")
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .wsChunkyCard(verticalPadding: 0, accent: WSColor.duoGreen)
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
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(WSColor.duoGreen)
                        .frame(width: 46, height: 46)
                        .shadow(color: WSColor.duoGreenDark.opacity(0.40), radius: 6, y: 2)
                    Text(t.emoji)
                        .font(.system(size: 22))
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(t.label)
                            .wsBody(.medium, weight: .black)
                            .foregroundStyle(WSColor.duoText)
                        Text("\(t.xp) XP")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(Capsule().fill(WSColor.duoGreen))
                    }
                    Text(t.blurb)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
                Image(systemName: active ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(active ? WSColor.duoGreen : WSColor.foregroundMuted)
                    .font(.system(size: 22))
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(active ? WSColor.duoGreenLight : WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(active ? WSColor.duoGreen : WSColor.duoBorder, lineWidth: active ? 2 : 1)
                    )
            )
        }
        .buttonStyle(.plain)
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
                            .wsBody(.medium, weight: .bold)
                            .foregroundStyle(WSColor.duoText)
                        Text("Generate a pack, finish a quiz, or pass a Focus unlock to earn XP.")
                            .wsBody(.caption)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    Spacer()
                }
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(WSColor.backgroundElevated)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(WSColor.duoBorder, lineWidth: 2)
                        )
                )
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
            ZStack {
                Circle().fill(WSColor.duoPurpleLight).frame(width: 32, height: 32)
                Image(systemName: entry.activity.icon)
                    .foregroundStyle(WSColor.duoPurple)
                    .font(.system(size: 13, weight: .heavy))
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(entry.activity.label)
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.duoText)
                Text(formatTime(entry.at))
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            Text("+\(entry.xp) XP")
                .font(.system(size: 12, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.duoOrange)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Capsule().fill(WSColor.duoOrangeLight))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(WSColor.duoBorder, lineWidth: 2)
                )
        )
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
        .wsChunkyCard(verticalPadding: 14, accent: WSColor.duoOrange)
    }

    private func weekBar(log: DailyGoalStore.DayLog, maxXP: Int) -> some View {
        let frac = max(0.04, min(1.0, Double(log.xp) / Double(max(1, maxXP))))
        let isToday = Calendar.current.isDateInToday(log.date)
        let met = log.isComplete
        let color = met ? WSColor.duoGreen : (isToday ? WSColor.duoBlue : WSColor.duoBorder)
        return VStack(spacing: 6) {
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(WSColor.duoSurface)
                    .frame(maxWidth: .infinity)
                    .frame(height: 80)
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(color)
                    .frame(height: 80 * frac)
                    .frame(maxWidth: .infinity)
                    .shadow(color: color.opacity(0.30), radius: 4, y: 1)
                if met {
                    Image(systemName: "checkmark")
                        .font(.system(size: 9, weight: .black))
                        .foregroundStyle(.white)
                        .offset(y: -(80 * frac) + 8)
                }
            }

            Text(weekdayShort(log.date))
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(isToday ? WSColor.duoBlue : WSColor.foregroundMuted)
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
                xpRow(.studyPackGenerated)
                xpRow(.quizCompleted)
                xpRow(.quizPerfectScore)
                xpRow(.flashcardsReviewed)
                xpRow(.craterBlastPlayed)
                xpRow(.focusUnlock)
            }
        }
        .wsChunkyCard(verticalPadding: 14, accent: WSColor.duoBlue)
    }

    private func xpRow(_ activity: DailyGoalStore.Activity) -> some View {
        HStack(spacing: 10) {
            Image(systemName: activity.icon)
                .foregroundStyle(WSColor.duoPurple)
                .font(.system(size: 12, weight: .heavy))
                .frame(width: 18)
            Text(activity.label)
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.duoText)
            Spacer()
            Text("+\(activity.xp) XP")
                .font(.system(size: 11, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.duoOrange)
        }
    }

    // MARK: - Section header helper

    private func sectionHeader(label: String, systemIcon: String, tint: Color) -> some View {
        HStack(spacing: 6) {
            Image(systemName: systemIcon)
                .foregroundStyle(tint)
                .font(.system(size: 11, weight: .heavy))
            Text(label)
                .font(.system(size: 10, weight: .black, design: .rounded))
                .tracking(0.7)
                .foregroundStyle(WSColor.foregroundMuted)
        }
    }
}

#Preview {
    DailyGoalSheet(store: DailyGoalStore.shared)
}
