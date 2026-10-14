//
//  UsageAPI.swift
//  WriteScholar
//
//  Wraps GET /api/subscriptions/usage. Returns this billing period's
//  counters and the credit balance shown on the home screen.
//
//  This endpoint returns its fields at the top level of the JSON object
//  (not nested under `data`), so it uses APIClient.getRaw.
//

import Foundation

enum UsageAPI {
    struct Usage: Decodable {
        // Counters
        let documentsUploaded: Int
        let documentsAnalyzed: Int
        let citationSearchesUsed: Int
        let studyPacksGenerated: Int
        let storageUsed: Int

        // Remaining (per-feature, free plan)
        let uploadsRemaining: Int
        let analysesRemaining: Int
        let citationsRemaining: Int
        let studyPacksRemaining: Int
        let storageRemaining: Int
        let storageLimit: Int?

        // Combined pool (paid plans only — Pro/Premium share a budget
        // across analyses + study packs + citation searches)
        let combinedActionsUsed: Int?
        let combinedActionsRemaining: Int?
        let combinedWordsUsed: Int?
        let combinedWordsRemaining: Int?

        // Plan + reset
        let plan: String
        let daysUntilReset: Int

        /// Credit balance: 1 credit = 1 analysis, study pack or citation
        /// search. Includes rollover; free accounts have 0.
        let credits: Credits?

        struct Credits: Decodable {
            let isTrial: Bool?
            let isPaused: Bool?
            let cancelAtPeriodEnd: Bool?
            let allowance: Int?
            let rollover: Int?
            let total: Int?
            let used: Int?
            let remaining: Int?
            let cap: Int?
            let nextTopUp: Int?
            let wouldLoseAtRenewal: Int?
        }

        var creditsRemaining: Int { credits?.remaining ?? (isPaid ? combinedActionsRemaining ?? 0 : 0) }

        var isPaid: Bool {
            let p = plan.lowercased()
            return p == "pro" || p == "premium"
        }

        /// Returns the display number for the headline action remaining
        /// counter. Pro shows the combined pool; free shows analyses left.
        var headlineActionsRemaining: Int { creditsRemaining }

        var headlineActionsTotal: Int {
            if let total = credits?.total { return total }
            if isPaid, let used = combinedActionsUsed, let remaining = combinedActionsRemaining {
                return used + remaining
            }
            return 0
        }
    }

    static func fetch() async throws -> Usage {
        try await APIClient.shared.getRaw(path: "subscriptions/usage", requiresAuth: true)
    }
}
