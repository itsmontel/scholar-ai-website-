//
//  SignUpView.swift
//  WriteScholar
//
//  Email + password registration. Backend requires email verification
//  before the account can sign in, so on success we route to a
//  "check your inbox" success screen rather than dropping into Home.
//

import SwiftUI

struct SignUpView: View {
    @EnvironmentObject var session: AuthSession
    @Binding var path: NavigationPath

    @State private var email: String = ""
    @State private var password: String = ""
    @State private var confirmPassword: String = ""
    @State private var isLoading: Bool = false
    @FocusState private var focusedField: Field?

    enum Field { case email, password, confirm }

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 28) {
                    headerBlock
                        .padding(.top, 12)

                    formBlock
                        .padding(.horizontal, 24)

                    footerBlock
                        .padding(.horizontal, 24)
                }
                .padding(.bottom, 40)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    Haptics.light()
                    guard !path.isEmpty else { return }
                    path.removeLast()
                } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "chevron.backward")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Skip")
                            .wsBody(.small, weight: .bold)
                    }
                    .foregroundStyle(WSColor.brandPrimary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Skip sign up and go back")
            }
        }
        .onSubmit { advanceField() }
    }

    // MARK: - Header

    private var headerBlock: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(WSColor.brandSoft)
                    .frame(width: 110, height: 110)
                WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                    .frame(width: 90, height: 90)
            }

            VStack(spacing: 6) {
                Text("Create your account")
                    .wsHeadline(.medium, weight: .semibold)
                    .foregroundStyle(WSColor.foreground)
                Text("Free forever. Pro upgrades inside the app.")
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
        }
    }

    // MARK: - Form

    private var formBlock: some View {
        VStack(spacing: 12) {
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
                placeholder: "Password (6+ chars)",
                icon: "lock",
                text: $password,
                isSecure: true,
                contentType: .newPassword
            )
            .focused($focusedField, equals: .password)

            WSTextField(
                placeholder: "Confirm password",
                icon: "lock.shield",
                text: $confirmPassword,
                isSecure: true,
                contentType: .newPassword
            )
            .focused($focusedField, equals: .confirm)

            if let err = session.lastError {
                Text(err)
                    .wsBody(.small, weight: .semibold)
                    .foregroundStyle(WSColor.concern)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 4)
            }

            if !confirmPassword.isEmpty && password != confirmPassword {
                Text("Passwords don't match yet.")
                    .wsBody(.small, weight: .semibold)
                    .foregroundStyle(WSColor.revise)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 4)
            }

            Button {
                Task { await submit() }
            } label: {
                HStack(spacing: 8) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    }
                    Text(isLoading ? "Creating account…" : "Create account")
                }
            }
            .buttonStyle(WSPrimaryButtonStyle())
            .disabled(!canSubmit || isLoading)
            .opacity(canSubmit ? 1 : 0.65)
            .padding(.top, 4)
        }
    }

    // MARK: - Footer

    private var footerBlock: some View {
        VStack(spacing: 14) {
            HStack(spacing: 4) {
                Text("Already have an account?")
                    .foregroundStyle(WSColor.foregroundMuted)
                Button("Sign in") {
                    guard !path.isEmpty else { return }
                    path.removeLast()
                    if path.isEmpty {
                        path.append(AuthRoute.signIn)
                    }
                }
                .buttonStyle(WSTertiaryButtonStyle())
            }
            .wsBody(.small)

            ExploreWithoutSigningInButton()
        }
    }

    // MARK: - Submission

    private var canSubmit: Bool {
        email.contains("@")
            && password.count >= 6
            && password == confirmPassword
    }

    private func advanceField() {
        switch focusedField {
        case .email:    focusedField = .password
        case .password: focusedField = .confirm
        case .confirm:  if canSubmit { Task { await submit() } }
        case .none:     break
        }
    }

    private func submit() async {
        guard canSubmit, !isLoading else { return }
        Haptics.medium()
        isLoading = true
        let resp = await session.signUp(
            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
            password: password
        )
        isLoading = false
        if resp != nil {
            Haptics.success()
            path.append(AuthRoute.signUpSuccess(email: email))
        }
    }
}

#Preview {
    NavigationStack {
        SignUpView(path: .constant(NavigationPath()))
    }
    .environmentObject(AuthSession())
}
