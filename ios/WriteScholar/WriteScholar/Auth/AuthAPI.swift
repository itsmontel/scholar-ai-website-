//
//  AuthAPI.swift
//  WriteScholar
//
//  Endpoint helpers for /auth/* routes on the backend.
//

import Foundation

enum AuthAPI {
    // MARK: Request bodies

    struct LoginRequest: Encodable {
        let email: String
        let password: String
    }

    struct RegisterRequest: Encodable {
        let email: String
        let password: String
    }

    struct AppleSignInRequest: Encodable {
        let identityToken: String
        let authorizationCode: String?
        let firstName: String?
        let lastName: String?
        let email: String?
        let appleUserId: String
    }

    // MARK: Response shapes (envelope's `data` field)

    struct LoginResponse: Decodable {
        let user: WSUser
        let token: String
    }

    struct RegisterResponse: Decodable {
        let user: WSUser
        let emailSent: Bool?
        let verificationToken: String?  // Only sent in dev for easier testing
    }

    struct MeResponse: Decodable {
        let user: WSUser
        /// Optional achievements payload — present when /me is hit on a
        /// signed-in user. Null/absent for guests or older builds.
        let achievements: AchievementsPayload?

        struct AchievementsPayload: Decodable {
            let stats: AchievementStats?
            /// Map of badge_id → ISO8601 unlock timestamp.
            let unlockedBadges: [String: String]?
        }
    }

    // MARK: Calls

    static func login(email: String, password: String) async throws -> LoginResponse {
        try await APIClient.shared.post(
            path: "auth/login",
            body: LoginRequest(email: email, password: password)
        )
    }

    static func register(email: String, password: String) async throws -> RegisterResponse {
        try await APIClient.shared.post(
            path: "auth/register",
            body: RegisterRequest(email: email, password: password)
        )
    }

    static func me() async throws -> MeResponse {
        try await APIClient.shared.get(path: "auth/me", requiresAuth: true)
    }

    /// Stub for the future /auth/apple endpoint.
    /// Backend addition is tracked in the Chapter 2.5 README.
    static func appleSignIn(_ request: AppleSignInRequest) async throws -> LoginResponse {
        try await APIClient.shared.post(
            path: "auth/apple",
            body: request
        )
    }
}
