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

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.duoSurface.ignoresSafeArea()

                VStack(spacing: 0) {
                    WSChunkyRibbon(color: WSColor.duoPurple)
                    ScrollView {
                        VStack(spacing: 22) {
                            accountCard
                            settingsList
                            signOutButton
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
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundStyle(WSColor.duoBorder)
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
            ZStack {
                Circle()
                    .fill(WSColor.duoGreen)
                    .frame(width: 64, height: 64)
                Circle()
                    .stroke(WSColor.duoGreenDark, lineWidth: 2)
                    .frame(width: 64, height: 64)
                Text(initial)
                    .font(WSFont.headline(26, weight: .black))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(user.displayName)
                    .font(WSFont.headline(15, weight: .black))
                    .foregroundStyle(WSColor.duoText)
                Text(user.email)
                    .font(WSFont.sans(13))
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
                HStack(spacing: 6) {
                    Image(systemName: user.isPro ? "crown.fill" : "leaf.fill")
                        .foregroundStyle(user.isPro ? WSColor.duoOrange : WSColor.duoGreen)
                    Text(user.isPro ? "Pro" : "Free")
                        .font(WSFont.headline(11, weight: .black))
                        .foregroundStyle(WSColor.duoText)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    Capsule().fill(user.isPro ? WSColor.duoOrangeLight : WSColor.duoGreenLight)
                )
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
            settingsRow(icon: "crown.fill",          tint: WSColor.duoOrange,   label: "Upgrade to Pro")
            settingsRow(icon: "trophy.fill",         tint: WSColor.duoPurple,   label: "All achievements")
            settingsRow(icon: "questionmark.circle", tint: WSColor.duoBlue,     label: "Help center")
            settingsRow(icon: "lock.shield",         tint: WSColor.duoText.opacity(0.5), label: "Privacy & terms")
            Button {
                Haptics.light()
                onboardingComplete = false
                dismiss()
            } label: {
                settingsRow(icon: "sparkles",        tint: WSColor.duoPurple,   label: "Replay onboarding")
            }
            .buttonStyle(.plain)
        }
    }

    private func settingsRow(icon: String, tint: Color, label: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(tint.opacity(0.12))
                    .frame(width: 34, height: 34)
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(tint)
            }
            Text(label)
                .font(WSFont.headline(15, weight: .black))
                .foregroundStyle(WSColor.duoText)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(WSColor.duoBorder)
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

    private var appVersion: some View {
        Text("WriteScholar iOS · v1.0")
            .font(WSFont.sans(11, weight: .bold))
            .foregroundStyle(WSColor.duoText.opacity(0.4))
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
}
