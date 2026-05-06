//
//  AuthSession.swift
//  WriteScholar
//
//  Single source of truth for auth state. Owns the current user,
//  signs the user in/up via AuthAPI, persists the JWT to the Keychain,
//  and exposes a Published `state` so SwiftUI views can react.
//

import Foundation
import SwiftUI

@MainActor
final class AuthSession: ObservableObject {

    enum State: Equatable {
        case unauthenticated
        case verifying          // booting / checking keychain
        case authenticated(WSUser)

        var user: WSUser? {
            if case .authenticated(let u) = self { return u }
            return nil
        }

        var isAuthenticated: Bool {
            if case .authenticated = self { return true }
            return false
        }
    }

    @Published private(set) var state: State = .verifying
    @Published var lastError: String?

    // MARK: - Achievements + stats (populated by /me)

    /// Per-user achievement counters from the backend. Drives unlock
    /// evaluation in `AchievementCatalog` and the home dashboard's
    /// "Recent achievements" row.
    @Published private(set) var achievementStats: AchievementStats = AchievementStats()
    /// Set of badge IDs the backend has marked unlocked for this user.
    @Published private(set) var unlockedBadgeIds: Set<String> = []

    init() {
        // Hydrate from keychain on launch — if a token exists, validate it
        // by calling /auth/me. If valid, mark as authenticated; otherwise
        // wipe the token and prompt for sign-in.
        if KeychainStore.shared.authToken != nil {
            Task { await self.bootstrap() }
        } else {
            self.state = .unauthenticated
        }
    }

    // MARK: Bootstrap

    func bootstrap() async {
        do {
            let me = try await AuthAPI.me()
            state = .authenticated(me.user)
            ingestAchievements(me.achievements)
        } catch {
            // Token invalid or network error during boot — fall through
            // to the auth screen rather than blocking the whole app.
            KeychainStore.shared.authToken = nil
            state = .unauthenticated
        }
    }

    /// Re-fetches /me to refresh stats + unlocked badges. Cheap to call
    /// after a major user action (study pack generated, analysis ran).
    func refreshAchievements() async {
        guard state.isAuthenticated else { return }
        do {
            let me = try await AuthAPI.me()
            ingestAchievements(me.achievements)
        } catch {
            // Silent — stale stats are fine until the next refresh.
        }
    }

    private func ingestAchievements(_ payload: AuthAPI.MeResponse.AchievementsPayload?) {
        if let stats = payload?.stats {
            achievementStats = stats
        }
        if let map = payload?.unlockedBadges {
            unlockedBadgeIds = Set(map.keys)
        }
    }

    // MARK: Email auth

    func signIn(email: String, password: String) async {
        lastError = nil
        do {
            let resp = try await AuthAPI.login(email: email, password: password)
            KeychainStore.shared.authToken = resp.token
            state = .authenticated(resp.user)
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    /// Returns the freshly-registered user; caller decides next step
    /// (typically: show "check your email" screen, since `/register`
    /// requires verification before login is allowed).
    @discardableResult
    func signUp(email: String, password: String) async -> AuthAPI.RegisterResponse? {
        lastError = nil
        do {
            return try await AuthAPI.register(email: email, password: password)
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
            return nil
        }
    }

    // MARK: Apple Sign-In
    // Identity token verification needs a backend `/auth/apple` endpoint
    // (Chapter 2.5). This call is wired up; it will succeed the moment
    // the backend handler exists.

    func signInWithApple(_ request: AuthAPI.AppleSignInRequest) async {
        lastError = nil
        do {
            let resp = try await AuthAPI.appleSignIn(request)
            KeychainStore.shared.authToken = resp.token
            state = .authenticated(resp.user)
        } catch {
            lastError = (error as? APIError)?.errorDescription ?? error.localizedDescription
        }
    }

    /// Enters the main app tabs without storing credentials — for previews or until auth is wired.
    func continueWithoutSigningIn() {
        lastError = nil
        state = .authenticated(.localGuest)
    }

    // MARK: Sign out

    func signOut() {
        KeychainStore.shared.authToken = nil
        state = .unauthenticated
    }
}
