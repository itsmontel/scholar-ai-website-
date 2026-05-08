//
//  Achievement.swift
//  WriteScholar
//
//  Direct port of src/data/achievements.ts. Same 90-badge catalog with
//  identical IDs, names, XP values, categories, rarities, and unlock
//  thresholds as the desktop site — server already returns the same
//  `unlockedBadges: { [badgeId]: ISO8601Date }` map and the same
//  `AchievementStats` shape via /api/auth/me.
//

import Foundation
import SwiftUI

// MARK: - Achievement model

struct Achievement: Identifiable, Equatable {
    let id: String
    let name: String
    let creatureName: String
    let description: String
    let xp: Int
    let category: Category
    let rarity: Rarity
    let conditionText: String
    let rule: UnlockRule

    enum Category: String, CaseIterable {
        case gettingStarted = "getting-started"
        case streak
        case mastery
        case subscription
        case special

        var label: String {
            switch self {
            case .gettingStarted: return "Getting Started"
            case .streak:         return "Streak"
            case .mastery:        return "Mastery"
            case .subscription:   return "Subscription"
            case .special:        return "Special"
            }
        }
        var icon: String {
            switch self {
            case .gettingStarted: return "sparkles"
            case .streak:         return "flame.fill"
            case .mastery:        return "trophy.fill"
            case .subscription:   return "crown.fill"
            case .special:        return "star.fill"
            }
        }
    }

    enum Rarity: String, CaseIterable {
        case common, uncommon, rare, epic, legendary

        /// Brand-tinted colour for the badge ring + glow
        var color: Color {
            switch self {
            case .common:    return Color(hex: 0x94A3B8)  // slate
            case .uncommon:  return Color(hex: 0x10B981)  // emerald
            case .rare:      return Color(hex: 0x3B82F6)  // blue
            case .epic:      return Color(hex: 0x8B5CF6)  // violet
            case .legendary: return Color(hex: 0xF59E0B)  // amber
            }
        }
        var label: String { rawValue.capitalized }
    }

    /// Typed unlock condition — mirrors each lambda in BADGES on desktop.
    enum UnlockRule: Equatable {
        case firstLogin
        case visitedBadges
        case isPaidUser
        case isPaidSinceMonthsAgo(Int)

        case uploadsAtLeast(Int)
        case analysesAtLeast(Int)
        case citationsAtLeast(Int)
        case summariesAtLeast(Int)
        case longestStreakAtLeast(Int)
        case toolsUsedEverAtLeast(Int)
        case exportsAtLeast(Int)
        case copiesAtLeast(Int)
        case quickReviewCountAtLeast(Int)
        case quickReviewPerfectAtLeast(Int)
        case quickReviewLongestStreakAtLeast(Int)
        case craterBlastGamesAtLeast(Int)
        case craterBlastPerfectAtLeast(Int)
        case totalStudyToolsAtLeast(Int)
        case totalWordsAnalyzedAtLeast(Int)
        case documentsInSingleDayAtLeast(Int)
        case studyPacksAtLeast(Int)
        case focusModeUnlocksAtLeast(Int)
        case focusModeBlocksAtLeast(Int)

        // v2 — per-tool unlock rules. Server already populates the
        // matching counters in `AchievementStats`; we just hadn't wired
        // badges to them yet.
        case quizzesCountAtLeast(Int)
        case flashcardsCountAtLeast(Int)
        case lessonsCountAtLeast(Int)
        case crosswordsCountAtLeast(Int)

        case usedAfter10pm
        case usedBefore7am
        case midnightUsage
        case weekendUsage
        case comebackKid7Days
    }

    func isUnlocked(stats: AchievementStats) -> Bool {
        switch rule {
        case .firstLogin:                            return stats.firstLogin
        case .visitedBadges:                         return stats.visitedBadges
        case .isPaidUser:                            return stats.isPaidUser
        case .isPaidSinceMonthsAgo(let m):           return stats.isPaidUser && stats.monthsSincePaid >= m
        case .uploadsAtLeast(let n):                 return stats.uploadsCount >= n
        case .analysesAtLeast(let n):                return stats.analysesCount >= n
        case .citationsAtLeast(let n):               return stats.citationsCount >= n
        case .summariesAtLeast(let n):               return stats.summariesCount >= n
        case .longestStreakAtLeast(let n):           return stats.longestStreak >= n
        case .toolsUsedEverAtLeast(let n):           return stats.toolsUsedEver.count >= n
        case .exportsAtLeast(let n):                 return stats.exportsCount >= n
        case .copiesAtLeast(let n):                  return stats.copiesCount >= n
        case .quickReviewCountAtLeast(let n):        return stats.quickReviewCount >= n
        case .quickReviewPerfectAtLeast(let n):      return stats.quickReviewPerfectScores >= n
        case .quickReviewLongestStreakAtLeast(let n):return stats.quickReviewLongestStreak >= n
        case .craterBlastGamesAtLeast(let n):        return stats.craterBlastGames >= n
        case .craterBlastPerfectAtLeast(let n):      return stats.craterBlastPerfectGames >= n
        case .totalStudyToolsAtLeast(let n):         return stats.totalStudyToolsCreated >= n
        case .totalWordsAnalyzedAtLeast(let n):      return stats.totalWordsAnalyzed >= n
        case .documentsInSingleDayAtLeast(let n):    return stats.documentsInSingleDay >= n
        case .studyPacksAtLeast(let n):              return stats.studyPacksCount >= n
        case .focusModeUnlocksAtLeast(let n):        return stats.focusModeUnlocksCount >= n
        case .focusModeBlocksAtLeast(let n):         return stats.focusModeSitesBlocked >= n
        case .quizzesCountAtLeast(let n):            return stats.quizzesCount >= n
        case .flashcardsCountAtLeast(let n):         return stats.flashcardsCount >= n
        case .lessonsCountAtLeast(let n):            return stats.lessonsCount >= n
        case .crosswordsCountAtLeast(let n):         return stats.crosswordsCount >= n
        case .usedAfter10pm:                         return stats.usedAfter10pm
        case .usedBefore7am:                         return stats.usedBefore7am
        case .midnightUsage:                         return stats.midnightUsage
        case .weekendUsage:                          return stats.weekendUsage
        case .comebackKid7Days:                      return stats.daysSinceLastActive >= 7
        }
    }

