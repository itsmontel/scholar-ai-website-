//
//  StreakInsightsSheet.swift
//  WriteScholar
//
//  Tap the streak card on Home -> this sheet pops up with a deep dive
//  into the user's streak life. Designed to feel like a celebration,
//  not a stats dashboard.
//
//  Sections (top -> bottom):
//
//    1. Hero      -- Big animated flame, current streak, "active today" pill.
//    2. Stats row -- Current . Longest . Total active days . This month.
//    3. Calendar  -- Month grid for the currently-selected month, with
//                    flame dots on active days. Swipeable left/right
//                    to walk through months.
//    4. Year      -- GitHub-style heatmap: one cell per day, the past
//                    52 weeks. Tooltip on tap (long-press for now via
//                    a sheet selection callback).
//    5. Insights  -- Three highlight cards (best week, longest streak
//                    date, average sessions per week).
//    6. Milestones -- Closest streak achievement(s) progress bars.
//
//  Inputs:
//    * streak -- StreakAPI.StreakInfo (currentStreak, longestStreak,
//               totalActivityDays, hasActivityToday, weekActivities)
//    * activeDays -- `Set<Date>` of days the user has been active. The
//                   server only returns this week's activity, so the
//                   sheet falls back to a synthetic "consecutive days
//                   ending today" set for the past 90 days when only
//                   the basic streak fields are available.
//    * achievementStats -- used to drive the milestones section.
//

import SwiftUI

struct StreakInsightsSheet: View {
    let streak: StreakAPI.StreakInfo?
    let stats: AchievementStats

    @Environment(\.dismiss) private var dismiss

    @State private var monthOffset: Int = 0
    @State private var selectedHeatmapDate: Date? = nil

    /// Synthetic dataset: any day inside the last 365 the user was
    /// "active" -- derived from the few reliable signals the server
    /// returns today (currentStreak + weekActivities). When the API
    /// later starts returning a full activity calendar, swap this for
    /// `streak?.allActivities` and the rest of the view is unchanged.
    private var activeDays: Set<String> {
        var set = Set<String>(streak?.weekActivities ?? [])
        // Fold the current consecutive streak in by walking back from today
        if let s = streak {
            let cal = Calendar.current
            let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.locale = Locale(identifier: "en_US_POSIX")
            for back in 0..<s.currentStreak {
                if let d = cal.date(byAdding: .day, value: -back, to: Date()) {
                    set.insert(f.string(from: d))
                }
            }
        }
        return set
    }

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.duoSurface.ignoresSafeArea()

