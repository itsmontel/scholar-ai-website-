//
//  WSGamification.swift
//  WriteScholar
//
//  Reusable Duolingo-feel gamification components used across the app:
//
//    • WSStreakFlame    — Big animated flame with streak count overlay,
//                          dimmed grey when the streak is broken / not
//                          extended today.
//    • WSXPBar          — Chunky XP progress bar with a soft inner glow,
//                          animated fill when value changes.
//    • WSLevelBadge     — Round level chip with brand gradient + glow.
//    • WSDailyGoalRing  — Progress ring around an icon, used on the home
//                          dashboard to show "today's goal".
//    • WSStreakWeekStrip — 7-day little dots (Mon-Sun) with today
//                          highlighted, mirroring Duolingo's daily strip.
//    • WSGemChip        — Small "currency" pill used to tease the upcoming
//                          gem economy that the website Pro tier ships.
//
//  All purely presentational — no state, no I/O. Bind them to whatever
//  you have on hand (StreakAPI / AchievementCatalog / GamificationStore).
//

import SwiftUI

// MARK: - Streak flame

struct WSStreakFlame: View {
    let count: Int
    /// True if user has done something today that extends the streak.
    let activeToday: Bool
    var size: CGFloat = 88

    @State private var pulse: CGFloat = 1.0
    @State private var spin: Double = 0

    var body: some View {
        ZStack {
            WSStarburst(points: 16, inset: 0.86)
                .fill(activeToday ? WSColor.sun : WSColor.lilacDeep)
                .overlay(WSStarburst(points: 16, inset: 0.86).stroke(WSColor.ink, lineWidth: 2.5))
                .frame(width: size * 1.3, height: size * 1.3)
                .modifier(WSSpinIf(on: activeToday))

            Circle()
                .fill(activeToday ? WSColor.orange : WSColor.backgroundElevated)
                .overlay(Circle().strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
                .frame(width: size, height: size)

            WSFlameIcon(size: size * 0.42, lit: activeToday)

            Text("\(count)")
                .font(WSFont.headline(size * 0.28, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, max(7, size * 0.10))
                .padding(.vertical, max(2, size * 0.05))
                .background(Capsule().fill(WSColor.lime))
                .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
                .rotationEffect(.degrees(-6))
                .offset(x: size * 0.36, y: size * 0.36)
        }
        .frame(width: size * 1.3, height: size * 1.3)
    }
}

/// Spins only when `on` (an active streak).
private struct WSSpinIf: ViewModifier {
    var on: Bool
    func body(content: Content) -> some View {
        if on { content.wsSpin(period: 20) } else { content }
    }
}

// MARK: - XP bar

struct WSXPBar: View {
    /// Current XP within the current level.
    let xpInLevel: Int
    /// XP needed to reach the next level from the start of this level.
    let xpForLevel: Int
    /// Optional override colour. Defaults to brand gradient.
    var tint: Color = WSColor.brandPrimary
    var height: CGFloat = 12
    var showsLabel: Bool = true

    private var fraction: Double {
        guard xpForLevel > 0 else { return 0 }
        return min(1.0, max(0.0, Double(xpInLevel) / Double(xpForLevel)))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            if showsLabel {
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "bolt.fill")
                            .foregroundStyle(WSColor.duoOrangeDark)
                        Text("\(xpInLevel) / \(xpForLevel) XP")
                            .font(WSFont.headline(12, weight: .black))
                            .foregroundStyle(WSColor.foreground)
                    }
                    Spacer()
                    Text("\(Int(fraction * 100))%")
                        .font(WSFont.headline(11, weight: .black))
                        .foregroundStyle(tint)
                }
            }
            WSStripeBar(fraction: fraction, fill: WSStickerTint.face(for: tint), height: height)
        }
    }
}

// MARK: - Level badge

struct WSLevelBadge: View {
    let level: Int
    var size: CGFloat = 60
    var tint: Color = WSColor.brandPrimary

    var body: some View {
        VStack(spacing: 0) {
            Text("LV")
                .font(WSFont.headline(size * 0.16, weight: .black))
                .tracking(1.0)
            Text("\(level)")
                .font(WSFont.headline(size * 0.42, weight: .black))
        }
        .foregroundStyle(tint == WSColor.brandPrimary ? Color.white : WSColor.inkText)
        .frame(width: size, height: size)
        .wsStickerCircle(fill: WSStickerTint.face(for: tint), depth: size * 0.07)
        .padding(.bottom, size * 0.07)
    }
}

// MARK: - Daily goal ring

struct WSDailyGoalRing: View {
    /// 0...1
    let progress: Double
    let icon: String
    var tint: Color = WSColor.duoOrangeDark
    var size: CGFloat = 72