    /// Returns 0…1 progress fraction for showing a partial bar on locked badges.
    func progress(stats: AchievementStats) -> Double {
        switch rule {
        case .uploadsAtLeast(let n):                 return frac(stats.uploadsCount, n)
        case .analysesAtLeast(let n):                return frac(stats.analysesCount, n)
        case .citationsAtLeast(let n):               return frac(stats.citationsCount, n)
        case .summariesAtLeast(let n):               return frac(stats.summariesCount, n)
        case .longestStreakAtLeast(let n):           return frac(stats.longestStreak, n)
        case .toolsUsedEverAtLeast(let n):           return frac(stats.toolsUsedEver.count, n)
        case .exportsAtLeast(let n):                 return frac(stats.exportsCount, n)
        case .copiesAtLeast(let n):                  return frac(stats.copiesCount, n)
        case .quickReviewCountAtLeast(let n):        return frac(stats.quickReviewCount, n)
        case .quickReviewPerfectAtLeast(let n):      return frac(stats.quickReviewPerfectScores, n)
        case .quickReviewLongestStreakAtLeast(let n):return frac(stats.quickReviewLongestStreak, n)
        case .craterBlastGamesAtLeast(let n):        return frac(stats.craterBlastGames, n)
        case .craterBlastPerfectAtLeast(let n):      return frac(stats.craterBlastPerfectGames, n)
        case .totalStudyToolsAtLeast(let n):         return frac(stats.totalStudyToolsCreated, n)
        case .totalWordsAnalyzedAtLeast(let n):      return frac(stats.totalWordsAnalyzed, n)
        case .documentsInSingleDayAtLeast(let n):    return frac(stats.documentsInSingleDay, n)
        case .studyPacksAtLeast(let n):              return frac(stats.studyPacksCount, n)
        case .focusModeUnlocksAtLeast(let n):        return frac(stats.focusModeUnlocksCount, n)
        case .focusModeBlocksAtLeast(let n):         return frac(stats.focusModeSitesBlocked, n)
        case .quizzesCountAtLeast(let n):            return frac(stats.quizzesCount, n)
        case .flashcardsCountAtLeast(let n):         return frac(stats.flashcardsCount, n)
        case .lessonsCountAtLeast(let n):            return frac(stats.lessonsCount, n)
        case .crosswordsCountAtLeast(let n):         return frac(stats.crosswordsCount, n)
        case .isPaidSinceMonthsAgo(let n):           return stats.isPaidUser ? frac(stats.monthsSincePaid, n) : 0
        default:                                      return isUnlocked(stats: stats) ? 1.0 : 0.0
        }
    }

    private func frac(_ have: Int, _ need: Int) -> Double {
        guard need > 0 else { return 1 }
        return min(1.0, max(0.0, Double(have) / Double(need)))
    }

    static func == (a: Achievement, b: Achievement) -> Bool { a.id == b.id }

    // MARK: - Mobile gallery grouping

    /// Coarser bucket used by the iOS Achievements gallery sheet.
    /// We want sections that map to actual app surfaces ("Games",
    /// "Focus", "Quizzes") rather than to the website's flat
    /// "mastery" / "special" buckets.
    var mobileGroup: MobileGroup {
        switch rule {
        case .longestStreakAtLeast,
             .quickReviewLongestStreakAtLeast:        return .streaks
        case .quickReviewCountAtLeast,
             .quickReviewPerfectAtLeast,
             .quizzesCountAtLeast:                    return .quizzes
        case .craterBlastGamesAtLeast,
             .craterBlastPerfectAtLeast:              return .games
        case .focusModeUnlocksAtLeast,
             .focusModeBlocksAtLeast:                 return .focus
        case .studyPacksAtLeast,
             .totalStudyToolsAtLeast,
             .flashcardsCountAtLeast,
             .lessonsCountAtLeast,
             .crosswordsCountAtLeast:                 return .studyPacks
        case .isPaidUser,
             .isPaidSinceMonthsAgo:                   return .subscription
        case .firstLogin,
             .visitedBadges:                          return .gettingStarted
        case .usedAfter10pm,
             .usedBefore7am,
             .midnightUsage,
             .weekendUsage,
             .comebackKid7Days,
             .toolsUsedEverAtLeast:                   return .special
        default:                                       return .special
        }
    }

