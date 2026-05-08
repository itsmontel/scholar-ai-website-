//
//  NotificationService.swift
//  WriteScholar
//
//  Local-only notifications. No remote push, no APNs, no server. The
//  service schedules two recurring local notifications and one ad-hoc
//  "you're about to lose your streak" warning:
//
//    1. Daily reminder       — Fires at the user's preferred hour each
//                               day (default 7pm). Skipped if the user
//                               has already met their daily goal.
//    2. Streak rescue        — Fires at 9pm if the user has a current
//                               streak ≥ 2 days and hasn't been active
//                               today yet. (Skipped on goal-met days.)
//    3. Focus reset          — Fires when the Focus unlock window ends.
//                               Already handled inside FocusManager
//                               via a foreground Timer; this service
//                               just provides a unified API.
//
//  All scheduling is idempotent — calling refreshAll() will tear down
//  the existing pending requests and re-add them, so changing the
//  reminder hour just works.
//
//  The user toggles these on/off via the Settings sheet; preferences
//  live in UserDefaults under `ws.notify.*`.
//
//  Authorization: requestAuthorizationIfNeeded() runs once on app
//  launch (called from WriteScholarApp). If the user denies, the rest
//  of the API silently no-ops.
//

import Foundation
import UserNotifications

@MainActor
final class NotificationService {

    // MARK: - Singleton

    static let shared = NotificationService()

    // MARK: - Identifiers

    private enum NotificationID {
        static let dailyReminder = "ws.notify.dailyReminder"
        static let streakRescue  = "ws.notify.streakRescue"
        static let focusReset    = "ws.notify.focusReset"
    }

    // MARK: - User preferences

    private enum Keys {
        static let dailyEnabled  = "ws.notify.daily.enabled"
        static let streakEnabled = "ws.notify.streak.enabled"
        static let dailyHour     = "ws.notify.daily.hour"     // 0…23
        static let dailyMinute   = "ws.notify.daily.minute"   // 0…59
        static let didRequestAuth = "ws.notify.didRequestAuth"
    }

    private let defaults: UserDefaults = .standard

    var dailyEnabled: Bool {
        get { defaults.object(forKey: Keys.dailyEnabled) as? Bool ?? true }
        set { defaults.set(newValue, forKey: Keys.dailyEnabled); refreshAll() }
    }

    var streakRescueEnabled: Bool {
        get { defaults.object(forKey: Keys.streakEnabled) as? Bool ?? true }
        set { defaults.set(newValue, forKey: Keys.streakEnabled); refreshAll() }
    }

    /// 0…23. Defaults to 19 (7pm).
    var dailyReminderHour: Int {
        get { (defaults.object(forKey: Keys.dailyHour) as? Int) ?? 19 }
        set { defaults.set(newValue, forKey: Keys.dailyHour); refreshAll() }
    }

    /// 0…59. Defaults to 0.
    var dailyReminderMinute: Int {
        get { (defaults.object(forKey: Keys.dailyMinute) as? Int) ?? 0 }
        set { defaults.set(newValue, forKey: Keys.dailyMinute); refreshAll() }
    }

    // MARK: - Authorization

    /// Request authorization the first time the app is opened. After the
    /// user has been asked, we don't ask again — the Settings sheet
    /// shows a "Enable in iOS Settings" link instead.
    func requestAuthorizationIfNeeded() async {
        if defaults.bool(forKey: Keys.didRequestAuth) { return }
        defaults.set(true, forKey: Keys.didRequestAuth)
        do {
            _ = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
            await MainActor.run { refreshAll() }
        } catch {
            print("⚠️ NotificationService: authorization failed — \(error)")
        }
    }

    /// Probe the current authorization status without prompting.
    func currentAuthorizationStatus() async -> UNAuthorizationStatus {
        await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
    }

    // MARK: - Public API

    /// Tear down + re-add every recurring notification. Cheap; safe
    /// to call from any "user changed a preference" callback.
    func refreshAll() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [
            NotificationID.dailyReminder,
            NotificationID.streakRescue
        ])

        Task {
            let status = await currentAuthorizationStatus()
            guard status == .authorized || status == .provisional else { return }
            await scheduleDailyReminder()
            await scheduleStreakRescue()
        }
    }

    /// Cancel one specific reminder. Used when the user opts out from
    /// the Settings sheet.
    func cancel(_ id: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [id])
    }

    // MARK: - Schedulers

    private func scheduleDailyReminder() async {
        guard dailyEnabled else { return }

        // Skip the daily reminder once the user has already smashed
        // today's goal — no point pestering them.
        // (This relies on `refreshAll()` being called when the goal hits;
        //  see HomeTabView's onChange handler.)
        if DailyGoalStore.shared.todayIsComplete { return }

        let content = UNMutableNotificationContent()
        content.title = "Time to study! 📚"
        content.body = goalReminderBody
        content.sound = .default

        var dateComponents = DateComponents()
        dateComponents.hour = dailyReminderHour
        dateComponents.minute = dailyReminderMinute
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)

        let request = UNNotificationRequest(
            identifier: NotificationID.dailyReminder,
            content: content,
            trigger: trigger
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("⚠️ NotificationService: scheduleDailyReminder failed — \(error)")
        }
    }

    private func scheduleStreakRescue() async {
        guard streakRescueEnabled else { return }
        // Only relevant if the user actually has a streak going.
        let dailyStreak = DailyGoalStore.shared.consecutiveCompletedDays
        guard dailyStreak >= 2 else { return }

        // 9pm rescue notification — but only if today isn't done yet.
        // We re-schedule daily, so this is fine to gate on today's state.
        if DailyGoalStore.shared.todayIsComplete { return }

        let content = UNMutableNotificationContent()
        content.title = "Don't lose your \(dailyStreak)-day streak! 🔥"
        content.body  = "Open the app and earn a few XP to keep it alive."
        content.sound = .default

        var dateComponents = DateComponents()
        dateComponents.hour = 21        // 9pm
        dateComponents.minute = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)

        let request = UNNotificationRequest(
            identifier: NotificationID.streakRescue,
            content: content,
            trigger: trigger
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("⚠️ NotificationService: scheduleStreakRescue failed — \(error)")
        }
    }

    // MARK: - Body copy

    private var goalReminderBody: String {
        let store = DailyGoalStore.shared
        let xp = store.todayXP
        let target = store.todayLog.target
        if xp == 0 {
            return "Spend 5 minutes on a study pack — keep your streak alive."
        }
        let remaining = max(0, target - xp)
        return "You're \(remaining) XP away from today's goal."
    }

    // MARK: - One-shot focus reset

    /// Scheduled by FocusManager when an unlock window opens. Fires
    /// when the window expires so the user knows their apps re-locked.
    func scheduleFocusResetNotification(at fireDate: Date) {
        cancel(NotificationID.focusReset)
        let content = UNMutableNotificationContent()
        content.title = "Focus is back on 🛡️"
        content.body  = "Your unlock window ended — apps are shielded again."
        content.sound = .default

        let interval = max(1, fireDate.timeIntervalSinceNow)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        let request = UNNotificationRequest(
            identifier: NotificationID.focusReset,
            content: content,
            trigger: trigger
        )
        UNUserNotificationCenter.current().add(request) { error in
            if let e = error {
                print("⚠️ NotificationService: scheduleFocusReset failed — \(e)")
            }
        }
    }
}
