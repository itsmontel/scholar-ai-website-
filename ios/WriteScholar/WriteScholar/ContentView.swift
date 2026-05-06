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
                OnboardingFlow(onboardingComplete: $onboardingComplete, session: session)
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
                    MainTabView(
                        user: user,
                        onboardingComplete: $onboardingComplete,
                        onSignOut: { session.signOut() }
                    )
                    .environmentObject(session)
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

#Preview("Onboarding") {
    ContentView(onboardingComplete: .constant(false))
}

#Preview("Auth") {
    ContentView(onboardingComplete: .constant(true))
}