    enum MobileGroup: String, CaseIterable, Identifiable, Hashable {
        case streaks
        case studyPacks
        case quizzes
        case games
        case focus
        case subscription
        case special
        case gettingStarted

        var id: String { rawValue }

        var label: String {
            switch self {
            case .streaks:        return "Streaks"
            case .studyPacks:     return "Study Packs"
            case .quizzes:        return "Quizzes"
            case .games:          return "Games"
            case .focus:          return "Focus Mode"
            case .subscription:   return "Pro"
            case .special:        return "Special"
            case .gettingStarted: return "Getting Started"
            }
        }

        var icon: String {
            switch self {
            case .streaks:        return "flame.fill"
            case .studyPacks:     return "graduationcap.fill"
            case .quizzes:        return "checkmark.bubble.fill"
            case .games:          return "gamecontroller.fill"
            case .focus:          return "shield.lefthalf.filled"
            case .subscription:   return "crown.fill"
            case .special:        return "sparkles"
            case .gettingStarted: return "star.fill"
            }
        }

        var tint: Color {
            switch self {
            case .streaks:        return Color(hex: 0xF59E0B)
            case .studyPacks:     return WSColor.brandPrimary
            case .quizzes:        return Color(hex: 0xD946EF)
            case .games:          return Color(hex: 0xEF4444)
            case .focus:          return Color(hex: 0x10B981)
            case .subscription:   return Color(hex: 0xEAB308)
            case .special:        return Color(hex: 0x6366F1)
            case .gettingStarted: return Color(hex: 0x06B6D4)
            }
        }
    }
}

// MARK: - AchievementStats (matches AchievementStats interface on desktop)

struct AchievementStats: Decodable {
    var uploadsCount: Int = 0
    var analysesCount: Int = 0
    var summariesCount: Int = 0
    var citationsCount: Int = 0
    var quizzesCount: Int = 0
    var flashcardsCount: Int = 0
    var crosswordsCount: Int = 0
    var lessonsCount: Int = 0

    var longestStreak: Int = 0
    var currentStreak: Int = 0

    var usedAfter10pm: Bool = false
    var usedBefore7am: Bool = false
    var midnightUsage: Bool = false
    var weekendUsage: Bool = false

    var isPaidUser: Bool = false
    var paidSince: String? = nil

    var toolsUsedEver: [String] = []
    var exportsCount: Int = 0
    var copiesCount: Int = 0

    var lastActiveDate: String? = nil
    var visitedBadges: Bool = false
    var firstLogin: Bool = false

    var quickReviewCount: Int = 0
    var quickReviewPerfectScores: Int = 0
    var quickReviewLongestStreak: Int = 0
    var craterBlastGames: Int = 0
    var craterBlastPerfectGames: Int = 0
    var craterBlastHighScore: Int = 0

    var totalStudyToolsCreated: Int = 0
    var totalWordsAnalyzed: Int = 0
    var documentsInSingleDay: Int = 0
    var studyPacksCount: Int = 0

    var focusModeUnlocksCount: Int = 0
    var focusModeSitesBlocked: Int = 0

    enum CodingKeys: String, CodingKey {
        case uploadsCount             = "uploads_count"
        case analysesCount            = "analyses_count"
        case summariesCount           = "summaries_count"
        case citationsCount           = "citations_count"
        case quizzesCount             = "quizzes_count"
        case flashcardsCount          = "flashcards_count"
        case crosswordsCount          = "crosswords_count"
        case lessonsCount             = "lessons_count"
        case longestStreak            = "longest_streak"
        case currentStreak            = "current_streak"
        case usedAfter10pm            = "used_after_10pm"
        case usedBefore7am            = "used_before_7am"
        case midnightUsage            = "midnight_usage"
        case weekendUsage             = "weekend_usage"
        case isPaidUser               = "is_paid_user"
        case paidSince                = "paid_since"
        case toolsUsedEver            = "tools_used_ever"
        case exportsCount             = "exports_count"
        case copiesCount              = "copies_count"
        case lastActiveDate           = "last_active_date"
        case visitedBadges            = "visited_badges"
        case firstLogin               = "first_login"
        case quickReviewCount         = "quick_review_count"
        case quickReviewPerfectScores = "quick_review_perfect_scores"
        case quickReviewLongestStreak = "quick_review_longest_streak"
        case craterBlastGames         = "crater_blast_games"
        case craterBlastPerfectGames  = "crater_blast_perfect_games"
        case craterBlastHighScore     = "crater_blast_high_score"
        case totalStudyToolsCreated   = "total_study_tools_created"
        case totalWordsAnalyzed       = "total_words_analyzed"
        case documentsInSingleDay     = "documents_in_single_day"
        case studyPacksCount          = "study_packs_count"
        case focusModeUnlocksCount    = "focus_mode_unlocks_count"
        case focusModeSitesBlocked    = "focus_mode_sites_blocked"
    }

