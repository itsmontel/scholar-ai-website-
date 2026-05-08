//
//  DailyGoalStore.swift
//  WriteScholar
//
//  The "did I learn enough today" loop. Mirrors Duolingo's daily-goal
//  XP ring — the user picks a target (Casual / Regular / Serious /
//  Intense) and every meaningful action contributes XP to today's
//  bucket. Hitting the target:
//
//    • Closes the goal ring with a green tick
//    • Bumps the daily-goal streak counter
//    • Fires a confetti burst (the calling view subscribes via the
//      `goalJustHit` Combine publisher)
//    • Triggers a one-shot success haptic + sound
//
//  Persistence: JSON in UserDefaults under `ws.dailyGoal.history`.
//  Day keys are `yyyy-MM-dd` strings to dodge timezone weirdness.
//
//  Threading: @MainActor — every mutation comes from a tap or a
//  coordinator callback that's already on the main thread.
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class DailyGoalStore: ObservableObject {

    // MARK: - Singleton

    static let shared = DailyGoalStore()

    // MARK: - Goal preset

    /// Preset XP targets the user can pick. Same wording as Duolingo
    /// because everyone already understands the cadence.
    enum Target: Int, CaseIterable, Identifiable, Codable {
        case casual   = 20    // ~1 quick activity
        case regular  = 50    // ~2-3 activities  ← default
        case serious  = 100   // ~4-5 activities
        case intense  = 200   // a true session

        var id: Int { rawValue }
        var xp: Int { rawValue }

        var label: String {
            switch self {
            case .casual:  return "Casual"
            case .regular: return "Regular"
            case .serious: return "Serious"
            case .intense: return "Intense"
            }
        }

        var emoji: String {
            switch self {
            case .casual:  return "🌱"
            case .regular: return "🎯"
            case .serious: return "🔥"
            case .intense: return "🏆"
            }
        }

        var blurb: String {
            switch self {
            case .casual:  return "About 5 minutes a day."
            case .regular: return "10–15 minutes a day."
            case .serious: return "20–30 minutes a day."
            case .intense: return "An hour-plus a day."
            }
        }

        var tint: Color {
            switch self {
            case .casual:  return Color(hex: 0x10B981)
            case .regular: return Color(hex: 0xF59E0B)
            case .serious: return Color(hex: 0xEF4444)
            case .intense: return Color(hex: 0x7C3AED)
            }
        }
    }

    // MARK: - Activity buckets

    /// What the user did. We keep these in stats so the home card can
    /// say "+10 XP — Pack generated" instead of just bumping the bar.
    enum Activity: String, Codable, Equatable {
        case studyPackGenerated
        case quizCompleted
        case quizPerfectScore
        case flashcardsReviewed
        case lessonRead
        case craterBlastPlayed
        case wordTowerPlayed
        case focusUnlock
        case dailyOpen      // First app open of the day

        var xp: Int {
            switch self {
            // Pack generation no longer awards XP — the user explicitly
            // asked for this. Reward *using* the pack (quizzes, flashcards,
            // games) rather than just creating one. We keep the case so
            // the activity log still shows "Pack generated" entries.
            case .studyPackGenerated: return 0
            case .quizCompleted:      return 15
            case .quizPerfectScore:   return 10  // bonus on top of completion
            case .flashcardsReviewed: return 10
            case .lessonRead:         return 8
            case .craterBlastPlayed:  return 12
            case .wordTowerPlayed:    return 12
            case .focusUnlock:        return 10
            case .dailyOpen:          return 5
            }
        }

        /// Maximum XP this single activity can contribute to today's bucket.
        /// Stops a user from spamming one action to farm XP. `Int.max`
        /// means no cap (e.g. dailyOpen only fires once per day anyway).
        /// Enforced in `DailyGoalStore.record(...)`.
        var dailyCap: Int {
            switch self {
            case .studyPackGenerated: return 0       // 0 XP/event regardless
            case .quizCompleted:      return 60      // ≈ 4 quizzes/day
            case .quizPerfectScore:   return 30      // ≈ 3 perfect scores/day
            case .flashcardsReviewed: return 40      // ≈ 4 deck reviews/day
            case .lessonRead:         return 24      // 3 lessons/day
            case .craterBlastPlayed:  return 48      // 4 games/day
            case .wordTowerPlayed:    return 48      // 4 games/day
            case .focusUnlock:        return 30      // 3 unlocks/day
            case .dailyOpen:          return .max    // fires once per day
            }
        }

        var label: String {
            switch self {
            case .studyPackGenerated: return "Pack generated"
            case .quizCompleted:      return "Quiz finished"
            case .quizPerfectScore:   return "Perfect quiz!"
            case .flashcardsReviewed: return "Flashcards reviewed"
            case .lessonRead:         return "Lesson read"
            case .craterBlastPlayed:  return "Crater Blast played"
            case .wordTowerPlayed:    return "Word Tower played"
            case .focusUnlock:        return "Focus unlock passed"
            case .dailyOpen:          return "Daily check-in"
            }
        }

        var icon: String {
            switch self {
            case .studyPackGenerated: return "graduationcap.fill"
            case .quizCompleted:      return "checkmark.bubble.fill"
            case .quizPerfectScore:   return "star.fill"
            case .flashcardsReviewed: return "rectangle.on.rectangle.angled.fill"
            case .lessonRead:         return "book.pages.fill"
            case .craterBlastPlayed:  return "burst.fill"
            case .wordTowerPlayed:    return "building.2.fill"
            case .focusUnlock:        return "lock.open.fill"
            case .dailyOpen:          return "sparkles"
            }
        }
    }

    /// One row inside the daily history. A day is "complete" when the
    /// sum of its `xp` reaches `target`.
    struct DayLog: Codable, Equatable, Identifiable {
        let id: String          // yyyy-MM-dd
        let date: Date          // start-of-day local time
        var target: Int
        var xp: Int
        var entries: [Entry]

        struct Entry: Codable, Equatable, Identifiable {
            let id: UUID
            let activity: Activity
            let xp: Int
            let at: Date
            /// Optional human-readable label for the History sheet, e.g. the
            /// quiz title or game subject. Older persisted entries decode
            /// fine because the field is optional.
            let title: String?
            /// Optional one-line context, e.g. "12/15 · 80%" or "Score 4200".
            let subtitle: String?

            init(activity: Activity, xp: Int? = nil, at: Date = Date(),
                 title: String? = nil, subtitle: String? = nil) {
                self.id = UUID()
                self.activity = activity
                self.xp = xp ?? activity.xp
                self.at = at
                self.title = title
                self.subtitle = subtitle
            }
        }

        var isComplete: Bool { xp >= target && target > 0 }
        var fraction: Double {
            guard target > 0 else { return 0 }
            return min(1.0, Double(xp) / Double(target))
        }
    }

    // MARK: - Published state

    @Published private(set) var target: Target = .regular {
        didSet { persistTarget(); applyTargetToToday() }
    }

    @Published private(set) var history: [DayLog] = []

    /// Toggled briefly when today's goal hits 100% so the UI can react
    /// (confetti, haptic, etc.). Reset back to nil after a frame.
    @Published var goalJustHit: Date? = nil

    // MARK: - Storage keys

    private enum Keys {
        static let target  = "ws.dailyGoal.target"
        static let history = "ws.dailyGoal.history.v1"
    }

    private let defaults: UserDefaults = .standard

    private init() {
        loadFromDisk()
        // Make sure today exists with the right target so the ring
        // renders even when the user hasn't done anything yet.
        applyTargetToToday()
    }

    // MARK: - Convenience

    var todayLog: DayLog {
        let key = Self.dayKey(for: Date())
        if let existing = history.first(where: { $0.id == key }) {
            return existing
        }
        let new = DayLog(id: key,
                         date: Calendar.current.startOfDay(for: Date()),
                         target: target.xp,
                         xp: 0,
                         entries: [])
        return new
    }

    var todayXP: Int { todayLog.xp }
    var todayFraction: Double { todayLog.fraction }
    var todayIsComplete: Bool { todayLog.isComplete }

    /// XP already awarded today for a single activity. Drives the
    /// per-activity daily cap in `record(...)`.
    func todayXP(for activity: Activity) -> Int {
        todayLog.entries
            .filter { $0.activity == activity }
            .reduce(0) { $0 + $1.xp }
    }

    /// Number of consecutive recent days where the goal was met,
    /// counting back from today (or yesterday if today isn't done yet).
    var consecutiveCompletedDays: Int {
        let cal = Calendar.current
        var count = 0
        var cursor = Date()
        // Tolerate today not being done yet: if today isn't complete,
        // we start counting from yesterday so the streak doesn't fall
        // to 0 mid-morning.
        if !todayIsComplete {
            cursor = cal.date(byAdding: .day, value: -1, to: cursor) ?? cursor
        }
        while true {
            let key = Self.dayKey(for: cursor)
            guard let log = history.first(where: { $0.id == key }), log.isComplete else {
                break
            }
            count += 1
            cursor = cal.date(byAdding: .day, value: -1, to: cursor) ?? cursor
            if count > 365 { break } // safety
        }
        return count
    }

    // MARK: - Mutating API

    /// Update the user's daily target. Re-applies it to today's log so
    /// the ring resizes immediately.
    func setTarget(_ newTarget: Target) {
        target = newTarget
        Haptics.medium()
    }

    /// Record an activity completion. Returns the XP actually awarded
    /// (may be 0 if the activity has hit its daily cap, or if the
    /// activity itself awards 0 XP). Always logs the entry to today's
    /// `entries` list so the History sheet still shows what happened —
    /// the cap only affects the XP tally and the goal ring.
    @discardableResult
    func record(_ activity: Activity,
                xp: Int? = nil,
                title: String? = nil,
                subtitle: String? = nil) -> Int {
        let nominal = xp ?? activity.xp
        let key = Self.dayKey(for: Date())

        // Apply the per-activity daily cap. Look at how much of this
        // activity's XP has already been awarded today and only grant
        // up to the remaining headroom.
        let alreadyToday = todayXP(for: activity)
        let headroom = max(0, activity.dailyCap - alreadyToday)
        let award = max(0, min(nominal, headroom))

        let wasCompleteBefore = (history.first(where: { $0.id == key })?.isComplete ?? false)

        if let idx = history.firstIndex(where: { $0.id == key }) {
            history[idx].xp += award
            history[idx].entries.append(.init(activity: activity, xp: award, title: title, subtitle: subtitle))
        } else {
            let log = DayLog(
                id: key,
                date: Calendar.current.startOfDay(for: Date()),
                target: target.xp,
                xp: award,
                entries: [.init(activity: activity, xp: award, title: title, subtitle: subtitle)]
            )
            history.append(log)
        }

        // Trim to last 365 days
        if history.count > 365 {
            history = history
                .sorted { $0.date > $1.date }
                .prefix(365)
                .map { $0 }
        }

        persistHistory()

        // Did this push us across the finish line?
        let isCompleteNow = (history.first(where: { $0.id == key })?.isComplete ?? false)
        if !wasCompleteBefore && isCompleteNow {
            goalJustHit = Date()
            Haptics.success()
        } else {
            Haptics.light()
        }

        return award
    }

    /// Reset everything (debug + settings sheet "Clear history" action).
    func clearHistory() {
        history.removeAll()
        persistHistory()
        applyTargetToToday()
    }

    // MARK: - Day key helper

    private static func dayKey(for date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.string(from: date)
    }

    // MARK: - Persistence

    private func loadFromDisk() {
        if let raw = defaults.string(forKey: Keys.target),
           let parsed = Int(raw),
           let t = Target(rawValue: parsed) {
            target = t
        }
        if let data = defaults.data(forKey: Keys.history),
           let decoded = try? JSONDecoder().decode([DayLog].self, from: data) {
            history = decoded
        }
    }

    private func persistTarget() {
        defaults.set(String(target.rawValue), forKey: Keys.target)
    }

    private func persistHistory() {
        guard let data = try? JSONEncoder().encode(history) else { return }
        defaults.set(data, forKey: Keys.history)
    }

    /// Make sure today's row exists with the *current* target — handy
    /// when the user changes targets mid-day.
    private func applyTargetToToday() {
        let key = Self.dayKey(for: Date())
        if let idx = history.firstIndex(where: { $0.id == key }) {
            history[idx].target = target.xp
            persistHistory()
        } else {
            history.append(DayLog(
                id: key,
                date: Calendar.current.startOfDay(for: Date()),
                target: target.xp,
                xp: 0,
                entries: []
            ))
            persistHistory()
        }
    }

    // MARK: - History query helpers

    /// Last `n` days (newest → oldest), filling missing days with empty
    /// logs so the calendar/heatmap can render gaps.
    func lastDays(_ n: Int) -> [DayLog] {
        let cal = Calendar.current
        var out: [DayLog] = []
        out.reserveCapacity(n)
        for back in 0..<n {
            guard let day = cal.date(byAdding: .day, value: -back, to: Date()) else { continue }
            let key = Self.dayKey(for: day)
            if let existing = history.first(where: { $0.id == key }) {
                out.append(existing)
            } else {
                out.append(DayLog(id: key, date: cal.startOfDay(for: day),
                                  target: target.xp, xp: 0, entries: []))
            }
        }
        return out
    }
}
