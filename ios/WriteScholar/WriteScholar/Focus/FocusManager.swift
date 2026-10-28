//
//  FocusManager.swift
//  WriteScholar
//
//  The single source of truth for the Focus tab. Holds:
//    • The user's chosen apps to block (FamilyActivitySelection)
//    • The Focus settings (unlock duration, challenge type, difficulty)
//    • The current unlock window expiry
//    • Lightweight stats (challenges solved today, total)
//    • Helpers to apply/remove the iOS Shield via ManagedSettings
//
//  Behaviour mirrors the VirtuPet BlockedAppsManager but with two key
//  differences:
//    1. The unlock challenge is a quiz/flashcard recall (not a puzzle)
//    2. The manager degrades gracefully when the Family Controls
//       entitlement isn't granted — the UI keeps working, the shield
//       just doesn't get applied. This lets us ship the feature now and
//       light up real blocking the moment Apple approves the entitlement
//       request for `com.writescholar.app`.
//
//  Persistence:
//    • Uses an App Group UserDefaults when one is available
//      (`group.com.writescholar.focus`), else falls back to .standard
//    • All Codable shapes (FocusSettings, FocusStats) are JSON-encoded
//
//  Threading: marked @MainActor — all mutation should happen on the
//  main thread. Background extensions read via UserDefaults directly.
//

import Foundation
import SwiftUI
import Combine
import FamilyControls
import ManagedSettings

@MainActor
final class FocusManager: ObservableObject {

    // MARK: - Singleton

    static let shared = FocusManager()

    // MARK: - App Group / persistence

    /// The shared App Group identifier. The `DeviceActivityMonitor`,
    /// `ShieldConfiguration`, and `ShieldAction` extension targets (when
    /// added) must match this identifier in their entitlements.
    static let appGroupID = "group.com.writescholar.focus"

    /// Returns the App Group UserDefaults if available, otherwise
    /// `.standard`. The selection of which is opaque to callers.
    private var defaults: UserDefaults {
        UserDefaults(suiteName: Self.appGroupID) ?? .standard
    }

    // MARK: - Published state

    /// The set of apps + categories the user has chosen to block.
    @Published var blockedSelection: FamilyActivitySelection = FamilyActivitySelection()

    /// User-facing settings (unlock duration, challenge type, difficulty).
    @Published var settings: FocusSettings = .default

    /// When non-nil and in the future, the shield is currently lifted.
    @Published var unlockUntil: Date? = nil

    /// Aggregated stats surfaced on the Focus tab landing screen.
    @Published var stats: FocusStats = .zero

    /// Authorization for FamilyControls. Drives whether the picker can
    /// be shown and whether shields will actually be enforced.
    @Published var authorizationStatus: AuthorizationStatus = .notDetermined

    // MARK: Study Mode (one question before an app opens)

    @Published private(set) var studyConfig: StudyModeConfig = .default
    /// Apps that never ask a question in "All apps" mode.
    @Published private(set) var allowedSelection: FamilyActivitySelection = FamilyActivitySelection()
    @Published private(set) var studyDeckCount: Int = 0
    @Published private(set) var studyPackCount: Int = 0
    @Published private(set) var studyUsesTopicBanks: Bool = false
    /// The question the next gated app will ask, for the in-app preview.
    @Published private(set) var studyNextQuestion: StudyGateQuestion? = nil
    @Published private(set) var studyToday: StudyModeDayStats = StudyModeDayStats()

    // MARK: - Private

    private let authCenter = AuthorizationCenter.shared
    private var cancellables = Set<AnyCancellable>()
    private var reblockTimer: Timer?

    // MARK: - Init

    private init() {
        authorizationStatus = authCenter.authorizationStatus
        loadFromDefaults()
        loadStudyMode()

        // Mirror future authorization status changes
        authCenter.$authorizationStatus
            .receive(on: DispatchQueue.main)
            .sink { [weak self] status in
                self?.authorizationStatus = status
            }
            .store(in: &cancellables)

        // If the unlock period was in flight at launch, reschedule the
        // re-block; if it expired, reapply shields immediately.
        scheduleReblockIfNeeded()
    }