    init() {}

    init(from decoder: Decoder) throws {
        // All keys optional with safe defaults so a missing field never breaks decoding
        let c = try decoder.container(keyedBy: CodingKeys.self)
        uploadsCount             = (try? c.decode(Int.self,    forKey: .uploadsCount))             ?? 0
        analysesCount            = (try? c.decode(Int.self,    forKey: .analysesCount))            ?? 0
        summariesCount           = (try? c.decode(Int.self,    forKey: .summariesCount))           ?? 0
        citationsCount           = (try? c.decode(Int.self,    forKey: .citationsCount))           ?? 0
        quizzesCount             = (try? c.decode(Int.self,    forKey: .quizzesCount))             ?? 0
        flashcardsCount          = (try? c.decode(Int.self,    forKey: .flashcardsCount))          ?? 0
        crosswordsCount          = (try? c.decode(Int.self,    forKey: .crosswordsCount))          ?? 0
        lessonsCount             = (try? c.decode(Int.self,    forKey: .lessonsCount))             ?? 0
        longestStreak            = (try? c.decode(Int.self,    forKey: .longestStreak))            ?? 0
        currentStreak            = (try? c.decode(Int.self,    forKey: .currentStreak))            ?? 0
        usedAfter10pm            = (try? c.decode(Bool.self,   forKey: .usedAfter10pm))            ?? false
        usedBefore7am            = (try? c.decode(Bool.self,   forKey: .usedBefore7am))            ?? false
        midnightUsage            = (try? c.decode(Bool.self,   forKey: .midnightUsage))            ?? false
        weekendUsage             = (try? c.decode(Bool.self,   forKey: .weekendUsage))             ?? false
        isPaidUser               = (try? c.decode(Bool.self,   forKey: .isPaidUser))               ?? false
        paidSince                = try? c.decode(String.self,  forKey: .paidSince)
        toolsUsedEver            = (try? c.decode([String].self, forKey: .toolsUsedEver))          ?? []
        exportsCount             = (try? c.decode(Int.self,    forKey: .exportsCount))             ?? 0
        copiesCount              = (try? c.decode(Int.self,    forKey: .copiesCount))              ?? 0
        lastActiveDate           = try? c.decode(String.self,  forKey: .lastActiveDate)
        visitedBadges            = (try? c.decode(Bool.self,   forKey: .visitedBadges))            ?? false
        firstLogin               = (try? c.decode(Bool.self,   forKey: .firstLogin))               ?? false
        quickReviewCount         = (try? c.decode(Int.self,    forKey: .quickReviewCount))         ?? 0
        quickReviewPerfectScores = (try? c.decode(Int.self,    forKey: .quickReviewPerfectScores)) ?? 0
        quickReviewLongestStreak = (try? c.decode(Int.self,    forKey: .quickReviewLongestStreak)) ?? 0
        craterBlastGames         = (try? c.decode(Int.self,    forKey: .craterBlastGames))         ?? 0
        craterBlastPerfectGames  = (try? c.decode(Int.self,    forKey: .craterBlastPerfectGames))  ?? 0
        craterBlastHighScore     = (try? c.decode(Int.self,    forKey: .craterBlastHighScore))     ?? 0
        totalStudyToolsCreated   = (try? c.decode(Int.self,    forKey: .totalStudyToolsCreated))   ?? 0
        totalWordsAnalyzed       = (try? c.decode(Int.self,    forKey: .totalWordsAnalyzed))       ?? 0
        documentsInSingleDay     = (try? c.decode(Int.self,    forKey: .documentsInSingleDay))     ?? 0
        studyPacksCount          = (try? c.decode(Int.self,    forKey: .studyPacksCount))          ?? 0
        focusModeUnlocksCount    = (try? c.decode(Int.self,    forKey: .focusModeUnlocksCount))    ?? 0
        focusModeSitesBlocked    = (try? c.decode(Int.self,    forKey: .focusModeSitesBlocked))    ?? 0
    }

    // MARK: - Computed

    var monthsSincePaid: Int {
        guard let paidSince, !paidSince.isEmpty else { return 0 }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: paidSince) ?? ISO8601DateFormatter().date(from: paidSince)
        guard let date else { return 0 }
        let comps = Calendar.current.dateComponents([.month], from: date, to: Date())
        return max(0, comps.month ?? 0)
    }

    var daysSinceLastActive: Int {
        guard let lastActiveDate, !lastActiveDate.isEmpty else { return 0 }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: lastActiveDate) ?? ISO8601DateFormatter().date(from: lastActiveDate)
        guard let date else { return 0 }
        let comps = Calendar.current.dateComponents([.day], from: date, to: Date())
        return max(0, comps.day ?? 0)
    }
}

