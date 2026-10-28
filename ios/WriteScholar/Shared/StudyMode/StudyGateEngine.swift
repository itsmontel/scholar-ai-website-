//
//  StudyGateEngine.swift
//  WriteScholar (shared with the StudyGate extensions)
//
//  Turns Study Mode state into Screen Time settings. Apple calls the
//  screen it puts in front of an app a "shield"; for us it is the
//  question screen, and an app is only ever "gated", never locked away.
//
//  `apply()` is the one place that decides which apps ask a question.
//  The main app calls it when settings change, the action extension
//  calls it after a right answer, and the monitor extension calls it when
//  an unlock runs out. Because every caller recomputes from App Group
//  state, there is nothing to keep in sync between processes.
//

import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

/// The thing the user tapped: an app, or a website in Safari.
enum StudyGateTarget {
    case app(ApplicationToken)
    case webDomain(WebDomainToken)
}

enum StudyGateEngine {

    /// Same named store FocusManager has always used, so updating to this
    /// version takes over the existing settings rather than stacking a
    /// second set on top.
    static var storeName: ManagedSettingsStore.Name { .init("WriteScholarFocus") }

    /// DeviceActivity names for unlock timers. The monitor extension only
    /// reacts to names with this prefix.
    static let relockPrefix = "ws.relock."

    /// Timer IDs for the in-app challenge's whole-phone unlock start with
    /// this, so they are pruned by the global window rather than per app.
    static let globalTimerPrefix = "global-"

    // MARK: - State

    static var config: StudyModeConfig {
        get {
            if let stored = StudyModeStore.storedConfig { return stored }
            // First launch after this update: people who already picked
            // apps in Focus keep being asked, everyone else starts off.
            var fresh = StudyModeConfig.default
            fresh.isOn = hasItems(chosenSelection)
            return fresh
        }
        set { StudyModeStore.storedConfig = newValue }
    }

    /// Apps picked for "Only apps I choose". Written by FocusManager.
    static var chosenSelection: FamilyActivitySelection {
        selection(forKey: StudyModeStore.Keys.blockedSelection)
    }

    /// Apps that never ask in "All apps" mode (Messages, Maps and so on).
    static var allowedSelection: FamilyActivitySelection {
        get { selection(forKey: StudyModeStore.Keys.allowedSelection) }
        set {
            if let data = try? PropertyListEncoder().encode(newValue) {
                StudyModeStore.defaults.set(data, forKey: StudyModeStore.Keys.allowedSelection)
            }
        }
    }

    static func hasItems(_ selection: FamilyActivitySelection) -> Bool {
        !selection.applicationTokens.isEmpty
            || !selection.categoryTokens.isEmpty
            || !selection.webDomainTokens.isEmpty
    }

    // MARK: - Apply

    /// Recomputes which apps ask a question and hands it to Screen Time.
    static func apply() {
        let store = ManagedSettingsStore(named: storeName)
        let config = self.config

        guard config.isOn, !StudyModeStore.globalUnlockActive else {
            clear(store)
            return
        }

        let unlocks = StudyModeStore.activeUnlocks()
        let decoder = JSONDecoder()
        let openApps = Set(unlocks.filter { !$0.isWebDomain }.compactMap {
            try? decoder.decode(ApplicationToken.self, from: $0.tokenData)
        })
        let openSites = Set(unlocks.filter { $0.isWebDomain }.compactMap {
            try? decoder.decode(WebDomainToken.self, from: $0.tokenData)
        })

        switch config.scope {
        case .allApps:
            let skip = allowedSelection.applicationTokens.union(openApps)
            store.shield.applications = nil
            store.shield.applicationCategories = .all(except: skip)
            store.shield.webDomains = nil
            store.shield.webDomainCategories = nil

        case .chosenApps:
            let chosen = chosenSelection
            guard hasItems(chosen) else {
                clear(store)
                return
            }
            let apps = chosen.applicationTokens.subtracting(openApps)
            store.shield.applications = apps.isEmpty ? nil : apps
            store.shield.applicationCategories = chosen.categoryTokens.isEmpty
                ? nil
                : .specific(chosen.categoryTokens, except: openApps)
            let sites = chosen.webDomainTokens.subtracting(openSites)
            store.shield.webDomains = sites.isEmpty ? nil : sites
            store.shield.webDomainCategories = nil
        }
    }