    // MARK: - Computed

    var isAuthorized: Bool { authorizationStatus == .approved }

    var hasBlockedApps: Bool {
        !blockedSelection.applicationTokens.isEmpty
            || !blockedSelection.categoryTokens.isEmpty
            || !blockedSelection.webDomainTokens.isEmpty
    }

    var blockedItemsCount: Int {
        blockedSelection.applicationTokens.count
            + blockedSelection.categoryTokens.count
            + blockedSelection.webDomainTokens.count
    }

    var isCurrentlyUnlocked: Bool {
        guard let until = unlockUntil else { return false }
        return Date() < until
    }

    /// True when opening at least one app will ask a question.
    var isStudyModeGating: Bool {
        studyConfig.isOn && (studyConfig.scope == .allApps || hasBlockedApps)
    }

    var allowedAppsCount: Int {
        allowedSelection.applicationTokens.count + allowedSelection.categoryTokens.count
    }

    /// The headline status string shown on the Focus tab.
    var statusHeadline: String {
        if !hasBlockedApps             { return "No apps blocked yet" }
        if !isAuthorized               { return "Permission needed" }
        if isCurrentlyUnlocked         { return "Unlocked" }
        return "Focus is on"
    }

    /// "12m 04s" countdown shown while the unlock window is open.
    var unlockTimeRemainingString: String {
        guard let until = unlockUntil, Date() < until else { return "" }
        let remaining = until.timeIntervalSince(Date())
        let minutes = Int(remaining) / 60
        let seconds = Int(remaining) % 60
        if minutes > 0 { return "\(minutes)m \(seconds)s" }
        return "\(seconds)s"
    }

    // MARK: - Authorization

    /// Requests Family Controls authorization. No-ops gracefully when
    /// the entitlement isn't present in the bundle.
    func requestAuthorization() async {
        do {
            try await authCenter.requestAuthorization(for: .individual)
            authorizationStatus = authCenter.authorizationStatus
            // After approval, apply any persisted blocks
            applyBlockingState()
        } catch {
            // Most commonly this fails when the entitlement isn't
            // granted yet. We surface the status via authorizationStatus
            // and let the UI prompt the user to install the build that
            // includes the (Apple-approved) entitlement.
            authorizationStatus = authCenter.authorizationStatus
            print("⚠️ FocusManager: authorization failed — \(error)")
        }
    }

    // MARK: - Mutating selection

    /// Replace the blocked selection wholesale, persist, and apply.
    func updateBlockedSelection(_ selection: FamilyActivitySelection) {
        blockedSelection = selection
        // Changing the selection invalidates any active unlock window —
        // the user just edited what they want blocked.
        unlockUntil = nil
        stats.blockedAppsCount = blockedItemsCount
        persist()
        applyBlockingState()
    }

    /// Convenience used by the "Clear all" action.
    func clearAllBlocks() {
        updateBlockedSelection(FamilyActivitySelection())
    }

    // MARK: - Settings

    func updateSettings(_ new: FocusSettings) {
        settings = new
        persist()
    }

    // MARK: - Apply / remove shields

    /// Apply the question screen based on current state. Safe to call even
    /// when not authorized: Screen Time ignores it without the entitlement.
    /// StudyGateEngine reads the persisted state, so persist first.
    func applyBlockingState() {
        StudyGateEngine.apply()
    }

    // MARK: - Study Mode

    func setStudyMode(on: Bool) {
        var config = studyConfig
        config.isOn = on
        saveStudyConfig(config)
        if on { rebuildStudyDeck() }
    }

    func setStudyScope(_ scope: StudyModeScope) {
        var config = studyConfig
        config.scope = scope
        saveStudyConfig(config)
    }

    func setStudyUnlockMinutes(_ minutes: Int) {
        var config = studyConfig
        config.unlockMinutes = minutes
        saveStudyConfig(config)
    }