    var body: some View {
        ZStack {
            // Track ring
            Circle()
                .stroke(WSColor.lilacDeep, lineWidth: 8)
                .frame(width: size, height: size)

            Circle()
                .trim(from: 0, to: max(0.001, min(1.0, progress)))
                .stroke(WSStickerTint.face(for: tint),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .frame(width: size, height: size)
                .animation(.wsBouncePop, value: progress)

            Circle().strokeBorder(WSColor.ink, lineWidth: 2).frame(width: size + 8, height: size + 8)
            Circle().strokeBorder(WSColor.ink, lineWidth: 2).frame(width: size - 8, height: size - 8)

            Image(systemName: icon)
                .font(.system(size: size * 0.32, weight: .black))
                .foregroundStyle(WSColor.foreground)
        }
    }
}

// MARK: - Streak week strip

struct WSStreakWeekStrip: View {
    /// Mon → Sun (or whatever calendar week starts with).
    /// 7 entries: each true if the user did at least one thing that day.
    let days: [Bool]
    /// Index into `days` of "today". Used to mark today specially.
    var todayIndex: Int

    private let labels = ["M", "T", "W", "T", "F", "S", "S"]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(Array(days.enumerated()), id: \.offset) { (i, active) in
                VStack(spacing: 4) {
                    Text(labels[i])
                        .font(WSFont.headline(9, weight: .black))
                        .tracking(0.6)
                        .foregroundStyle(i == todayIndex ? WSColor.foreground : WSColor.foregroundMuted)

                    ZStack {
                        Circle()
                            .fill(active ? WSColor.orange : (i == todayIndex ? WSColor.lime : WSColor.backgroundElevated))
                            .overlay(
                                Circle()
                                    .strokeBorder(WSColor.ink.opacity(active || i == todayIndex ? 1 : 0.3), lineWidth: 2)
                            )
                            .frame(width: 28, height: 28)
                        if active {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 12, weight: .black))
                                .foregroundStyle(WSColor.inkText)
                        } else if i == todayIndex {
                            Circle().fill(WSColor.inkText).frame(width: 6, height: 6)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
    }
}

// MARK: - Week calendar strip (Daily Review header)

/// The mockup's week header: M T W T F S S letters with day-of-month
/// numbers beneath; today is a filled brand-purple circle with white text.
struct WSWeekCalendarStrip: View {
    /// 7 dates, Monday → Sunday of the current week.
    let dates: [Date]
    /// Which of `dates` carry activity (flame-worthy days).
    var activeDays: [Bool] = Array(repeating: false, count: 7)

    private let labels = ["M", "T", "W", "T", "F", "S", "S"]
    private var cal: Calendar { Calendar.current }

    var body: some View {
        HStack(spacing: 6) {
            ForEach(Array(dates.enumerated()), id: \.offset) { (i, date) in
                let isToday = cal.isDateInToday(date)
                let dayNum = cal.component(.day, from: date)
                let active = i < activeDays.count && activeDays[i]

                VStack(spacing: 6) {
                    Text(labels[i % 7])
                        .font(WSFont.sans(11, weight: .black))
                        .tracking(0.6)
                        .foregroundStyle(isToday ? WSColor.foreground : WSColor.foregroundMuted)

                    Text("\(dayNum)")
                        .font(WSFont.headline(15, weight: .black))
                        .foregroundStyle(isToday || active ? WSColor.inkText : WSColor.foreground)
                        .frame(width: 38, height: 38)
                        .background(
                            ZStack {
                                if isToday || active {
                                    Circle().fill(WSColor.ink).offset(y: 3)
                                }
                                Circle().fill(isToday ? WSColor.lime : (active ? WSColor.orange : WSColor.backgroundElevated))
                                Circle().strokeBorder(WSColor.ink.opacity(isToday || active ? 1 : 0.3), lineWidth: 2)
                            }
                        )
                }
                .frame(maxWidth: .infinity)
            }
        }
    }

    /// Convenience: the current Monday-first week + per-day activity flags
    /// from a set of active `yyyy-MM-dd`-style start-of-day dates.
    static func currentWeek(activeDates: Set<String> = []) -> WSWeekCalendarStrip {
        var cal = Calendar.current
        cal.firstWeekday = 2 // Monday
        let today = cal.startOfDay(for: Date())
        let weekday = cal.component(.weekday, from: today)
        // Distance back to Monday (weekday: 1=Sun … 7=Sat)
        let back = (weekday + 5) % 7
        let monday = cal.date(byAdding: .day, value: -back, to: today) ?? today
        let dates = (0..<7).compactMap { cal.date(byAdding: .day, value: $0, to: monday) }
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        fmt.locale = Locale(identifier: "en_US_POSIX")
        let flags = dates.map { activeDates.contains(fmt.string(from: $0)) }
        return WSWeekCalendarStrip(dates: dates, activeDays: flags)
    }
}

// MARK: - Hexagon achievement badge

/// Rounded pointy-top hexagon badge — the mockup's Profile achievements.
/// Earned: tinted fill + white icon + soft tinted shadow. Locked: muted
/// surface + gray icon.
struct WSHexBadge: View {
    var icon: String
    var tint: Color
    var earned: Bool = true
    var size: CGFloat = 62

