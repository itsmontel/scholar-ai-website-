//
//  StudyModeStore.swift
//  WriteScholar (shared with the StudyGate extensions)
//
//  Study Mode puts one question from the user's study packs in front of
//  an app when they open it. Answer it right and that app opens.
//
//  This file is compiled into the main app AND the three extensions
//  (StudyGateConfiguration, StudyGateAction, StudyGateMonitor), which run
//  as separate processes. Everything they share lives in the App Group
//  UserDefaults below, so this file must stay free of SwiftUI and of any
//  main-app type.
//
//  Who writes what:
//    • Main app      → config, question deck, chosen/allowed apps
//    • Action ext    → answers (pointer, feedback, stats), app unlocks
//    • Monitor ext   → nothing; it re-applies the gate when an unlock ends
//    • Config ext    → nothing; it only reads to draw the question screen
//

import Foundation

// MARK: - Config

enum StudyModeScope: String, Codable, CaseIterable, Sendable {
    /// Every app asks a question, except the ones on the "always allowed" list.
    case allApps
    /// Only the apps the user picked ask a question.
    case chosenApps
}

struct StudyModeConfig: Codable, Equatable, Sendable {
    var isOn: Bool = false
    var scope: StudyModeScope = .chosenApps
    /// How long an app stays open after a right answer.
    var unlockMinutes: Int = 15
    /// Library item IDs of the packs to draw questions from. Empty = all packs.
    var packIDs: [String] = []

    static let `default` = StudyModeConfig()
    static let unlockChoices = [5, 15, 30, 60]
}

// MARK: - Questions

/// One question as the question screen shows it: a prompt and exactly two
/// answers, because Apple's screen has exactly two buttons.
struct StudyGateQuestion: Codable, Equatable, Identifiable, Sendable {
    let id: String
    let prompt: String
    let options: [String]
    let correctIndex: Int
    /// Pack title, or the topic name for built-in questions.
    let source: String

    var correctAnswer: String { options[correctIndex] }
}

/// What happened on the last answer, so the next question screen can say
/// "Not quite, it was X" before asking again.
struct StudyGateFeedback: Codable, Sendable {
    let wasCorrect: Bool
    let correctAnswer: String
    let at: Date
}

/// An app (or website) the user has answered their way into, until `until`.
/// Tokens are stored as encoded Data so this file needs no Screen Time imports.
struct StudyGateUnlock: Codable, Sendable {
    let id: String
    let tokenData: Data
    let isWebDomain: Bool
    let until: Date
}

struct StudyModeDayStats: Codable, Equatable, Sendable {
    var right: Int = 0
    var wrong: Int = 0
}

// MARK: - Store

enum StudyModeStore {

    /// Must match the App Group in every target's entitlements.
    static let appGroupID = "group.com.writescholar.focus"

