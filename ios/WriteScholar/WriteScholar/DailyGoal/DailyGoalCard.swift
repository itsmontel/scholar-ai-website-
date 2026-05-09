//
//  DailyGoalCard.swift
//  WriteScholar
//
//  The chunky daily-goal card shown on the Home tab between the streak
//  card and the quick-action grid. Has three states:
//
//    * In progress -- animated XP ring with current/target,
//                    "X XP to go" subtitle, tap -> DailyGoalSheet
//    * Complete    -- green tick + confetti vibe, daily-goal streak count
//    * No target   -- gentle prompt to pick one (only shown if user has
//                    explicitly cleared their target)
//
//  Tapping anywhere on the card opens DailyGoalSheet for a richer
//  picker + 7-day mini-history.
//

import SwiftUI

struct DailyGoalCard: View {
    @ObservedObject var store: DailyGoalStore
    var onTap: () -> Void = {}

    var body: some View {
        Button {
            Haptics.medium()
            onTap()
        } label: {
            HStack(alignment: .center, spacing: 14) {
                ringBlock
                contentBlock
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .foregroundStyle(WSColor.foregroundMuted)
                    .font(.system(size: 12, weight: .heavy))
                    .padding(8)
                    .background(Circle().fill(WSColor.duoSurface))
            }
            .frame(maxWidth: .infinity)
            .wsChunkyCard(
                verticalPadding: 14,
                accent: store.todayIsComplete ? WSColor.duoGreen : WSColor.duoGreen
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    // MARK: - Ring

    private var ringBlock: some View {
        ZStack {
            Circle()
                .stroke(WSColor.duoSurface, lineWidth: 8)
                .frame(width: 72, height: 72)

            Circle()
                .trim(from: 0, to: max(0.001, min(1.0, store.todayFraction)))
                .stroke(
                    WSColor.duoGreen,
                    style: StrokeStyle(lineWidth: 8, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .frame(width: 72, height: 72)
                .shadow(color: WSColor.duoGreen.opacity(0.4), radius: 4, y: 1)
                .animation(.wsBouncePop, value: store.todayFraction)

            if store.todayIsComplete {
                Circle()
                    .fill(WSColor.duoGreen)
                    .frame(width: 36, height: 36)
                Image(systemName: "checkmark")
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(.white)
            } else {
                VStack(spacing: 0) {
                    Text("\(store.todayXP)")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.duoText)
                    Text("/\(store.todayLog.target)")
                        .font(.system(size: 9, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
        }
    }

    // MARK: - Content

    @ViewBuilder
    private var contentBlock: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Text("DAILY GOAL")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .tracking(0.7)
                    .foregroundStyle(WSColor.foregroundMuted)

                Text("\(store.target.emoji) \(store.target.label)")
                    .font(.system(size: 10, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(WSColor.duoGreen))
            }

            if store.todayIsComplete {
                Text("Goal smashed today")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                if store.consecutiveCompletedDays > 1 {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill").foregroundStyle(WSColor.duoOrange)
                        Text("\(store.consecutiveCompletedDays)-day goal streak")
                            .wsBody(.caption, weight: .bold)
                            .foregroundStyle(WSColor.duoOrange)
                    }
                } else {
                    Text("Come back tomorrow to keep your goal streak.")
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            } else {
                let remaining = max(0, store.todayLog.target - store.todayXP)
                Text("\(remaining) XP to go")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                Text(motivationalSubtitle(remaining: remaining))
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
        }
    }

    private func motivationalSubtitle(remaining: Int) -> String {
        if remaining > store.target.xp / 2 {
            return "Generate a study pack -- that's +25 XP."
        } else if remaining > 15 {
            return "Finish a quiz to round it out -- +15 XP."
        } else {
            return "Almost there. One more activity!"
        }
    }
}

#Preview {
    VStack(spacing: 14) {
        DailyGoalCard(store: {
            let s = DailyGoalStore.shared
            return s
        }())
    }
    .padding()
    .background(WSColor.duoSurface)
}
