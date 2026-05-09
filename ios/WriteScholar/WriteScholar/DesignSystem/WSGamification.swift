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
        let activeFlame  = WSColor.duoOrange
        let activeRing   = WSColor.duoOrangeDark
        let dormantTint  = Color(hex: 0x94A3B8)
        let dormantRing  = Color(hex: 0xCBD5E1)
        let chipFill     = activeToday ? WSColor.duoRed : dormantTint
        let chipStroke   = activeToday ? WSColor.duoRedDark : Color(hex: 0x64748B)

        ZStack {
            // Outer halo — soft solid wash via blur+opacity (no radial gradient)
            Circle()
                .fill((activeToday ? activeFlame : dormantTint).opacity(activeToday ? 0.32 : 0.18))
                .frame(width: size * 1.6, height: size * 1.6)
                .scaleEffect(pulse)
                .blur(radius: 14)

            // Outer ring — solid color
            Circle()
                .stroke(activeToday ? activeRing : dormantRing, lineWidth: 4)
                .frame(width: size, height: size)

            // Inner fill — solid (was a radial gradient)
            Circle()
                .fill(activeToday ? Color(hex: 0xFFF4D8) : WSColor.surface)
                .frame(width: size - 8, height: size - 8)

            // Flame icon — solid color
            Image(systemName: "flame.fill")
                .font(.system(size: size * 0.42, weight: .black))
                .foregroundStyle(activeToday ? activeFlame : dormantTint)
                .scaleEffect(pulse)
                .rotationEffect(.degrees(spin))
                .shadow(color: activeToday ? activeRing.opacity(0.55) : .clear, radius: 6)

            // Streak count chip — solid red on red-dark with chunky border lip feel
            Text("\(count)")
                .font(.system(size: size * 0.28, weight: .black, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, max(7, size * 0.10))
                .padding(.vertical, max(2, size * 0.05))
                .background(
                    Capsule()
                        .fill(chipFill)
                        .overlay(Capsule().stroke(chipStroke, lineWidth: 1.5))
                        .shadow(color: .black.opacity(0.20), radius: 4, y: 2)
                )
                .offset(x: size * 0.30, y: size * 0.32)
        }
        .onAppear {
            guard activeToday else { return }
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                pulse = 1.10
            }
            withAnimation(.easeInOut(duration: 4.0).repeatForever(autoreverses: true)) {
                spin = 4
            }
        }
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
                            .font(.system(size: 12, weight: .black, design: .rounded))
                            .foregroundStyle(WSColor.foreground)
                    }
                    Spacer()
                    Text("\(Int(fraction * 100))%")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(tint)
                }
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    // Track
                    RoundedRectangle(cornerRadius: height, style: .continuous)
                        .fill(WSColor.surface)
                        .overlay(
                            RoundedRectangle(cornerRadius: height, style: .continuous)
                                .stroke(WSColor.hairline, lineWidth: 1)
                        )

                    // Fill — solid color, with a thin white inner stroke for sheen
                    RoundedRectangle(cornerRadius: height, style: .continuous)
                        .fill(tint)
                        .frame(width: max(height, geo.size.width * fraction))
                        .overlay(
                            RoundedRectangle(cornerRadius: height, style: .continuous)
                                .stroke(.white.opacity(0.40), lineWidth: 1)
                        )
                        .shadow(color: tint.opacity(0.4), radius: 4, y: 2)
                        .animation(.wsBouncePop, value: fraction)
                }
            }
            .frame(height: height)
        }
    }
}

// MARK: - Level badge

struct WSLevelBadge: View {
    let level: Int
    var size: CGFloat = 60
    var tint: Color = WSColor.brandPrimary

    var body: some View {
        ZStack(alignment: .top) {
            // 3D lip — darker tint a few pts below the top face
            Circle()
                .fill(tint.mix(with: .black, by: 0.22))
                .frame(width: size, height: size)
                .padding(.top, size * 0.08)

            // Top face — solid color with white inner stroke
            Circle()
                .fill(tint)
                .frame(width: size, height: size)
                .overlay(Circle().stroke(.white.opacity(0.30), lineWidth: 2))
                .shadow(color: tint.opacity(0.45), radius: 8, y: 3)

            // Level number
            VStack(spacing: 0) {
                Text("LV")
                    .font(.system(size: size * 0.16, weight: .black, design: .rounded))
                    .tracking(1.0)
                    .foregroundStyle(.white.opacity(0.85))
                Text("\(level)")
                    .font(.system(size: size * 0.42, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
            }
            .padding(.top, size * 0.18)
        }
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
                .stroke(WSColor.duoBorder.opacity(0.55), lineWidth: 6)
                .frame(width: size, height: size)

            // Progress arc — solid tint, no gradient
            Circle()
                .trim(from: 0, to: max(0.001, min(1.0, progress)))
                .stroke(tint,
                        style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .frame(width: size, height: size)
                .shadow(color: tint.opacity(0.4), radius: 4, y: 1)
                .animation(.wsBouncePop, value: progress)

            // Center icon — solid color
            Image(systemName: icon)
                .font(.system(size: size * 0.36, weight: .black))
                .foregroundStyle(tint)
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
                        .font(.system(size: 9, weight: .black, design: .rounded))
                        .tracking(0.6)
                        .foregroundStyle(i == todayIndex ? WSColor.foreground : WSColor.foregroundMuted)

                    ZStack {
                        Circle()
                            .fill(active ? WSColor.duoOrange : WSColor.surface)
                            .overlay(
                                Circle()
                                    .stroke(active
                                            ? WSColor.duoOrangeDark
                                            : (i == todayIndex ? WSColor.brandPrimary : Color.clear),
                                            lineWidth: 2)
                            )
                            .frame(width: 26, height: 26)
                        if active {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 12, weight: .black))
                                .foregroundStyle(.white)
                        } else if i == todayIndex {
                            Circle().fill(WSColor.brandPrimary).frame(width: 6, height: 6)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
            }
        }
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
                .foregroundStyle(tint)
            Text("\(count)")
                .font(.system(size: compact ? 11 : 13, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.foreground)
        }
        .padding(.horizontal, compact ? 8 : 10)
        .padding(.vertical, compact ? 3 : 5)
        .background(
            Capsule()
                .fill(tint.opacity(0.14))
                .overlay(Capsule().stroke(tint.opacity(0.40), lineWidth: 1))
        )
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
                    .foregroundStyle(i < lives ? WSColor.duoRed : Color(hex: 0xCBD5E1))
                    .scaleEffect(i < lives ? 1.0 : 0.95)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(
            Capsule()
                .fill(WSColor.backgroundElevated)
                .overlay(Capsule().stroke(WSColor.hairline, lineWidth: 1))
        )
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