    /// Empty = every pack.
    func setStudyPacks(_ packIDs: [String]) {
        var config = studyConfig
        config.packIDs = packIDs
        saveStudyConfig(config)
        rebuildStudyDeck()
    }

    func updateAllowedSelection(_ selection: FamilyActivitySelection) {
        allowedSelection = selection
        StudyGateEngine.allowedSelection = selection
        applyBlockingState()
    }

    /// Rebuilds the question deck from the current study packs. Cheap
    /// (local JSON only), so it runs whenever the app comes forward.
    func rebuildStudyDeck() {
        let result = StudyModeDeckBuilder.build(config: studyConfig, topics: settings.selectedTopics)
        StudyModeStore.replaceDeck(result.questions)
        studyDeckCount = result.questions.count
        studyPackCount = result.packCount
        studyUsesTopicBanks = result.usesTopicBanks
        studyNextQuestion = StudyModeStore.currentQuestion()
    }

    /// Called when the app comes to the foreground: picks up answers given
    /// on the question screen, drops finished unlocks, refreshes the deck.
    func refreshStudyMode() {
        loadStudyMode()
        rebuildStudyDeck()
        applyBlockingState()
    }

    /// Right answers happen on Apple's question screen, in an extension
    /// that can't reach DailyGoalStore. When the app comes back we credit
    /// any new ones: 2 XP each, logged once.
    private func awardQuestionScreenXP() {
        let key = "ws.study.xpAwarded." + Self.todayKey()
        let alreadyAwarded = UserDefaults.standard.integer(forKey: key)
        let delta = studyToday.right - alreadyAwarded
        guard delta > 0 else { return }
        UserDefaults.standard.set(studyToday.right, forKey: key)
        DailyGoalStore.shared.record(
            .focusUnlock,
            xp: delta * 2,
            title: "Study Mode",
            subtitle: "\(delta) right before an app opened"
        )
    }

    private func saveStudyConfig(_ config: StudyModeConfig) {
        studyConfig = config
        StudyGateEngine.config = config
        applyBlockingState()
    }

    private func loadStudyMode() {
        studyConfig = StudyGateEngine.config
        allowedSelection = StudyGateEngine.allowedSelection
        studyToday = StudyModeStore.todayStats
        awardQuestionScreenXP()
        studyNextQuestion = StudyModeStore.currentQuestion()
        studyDeckCount = StudyModeStore.deck.count
    }

    // MARK: - Challenge result

    /// Called by FocusUnlockChallenge when the user finishes the puzzle.
    /// On a pass we open an unlock window, lift the shield, and bump
    /// stats. On a fail we just bump stats — the UI handles cooldown.
    func handleChallengeResult(_ result: FocusChallengeResult) {
        let today = Self.todayKey()
        switch result {
        case .passed:
            stats.challengesPassedToday += 1
            stats.totalChallengesPassed += 1
            stats.lastUnlockAt = Date()
            unlockUntil = Date().addingTimeInterval(TimeInterval(settings.unlockDuration.minutes * 60))
            persist(updatingDailyKey: today)
            applyBlockingState()
            scheduleReblockIfNeeded()
            // Relock even if WriteScholar is closed when the window ends.
            if let until = unlockUntil {
                StudyGateEngine.scheduleRelock(id: StudyGateEngine.globalTimerPrefix + UUID().uuidString, at: until)
            }
            // Award daily-goal XP for the unlock challenge win + log
            // a richer entry to the History sheet.
            DailyGoalStore.shared.record(
                .focusUnlock,
                title: "Focus unlocked",
                subtitle: "\(settings.unlockDuration.minutes)-minute window"
            )

        case .failed:
            stats.challengesFailedToday += 1
            persist(updatingDailyKey: today)

        case .bailedOut:
            // No state change — user dismissed the challenge sheet.
            break
        }
    }

    // MARK: - Re-block scheduling

