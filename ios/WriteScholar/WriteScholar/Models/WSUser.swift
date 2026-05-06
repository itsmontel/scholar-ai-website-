//
//  WSUser.swift
//  WriteScholar
//
//  Mirrors the user payload returned by /auth/login, /auth/register,
//  and /auth/me on the backend. Decoded directly from the envelope's
//  `data.user` field.
//

import Foundation

struct WSUser: Codable, Identifiable, Equatable {
    let id: String
    let email: String
    let username: String?
    let firstName: String?
    let lastName: String?
    let subscriptionPlan: String?
    let subscriptionStatus: String?
    let emailVerified: Bool?
    let onboardingCompleted: Bool?
    let welcomeTutorialCompleted: Bool?

    var displayName: String {
        if let f = firstName, !f.isEmpty { return f }
        if let u = username, !u.isEmpty { return u }
        return email.components(separatedBy: "@").first ?? email
    }

    var isPro: Bool {
        let plan = subscriptionPlan?.lowercased() ?? ""
        return plan == "pro" || plan == "premium"
    }
}