    static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroupID) ?? .standard
    }

    enum Keys {
        // Owned by FocusManager, read here.
        static let blockedSelection = "ws.focus.blockedSelection"
        static let globalUnlockUntil = "ws.focus.unlockUntil"
        // Study Mode.
        static let config = "ws.study.config"
        static let allowedSelection = "ws.study.allowedSelection"
        static let deck = "ws.study.deck"
        static let pointer = "ws.study.pointer"
        static let feedback = "ws.study.feedback"
        static let unlocks = "ws.study.unlocks"
        static let statsByDay = "ws.study.statsByDay"
    }

    /// Feedback older than this is stale: the user has moved on.
    static let feedbackWindow: TimeInterval = 90

    // MARK: Config

    /// nil until the user (or the first-launch default in StudyGateEngine)
    /// saves one. Read through `StudyGateEngine.config`.
    static var storedConfig: StudyModeConfig? {
        get {
            guard let data = defaults.data(forKey: Keys.config) else { return nil }
            return try? JSONDecoder().decode(StudyModeConfig.self, from: data)
        }
        set {
            if let newValue, let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: Keys.config)
            } else {
                defaults.removeObject(forKey: Keys.config)
            }
        }
    }

    // MARK: Deck

    static var deck: [StudyGateQuestion] {
        get {
            guard let data = defaults.data(forKey: Keys.deck) else { return [] }
            return (try? JSONDecoder().decode([StudyGateQuestion].self, from: data)) ?? []
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: Keys.deck)
            }
        }
    }

    /// Replaces the deck. Keeps the user on the same question if it is still
    /// in the new deck, so a rebuild never swaps a question out from under
    /// someone who is looking at it.
    static func replaceDeck(_ newDeck: [StudyGateQuestion]) {
        let currentID = currentQuestion()?.id
        deck = newDeck
        if let currentID, let idx = newDeck.firstIndex(where: { $0.id == currentID }) {
            defaults.set(idx, forKey: Keys.pointer)
        } else {
            defaults.set(0, forKey: Keys.pointer)
        }
    }

    static func currentQuestion() -> StudyGateQuestion? {
        let all = deck
        guard !all.isEmpty else { return nil }
        let idx = defaults.integer(forKey: Keys.pointer)
        return all[((idx % all.count) + all.count) % all.count]
    }

    // MARK: Answers

    static var recentFeedback: StudyGateFeedback? {
        guard let data = defaults.data(forKey: Keys.feedback),
              let fb = try? JSONDecoder().decode(StudyGateFeedback.self, from: data),
              Date().timeIntervalSince(fb.at) < feedbackWindow
        else { return nil }
        return fb
    }

    /// Records an answer, moves on to the next question and bumps today's stats.
    static func recordAnswer(correct: Bool, to question: StudyGateQuestion) {
        let fb = StudyGateFeedback(wasCorrect: correct, correctAnswer: question.correctAnswer, at: Date())
        if let data = try? JSONEncoder().encode(fb) {
            defaults.set(data, forKey: Keys.feedback)
        }
        defaults.set(defaults.integer(forKey: Keys.pointer) + 1, forKey: Keys.pointer)

        var map = statsMap
        var today = map[todayKey()] ?? StudyModeDayStats()
        if correct { today.right += 1 } else { today.wrong += 1 }
        map[todayKey()] = today
        // Keep a month, same as Focus stats.
        let cutoff = dayKey(for: Date().addingTimeInterval(-30 * 86_400))
        statsMap = map.filter { $0.key >= cutoff }
    }

    static var todayStats: StudyModeDayStats {
        statsMap[todayKey()] ?? StudyModeDayStats()
    }

    private static var statsMap: [String: StudyModeDayStats] {
        get {
            guard let data = defaults.data(forKey: Keys.statsByDay) else { return [:] }
            return (try? JSONDecoder().decode([String: StudyModeDayStats].self, from: data)) ?? [:]
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: Keys.statsByDay)
            }
        }
    }

    // MARK: Unlocks

    /// Unlocks that have not ended. Ones ending within a few seconds count
    /// as ended, so the monitor firing a moment early still relocks.
    static func activeUnlocks(now: Date = Date()) -> [StudyGateUnlock] {
        allUnlocks.filter { $0.until > now.addingTimeInterval(5) }
    }

    static func addUnlock(_ unlock: StudyGateUnlock) {
        var list = activeUnlocks()
        list.removeAll { $0.tokenData == unlock.tokenData }
        list.append(unlock)
        allUnlocks = list
    }

    static func clearUnlocks() {
        allUnlocks = []
    }

    private static var allUnlocks: [StudyGateUnlock] {
        get {
            guard let data = defaults.data(forKey: Keys.unlocks) else { return [] }
            return (try? JSONDecoder().decode([StudyGateUnlock].self, from: data)) ?? []
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) {
                defaults.set(data, forKey: Keys.unlocks)
            }
        }
    }

    /// The whole-phone unlock from the in-app 5-question challenge.
    static var globalUnlockActive: Bool {
        let ts = defaults.double(forKey: Keys.globalUnlockUntil)
        return ts > 0 && Date(timeIntervalSince1970: ts) > Date().addingTimeInterval(5)
    }

    // MARK: Days

    static func todayKey() -> String { dayKey(for: Date()) }

    static func dayKey(for date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.string(from: date)
    }
}
