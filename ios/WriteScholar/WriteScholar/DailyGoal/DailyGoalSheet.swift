//
//  DailyGoalSheet.swift
//  WriteScholar
//
//  Tap the daily-goal card on Home → this sheet pops up with:
//
//    1. Hero ring     — Big animated XP ring for today
//    2. Picker        — Casual / Regular / Serious / Intense (chunky
//                        cards with emoji + blurb + XP target)
//    3. Today's log   — Per-activity rows with the XP earned
//    4. 7-day strip   — Mini bar chart of the past week's progress
//    5. How XP works  — Cheat sheet showing what awards how much XP
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
                // Tinted backdrop following the active goal color
                LinearGradient(
                    colors: [
                        store.target.tint.opacity(0.10),
                        WSColor.background,
                        store.target.tint.opacity(0.06)
                    ],
                    startPoint: .top, endPoint: .bottom
                )
                .ignoresSafeArea()

                Circle()
                    .fill(store.target.tint.opacity(0.12))
                    .frame(width: 360, height: 360)
                    .blur(radius: 80)
                    .offset(x: -180, y: -300)
                    .ignoresSafeArea()

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
            .navigationTitle("Daily goal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
        }
    }

    // MARK: - Hero ring

    private var heroRing: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [store.target.tint.opacity(0.30), .clear],
                            center: .center, startRadius: 6, endRadius: 130
                        )
                    )
                    .frame(width: 240, height: 240)
                    .blur(radius: 12)

                Circle()
                    .stroke(WSColor.surface, lineWidth: 14)
                    .frame(width: 170, height: 170)

                Circle()
                    .trim(from: 0, to: max(0.001, min(1.0, store.todayFraction)))
                    .stroke(
                        LinearGradient(colors: [store.target.tint, store.target.tint.opacity(0.7)],
                                       startPoint: .top, endPoint: .bottom),
                        style: StrokeStyle(lineWidth: 14, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .frame(width: 170, height: 170)
                    .shadow(color: store.target.tint.opacity(0.45), radius: 8, y: 2)
                    .animation(.wsBouncePop, value: store.todayFraction)

                if store.todayIsComplete {
                    VStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 50, weight: .black))
                            .foregroundStyle(Color(hex: 0x10B981))
                        Text("Done!")
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundStyle(WSColor.foreground)
                    }
                } else {
                    VStack(spacing: 2) {
                        Text("\(store.todayXP)")
                            .font(.system(size: 44, weight: .black, design: .rounded))
                            .foregroundStyle(WSColor.foreground)
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
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
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
        .wsChunkyCard(verticalPadding: 0, accent: store.target.tint)
    }

    // MARK: - Picker

    private var picker: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(label: "TARGET", systemIcon: "target", tint: store.target.tint)
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
                        .fill(LinearGradient(colors: [t.tint, t.tint.opacity(0.78)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 46, height: 46)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(.white.opacity(0.30), lineWidth: 1)
                        )
                        .shadow(color: t.tint.opacity(0.40), radius: 6, y: 2)
                    Text(t.emoji)
                        .font(.system(size: 22))
                }

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(t.label)
                            .wsBody(.medium, weight: .black)
                            .foregroundStyle(WSColor.foreground)
                        Text("\(t.xp) XP")
                            .font(.system(size: 11, weight: .black, design: .rounded))
                            .foregroundStyle(t.tint)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(Capsule().fill(t.tint.opacity(0.13)))
                    }
                    Text(t.blurb)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
                Image(systemName: active ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(active ? t.tint : WSColor.foregroundMuted)
                    .font(.system(size: 22))
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(active ? t.tint.opacity(0.08) : WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(active ? t.tint.opacity(0.50) : WSColor.hairline, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Today log

    private var todayLogCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader(label: "TODAY", systemIcon: "list.bullet.clipboard.fill", tint: WSColor.brandPrimary)

            if store.todayLog.entries.isEmpty {
                HStack(spacing: 10) {
                    Image(systemName: "moon.zzz.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(WSColor.foregroundMuted)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Nothing yet today")
                            .wsBody(.medium, weight: .bold)
                            .foregroundStyle(WSColor.foreground)
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
                                .stroke(WSColor.hairline, lineWidth: 1)
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
                Circle().fill(WSColor.brandPrimary.opacity(0.16)).frame(width: 32, height: 32)
                Image(systemName: entry.activity.icon)
                    .foregroundStyle(WSColor.brandPrimary)
                    .font(.system(size: 13, weight: .heavy))
            }
            VStack(alignment: .leading, spacing: 1) {
                Text(entry.activity.label)
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text(formatTime(entry.at))
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            Text("+\(entry.xp) XP")
                .font(.system(size: 12, weight: .black, design: .rounded))
                .foregroundStyle(Color(hex: 0xF59E0B))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Capsule().fill(Color(hex: 0xF59E0B).opacity(0.14)))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
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
        let days = store.lastDays(7).reversed().map { $0 }    // oldest → newest
        let maxXP = max(days.map(\.xp).max() ?? 1, store.target.xp)

        return VStack(alignment: .leading, spacing: 12) {
            sectionHeader(label: "LAST 7 DAYS", systemIcon: "chart.bar.fill", tint: Color(hex: 0xF59E0B))

            HStack(alignment: .bottom, spacing: 8) {
                ForEach(days) { log in
                    weekBar(log: log, maxXP: maxXP)
                }
            }
            .frame(height: 110)
            .frame(maxWidth: .infinity)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
        )
    }

    private func weekBar(log: DailyGoalStore.DayLog, maxXP: Int) -> some View {
        let frac = max(0.04, min(1.0, Double(log.xp) / Double(max(1, maxXP))))
        let isToday = Calendar.current.isDateInToday(log.date)
        let met = log.isComplete
        let color = met ? Color(hex: 0x10B981) : (isToday ? store.target.tint : Color(hex: 0xCBD5E1))
        return VStack(spacing: 6) {
            ZStack(alignment: .bottom) {
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(WSColor.surface)
                    .frame(maxWidth: .infinity)
                    .frame(height: 80)
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .fill(
                        LinearGradient(colors: [color, color.opacity(0.78)],
                                       startPoint: .top, endPoint: .bottom)
                    )
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
                .foregroundStyle(isToday ? store.target.tint : WSColor.foregroundMuted)
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
            sectionHeader(label: "HOW XP WORKS", systemIcon: "info.circle.fill", tint: Color(hex: 0x6366F1))

            VStack(spacing: 6) {
                xpRow(.studyPackGenerated)
                xpRow(.quizCompleted)
                xpRow(.quizPerfectScore)
                xpRow(.flashcardsReviewed)
                xpRow(.craterBlastPlayed)
                xpRow(.focusUnlock)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color(hex: 0x6366F1).opacity(0.06))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color(hex: 0x6366F1).opacity(0.20), lineWidth: 1)
                )
        )
    }

    private func xpRow(_ activity: DailyGoalStore.Activity) -> some View {
        HStack(spacing: 10) {
            Image(systemName: activity.icon)
                .foregroundStyle(WSColor.brandPrimary)
                .font(.system(size: 12, weight: .heavy))
                .frame(width: 18)
            Text(activity.label)
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foreground)
            Spacer()
            Text("+\(activity.xp) XP")
                .font(.system(size: 11, weight: .black, design: .rounded))
                .foregroundStyle(Color(hex: 0xF59E0B))
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