    var body: some View {
        ZStack {
            WSHexagonShape()
                .fill(WSColor.ink)
                .frame(width: size, height: size * 1.1)
                .offset(y: 3)
            WSHexagonShape()
                .fill(earned ? WSStickerTint.face(for: tint) : WSColor.lilacDeep)
                .overlay(
                    WSHexagonShape()
                        .stroke(WSColor.ink, lineWidth: WSSticker.stroke)
                )
                .frame(width: size, height: size * 1.1)

            Image(systemName: earned ? icon : "lock.fill")
                .font(.system(size: size * 0.34, weight: .black))
                .foregroundStyle(earned ? WSColor.inkText : WSColor.foregroundMuted.opacity(0.6))
        }
        .padding(.bottom, 3)
    }
}

/// Pointy-top hexagon with gently rounded corners.
struct WSHexagonShape: Shape {
    var cornerRadius: CGFloat = 6

    func path(in rect: CGRect) -> Path {
        let w = rect.width, h = rect.height
        let cx = rect.midX
        // Pointy-top hexagon vertices (clockwise from top point).
        let pts: [CGPoint] = [
            CGPoint(x: cx,          y: rect.minY),
            CGPoint(x: rect.maxX,   y: rect.minY + h * 0.25),
            CGPoint(x: rect.maxX,   y: rect.minY + h * 0.75),
            CGPoint(x: cx,          y: rect.maxY),
            CGPoint(x: rect.minX,   y: rect.minY + h * 0.75),
            CGPoint(x: rect.minX,   y: rect.minY + h * 0.25),
        ]
        var path = Path()
        for i in 0..<pts.count {
            let prev = pts[(i + pts.count - 1) % pts.count]
            let curr = pts[i]
            let next = pts[(i + 1) % pts.count]
            // Inset the corner along both edges, then arc through the vertex.
            let d1 = hypot(curr.x - prev.x, curr.y - prev.y)
            let d2 = hypot(next.x - curr.x, next.y - curr.y)
            let r = min(cornerRadius, d1 / 2, d2 / 2)
            let p1 = CGPoint(x: curr.x + (prev.x - curr.x) / d1 * r,
                             y: curr.y + (prev.y - curr.y) / d1 * r)
            let p2 = CGPoint(x: curr.x + (next.x - curr.x) / d2 * r,
                             y: curr.y + (next.y - curr.y) / d2 * r)
            if i == 0 { path.move(to: p1) } else { path.addLine(to: p1) }
            path.addQuadCurve(to: p2, control: curr)
        }
        path.closeSubpath()
        return path
    }
}

// MARK: - Gem chip

struct WSGemChip: View {
    let count: Int
    var icon: String = "diamond.fill"
    var tint: Color = Color(hex: 0x06B6D4)
    var compact: Bool = false

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: compact ? 9 : 11, weight: .black))
            Text("\(count)")
                .font(WSFont.headline(compact ? 11 : 13, weight: .black))
        }
        .foregroundStyle(WSColor.inkText)
        .padding(.horizontal, compact ? 8 : 10)
        .padding(.vertical, compact ? 3 : 5)
        .background(Capsule().fill(WSStickerTint.face(for: tint)))
        .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
    }
}

// MARK: - Heart / lives row

/// 5-heart life row used on the unlock challenge — losing a question
/// pops one off with a wobble + haptic.
struct WSHeartsRow: View {
    let lives: Int
    let total: Int
    var onTap: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<total, id: \.self) { i in
                Image(systemName: i < lives ? "heart.fill" : "heart")
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundStyle(i < lives ? WSColor.pink : WSColor.foregroundMuted.opacity(0.4))
                    .scaleEffect(i < lives ? 1.0 : 0.85)
                    .animation(.wsBouncePop, value: lives)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Capsule().fill(WSColor.backgroundElevated))
        .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
        .onTapGesture { onTap?() }
    }
}

// MARK: - Previews

#Preview("Gamification gallery") {
    ScrollView {
        VStack(spacing: 22) {
            HStack(spacing: 24) {
                WSStreakFlame(count: 12, activeToday: true)
                WSStreakFlame(count: 0, activeToday: false, size: 70)
            }
            HStack(spacing: 24) {
                WSLevelBadge(level: 7)
                WSLevelBadge(level: 14, tint: Color(hex: 0x10B981))
                WSDailyGoalRing(progress: 0.65, icon: "checkmark.bubble.fill")
            }
            WSXPBar(xpInLevel: 240, xpForLevel: 500)
            WSStreakWeekStrip(days: [true, true, false, true, true, false, false], todayIndex: 6)
            HStack(spacing: 10) {
                WSGemChip(count: 1240)
                WSGemChip(count: 4, icon: "heart.fill", tint: WSColor.duoRed)
                WSHeartsRow(lives: 3, total: 5)
            }
        }
        .padding()
    }
    .background(WSGradient.heroBackdrop)
}