    private static func clear(_ store: ManagedSettingsStore) {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        store.shield.webDomainCategories = nil
    }

    // MARK: - Answering

    /// Handles a tap on one of the two answer buttons. The primary button
    /// is always option 0 and the secondary option 1, matching how
    /// StudyGateConfigurationExtension draws them.
    static func answer(_ action: ShieldAction, for target: StudyGateTarget) -> ShieldActionResponse {
        guard let question = StudyModeStore.currentQuestion() else {
            // No questions loaded yet (the app has not been opened since
            // install). Never strand someone outside their own app.
            unlock(target)
            return .defer
        }

        let picked = action == .primaryButtonPressed ? 0 : 1
        let correct = picked == question.correctIndex
        StudyModeStore.recordAnswer(correct: correct, to: question)

        if correct {
            unlock(target)
        }
        // `.defer` makes iOS ask the configuration extension again: after a
        // right answer the app is no longer gated so the screen goes away,
        // after a wrong one it redraws with feedback and the next question.
        return .defer
    }

    /// Opens one app or site for `config.unlockMinutes`.
    static func unlock(_ target: StudyGateTarget) {
        let encoder = JSONEncoder()
        let data: Data?
        let isWeb: Bool
        switch target {
        case .app(let token):
            data = try? encoder.encode(token)
            isWeb = false
        case .webDomain(let token):
            data = try? encoder.encode(token)
            isWeb = true
        }
        guard let data else { return }

        let id = UUID().uuidString
        let until = Date().addingTimeInterval(TimeInterval(config.unlockMinutes * 60))
        StudyModeStore.addUnlock(StudyGateUnlock(id: id, tokenData: data, isWebDomain: isWeb, until: until))
        apply()
        scheduleRelock(id: id, at: until)
    }

    // MARK: - Relock timers

    /// Asks iOS to wake StudyGateMonitor at `end`, which re-applies the
    /// gate. Works with WriteScholar closed.
    static func scheduleRelock(id: String, at end: Date) {
        let center = DeviceActivityCenter()
        pruneFinishedTimers(center)

        let calendar = Calendar.current
        let parts: Set<Calendar.Component> = [.year, .month, .day, .hour, .minute, .second]
        // iOS rejects schedules shorter than 15 minutes. Only the end
        // matters here, so a short unlock starts its interval in the past.
        let start = min(Date(), end.addingTimeInterval(-16 * 60))
        let schedule = DeviceActivitySchedule(
            intervalStart: calendar.dateComponents(parts, from: start),
            intervalEnd: calendar.dateComponents(parts, from: end),
            repeats: false
        )
        do {
            try center.startMonitoring(DeviceActivityName(relockPrefix + id), during: schedule)
        } catch {
            print("⚠️ StudyGateEngine: could not schedule relock — \(error)")
        }
    }

    /// iOS caps how many schedules an app can have running, so drop the
    /// ones whose unlock has already ended.
    private static func pruneFinishedTimers(_ center: DeviceActivityCenter) {
        let live = Set(StudyModeStore.activeUnlocks().map { relockPrefix + $0.id })
        let globalPrefix = relockPrefix + globalTimerPrefix
        let finished = center.activities.filter { name in
            guard name.rawValue.hasPrefix(relockPrefix) else { return false }
            if name.rawValue.hasPrefix(globalPrefix) { return !StudyModeStore.globalUnlockActive }
            return !live.contains(name.rawValue)
        }
        if !finished.isEmpty {
            center.stopMonitoring(finished)
        }
    }

    // MARK: - Helpers

    private static func selection(forKey key: String) -> FamilyActivitySelection {
        guard let data = StudyModeStore.defaults.data(forKey: key),
              let decoded = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
        else { return FamilyActivitySelection() }
        return decoded
    }
}
