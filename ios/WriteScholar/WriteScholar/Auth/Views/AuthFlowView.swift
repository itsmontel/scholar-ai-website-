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
    @State private var dancingMascotBob: CGFloat = 0

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                WSGradient.heroBackdrop.ignoresSafeArea()

                // Soft brand orb in the corner for depth
                Circle()
                    .fill(WSColor.brandPrimary.opacity(0.15))
                    .frame(width: 360, height: 360)
                    .blur(radius: 60)
                    .offset(x: -180, y: -260)
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer(minLength: 24)

                    heroBlock
                        .padding(.bottom, 24)

                    Spacer(minLength: 0)

                    actionStack
                        .padding(.horizontal, 24)
                        .padding(.bottom, 8)

                    legalFooter
                        .padding(.horizontal, 32)

                    ExploreWithoutSigningInButton()
                        .padding(.bottom, 16)
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
            .onAppear {
                withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true)) {
                    dancingMascotBob = -10
                }
            }
        }
    }

    // MARK: - Hero

    private var heroBlock: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(WSColor.brandPrimary.opacity(0.18))
                    .frame(width: 220, height: 220)
                    .blur(radius: 30)

                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 160, height: 160)
                    .offset(y: dancingMascotBob)
                    .shadow(color: Color(hex: 0x7C3AED, opacity: 0.30), radius: 22, y: 12)
            }

            VStack(spacing: 8) {
                Text("Welcome to WriteScholar")
                    .wsHeadline(.large, weight: .semibold)
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
        VStack(spacing: 12) {
            // Apple — required by App Store guideline 4.8 since we offer
            // other 3rd-party sign-in. Native AS button per HIG.
            SignInWithAppleButton(.continue) { request in
                request.requestedScopes = [.fullName, .email]
            } onCompletion: { result in
                handleAppleResult(result)
            }
            .signInWithAppleButtonStyle(.black)
            .frame(height: 54)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: .black.opacity(0.18), radius: 10, y: 4)

            // Google — wired up to a placeholder; needs Google Sign-In SDK
            Button {
                // TODO Chapter 2.5: integrate GoogleSignIn iOS SDK
                Haptics.light()
                session.lastError = "Google Sign-In ships in the next chapter."
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "g.circle.fill")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(Color(hex: 0xEA4335))
                    Text("Continue with Google")
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(WSColor.backgroundElevated)
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(WSColor.hairline, lineWidth: 1)
                        )
                        .shadow(color: .black.opacity(0.06), radius: 10, y: 3)
                )
            }

            // Divider
            HStack(spacing: 12) {
                line
                Text("or")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                line
            }
            .padding(.vertical, 4)

            Button {
                path.append(AuthRoute.signIn)
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "envelope.fill")
                    Text("Continue with email")
                }
            }
            .buttonStyle(WSPrimaryButtonStyle())

            Button {
                path.append(AuthRoute.signUp)
            } label: {
                HStack(spacing: 4) {
                    Text("New to WriteScholar?")
                        .foregroundStyle(WSColor.foregroundMuted)
                    Text("Create account")
                        .foregroundStyle(WSColor.brandPrimary)
                }
                .wsBody(.small, weight: .semibold)
            }
            .buttonStyle(WSTertiaryButtonStyle())
            .padding(.top, 4)

            if let err = session.lastError {
                Text(err)
                    .wsBody(.small, weight: .semibold)
                    .foregroundStyle(WSColor.concern)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 8)
                    .transition(.opacity)
            }
        }
    }

    private var line: some View {
        Rectangle()
            .fill(WSColor.hairline)
            .frame(height: 1)
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
                .foregroundStyle(WSColor.brandPrimary)
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
