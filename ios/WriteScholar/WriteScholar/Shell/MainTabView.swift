//
//  MainTabView.swift
//  WriteScholar
//
//  Bottom tab bar shell for the signed-in app:
//    Study | Analyze | Games | Library | Settings
//  Only Study (Chapter 3) is wired to a real flow today; the rest are
//  branded placeholders that flesh out in later chapters.
//

import SwiftUI

struct MainTabView: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    var body: some View {
        TabView {
            StudyPackTabContainer()
                .tabItem {
                    Label("Study", systemImage: "graduationcap.fill")
                }

            AnalyzeTabContainer()
                .tabItem {
                    Label("Analyze", systemImage: "doc.text.magnifyingglass")
                }

            GamesTabView()
                .tabItem {
                    Label("Games", systemImage: "gamecontroller.fill")
                }

            ComingSoonTab(
                title: "Library",
                subtitle: "Every essay analysis and study pack you create — all in one place.",
                systemIcon: "books.vertical.fill",
                tint: Color(hex: 0x6366F1),
                chapterLabel: "Chapter 6"
            )
            .tabItem {
                Label("Library", systemImage: "books.vertical.fill")
            }

            SettingsTab(
                user: user,
                onboardingComplete: $onboardingComplete,
                onSignOut: onSignOut
            )
            .tabItem {
                Label("Settings", systemImage: "gearshape.fill")
            }
        }
        .tint(WSColor.brandPrimary)
    }
}

// MARK: - Placeholder tab body

struct ComingSoonTab: View {
    let title: String
    let subtitle: String
    let systemIcon: String
    let tint: Color
    let chapterLabel: String

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            VStack(spacing: 18) {
                ZStack {
                    Circle()
                        .fill(tint.opacity(0.15))
                        .frame(width: 130, height: 130)
                    Image(systemName: systemIcon)
                        .font(.system(size: 56, weight: .semibold))
                        .foregroundStyle(tint)
                }

                VStack(spacing: 6) {
                    Text(title)
                        .wsHeadline(.medium, weight: .semibold)
                        .foregroundStyle(WSColor.foreground)

                    Text(chapterLabel)
                        .wsEyebrow()
                        .foregroundStyle(tint)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(tint.opacity(0.15)))
                }

                Text(subtitle)
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            .padding(.top, 60)
        }
    }
}

// MARK: - Settings tab

struct SettingsTab: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 22) {
                    // Account card
                    HStack(spacing: 14) {
                        WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                            .frame(width: 64, height: 64)
                            .background(Circle().fill(WSColor.brandSoft))
                            .clipShape(Circle())

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

                    // Settings rows
                    VStack(spacing: 0) {
                        SettingsRow(icon: "crown.fill",          tint: Color(hex: 0xF59E0B), label: "Upgrade to Pro")
                        Divider().padding(.leading, 50)
                        SettingsRow(icon: "questionmark.circle", tint: WSColor.brandPrimary,  label: "Help center")
                        Divider().padding(.leading, 50)
                        SettingsRow(icon: "lock.shield",         tint: WSColor.foregroundMuted, label: "Privacy & terms")
                        Divider().padding(.leading, 50)
                        Button {
                            onboardingComplete = false
                            Haptics.light()
                        } label: {
                            SettingsRow(icon: "sparkles",        tint: Color(hex: 0xD946EF), label: "Replay onboarding", asButton: true)
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

                    Button("Sign out") {
                        onSignOut()
                    }
                    .buttonStyle(WSSecondaryButtonStyle(fullWidth: true))

                    Text("WriteScholar iOS · v1.0")
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .padding(.top, 8)
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 32)
            }
        }
    }
}

private struct SettingsRow: View {
    let icon: String
    let tint: Color
    let label: String
    var asButton: Bool = false

    var body: some View {
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
}

#Preview {
    MainTabView(
        user: WSUser(
            id: "1",
            email: "you@school.edu",
            username: "you",
            firstName: "Alex",
            lastName: nil,
            subscriptionPlan: "free",
            subscriptionStatus: "active",
            emailVerified: true,
            onboardingCompleted: true,
            welcomeTutorialCompleted: true
        ),
        onboardingComplete: .constant(true),
        onSignOut: {}
    )
}
