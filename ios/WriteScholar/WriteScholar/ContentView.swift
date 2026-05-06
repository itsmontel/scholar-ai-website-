//
//  ContentView.swift
//  WriteScholar
//
//  Top-level router. Three states:
//    1. Onboarding (first launch only)
//    2. Auth flow (when no valid token)
//    3. Home shell (placeholder until Chapter 3)
//

import SwiftUI

struct ContentView: View {
    @Binding var onboardingComplete: Bool
    @StateObject private var session = AuthSession()

    var body: some View {
        ZStack {
            if !onboardingComplete {
                OnboardingFlow(onboardingComplete: $onboardingComplete)
                    .transition(.opacity)
            } else {
                switch session.state {
                case .verifying:
                    LoadingShell()
                        .transition(.opacity)

                case .unauthenticated:
                    AuthFlowView()
                        .environmentObject(session)
                        .transition(.opacity)

                case .authenticated(let user):
                    PlaceholderHomeView(
                        user: user,
                        onboardingComplete: $onboardingComplete,
                        onSignOut: { session.signOut() }
                    )
                    .transition(.opacity.combined(with: .scale(scale: 1.01)))
                }
            }
        }
        .animation(.spring(response: 0.55, dampingFraction: 0.85), value: onboardingComplete)
        .animation(.easeInOut(duration: 0.35), value: session.state)
    }
}

// MARK: - Boot loading shell

private struct LoadingShell: View {
    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()
            VStack(spacing: 18) {
                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 120, height: 120)
                ProgressView()
                    .tint(WSColor.brandPrimary)
            }
        }
    }
}

// MARK: - Placeholder home (Chapter 3 will replace with real tabs)

struct PlaceholderHomeView: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 28) {
                    VStack(spacing: 12) {
                        WSAnimatedImage(name: "mascot-dance", ext: "webp")
                            .frame(width: 140, height: 140)

                        Text("Hey, \(user.displayName)")
                            .wsHeadline(.large, weight: .semibold)
                            .foregroundStyle(WSColor.foreground)

                        Text(user.email)
                            .wsBody(.small, weight: .semibold)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    .padding(.top, 60)

                    VStack(spacing: 6) {
                        Text("You're signed in.")
                            .wsBody(.medium, weight: .bold)
                            .foregroundStyle(WSColor.foreground)
                        Text("Tabs + tools land in Chapter 3.")
                            .wsBody(.small)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    .padding(.horizontal, 32)
                    .multilineTextAlignment(.center)

                    VStack(spacing: 10) {
                        Button("Sign out", action: onSignOut)
                            .buttonStyle(WSSecondaryButtonStyle(fullWidth: true))
                        Button("Reset onboarding") {
                            onboardingComplete = false
                        }
                        .buttonStyle(WSTertiaryButtonStyle())
                    }
                    .padding(.horizontal, 24)
                }
                .padding(.bottom, 40)
            }
        }
    }
}

#Preview("Onboarding") {
    ContentView(onboardingComplete: .constant(false))
}

#Preview("Auth") {
    ContentView(onboardingComplete: .constant(true))
}
