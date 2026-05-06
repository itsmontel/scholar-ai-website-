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
        } catch {
            // Token invalid or network error during boot — fall through
            // to the auth screen rather than blocking the whole app.
            KeychainStore.shared.authToken = nil
            state = .unauthenticated
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

    // MARK: Sign out

    func signOut() {
        KeychainStore.shared.authToken = nil
        state = .unauthenticated
    }
}
