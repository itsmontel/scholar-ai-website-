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
    /// Offline-only placeholder used when the user opens the app shell without signing in.
    static let localGuestId = "__local_guest__"

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

    /// Browsing without an account (no JWT; backend calls may fail until you sign in).
    static let localGuest = WSUser(
        id: localGuestId,
        email: "guest@local.writescholar",
        username: nil,
        firstName: "Guest",
        lastName: nil,
        subscriptionPlan: "free",
        subscriptionStatus: "local",
        emailVerified: false,
        onboardingCompleted: true,
        welcomeTutorialCompleted: nil
    )

    var isLocalGuestAccount: Bool { id == Self.localGuestId }

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