// MARK: - Catalog
//
// Mobile-only catalog. Citation/upload/analyze/export/wordsmith badges
// (and the matching mastery tiers) live on the desktop website where
// those features are exposed — they aren't surfaced from this app, so
// shipping them as locked-forever rewards would just be noise. Anything
// the user can actually unlock on iOS is here.

enum AchievementCatalog {
    typealias A = Achievement

    static let all: [Achievement] = [

        // ── Getting Started (3) ──────────────────────────────
        A(id: "first_login",            name: "Welcome!",            creatureName: "Greenie",   description: "Log in for the first time",       xp: 5,  category: .gettingStarted, rarity: .common,    conditionText: "Log in to WriteScholar",        rule: .firstLogin),
        A(id: "explorer",               name: "Badge Explorer",      creatureName: "Peeker",    description: "Visit the badges page",           xp: 5,  category: .gettingStarted, rarity: .common,    conditionText: "Visit the Badges page",         rule: .visitedBadges),
        A(id: "study_pack_pioneer",     name: "Study Pack Pioneer",  creatureName: "Packly",    description: "Generate your first Study Pack",  xp: 15, category: .gettingStarted, rarity: .common,    conditionText: "Generate 1 Study Pack",         rule: .studyPacksAtLeast(1)),

        // ── Streaks (10) ─────────────────────────────────────
        A(id: "streak_starter",   name: "Streak Starter",  creatureName: "Emberly",     description: "Achieve a 3-day streak",   xp: 20,  category: .streak, rarity: .uncommon,  conditionText: "3-day streak",   rule: .longestStreakAtLeast(3)),
        A(id: "streak_warrior",   name: "Streak Warrior",  creatureName: "Blazer",      description: "Achieve a 5-day streak",   xp: 30,  category: .streak, rarity: .rare,      conditionText: "5-day streak",   rule: .longestStreakAtLeast(5)),
        A(id: "streak_legend",    name: "Streak Legend",   creatureName: "Phoenix",     description: "Achieve a 7-day streak",   xp: 50,  category: .streak, rarity: .epic,      conditionText: "7-day streak",   rule: .longestStreakAtLeast(7)),
        A(id: "two_week_titan",   name: "Two Week Titan",  creatureName: "Titan",       description: "Achieve a 14-day streak",  xp: 60,  category: .streak, rarity: .epic,      conditionText: "14-day streak",  rule: .longestStreakAtLeast(14)),
        A(id: "streak_champion",  name: "Streak Champion", creatureName: "Broadcaster", description: "Achieve a 21-day streak",  xp: 75,  category: .streak, rarity: .epic,      conditionText: "21-day streak",  rule: .longestStreakAtLeast(21)),
        A(id: "monthly_master",   name: "Monthly Master",  creatureName: "Inferno",     description: "Achieve a 30-day streak",  xp: 100, category: .streak, rarity: .legendary, conditionText: "30-day streak",  rule: .longestStreakAtLeast(30)),
        A(id: "streak_titan",     name: "Streak Titan",    creatureName: "Influex",     description: "Achieve a 45-day streak",  xp: 125, category: .streak, rarity: .legendary, conditionText: "45-day streak",  rule: .longestStreakAtLeast(45)),
        A(id: "streak_machine",   name: "Streak Machine",  creatureName: "Mechablaze",  description: "Achieve a 60-day streak",  xp: 150, category: .streak, rarity: .legendary, conditionText: "60-day streak",  rule: .longestStreakAtLeast(60)),
        A(id: "streak_immortal",  name: "Streak Immortal", creatureName: "Eternox",     description: "Achieve a 100-day streak", xp: 200, category: .streak, rarity: .legendary, conditionText: "100-day streak", rule: .longestStreakAtLeast(100)),
        A(id: "streak_demigod",   name: "Streak Demigod",  creatureName: "Godflame",    description: "Achieve a 365-day streak", xp: 500, category: .streak, rarity: .legendary, conditionText: "365-day streak", rule: .longestStreakAtLeast(365)),

        // ── Study Packs (8) ──────────────────────────────────
        A(id: "study_pack_explorer",  name: "Study Pack Explorer",  creatureName: "Explorix",  description: "Generate 3 Study Packs",   xp: 25, category: .mastery, rarity: .uncommon, conditionText: "Generate 3 Study Packs",  rule: .studyPacksAtLeast(3)),
        A(id: "study_pack_pro",       name: "Study Pack Pro",       creatureName: "Studix",    description: "Generate 5 Study Packs",   xp: 35, category: .mastery, rarity: .rare,     conditionText: "Generate 5 Study Packs",  rule: .studyPacksAtLeast(5)),
        A(id: "study_pack_master",    name: "Study Pack Master",    creatureName: "Masterly",  description: "Generate 10 Study Packs",  xp: 50, category: .mastery, rarity: .epic,     conditionText: "Generate 10 Study Packs", rule: .studyPacksAtLeast(10)),
        A(id: "study_pack_champion",  name: "Study Pack Champion",  creatureName: "Champton",  description: "Generate 25 Study Packs",  xp: 75, category: .mastery, rarity: .epic,     conditionText: "Generate 25 Study Packs", rule: .studyPacksAtLeast(25)),
        A(id: "study_pack_legend",    name: "Study Pack Legend",    creatureName: "Legendix",  description: "Generate 50 Study Packs",  xp: 100,category: .mastery, rarity: .legendary,conditionText: "Generate 50 Study Packs", rule: .studyPacksAtLeast(50)),
        A(id: "study_pack_centurion", name: "Study Pack Centurion", creatureName: "Centurion", description: "Generate 100 Study Packs", xp: 150,category: .mastery, rarity: .legendary,conditionText: "Generate 100 Study Packs",rule: .studyPacksAtLeast(100)),
        A(id: "study_pack_god",       name: "Study Pack God",       creatureName: "Packgod",   description: "Generate 200 Study Packs", xp: 250,category: .mastery, rarity: .legendary,conditionText: "Generate 200 Study Packs",rule: .studyPacksAtLeast(200)),
        A(id: "study_tool_centurion", name: "Study Tool Centurion", creatureName: "Centurion", description: "Create 100 total study tools", xp: 150, category: .mastery, rarity: .legendary, conditionText: "Create 100 study tools", rule: .totalStudyToolsAtLeast(100)),

        // ── Quick Review / Quiz (8) ──────────────────────────
        A(id: "quick_starter",    name: "Quick Starter",   creatureName: "Speedy",    description: "Complete your first Quick Review",  xp: 10,  category: .mastery, rarity: .common,    conditionText: "Complete 1 Quick Review",   rule: .quickReviewCountAtLeast(1)),
        A(id: "perfect_recall",   name: "Perfect Recall",  creatureName: "Memoria",   description: "Score 100% on a Quick Review",      xp: 25,  category: .mastery, rarity: .rare,      conditionText: "Get 100% on Quick Review",  rule: .quickReviewPerfectAtLeast(1)),
        A(id: "review_regular",   name: "Review Regular",  creatureName: "Reviewer",  description: "Complete 10 Quick Reviews",         xp: 30,  category: .mastery, rarity: .uncommon,  conditionText: "Complete 10 Quick Reviews", rule: .quickReviewCountAtLeast(10)),
        A(id: "weekly_reviewer",  name: "Weekly Reviewer", creatureName: "Weekwise",  description: "7-day Quick Review streak",         xp: 50,  category: .streak,  rarity: .epic,      conditionText: "7-day Quick Review streak", rule: .quickReviewLongestStreakAtLeast(7)),
        A(id: "review_warrior",   name: "Review Warrior",  creatureName: "Revisor",   description: "Complete 30 Quick Reviews",         xp: 50,  category: .mastery, rarity: .rare,      conditionText: "Complete 30 Quick Reviews", rule: .quickReviewCountAtLeast(30)),
        A(id: "monthly_reviewer", name: "Monthly Reviewer",creatureName: "Consistor", description: "30-day Quick Review streak",        xp: 150, category: .streak,  rarity: .legendary, conditionText: "30-day Quick Review streak",rule: .quickReviewLongestStreakAtLeast(30)),
        A(id: "review_master",    name: "Review Master",   creatureName: "Recallion", description: "Complete 50 Quick Reviews",         xp: 75,  category: .mastery, rarity: .epic,      conditionText: "Complete 50 Quick Reviews", rule: .quickReviewCountAtLeast(50)),
        A(id: "review_legend",    name: "Review Legend",   creatureName: "Retainex",  description: "Complete 100 Quick Reviews",        xp: 150, category: .mastery, rarity: .legendary, conditionText: "Complete 100 Quick Reviews",rule: .quickReviewCountAtLeast(100)),
        A(id: "perfectionist",    name: "Perfectionist",   creatureName: "Flawless",  description: "Get 5 perfect Quick Reviews",       xp: 60,  category: .mastery, rarity: .epic,      conditionText: "5 perfect Quick Reviews",   rule: .quickReviewPerfectAtLeast(5)),
        A(id: "memory_machine",   name: "Memory Machine",  creatureName: "Mnemonic",  description: "Get 25 perfect Quick Reviews",      xp: 150, category: .mastery, rarity: .legendary, conditionText: "25 perfect Quick Reviews",  rule: .quickReviewPerfectAtLeast(25)),

        // ── Games (Crater Blast — 5) ─────────────────────────
        A(id: "crater_rookie",    name: "Crater Rookie",   creatureName: "Blastling",  description: "Play your first Crater Blast game", xp: 10, category: .mastery, rarity: .common,    conditionText: "Play 1 Crater Blast game",   rule: .craterBlastGamesAtLeast(1)),
        A(id: "crater_veteran",   name: "Crater Veteran",  creatureName: "Blastor",    description: "Play 10 Crater Blast games",        xp: 30, category: .mastery, rarity: .uncommon,  conditionText: "Play 10 Crater Blast games", rule: .craterBlastGamesAtLeast(10)),
        A(id: "perfect_blaster",  name: "Perfect Blaster", creatureName: "Perfecto",   description: "Get a perfect Crater Blast score",  xp: 50, category: .mastery, rarity: .epic,      conditionText: "Perfect Crater Blast game",  rule: .craterBlastPerfectAtLeast(1)),
        A(id: "crater_champion",  name: "Crater Champion", creatureName: "Boomking",   description: "Play 25 Crater Blast games",        xp: 60, category: .mastery, rarity: .rare,      conditionText: "Play 25 Crater Blast games", rule: .craterBlastGamesAtLeast(25)),
        A(id: "crater_master",    name: "Crater Master",   creatureName: "Craterlord", description: "Play 50 Crater Blast games",        xp: 100,category: .mastery, rarity: .legendary, conditionText: "Play 50 Crater Blast games", rule: .craterBlastGamesAtLeast(50)),

        // ── Focus Mode (5) ───────────────────────────────────
        A(id: "focus_mode_first_unlock", name: "Unlocked!",             creatureName: "Keyley",    description: "Complete your first Focus Mode unlock", xp: 15, category: .gettingStarted, rarity: .common,   conditionText: "Pass the unlock quiz once", rule: .focusModeUnlocksAtLeast(1)),
        A(id: "focus_mode_first_block",  name: "Block Party",           creatureName: "Blocky",    description: "Block your first distracting app",      xp: 15, category: .gettingStarted, rarity: .common,   conditionText: "Block 1 app",                rule: .focusModeBlocksAtLeast(1)),
        A(id: "focus_mode_unlock_5",     name: "Earned It",             creatureName: "Earnix",    description: "Unlock apps 5 times with the quiz",     xp: 30, category: .mastery,        rarity: .uncommon, conditionText: "Unlock apps 5 times",        rule: .focusModeUnlocksAtLeast(5)),
        A(id: "focus_mode_block_5",      name: "Distraction Destroyer", creatureName: "Destroyix", description: "Block 5 distracting apps",              xp: 30, category: .mastery,        rarity: .uncommon, conditionText: "Block 5 apps",               rule: .focusModeBlocksAtLeast(5)),
        A(id: "focus_mode_master",       name: "Focus Master",          creatureName: "Focusix",   description: "Unlock apps 10 times",                  xp: 50, category: .mastery,        rarity: .epic,     conditionText: "Unlock apps 10 times",       rule: .focusModeUnlocksAtLeast(10)),

        // ── Subscription (4) ─────────────────────────────────
        A(id: "premium_pioneer",  name: "Pro Pioneer",     creatureName: "Goldie",    description: "Become a Pro subscriber",        xp: 50,  category: .subscription, rarity: .epic,      conditionText: "Subscribe to Pro",            rule: .isPaidUser),
        A(id: "loyal_learner",    name: "Loyal Learner",   creatureName: "Loyalist",  description: "3 months as a paid subscriber",  xp: 75,  category: .subscription, rarity: .epic,      conditionText: "3 months as paid subscriber", rule: .isPaidSinceMonthsAgo(3)),
        A(id: "dedicated_scholar",name: "Dedicated Scholar",creatureName: "Devotion", description: "6 months as a paid subscriber",  xp: 100, category: .subscription, rarity: .legendary, conditionText: "6 months as paid subscriber", rule: .isPaidSinceMonthsAgo(6)),
        A(id: "scholar_supreme",  name: "Scholar Supreme", creatureName: "Eternia",   description: "1 year as a paid subscriber",    xp: 200, category: .subscription, rarity: .legendary, conditionText: "1 year as paid subscriber",   rule: .isPaidSinceMonthsAgo(12)),

        // ── Special / time-of-day (5) ────────────────────────
        A(id: "night_owl",        name: "Night Owl",       creatureName: "Nyx",       description: "Use WriteScholar after 10 PM",                xp: 15, category: .special, rarity: .uncommon, conditionText: "Use app after 10 PM",        rule: .usedAfter10pm),
        A(id: "early_bird",       name: "Early Bird",      creatureName: "Sol",       description: "Use WriteScholar before 7 AM",                xp: 15, category: .special, rarity: .uncommon, conditionText: "Use app before 7 AM",        rule: .usedBefore7am),
        A(id: "midnight_scholar", name: "Midnight Scholar",creatureName: "Midnight",  description: "Use WriteScholar between midnight and 3 AM",  xp: 25, category: .special, rarity: .rare,     conditionText: "Use app midnight–3 AM",      rule: .midnightUsage),
        A(id: "weekend_warrior",  name: "Weekend Warrior", creatureName: "Weekender", description: "Use WriteScholar on a weekend",               xp: 10, category: .special, rarity: .common,   conditionText: "Use app on a weekend",       rule: .weekendUsage),
        A(id: "comeback_kid",     name: "Comeback Kid",    creatureName: "Boomerang", description: "Return after 7+ days away",                   xp: 20, category: .special, rarity: .uncommon, conditionText: "Return after 7+ days away",  rule: .comebackKid7Days),

        // ── Quizzes (5 — new in v2) ─────────────────────────
        A(id: "quiz_rookie",     name: "Quiz Rookie",     creatureName: "Quizzy",     description: "Finish your first quiz",  xp: 10,  category: .gettingStarted, rarity: .common,    conditionText: "Finish 1 quiz",       rule: .quizzesCountAtLeast(1)),
        A(id: "quiz_veteran",    name: "Quiz Veteran",    creatureName: "Querion",    description: "Finish 10 quizzes",       xp: 30,  category: .mastery,        rarity: .uncommon,  conditionText: "Finish 10 quizzes",   rule: .quizzesCountAtLeast(10)),
        A(id: "quiz_champion",   name: "Quiz Champion",   creatureName: "Quizmaster", description: "Finish 25 quizzes",       xp: 60,  category: .mastery,        rarity: .rare,      conditionText: "Finish 25 quizzes",   rule: .quizzesCountAtLeast(25)),
        A(id: "quiz_legend",     name: "Quiz Legend",     creatureName: "Examona",    description: "Finish 50 quizzes",       xp: 100, category: .mastery,        rarity: .epic,      conditionText: "Finish 50 quizzes",   rule: .quizzesCountAtLeast(50)),
        A(id: "quiz_immortal",   name: "Quiz Immortal",   creatureName: "Quizion",    description: "Finish 100 quizzes",      xp: 175, category: .mastery,        rarity: .legendary, conditionText: "Finish 100 quizzes",  rule: .quizzesCountAtLeast(100)),

        // ── Flashcards (4 — new in v2) ──────────────────────
        A(id: "flash_starter",   name: "Flash Starter",   creatureName: "Sparkette",  description: "Make your first flashcard set", xp: 10,  category: .gettingStarted, rarity: .common,    conditionText: "Create 1 flashcard set",   rule: .flashcardsCountAtLeast(1)),
        A(id: "card_counter",    name: "Card Counter",    creatureName: "Stacker",    description: "Make 25 flashcard sets",        xp: 40,  category: .mastery,        rarity: .uncommon,  conditionText: "Create 25 flashcard sets", rule: .flashcardsCountAtLeast(25)),
        A(id: "card_master",     name: "Card Master",     creatureName: "Decksmith",  description: "Make 100 flashcard sets",       xp: 80,  category: .mastery,        rarity: .epic,      conditionText: "Create 100 flashcard sets",rule: .flashcardsCountAtLeast(100)),
        A(id: "card_legend",     name: "Card Legend",     creatureName: "Cardex",     description: "Make 250 flashcard sets",       xp: 150, category: .mastery,        rarity: .legendary, conditionText: "Create 250 flashcard sets",rule: .flashcardsCountAtLeast(250)),

        // ── Lessons + Crosswords (3 — new in v2) ────────────
        A(id: "lesson_learner",   name: "Lesson Learner",   creatureName: "Lessonix", description: "Generate 5 AI lessons",  xp: 25, category: .mastery, rarity: .uncommon,  conditionText: "Generate 5 AI lessons",  rule: .lessonsCountAtLeast(5)),
        A(id: "lesson_master",    name: "Lesson Master",    creatureName: "Tutorix",  description: "Generate 25 AI lessons", xp: 75, category: .mastery, rarity: .epic,      conditionText: "Generate 25 AI lessons", rule: .lessonsCountAtLeast(25)),
        A(id: "crossword_cracker",name: "Crossword Cracker",creatureName: "Crossix",  description: "Generate 5 crosswords",  xp: 25, category: .mastery, rarity: .uncommon,  conditionText: "Generate 5 crosswords",  rule: .crosswordsCountAtLeast(5))
    ]

    /// XP-to-level table from desktop achievements.ts.
    static let levels: [(level: Int, name: String, minXP: Int, maxXP: Int)] = [
        (1, "Scholar Seedling", 0, 50),
        (2, "Curious Cat", 50, 120),
        (3, "Knowledge Keeper", 120, 220),
        (4, "Brain Explorer", 220, 350),
        (5, "Wisdom Warrior", 350, 520),
        (6, "Study Sage", 520, 750),
        (7, "Academic Ace", 750, 1000),
        (8, "Genius Guide", 1000, 1400),
        (9, "Master Mind", 1400, 2000),
        (10, "Supreme Scholar", 2000, .max)
    ]

    static func totalXP(unlockedIds: Set<String>) -> Int {
        all.filter { unlockedIds.contains($0.id) }.reduce(0) { $0 + $1.xp }
    }

    static func currentLevel(forXP xp: Int) -> (level: Int, name: String, minXP: Int, maxXP: Int) {
        levels.last { xp >= $0.minXP } ?? levels[0]
    }
}