    private func scheduleReblockIfNeeded() {
        reblockTimer?.invalidate()
        reblockTimer = nil

        guard let until = unlockUntil else {
            // No active unlock — make sure shields are applied
            applyBlockingState()
            return
        }

        let remaining = until.timeIntervalSinceNow
        if remaining <= 0 {
            // Already expired
            unlockUntil = nil
            persist()
            applyBlockingState()
            return
        }

        // Foreground-only timer — re-applies shields when the unlock
        // window ends. The DeviceActivityMonitor extension (when added)
        // will handle the background equivalent.
        reblockTimer = Timer.scheduledTimer(withTimeInterval: remaining, repeats: false) { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                self.unlockUntil = nil
                self.persist()
                self.applyBlockingState()
            }
        }

        // Schedule a local notification so the user knows when the
        // window ends — works even if the app has been backgrounded.
        NotificationService.shared.scheduleFocusResetNotification(at: until)
    }

    // MARK: - Persistence

    private enum Keys {
        static let blockedSelection = "ws.focus.blockedSelection"
        static let settings         = "ws.focus.settings"
        static let unlockUntil      = "ws.focus.unlockUntil"
        static let statsByDay       = "ws.focus.statsByDay"
        static let totalPassed      = "ws.focus.totalPassed"
        static let lastUnlockAt     = "ws.focus.lastUnlockAt"
    }

    private func loadFromDefaults() {
        // Selection
        if let data = defaults.data(forKey: Keys.blockedSelection),
           let decoded = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
            blockedSelection = decoded
        }

        // Settings
        if let data = defaults.data(forKey: Keys.settings),
           let decoded = try? JSONDecoder().decode(FocusSettings.self, from: data) {
            settings = decoded
        }

        // Unlock window
        let ts = defaults.double(forKey: Keys.unlockUntil)
        if ts > 0 {
            let date = Date(timeIntervalSince1970: ts)
            unlockUntil = date > Date() ? date : nil
        }

        // Stats — only today's day-bucket counts toward today, but we
        // also surface lifetime totals.
        let today = Self.todayKey()
        let map = defaults.dictionary(forKey: Keys.statsByDay) as? [String: [String: Int]] ?? [:]
        let todayBucket = map[today] ?? [:]
        stats = FocusStats(
            blockedAppsCount: blockedItemsCount,
            challengesPassedToday: todayBucket["passed"] ?? 0,
            challengesFailedToday: todayBucket["failed"] ?? 0,
            totalChallengesPassed: defaults.integer(forKey: Keys.totalPassed),
            lastUnlockAt: defaults.object(forKey: Keys.lastUnlockAt) as? Date
        )
    }

    private func persist(updatingDailyKey day: String? = nil) {
        // Selection
        if let data = try? PropertyListEncoder().encode(blockedSelection) {
            defaults.set(data, forKey: Keys.blockedSelection)
        }

        // Settings
        if let data = try? JSONEncoder().encode(settings) {
            defaults.set(data, forKey: Keys.settings)
        }

        // Unlock window
        if let until = unlockUntil {
            defaults.set(until.timeIntervalSince1970, forKey: Keys.unlockUntil)
        } else {
            defaults.removeObject(forKey: Keys.unlockUntil)
        }

        // Stats — daily bucket + lifetime total
        let today = day ?? Self.todayKey()
        var map = defaults.dictionary(forKey: Keys.statsByDay) as? [String: [String: Int]] ?? [:]
        var todayBucket = map[today] ?? [:]
        todayBucket["passed"] = stats.challengesPassedToday
        todayBucket["failed"] = stats.challengesFailedToday
        map[today] = todayBucket
        // Trim to last 30 days
        let cutoff = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
        let cutoffKey = Self.dayKey(for: cutoff)
        map = map.filter { $0.key >= cutoffKey }
        defaults.set(map, forKey: Keys.statsByDay)
        defaults.set(stats.totalChallengesPassed, forKey: Keys.totalPassed)
        if let last = stats.lastUnlockAt {
            defaults.set(last, forKey: Keys.lastUnlockAt)
        }
    }

    private static func todayKey() -> String { dayKey(for: Date()) }

    private static func dayKey(for date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.string(from: date)
    }
}
