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
                            .font(.system(size: 14, weight: .bold))
                        Text("Skip")
                            .font(WSFont.sans(14, weight: .bold))
                    }
                    .foregroundStyle(WSColor.duoPurple)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Skip sign up and go back")
            }
        }
        .onSubmit { advanceField() }
    }

    // MARK: - Header

    private var headerBlock: some View {
        VStack(spacing: 16) {
            WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                .frame(width: 100, height: 100)
                .wsBobbing(amount: 3, duration: 2.8)

            VStack(spacing: 8) {
                Text("Create your account")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                Text("Free forever. Pro upgrades inside the app.")
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

            if !confirmPassword.isEmpty && password != confirmPassword {
                HStack(spacing: 6) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 13, weight: .bold))
                    Text("Passwords don't match yet.")
                        .wsBody(.small, weight: .bold)
                }
                .foregroundStyle(WSColor.duoOrange)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(WSColor.duoOrangeLight)
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
                    Text(isLoading ? "Creating account..." : "Create account")
                }
            }
            .buttonStyle(WSDuoSuccessButtonStyle())
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
