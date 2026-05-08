//
//  FocusModels.swift
//  WriteScholar
//
//  Lightweight value types for the Focus tab.
//
//  The actual Family Controls / Screen Time integration lives in
//  FocusManager — these are just the small enums + structs that travel
//  between the UI and the manager.
//

import Foundation
import SwiftUI

// MARK: - Challenge type

/// Which kind of unlock challenge the user has to solve when a blocked app
/// is opened. Pulled from the user's most recent study pack, falling back
/// to FocusSampleQuestions when no pack is available.
enum FocusChallengeType: String, CaseIterable, Identifiable, Codable {
    case quiz       = "Quiz"
    case flashcards = "Flashcards"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .quiz:       return "checkmark.bubble.fill"
        case .flashcards: return "rectangle.on.rectangle.angled.fill"
        }
    }

    var blurb: String {
        switch self {
        case .quiz:
            return "Answer 4 of 5 multiple-choice questions correctly to unlock."
        case .flashcards:
            return "Recall the answer on 4 of 5 flashcards to unlock."
        }
    }

    var tint: Color {
        switch self {
        case .quiz:       return Color(hex: 0xD946EF)
        case .flashcards: return Color(hex: 0x7C3AED)
        }
    }
}

// MARK: - Unlock duration

/// How long apps stay unlocked after a successful challenge. Mirrors the
/// presets used by the Chrome extension + website Focus Mode settings.
enum FocusUnlockDuration: Int, CaseIterable, Identifiable, Codable {
    case fiveMinutes      = 5
    case fifteenMinutes   = 15
    case thirtyMinutes    = 30
    case sixtyMinutes     = 60

    var id: Int { rawValue }
    var minutes: Int { rawValue }

    var label: String {
        switch self {
        case .fiveMinutes:    return "5 min"
        case .fifteenMinutes: return "15 min"
        case .thirtyMinutes:  return "30 min"
        case .sixtyMinutes:   return "60 min"
        }
    }

    var caption: String {
        "After unlock, apps stay open for \(label) before relocking."
    }
}

// MARK: - Difficulty

enum FocusDifficulty: String, CaseIterable, Identifiable, Codable {
    case standard
    case hard

    var id: String { rawValue }

    var label: String {
        switch self {
        case .standard: return "Standard"
        case .hard:     return "Hard mode"
        }
    }

    var subtitle: String {
        switch self {
        case .standard:
            return "5 questions, need 4 right. 30s per question."
        case .hard:
            return "5 questions, need 5 right. 15s per question."
        }
    }

    var requiredCorrect: Int { self == .hard ? 5 : 4 }
    var totalQuestions: Int  { 5 }
    var secondsPerQuestion: Int { self == .hard ? 15 : 30 }
}

// MARK: - Challenge result

enum FocusChallengeResult: Equatable {
    case passed(score: Int, of: Int)
    case failed(score: Int, of: Int, cooldown: TimeInterval)
    case bailedOut

    var didUnlock: Bool {
        if case .passed = self { return true }
        return false
    }
}

// MARK: - Topics (used when the user has no study packs)

/// Trivia-pursuit-style categories the user can choose from when they
/// haven't generated a study pack yet. Every question across every
/// topic is curated to be **timeless** — facts that don't change with
/// the news cycle (no records, no current officeholders, no populations
/// that drift year-to-year). The Lakers championship problem.
enum FocusTopic: String, Codable, Hashable, CaseIterable, Identifiable {
    case math       = "math"
    case science    = "science"
    case history    = "history"
    case geography  = "geography"
    case vocabulary = "vocabulary"
    case music      = "music"
    case sports     = "sports"
    case trivia     = "trivia"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .math:       return "Math"
        case .science:    return "Science"
        case .history:    return "History"
        case .geography:  return "Geography"
        case .vocabulary: return "Vocabulary"
        case .music:      return "Music"
        case .sports:     return "Sports"
        case .trivia:     return "General Trivia"
        }
    }

    var blurb: String {
        switch self {
        case .math:       return "Times tables, percentages, basic algebra."
        case .science:    return "Biology, chemistry, physics fundamentals."
        case .history:    return "Empires, treaties, and people who shaped the world."
        case .geography:  return "Capitals, continents, oceans, longest rivers."
        case .vocabulary: return "Definitions, etymology, classic literary terms."
        case .music:      return "Composers, instruments, and basic theory."
        case .sports:     return "Rules, equipment, and timeless traditions."
        case .trivia:     return "A grab-bag of cross-subject facts."
        }
    }

    var icon: String {
        switch self {
        case .math:       return "function"
        case .science:    return "atom"
        case .history:    return "scroll.fill"
        case .geography:  return "globe.europe.africa.fill"
        case .vocabulary: return "text.book.closed.fill"
        case .music:      return "music.note"
        case .sports:     return "figure.run"
        case .trivia:     return "sparkles"
        }
    }

    var tint: Color {
        switch self {
        case .math:       return Color(hex: 0x6366F1)
        case .science:    return Color(hex: 0x10B981)
        case .history:    return Color(hex: 0xB45309)
        case .geography:  return Color(hex: 0x0EA5E9)
        case .vocabulary: return Color(hex: 0x7C3AED)
        case .music:      return Color(hex: 0xD946EF)
        case .sports:     return Color(hex: 0xEF4444)
        case .trivia:     return Color(hex: 0xF59E0B)
        }
    }
}

// MARK: - Aggregate Focus settings

/// Persisted as JSON in UserDefaults (App Group when entitlement granted).
struct FocusSettings: Codable, Equatable {
    var unlockDuration: FocusUnlockDuration = .fifteenMinutes
    var challengeType:  FocusChallengeType  = .quiz
    var difficulty:     FocusDifficulty     = .standard
    /// When true the daily streak counts a day as "focused" once any challenge
    /// is passed. When false the streak only counts pure-block days (no unlocks).
    var streakOnUnlock: Bool = true
    /// When the user has no study packs, the unlock challenge draws from
    /// these topic banks. Defaults to a friendly mixed set.
    var selectedTopics: Set<FocusTopic> = [.math, .science, .geography, .trivia]
    /// When true and the user has at least one study pack, the unlock
    /// challenge prefers their pack's questions over the topic banks.
    /// (Enabled by default — kept here so we can flip it later.)
    var preferStudyPack: Bool = true

    static let `default` = FocusSettings()
}

// MARK: - Lightweight stat snapshot

/// Surfaced on the Focus tab landing screen. Lives in App Group so the
/// (future) DeviceActivityMonitor extension can also write to it.
struct FocusStats: Codable, Equatable {
    var blockedAppsCount: Int = 0
    var challengesPassedToday: Int = 0
    var challengesFailedToday: Int = 0
    var totalChallengesPassed: Int = 0
    var lastUnlockAt: Date? = nil

    static let zero = FocusStats()
}
