//
//  SignUpSuccessView.swift
//  WriteScholar
//
//  Shown after a successful /auth/register. Backend sends a verification
//  email; user must click the link before /auth/login will succeed.
//

import SwiftUI

struct SignUpSuccessView: View {
    let email: String
    @Binding var path: NavigationPath
    @State private var celebrate = 0
    @State private var appeared = false

    var body: some View {
        ZStack {
            // Green-tinted celebration background
            LinearGradient(
                colors: [
                    WSColor.backgroundElevated,
                    WSColor.duoGreenLight,
                    WSColor.duoGreenLight.opacity(0.6)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 28) {
                Spacer(minLength: 0)

                // Mascot with green glow
                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 160, height: 160)
                    .wsBobbing(amount: 6, duration: 2.2)
                    .shadow(color: WSColor.duoGreen.opacity(0.3), radius: 20, y: 8)
                    .wsStaggerEntry(0)

                // Success message in a chunky card
                VStack(spacing: 14) {
                    // Green checkmark badge
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 44, weight: .bold))
                        .foregroundStyle(WSColor.duoGreen)

                    Text("Check your inbox")
                        .wsHeadline(.large, weight: .black)
                        .foregroundStyle(WSColor.duoText)

                    VStack(spacing: 6) {
                        Text("We sent a verification link to")
                            .wsBody(.medium)
                            .foregroundStyle(WSColor.foregroundMuted)
                        Text(email)
                            .wsBody(.medium, weight: .bold)
                            .foregroundStyle(WSColor.duoPurple)
                    }

                    Text("Click the link to activate your account, then come back here to sign in.")
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .multilineTextAlignment(.center)
                        .padding(.top, 2)
                }
                .multilineTextAlignment(.center)
                .wsChunkyCard(
                    cornerRadius: 24,
                    horizontalPadding: 24,
                    verticalPadding: 28,
                    accent: WSColor.duoGreen
                )
                .padding(.horizontal, 24)
                .wsStaggerEntry(1)

                Spacer(minLength: 0)

                // Action buttons
                VStack(spacing: 12) {
                    Button("Open Mail") {
                        if let url = URL(string: "message://"),
                           UIApplication.shared.canOpenURL(url) {
                            UIApplication.shared.open(url)
                        }
                    }
                    .buttonStyle(WSDuoSuccessButtonStyle())

                    Button("I've verified \u{2014} sign me in") {
                        // Pop back to sign-in so user can log in.
                        path.removeLast(path.count)
                        path.append(AuthRoute.signIn)
                    }
                    .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
                .wsStaggerEntry(2)
            }

            // Confetti overlay
            WSConfettiView(trigger: $celebrate)
                .ignoresSafeArea()
        }
        .navigationBarBackButtonHidden(true)
        .onAppear {
            guard !appeared else { return }
            appeared = true
            // Fire confetti after a brief delay so the view is visible
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                celebrate += 1
            }
        }
    }
}

#Preview {
    NavigationStack {
        SignUpSuccessView(email: "you@school.edu", path: .constant(NavigationPath()))
    }
}
