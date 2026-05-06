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
    @State private var bob: CGFloat = 0

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            VStack(spacing: 28) {
                Spacer(minLength: 0)

                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(hex: 0x10B981, opacity: 0.32),
                                    .clear
                                ],
                                center: .center, startRadius: 10, endRadius: 180
                            )
                        )
                        .frame(width: 280, height: 280)
                        .blur(radius: 12)

                    WSAnimatedImage(name: "mascot-dance", ext: "webp")
                        .frame(width: 160, height: 160)
                        .offset(y: bob)
                        .shadow(color: Color(hex: 0x10B981, opacity: 0.32), radius: 22, y: 12)
                }

                VStack(spacing: 12) {
                    Text("Check your inbox")
                        .wsHeadline(.large, weight: .semibold)
                        .foregroundStyle(WSColor.foreground)

                    VStack(spacing: 4) {
                        Text("We sent a verification link to")
                            .wsBody(.medium)
                            .foregroundStyle(WSColor.foregroundMuted)
                        Text(email)
                            .wsBody(.medium, weight: .bold)
                            .foregroundStyle(WSColor.brandPrimary)
                    }

                    Text("Click the link to activate your account, then come back here to sign in.")
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                        .padding(.top, 4)
                }

                Spacer(minLength: 0)

                VStack(spacing: 12) {
                    Button("Open Mail") {
                        if let url = URL(string: "message://"),
                           UIApplication.shared.canOpenURL(url) {
                            UIApplication.shared.open(url)
                        }
                    }
                    .buttonStyle(WSPrimaryButtonStyle())

                    Button("I've verified — sign me in") {
                        // Pop back to sign-in so user can log in.
                        path.removeLast(path.count)
                        path.append(AuthRoute.signIn)
                    }
                    .buttonStyle(WSSecondaryButtonStyle(fullWidth: true))
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
        .navigationBarBackButtonHidden(true)
        .onAppear {
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) {
                bob = -10
            }
        }
    }
}

#Preview {
    NavigationStack {
        SignUpSuccessView(email: "you@school.edu", path: .constant(NavigationPath()))
    }
}
