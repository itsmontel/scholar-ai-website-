//
//  SignInView.swift
//  WriteScholar
//
//  Email + password login. Calls AuthSession.signIn which hits the
//  existing /api/auth/login endpoint.
//

import SwiftUI

struct SignInView: View {
    @EnvironmentObject var session: AuthSession
    @Binding var path: NavigationPath

    @State private var email: String = ""
    @State private var password: String = ""
    @State private var isLoading: Bool = false
    @FocusState private var focusedField: Field?

    enum Field { case email, password }

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    headerBlock
                        .padding(.top, 16)
                        .wsStaggerEntry(0)

                    formCard
                        .padding(.horizontal, 24)
                        .wsStaggerEntry(1)

                    footerBlock
                        .padding(.horizontal, 24)
                        .wsStaggerEntry(2)
                }
                .padding(.bottom, 40)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .onSubmit { advanceField() }
    }

    // MARK: - Header

    private var headerBlock: some View {
        VStack(spacing: 16) {
            WSAnimatedImage(name: "mascot-paper", ext: "webp")
                .frame(width: 100, height: 100)
                .wsBobbing(amount: 3, duration: 2.8)

            VStack(spacing: 8) {
                Text("Welcome back")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                Text("Sign in to your WriteScholar account.")
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
        }
    }

    // MARK: - Form inside a chunky card

    private var formCard: some View {
        VStack(spacing: 14) {
            WSTextField(
                placeholder: "Email",
                icon: "envelope",
                text: $email,
                isSecure: false,
                contentType: .emailAddress,
                keyboard: .emailAddress
            )
            .focused($focusedField, equals: .email)

            WSTextField(
                placeholder: "Password",
                icon: "lock",
                text: $password,
                isSecure: true,
                contentType: .password
            )
            .focused($focusedField, equals: .password)

            if let err = session.lastError {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 13, weight: .bold))
                    Text(err)
                        .wsBody(.small, weight: .bold)
                }
                .foregroundStyle(WSColor.duoRed)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(WSColor.duoRedLight)
                )
                .transition(.opacity.combined(with: .scale(scale: 0.95)))
            }

            Button {
                Task { await submit() }
            } label: {
                HStack(spacing: 8) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    }
                    Text(isLoading ? "Signing in..." : "Sign in")
                }
            }
            .buttonStyle(WSDuoPrimaryButtonStyle())
            .disabled(!canSubmit || isLoading)
            .opacity(canSubmit ? 1 : 0.55)
            .padding(.top, 4)
        }
        .wsChunkyCard(
            cornerRadius: 22,
            horizontalPadding: 20,
            verticalPadding: 24,
            accent: WSColor.duoPurple
        )
    }

    // MARK: - Footer

    private var footerBlock: some View {
        VStack(spacing: 14) {
            Button("Forgot your password?") {
                // Not yet implemented — links to website for now
                if let url = URL(string: "https://writescholar.com/reset-password") {
                    UIApplication.shared.open(url)
                }
            }
            .buttonStyle(WSTertiaryButtonStyle())

            HStack(spacing: 4) {
                Text("New here?")
                    .foregroundStyle(WSColor.foregroundMuted)
                Button("Create an account") {
                    path.append(AuthRoute.signUp)
                }
                .buttonStyle(WSTertiaryButtonStyle())
            }
            .wsBody(.small)

            ExploreWithoutSigningInButton()
        }
    }

    // MARK: - Submission

    private var canSubmit: Bool {
        email.contains("@") && password.count >= 6
    }

    private func advanceField() {
        if focusedField == .email {
            focusedField = .password
        } else if focusedField == .password, canSubmit {
            Task { await submit() }
        }
    }

    private func submit() async {
        guard canSubmit, !isLoading else { return }
        Haptics.medium()
        isLoading = true
        await session.signIn(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
        isLoading = false
        if session.state.isAuthenticated {
            Haptics.success()
            // Sheet/stack pops automatically because the ContentView swaps
            // away from AuthFlowView once `state.isAuthenticated` flips.
        }
    }
}

#Preview {
    NavigationStack {
        SignInView(path: .constant(NavigationPath()))
    }
    .environmentObject(AuthSession())
}
