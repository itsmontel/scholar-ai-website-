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
                WSGradient.heroBackdrop.ignoresSafeArea()

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
                            .foregroundStyle(WSColor.foregroundMuted)
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
                    .fill(WSGradient.brand)
                    .frame(width: 64, height: 64)
                Text(initial)
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(user.displayName)
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text(user.email)
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
                HStack(spacing: 6) {
                    Image(systemName: user.isPro ? "crown.fill" : "leaf.fill")
                        .foregroundStyle(user.isPro ? Color(hex: 0xF59E0B) : WSColor.strong)
                    Text(user.isPro ? "Pro" : "Free")
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    Capsule().fill((user.isPro ? Color(hex: 0xF59E0B) : WSColor.strong).opacity(0.18))
                )
            }
            Spacer()
        }
        .padding(16)
        .wsCard(elevation: .medium)
    }

    private var initial: String {
        String(user.displayName.first.map(String.init) ?? "?").uppercased()
    }

    // MARK: - Settings list

    private var settingsList: some View {
        VStack(spacing: 0) {
            settingsRow(icon: "crown.fill",          tint: Color(hex: 0xF59E0B), label: "Upgrade to Pro")
            divider
            settingsRow(icon: "trophy.fill",         tint: Color(hex: 0x8B5CF6), label: "All achievements")
            divider
            settingsRow(icon: "questionmark.circle", tint: WSColor.brandPrimary,  label: "Help center")
            divider
            settingsRow(icon: "lock.shield",         tint: WSColor.foregroundMuted, label: "Privacy & terms")
            divider
            Button {
                Haptics.light()
                onboardingComplete = false
                dismiss()
            } label: {
                settingsRow(icon: "sparkles",        tint: Color(hex: 0xD946EF), label: "Replay onboarding")
            }
            .buttonStyle(.plain)
        }
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
        )
    }

    private var divider: some View {
        Divider().padding(.leading, 60)
    }

    private func settingsRow(icon: String, tint: Color, label: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(tint.opacity(0.14))
                    .frame(width: 30, height: 30)
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(tint)
            }
            Text(label)
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
    }

    // MARK: - Sign out + version

    private var signOutButton: some View {
        Button("Sign out") {
            Haptics.medium()
            onSignOut()
            dismiss()
        }
        .buttonStyle(WSSecondaryButtonStyle(fullWidth: true))
    }

    private var appVersion: some View {
        Text("WriteScholar iOS · v1.0")
            .wsBody(.caption)
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
}
