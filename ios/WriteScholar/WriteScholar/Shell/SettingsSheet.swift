//
//  SettingsSheet.swift
//  WriteScholar
//
//  Settings is no longer a bottom-bar tab — it lives behind the profile
//  avatar in the top-right of the Home tab, presented as a modal sheet.
//

import SwiftUI

struct SettingsSheet: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var session: AuthSession

    @State private var showDeleteConfirm = false
    @State private var deleting = false
    @State private var deleteError: String?

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    ScrollView {
                        VStack(spacing: 22) {
                            accountCard
                            settingsList
                            signOutButton
                            if !user.isLocalGuestAccount {
                                deleteAccountButton
                            }
                            appVersion
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 8)
                        .padding(.bottom, 32)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Haptics.light()
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(WSColor.foreground)
                            .frame(width: 32, height: 32)
                            .wsStickerCircle(fill: WSColor.backgroundElevated)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Close")
                }
            }
        }
    }

    // MARK: - Account card

    private var accountCard: some View {
        HStack(spacing: 14) {
            Text(initial)
                .font(WSFont.headline(28, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 64, height: 64)
                .wsStickerCircle(fill: WSColor.lime, depth: 3)

            VStack(alignment: .leading, spacing: 4) {
                Text(user.displayName)
                    .font(WSFont.headline(18, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                Text(user.email)
                    .font(WSFont.sans(13))
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
                HStack(spacing: 6) {
                    Image(systemName: user.isPro ? "crown.fill" : "leaf.fill")
                    Text(user.isPro ? "Pro" : "Free")
                        .font(WSFont.headline(12, weight: .black))
                }
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, 9)
                .padding(.vertical, 3)
                .background(Capsule().fill(user.isPro ? WSColor.sun : WSColor.lime))
                .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
            }
            Spacer()
        }
        .wsChunkyCard(accent: WSColor.duoGreen)
    }

    private var initial: String {
        String(user.displayName.first.map(String.init) ?? "?").uppercased()
    }

    // MARK: - Settings list

    private var settingsList: some View {
        VStack(spacing: 10) {
            linkRow(icon: "crown.fill",          tint: WSColor.duoOrange, label: "Upgrade to Pro",
                    url: "https://writescholar.com/pricing")
            linkRow(icon: "trophy.fill",         tint: WSColor.duoPurple, label: "All achievements",
                    url: "https://writescholar.com/dashboard")
            linkRow(icon: "questionmark.circle", tint: WSColor.duoBlue,   label: "Help center",
                    url: "https://writescholar.com/help")
            linkRow(icon: "lock.shield",         tint: WSColor.lilacDeep, label: "Privacy & terms",
                    url: "https://writescholar.com/privacy")
            Button {
                Haptics.light()
                onboardingComplete = false
                dismiss()
            } label: {
                settingsRow(icon: "sparkles",        tint: WSColor.duoPurple,   label: "Replay onboarding")
            }
            .buttonStyle(WSStickerPressStyle())
        }
    }

    private func linkRow(icon: String, tint: Color, label: String, url: String) -> some View {
        Button {
            Haptics.light()
            if let u = URL(string: url) { UIApplication.shared.open(u) }
        } label: {
            settingsRow(icon: icon, tint: tint, label: label)
        }
        .buttonStyle(.plain)
    }

    private func settingsRow(icon: String, tint: Color, label: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 36, height: 36)
                .background(
                    ZStack {
                        RoundedRectangle(cornerRadius: 11, style: .continuous).fill(WSStickerTint.face(for: tint))
                        RoundedRectangle(cornerRadius: 11, style: .continuous).strokeBorder(WSColor.ink, lineWidth: 2)
                    }
                )
            Text(label)
                .font(WSFont.headline(16, weight: .black))
                .foregroundStyle(WSColor.foreground)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .black))
                .foregroundStyle(WSColor.foreground)
        }
        .wsChunkyCard(
            cornerRadius: 16,
            horizontalPadding: 14,
            verticalPadding: 12,
            lipHeight: 4,
            accent: tint
        )
    }

    // MARK: - Sign out + version

    private var signOutButton: some View {
        Button("Sign out") {
            Haptics.medium()
            onSignOut()
            dismiss()
        }
        .buttonStyle(WSDuoDangerButtonStyle())
    }

    // MARK: - Delete account (App Store guideline 5.1.1(v))

    private var deleteAccountButton: some View {
        Button {
            Haptics.warning()
            showDeleteConfirm = true
        } label: {
            HStack(spacing: 8) {
                if deleting {
                    ProgressView().tint(WSColor.foregroundMuted)
                } else {
                    Image(systemName: "trash")
                }
                Text(deleting ? "Deleting…" : "Delete account")
            }
            .font(WSFont.sans(14, weight: .heavy))
            .foregroundStyle(WSColor.foregroundMuted)
            .frame(minHeight: 44)
        }
        .buttonStyle(.plain)
        .disabled(deleting)
        .accessibilityHint("Permanently deletes your WriteScholar account")
        .alert("Delete your account?", isPresented: $showDeleteConfirm) {
            Button("Delete forever", role: .destructive) { deleteAccount() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This permanently deletes your WriteScholar account and the essays, study packs and progress saved to it. Any paid plan is cancelled too, so you won't be charged again. It can't be undone.")
        }
        .alert("Couldn't delete your account",
               isPresented: Binding(get: { deleteError != nil },
                                    set: { if !$0 { deleteError = nil } })) {
            Button("OK", role: .cancel) { deleteError = nil }
        } message: {
            Text(deleteError ?? "")
        }
    }

    private func deleteAccount() {
        deleting = true
        Task {
            do {
                try await session.deleteAccount()
                deleting = false
                Haptics.success()
                dismiss()
            } catch {
                deleting = false
                deleteError = error.localizedDescription
            }
        }
    }

    private var appVersion: some View {
        Text("WriteScholar iOS · v1.0")
            .font(WSFont.sans(11, weight: .bold))
            .foregroundStyle(WSColor.foregroundMuted)
            .padding(.top, 8)
    }
}

#Preview {
    SettingsSheet(
        user: WSUser(
            id: "1", email: "you@school.edu", username: "you",
            firstName: "Alex", lastName: nil,
            subscriptionPlan: "free", subscriptionStatus: "active",
            emailVerified: true, onboardingCompleted: true,
            welcomeTutorialCompleted: true
        ),
        onboardingComplete: .constant(true),
        onSignOut: {}
    )
    .environmentObject(AuthSession())
}
