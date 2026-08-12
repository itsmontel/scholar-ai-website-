//
//  GameScoreStore.swift
//  WriteScholar
//
//  Arcade high scores. One number per game, persisted in UserDefaults,
//  published so the Arcade rows ("High score: 1,250") update live the
//  moment a run beats the record.
//
//  `submit(_:for:)` returns whether the run set a new record so game-over
//  screens can celebrate (confetti + "New high score!").
//
//  Threading: @MainActor — scores land from game-over UI callbacks.
//

import Foundation
import SwiftUI

/// Every arcade game that keeps a high score.
enum ArcadeGame: String, CaseIterable, Identifiable, Codable {
    case wordBlitz
    case craterBlast
    case memoryMatch
    case quizRun
    case wordTower

    var id: String { rawValue }

    var title: String {
        switch self {
        case .wordBlitz:   return "Word Blitz"
        case .craterBlast: return "Crater Blast"
        case .memoryMatch: return "Memory Match"
        case .quizRun:     return "Quiz Run"
        case .wordTower:   return "Word Tower"
        }
    }

    var blurb: String {
        switch self {
        case .wordBlitz:   return "Find words, earn points"
        case .craterBlast: return "Shoot & learn concepts"
        case .memoryMatch: return "Match pairs, train memory"
        case .quizRun:     return "Answer fast, score more"
        case .wordTower:   return "Stack words, beat your streak"
        }
    }

    var icon: String {
        switch self {
        case .wordBlitz:   return "bolt.fill"
        case .craterBlast: return "burst.fill"
        case .memoryMatch: return "square.grid.2x2.fill"
        case .quizRun:     return "hare.fill"
        case .wordTower:   return "building.2.fill"
        }
    }

    /// Row-tile tint (mockup: blue / pink-red / blue / yellow / orange).
    var tint: Color {
        switch self {
        case .wordBlitz:   return WSColor.duoBlue
        case .craterBlast: return WSColor.duoPink
        case .memoryMatch: return WSColor.duoPurple
        case .quizRun:     return WSColor.duoYellowDark
        case .wordTower:   return WSColor.duoOrange
        }
    }

    /// The XP activity recorded when a run of this game finishes.
    var activity: DailyGoalStore.Activity {
        switch self {
        case .wordBlitz:   return .wordBlitzPlayed
        case .craterBlast: return .craterBlastPlayed
        case .memoryMatch: return .memoryMatchPlayed
        case .quizRun:     return .quizRunPlayed
        case .wordTower:   return .wordTowerPlayed
        }
    }
}

@MainActor
final class GameScoreStore: ObservableObject {

    static let shared = GameScoreStore()

    /// game → best score. Published so arcade rows refresh live.
    @Published private(set) var highScores: [ArcadeGame: Int] = [:]

    private let defaults: UserDefaults = .standard
    private static let key = "ws.arcade.highScores.v1"

    private init() {
        load()
    }

    func highScore(for game: ArcadeGame) -> Int {
        highScores[game] ?? 0
    }

    /// Record a finished run. Returns `true` when this run set a new
    /// high score (caller celebrates), `false` otherwise.
    @discardableResult
    func submit(_ score: Int, for game: ArcadeGame) -> Bool {
        guard score > 0 else { return false }
        let best = highScores[game] ?? 0
        guard score > best else { return false }
        highScores[game] = score
        persist()
        return true
    }

    // MARK: - Persistence

    private func load() {
        guard let data = defaults.data(forKey: Self.key),
              let decoded = try? JSONDecoder().decode([String: Int].self, from: data) else { return }
        var out: [ArcadeGame: Int] = [:]
        for (raw, score) in decoded {
            if let game = ArcadeGame(rawValue: raw) { out[game] = score }
        }
        highScores = out
    }

    private func persist() {
        let raw = Dictionary(uniqueKeysWithValues: highScores.map { ($0.key.rawValue, $0.value) })
        guard let data = try? JSONEncoder().encode(raw) else { return }
        defaults.set(data, forKey: Self.key)
    }
}