                VStack(spacing: 0) {
                    WSChunkyRibbon(color: WSColor.duoOrange)
                    ScrollView {
                        VStack(spacing: 22) {
                            heroBlock
                            statsRow
                            monthCalendarBlock
                            yearHeatmapBlock
                            insightsBlock
                            milestonesBlock
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
                    Text("Your Streak")
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

    // MARK: - Hero

    private var heroBlock: some View {
        let count = streak?.currentStreak ?? 0
        let active = streak?.hasActivityToday ?? false
        return VStack(spacing: 14) {
            WSStreakFlame(count: count, activeToday: active, size: 130)
                .padding(.top, 8)

            VStack(spacing: 4) {
                Text(active ? "On a roll!" : "Streak paused")
                    .font(.system(size: 14, weight: .black, design: .rounded))
                    .tracking(0.5)
                    .foregroundStyle(active ? WSColor.duoOrange : WSColor.foregroundMuted)
                Text("\(count)-day streak")
                    .wsHeadline(.huge, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                Text(active
                    ? "You did something today -- the fire keeps burning."
                    : "Open a study pack today to keep your streak alive.")
                    .wsBody(.small)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.horizontal, 24)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .wsChunkyCard(verticalPadding: 0, accent: WSColor.duoOrange)
    }

    // MARK: - Stats row

    private var statsRow: some View {
        let current = streak?.currentStreak ?? 0
        let longest = streak?.longestStreak ?? max(current, 0)
        let total   = streak?.totalActivityDays ?? activeDays.count
        let monthCount = activeDaysInCurrentMonth

        return HStack(spacing: 10) {
            statTile(label: "Current",  value: "\(current)", suffix: "days",
                     icon: "flame.fill", tint: WSColor.duoOrange)
            statTile(label: "Longest",  value: "\(longest)", suffix: "days",
                     icon: "trophy.fill", tint: WSColor.duoRed)
            statTile(label: "Lifetime", value: "\(total)",   suffix: "days",
                     icon: "calendar", tint: WSColor.duoPurple)
            statTile(label: "This month", value: "\(monthCount)", suffix: "days",
                     icon: "calendar.badge.clock", tint: WSColor.duoBlue)
        }
    }

    private func statTile(label: String, value: String, suffix: String, icon: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            ZStack {
                Circle().fill(tint.opacity(0.16)).frame(width: 28, height: 28)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 12, weight: .heavy))
            }
            Text(value)
                .font(.system(size: 22, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.duoText)
                .contentTransition(.numericText())
            Text(label.uppercased())
                .font(.system(size: 8, weight: .black, design: .rounded))
                .tracking(0.6)
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
        .wsChunkyCard(
            cornerRadius: 16,
            horizontalPadding: 0,
            verticalPadding: 0,
            lipHeight: 4,
            accent: tint
        )
    }

    // MARK: - Month calendar

    private var monthCalendarBlock: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("MONTH VIEW")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .tracking(0.7)
                        .foregroundStyle(WSColor.foregroundMuted)
                    Text(monthHeader)
                        .wsHeadline(.small, weight: .black)
                        .foregroundStyle(WSColor.duoText)
                }
                Spacer()
                HStack(spacing: 8) {
                    monthArrow(systemName: "chevron.left") { withAnimation(.wsBouncePop) { monthOffset -= 1 } }
                    monthArrow(systemName: "chevron.right",
                               disabled: monthOffset >= 0) {
                        if monthOffset < 0 {
                            withAnimation(.wsBouncePop) { monthOffset += 1 }
                        }
                    }
                }
            }

            // Weekday header
            let weekdays = orderedWeekdayInitials
            HStack(spacing: 0) {
                ForEach(weekdays, id: \.self) { d in
                    Text(d)
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .tracking(0.5)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .frame(maxWidth: .infinity)
                }
            }

            // 6 x 7 grid
            let cells = monthCells()
            VStack(spacing: 6) {
                ForEach(0..<6, id: \.self) { row in
                    HStack(spacing: 6) {
                        ForEach(0..<7, id: \.self) { col in
                            let idx = row * 7 + col
                            if idx < cells.count {
                                dayCell(cells[idx])
                            } else {
                                Color.clear.frame(maxWidth: .infinity, minHeight: 36)
                            }
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 16, accent: WSColor.duoOrange)
    }

    private func monthArrow(systemName: String, disabled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 12, weight: .heavy))
                .foregroundStyle(disabled ? WSColor.foregroundMuted.opacity(0.5) : WSColor.duoText)
                .padding(8)
                .background(
                    Circle()
                        .fill(WSColor.backgroundElevated)
                        .overlay(Circle().stroke(WSColor.duoBorder, lineWidth: 2))
                )
        }
        .buttonStyle(.plain)
        .disabled(disabled)
    }

    private struct DayCell {
        let date: Date?
        let inMonth: Bool
        let isActive: Bool
        let isToday: Bool
    }

    private func monthCells() -> [DayCell] {
        let cal = Calendar.current
        let now = Date()
        guard let baseMonthStart = cal.date(byAdding: .month, value: monthOffset,
                                            to: cal.date(from: cal.dateComponents([.year, .month], from: now)) ?? now)
        else { return [] }
        guard let monthRange = cal.range(of: .day, in: .month, for: baseMonthStart) else { return [] }
        let monthStartWeekday = cal.component(.weekday, from: baseMonthStart) // 1 = Sunday
        let firstWeekday = cal.firstWeekday

        // Number of leading blank cells so the month starts on the right column
        let leading = (monthStartWeekday - firstWeekday + 7) % 7
        var cells: [DayCell] = []

        // Leading blanks (still showing prior month dates greyed out)
        for i in stride(from: leading, to: 0, by: -1) {
            if let d = cal.date(byAdding: .day, value: -i, to: baseMonthStart) {
                cells.append(DayCell(date: d, inMonth: false, isActive: isActive(d), isToday: cal.isDateInToday(d)))
            } else {
                cells.append(DayCell(date: nil, inMonth: false, isActive: false, isToday: false))
            }
        }
        // Days in this month
        for d in monthRange {
            if let date = cal.date(byAdding: .day, value: d - 1, to: baseMonthStart) {
                cells.append(DayCell(date: date, inMonth: true, isActive: isActive(date), isToday: cal.isDateInToday(date)))
            }
        }
        // Trailing blanks to round up to 6 weeks
        while cells.count < 42 {
            cells.append(DayCell(date: nil, inMonth: false, isActive: false, isToday: false))
        }
        return cells
    }

    private func dayCell(_ cell: DayCell) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(
                    cell.isActive ? WSColor.duoOrange : WSColor.duoSurface
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .stroke(cell.isToday ? WSColor.duoPurple : .clear, lineWidth: 2)
                )
                .opacity(cell.inMonth || cell.date != nil ? 1.0 : 0.0)

            if let date = cell.date {
                let day = Calendar.current.component(.day, from: date)
                Text("\(day)")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundStyle(
                        cell.isActive ? .white :
                        cell.inMonth ? WSColor.duoText : WSColor.foregroundMuted.opacity(0.45)
                    )
                if cell.isActive {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 7, weight: .black))
                        .foregroundStyle(.white)
                        .offset(x: 8, y: -8)
                }
            }
        }
        .frame(maxWidth: .infinity, minHeight: 38)
    }

    private var monthHeader: String {
        let cal = Calendar.current
        guard let now = cal.date(byAdding: .month, value: monthOffset, to: Date()) else { return "" }
        let f = DateFormatter()
        f.dateFormat = "MMMM yyyy"
        return f.string(from: now)
    }

    private var orderedWeekdayInitials: [String] {
        let cal = Calendar.current
        let symbols = cal.veryShortStandaloneWeekdaySymbols
        let firstIdx = cal.firstWeekday - 1
        return Array(symbols[firstIdx...]) + Array(symbols[..<firstIdx])
    }

    private var activeDaysInCurrentMonth: Int {
        let cal = Calendar.current
        let now = Date()
        let comps = cal.dateComponents([.year, .month], from: now)
        guard let monthStart = cal.date(from: comps) else { return 0 }
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.locale = Locale(identifier: "en_US_POSIX")
        return activeDays.filter { key in
            guard let d = f.date(from: key) else { return false }
            return d >= monthStart && d <= now
        }.count
    }

    private func isActive(_ date: Date) -> Bool {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; f.locale = Locale(identifier: "en_US_POSIX")
        return activeDays.contains(f.string(from: date))
    }

    // MARK: - Year heatmap

    private var yearHeatmapBlock: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("YEAR AT A GLANCE")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .tracking(0.7)
                        .foregroundStyle(WSColor.foregroundMuted)
                    Text("Last 52 weeks")
                        .wsHeadline(.small, weight: .black)
                        .foregroundStyle(WSColor.duoText)
                }
                Spacer()
                heatmapLegend
            }

            ScrollView(.horizontal, showsIndicators: false) {
                heatmapGrid
                    .padding(.vertical, 4)
            }

            if let sel = selectedHeatmapDate {
                Text(LibraryRelativeFormatter.long(sel))
                    .wsBody(.caption, weight: .bold)
                    .foregroundStyle(WSColor.duoPurple)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 16, accent: WSColor.duoRed)
    }

    private var heatmapLegend: some View {
        HStack(spacing: 4) {
            Text("less")
                .font(.system(size: 8, weight: .bold, design: .rounded))
                .foregroundStyle(WSColor.foregroundMuted)
            ForEach(0..<5, id: \.self) { i in
                let intensity = Double(i) / 4.0
                RoundedRectangle(cornerRadius: 3, style: .continuous)
                    .fill(intensity == 0 ? WSColor.duoSurface :
                          WSColor.duoOrange.opacity(0.30 + intensity * 0.70))
                    .frame(width: 9, height: 9)
            }
            Text("more")
                .font(.system(size: 8, weight: .bold, design: .rounded))
                .foregroundStyle(WSColor.foregroundMuted)
        }
    }

    private var heatmapGrid: some View {
        let weeks = heatmapWeeks()  // 53 columns x 7 rows
        return HStack(spacing: 3) {
            ForEach(0..<weeks.count, id: \.self) { col in
                VStack(spacing: 3) {
                    ForEach(0..<7, id: \.self) { row in
                        let date = weeks[col][row]
                        cell(for: date)
                    }
                }
            }
        }
    }

    /// Returns a [week][weekday] grid of dates ending today, sized to
    /// fit the past 52 weeks. Weeks line up to the user's first weekday.
    private func heatmapWeeks() -> [[Date?]] {
        let cal = Calendar.current
        let today = Date()
        let weekdayOfToday = cal.component(.weekday, from: today)   // 1...7
        let firstWeekday = cal.firstWeekday
        let dayInWeekIdx = (weekdayOfToday - firstWeekday + 7) % 7   // 0...6

        // Find the start of the most recent week
        guard let weekStart = cal.date(byAdding: .day, value: -dayInWeekIdx, to: today) else { return [] }
        // Walk back 52 weeks
        var weeks: [[Date?]] = []
        for w in stride(from: 52, through: 0, by: -1) {
            var week: [Date?] = []
            for d in 0..<7 {
                if let date = cal.date(byAdding: .day, value: -(w * 7) + d, to: weekStart) {
                    week.append(date <= today ? date : nil)
                } else {
                    week.append(nil)
                }
            }
            weeks.append(week)
        }
        return weeks
    }

    private func cell(for date: Date?) -> some View {
        let active = date.map { isActive($0) } ?? false
        let isToday = date.map { Calendar.current.isDateInToday($0) } ?? false

        let intensity: Double = active ? 0.85 : 0.0
        let fill: Color = intensity == 0 ? WSColor.duoSurface
            : WSColor.duoOrange.opacity(0.30 + intensity * 0.70)

        return RoundedRectangle(cornerRadius: 3, style: .continuous)
            .fill(fill)
            .overlay(
                RoundedRectangle(cornerRadius: 3, style: .continuous)
                    .stroke(isToday ? WSColor.duoPurple : .clear, lineWidth: 1.5)
            )
            .frame(width: 11, height: 11)
            .opacity(date == nil ? 0.0 : 1.0)
            .onTapGesture {
                guard let d = date else { return }
                Haptics.light()
                selectedHeatmapDate = (selectedHeatmapDate == d) ? nil : d
            }
    }

    // MARK: - Insights

    private var insightsBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("INSIGHTS")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .tracking(0.7)
                .foregroundStyle(WSColor.foregroundMuted)
            insightRow(
                icon: "sparkle",
                tint: WSColor.duoOrange,
                title: bestWeekHeadline,
                body: "Your most-active week in the last 52."
            )
            insightRow(
                icon: "trophy.fill",
                tint: WSColor.duoRed,
                title: "Longest run: \(streak?.longestStreak ?? 0) days",
                body: "Beat that to unlock the next streak achievement."
            )
            insightRow(
                icon: "chart.line.uptrend.xyaxis",
                tint: WSColor.duoPurple,
                title: averagePerWeekHeadline,
                body: "Average days per week over the last month."
            )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: WSColor.duoPurple)
    }

    private func insightRow(icon: String, tint: Color, title: String, body: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle().fill(tint.opacity(0.16)).frame(width: 36, height: 36)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 14, weight: .heavy))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).wsBody(.medium, weight: .black).foregroundStyle(WSColor.duoText)
                Text(body).wsBody(.caption).foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer(minLength: 0)
        }
    }

    private var bestWeekHeadline: String {
        // Compute best week in the last 52
        let weeks = heatmapWeeks()
        let counts = weeks.map { week in week.compactMap { $0 }.filter { isActive($0) }.count }
        let best = counts.max() ?? 0
        return "Best week: \(best) of 7 days"
    }

    private var averagePerWeekHeadline: String {
        let weeks = heatmapWeeks().suffix(4)
        let counts = weeks.map { week in week.compactMap { $0 }.filter { isActive($0) }.count }
        let avg = counts.isEmpty ? 0 : Double(counts.reduce(0, +)) / Double(counts.count)
        return String(format: "Last 4 weeks: %.1f days/wk", avg)
    }

    // MARK: - Milestones

    private var milestonesBlock: some View {
        let upcoming = upcomingStreakBadges
        return VStack(alignment: .leading, spacing: 12) {
            Text("NEXT MILESTONES")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .tracking(0.7)
                .foregroundStyle(WSColor.foregroundMuted)

            if upcoming.isEmpty {
                HStack(spacing: 10) {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundStyle(WSColor.duoGreen)
                    Text("You've unlocked every streak badge -- legend!")
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.duoText)
                }
            } else {
                ForEach(upcoming, id: \.id) { ach in
                    milestoneRow(ach)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: WSColor.duoOrange)
    }

    private func milestoneRow(_ ach: Achievement) -> some View {
        let progress = ach.progress(stats: stats)
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 10) {
                ZStack {
                    Circle().fill(WSColor.duoOrangeLight).frame(width: 32, height: 32)
                    Image(systemName: "flame.fill").foregroundStyle(WSColor.duoOrange).font(.system(size: 13, weight: .heavy))
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text(ach.name)
                        .wsBody(.medium, weight: .black)
                        .foregroundStyle(WSColor.duoText)
                    Text(ach.conditionText)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
                Text("+\(ach.xp) XP")
                    .font(.system(size: 11, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.duoOrange)
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Capsule().fill(WSColor.duoOrangeLight))
            }
            WSXPBar(xpInLevel: Int(progress * 100), xpForLevel: 100, tint: WSColor.duoOrange, height: 8, showsLabel: false)
        }
    }

    /// Pick the next 3 streak achievements the user hasn't unlocked.
    private var upcomingStreakBadges: [Achievement] {
        AchievementCatalog.all
            .filter { $0.mobileGroup == .streaks }
            .filter { !$0.isUnlocked(stats: stats) }
            .sorted { $0.progress(stats: stats) > $1.progress(stats: stats) }
            .prefix(3)
            .map { $0 }
    }
}

// MARK: - Preview

#Preview {
    StreakInsightsSheet(
        streak: StreakAPI.StreakInfo(
            currentStreak: 5,
            longestStreak: 12,
            totalActivityDays: 42,
            hasActivityToday: true,
            weekActivities: ["2026-05-02", "2026-05-04", "2026-05-05", "2026-05-06"]
        ),
        stats: {
            var s = AchievementStats()
            s.longestStreak = 12
            s.currentStreak = 5
            return s
        }()
    )
}
