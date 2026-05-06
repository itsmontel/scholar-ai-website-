//
//  StreakAPI.swift
//  WriteScholar
//
//  Wraps GET /api/streaks. The backend returns the current streak, the
//  longest-ever streak, the rolling 7-day activity calendar, and a
//  "did you log in today" flag so the dashboard can spark the flame.
//

import Foundation

enum StreakAPI {
    struct StreakInfo: Decodable {
        let currentStreak: Int
        let longestStreak: Int
        let totalActivityDays: Int
        let hasActivityToday: Bool
        /// ISO `YYYY-MM-DD` strings for days the user was active this week.
        let weekActivities: [String]
    }

    /// The streak endpoint returns its envelope at the top level
    /// (no nested `data` field on success), so we use the regular APIClient
    /// envelope decoder which expects `data: T` — the route does include
    /// `data` here, so the standard envelope works.
    static func fetch() async throws -> StreakInfo {
        try await APIClient.shared.get(path: "streaks", requiresAuth: true)
    }
}
