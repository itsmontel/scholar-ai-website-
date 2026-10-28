//
//  AuthFlowView.swift
//  WriteScholar
//
//  Welcome → method picker (Apple / Google / Email). Pushes the email
//  screen via NavigationStack when the user taps "Continue with email".
//

import SwiftUI
import AuthenticationServices

struct AuthFlowView: View {
    @EnvironmentObject var session: AuthSession
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                // Flat Duolingo surface — white top fading to a subtle purple tint
                WSColor.lilac.ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer(minLength: 24)

                    heroBlock
                        .padding(.bottom, 28)
                        .wsStaggerEntry(0)

                    Spacer(minLength: 0)

                    actionStack
                        .padding(.horizontal, 24)
                        .padding(.bottom, 8)
                        .wsStaggerEntry(1)

                    legalFooter
                        .padding(.horizontal, 32)
                        .wsStaggerEntry(2)

                    ExploreWithoutSigningInButton()
                        .padding(.bottom, 16)
                        .wsStaggerEntry(3)
                }
            }
            .navigationDestination(for: AuthRoute.self) { route in
                switch route {
                case .signIn:  SignInView(path: $path)
                case .signUp:  SignUpView(path: $path)
                case .signUpSuccess(let email):
                    SignUpSuccessView(email: email, path: $path)
                }
            }
        }
    }

    // MARK: - Hero

    private var heroBlock: some View {
        VStack(spacing: 20) {
            WSMascotHero(asset: "mascot-dance", size: 150, haloTint: WSColor.lime)

            VStack(spacing: 10) {
                Text("Save your\nprogress.")
                    .font(WSFont.headline(42, weight: .black))
                    .tracking(-1.4)
                    .foregroundStyle(WSColor.foreground)
                    .multilineTextAlignment(.center)

                Text("Sign in to keep your essays, study packs, and streaks in sync.")
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }
        }
    }

    // MARK: - Buttons

    private var actionStack: some View {
        VStack(spacing: 14) {
            // Apple — required by App Store guideline 4.8 since we offer
            // other 3rd-party sign-in. Wrapped in a chunky card for 3D feel.
            SignInWithAppleButton(.continue) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                handleAppleResult(result)
            }
            .signInWithAppleButtonStyle(.black)
            .frame(height: 56)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
            )
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(WSColor.purple).offset(y: 4))
            .padding(.bottom, 4)

            // Google — chunky card style button
            Button {
                Haptics.light()
                Task { await session.signInWithGoogle() }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "g.circle.fill")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Color(hex: 0xEA4335))
                    Text("Continue with Google")
                        .font(WSFont.headline(17, weight: .black))
                        .foregroundStyle(WSColor.foreground)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 30)
            }
            .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))

            // Divider — Duolingo style
            HStack(spacing: 12) {
                duoDividerLine
                Text("or")
                    .font(WSFont.sans(13, weight: .bold))
                    .foregroundStyle(WSColor.duoBorder)
                    .textCase(.uppercase)
                duoDividerLine
            }
            .padding(.vertical, 2)

            // Email CTA — green success button
            Button {
                path.append(AuthRoute.signIn)
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "envelope.fill")
                    Text("Continue with email")
                }
            }
            .buttonStyle(WSDuoPrimaryButtonStyle())

            // Sign up nudge
            Button {
                path.append(AuthRoute.signUp)
            } label: {
                HStack(spacing: 4) {
                    Text("New to WriteScholar?")
                        .foregroundStyle(WSColor.foregroundMuted)
                    Text("Create account")
                        .foregroundStyle(WSColor.duoPurple)
                }
                .wsBody(.small, weight: .bold)
            }
            .buttonStyle(WSTertiaryButtonStyle())
            .padding(.top, 4)

            if let err = session.lastError {
                Text(err)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .wsSticker(fill: WSColor.pinkSoft, radius: 12, depth: 2)
                    .transition(.opacity.combined(with: .scale(scale: 0.95)))
            }
        }
    }

    private var duoDividerLine: some View {
        Rectangle()
            .fill(WSColor.duoBorder)
            .frame(height: 2)
            .frame(maxWidth: .infinity)
    }

    private var legalFooter: some View {
        Text("By continuing you agree to our Terms of Service and Privacy Policy.")
            .wsBody(.caption)
            .foregroundStyle(WSColor.foregroundMuted)
            .multilineTextAlignment(.center)
    }

    // MARK: - Apple callback

    private func handleAppleResult(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard let cred = auth.credential as? ASAuthorizationAppleIDCredential,
                  let identityTokenData = cred.identityToken,
                  let identityToken = String(data: identityTokenData, encoding: .utf8)
            else {
                session.lastError = "Apple didn't return a valid identity token."
                return
            }
            let codeStr: String? = {
                guard let data = cred.authorizationCode else { return nil }
                return String(data: data, encoding: .utf8)
            }()
            let body = AuthAPI.AppleSignInRequest(
                identityToken: identityToken,
                authorizationCode: codeStr,
                firstName: cred.fullName?.givenName,
                lastName: cred.fullName?.familyName,
                email: cred.email,
                appleUserId: cred.user
            )
            Task {
                await session.signInWithApple(body)
            }
        case .failure(let err):
            // User cancelled is not an error worth showing.
            if (err as NSError).code != ASAuthorizationError.canceled.rawValue {
                session.lastError = err.localizedDescription
            }
        }
    }
}

// MARK: - Routes

enum AuthRoute: Hashable {
    case signIn
    case signUp
    case signUpSuccess(email: String)
}

/// Opens the main tab shell without a JWT (backend features may not work until you sign in).
struct ExploreWithoutSigningInButton: View {
    @EnvironmentObject private var session: AuthSession

    var body: some View {
        Button {
            Haptics.light()
            session.continueWithoutSigningIn()
        } label: {
            Text("Explore without signing in")
                .wsBody(.small, weight: .semibold)
                .foregroundStyle(WSColor.duoPurple)
                .underline()
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Continue to the app without an account")
    }
}

#Preview {
    AuthFlowView()
        .environmentObject(AuthSession())
}
