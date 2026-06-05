//
//  GoogleSignInService.swift
//  WriteScholar
//
//  Drives Google sign-in via the existing backend OAuth flow (passport) using
//  an in-app web auth session — no GoogleSignIn SDK or extra Google client
//  needed. Opens {API}/auth/google?platform=ios; the backend completes the
//  Google handshake and redirects to writescholar://auth/google?token=<JWT>,
//  which this session captures.
//

import AuthenticationServices
import UIKit

@MainActor
final class GoogleSignInService: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = GoogleSignInService()

    enum GoogleSignInError: LocalizedError {
        case cancelled
        case noToken
        var errorDescription: String? {
            switch self {
            case .cancelled: return "Sign-in cancelled."
            case .noToken:   return "Google sign-in didn't return a token."
            }
        }
    }

    /// Keeps the session alive for the duration of the flow.
    private var session: ASWebAuthenticationSession?

    /// Returns the backend-issued JWT on success.
    func signIn() async throws -> String {
        var comps = URLComponents(
            url: APIConfig.baseURL.appendingPathComponent("auth/google"),
            resolvingAgainstBaseURL: false
        )
        comps?.queryItems = [URLQueryItem(name: "platform", value: "ios")]
        guard let url = comps?.url else { throw GoogleSignInError.noToken }

        return try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: "writescholar"
            ) { callbackURL, error in
                if let error = error {
                    if (error as? ASWebAuthenticationSessionError)?.code == .canceledLogin {
                        continuation.resume(throwing: GoogleSignInError.cancelled)
                    } else {
                        continuation.resume(throwing: error)
                    }
                    return
                }
                guard
                    let callbackURL,
                    let token = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
                        .queryItems?.first(where: { $0.name == "token" })?.value,
                    !token.isEmpty
                else {
                    continuation.resume(throwing: GoogleSignInError.noToken)
                    return
                }
                continuation.resume(returning: token)
            }
            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self.session = session
            session.start()
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
