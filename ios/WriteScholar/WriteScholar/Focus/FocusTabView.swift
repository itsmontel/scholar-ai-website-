//
//  FocusTabView.swift
//  WriteScholar
//
//  Landing screen for the Focus tab — Duolingo-style design.
//
//    1. Top bar:           "FOCUS" eyebrow + mascot
//    2. Status hero:       Big lock + "Focus is on / Unlocked / Off"
//                          + countdown if currently unlocked
//                          + primary CTA (pick apps / try unlock / settings)
//    3. Stat tiles:        Apps blocked · Today's wins · Lifetime wins
//    4. Settings preview:  Challenge type + duration + difficulty (tap -> sheet)
//    5. How it works:      Three-step explainer
//    6. Web sync hint:     Mentions site-blocking lives in the Chrome ext
//

import SwiftUI

struct FocusTabView: View {
    @StateObject private var manager = FocusManager.shared

    @State private var showAppPicker  = false
    @State private var showSettings   = false
    @State private var showChallenge  = false

    @State private var nowTick: Date = Date()
    private let countdownTimer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            WSColor.duoSurface.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    mascotHero
                    topBar
                    statusHero
                    statTiles
                    settingsPreview
                    howItWorks
                    webSyncHint
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
            .refreshable {
                manager.applyBlockingState()
                nowTick = Date()
            }
        }
        .onReceive(countdownTimer) { now in
            nowTick = now
        }
        .sheet(isPresented: $showAppPicker) {
            FocusBlockedAppsView(manager: manager)
        }
        .sheet(isPresented: $showSettings) {
            FocusSettingsSheet(manager: manager)
        }
        .fullScreenCover(isPresented: $showChallenge) {
            FocusUnlockChallenge(manager: manager) { _ in
                showChallenge = false
            }
        }
    }

    // MARK: - Mascot hero (Duolingo-energy header with mascot-paper)

    private var mascotHero: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(WSColor.duoBlueLight)
                    .frame(width: 180, height: 180)

                WSAnimatedImage(name: "mascot-paper", ext: "webp")
                    .frame(width: 140, height: 140)
                    .shadow(color: WSColor.duoBlue.opacity(0.30), radius: 16, y: 8)
                    .wsBobbing(amount: 6, duration: 2.6)
            }

            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "shield.lefthalf.filled")
                        .font(.system(size: 11, weight: .heavy))
                    Text("FOCUS")
                        .font(WSFont.sans(11, weight: .black))
                        .tracking(0.8)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(WSColor.duoBlue)
                        .shadow(color: WSColor.duoBlue.opacity(0.35), radius: 6, y: 3)
                )

                Text("Earn your ")
                    .font(WSFont.headline(28))
                    .foregroundStyle(WSColor.duoText)
                +
                Text("free time")
                    .font(WSFont.headline(28))
                    .foregroundStyle(WSColor.duoPurple)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    // MARK: - Top bar (utility row -- settings only)

    private var topBar: some View {
        HStack(spacing: 10) {
            Spacer()
            Button {
                Haptics.medium()
                showSettings = true
            } label: {
                ZStack {
                    Circle().fill(WSColor.backgroundElevated).frame(width: 40, height: 40)
                        .overlay(Circle().stroke(WSColor.duoBorder, lineWidth: 2))
                    Image(systemName: "slider.horizontal.3")
                        .foregroundStyle(WSColor.duoText)
                        .font(.system(size: 15, weight: .bold))
                }
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Focus settings")
        }
    }

    // MARK: - Status hero

    private var statusHero: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(heroBubbleColor.opacity(0.15))
                    .frame(width: 130, height: 130)

                Circle()
                    .fill(WSColor.backgroundElevated)
                    .frame(width: 100, height: 100)
                    .overlay(
                        Circle().stroke(heroBubbleColor, lineWidth: 3)
                    )

                Image(systemName: heroIcon)
                    .font(.system(size: 44, weight: .heavy))
                    .foregroundStyle(heroBubbleColor)
            }
            .padding(.top, 6)

            Text(manager.statusHeadline)
                .wsHeadline(.large, weight: .black)
                .foregroundStyle(WSColor.duoText)

            Text(heroSubtitle)
                .wsBody(.medium)
                .multilineTextAlignment(.center)
                .foregroundStyle(WSColor.duoText.opacity(0.65))
                .padding(.horizontal, 6)

            heroCTA
                .padding(.top, 6)
        }
        .frame(maxWidth: .infinity)
        .wsChunkyCard(verticalPadding: 22, accent: heroBubbleColor)
    }

    private var heroIcon: String {
        if !manager.hasBlockedApps { return "moon.zzz.fill" }
        if !manager.isAuthorized   { return "exclamationmark.shield.fill" }
        if manager.isCurrentlyUnlocked { return "lock.open.fill" }
        return "lock.fill"
    }

    private var heroBubbleColor: Color {
        if !manager.hasBlockedApps   { return WSColor.duoBorder }
        if !manager.isAuthorized     { return WSColor.duoOrange }
        if manager.isCurrentlyUnlocked { return WSColor.duoGreen }
        return WSColor.duoPurple
    }

    private var heroSubtitle: String {
        _ = nowTick
        if !manager.hasBlockedApps {
            return "Pick a few apps that pull you in. Focus mode shields them until you solve a quick challenge."
        }
        if !manager.isAuthorized {
            return "Tap below to allow Apple Family Controls — that's what powers the shield."
        }
        if manager.isCurrentlyUnlocked {
            return "Apps unlocked for \(manager.unlockTimeRemainingString). They'll relock automatically when the timer runs out."
        }
        return "\(manager.blockedItemsCount) item\(manager.blockedItemsCount == 1 ? "" : "s") shielded right now. Tap below if you genuinely need to open one."
    }

    @ViewBuilder
    private var heroCTA: some View {
        if !manager.hasBlockedApps {
            Button {
                Haptics.medium()
                showAppPicker = true
            } label: {
                Label("Pick apps to block", systemImage: "plus.shield.fill")
            }
            .buttonStyle(WSDuoInfoButtonStyle())
        } else if !manager.isAuthorized {
            Button {
                Haptics.medium()
                Task { await manager.requestAuthorization() }
            } label: {
                Label("Allow Screen Time", systemImage: "lock.shield.fill")
            }
            .buttonStyle(WSDuoWarnButtonStyle())
        } else if manager.isCurrentlyUnlocked {
            VStack(spacing: 8) {
                Text("Time remaining")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
                Text(manager.unlockTimeRemainingString)
                    .font(WSFont.headline(28))
                    .foregroundStyle(WSColor.duoGreen)
            }
        } else {
            Button {
                Haptics.medium()
                showChallenge = true
            } label: {
                Label("Solve to unlock", systemImage: "puzzlepiece.fill")
            }
            .buttonStyle(WSDuoPrimaryButtonStyle())
        }
    }

    // MARK: - Stat tiles

    private var statTiles: some View {
        HStack(spacing: 10) {
            statTile(
                icon: "shield.lefthalf.filled",
                label: "Blocked",
                value: "\(manager.blockedItemsCount)",
                tint: WSColor.duoPurple
            )
            statTile(
                icon: "checkmark.circle.fill",
                label: "Today",
                value: "\(manager.stats.challengesPassedToday)",
                tint: WSColor.duoGreen
            )
            statTile(
                icon: "trophy.fill",
                label: "Total",
                value: "\(manager.stats.totalChallengesPassed)",
                tint: WSColor.duoOrange
            )
        }
    }

    private func statTile(icon: String, label: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                Circle().fill(tint.opacity(0.15)).frame(width: 36, height: 36)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 15, weight: .bold))
            }
            Text(value)
                .font(WSFont.headline(24))
                .foregroundStyle(WSColor.duoText)
            Text(label.uppercased())
                .font(WSFont.sans(10, weight: .black))
                .foregroundStyle(WSColor.duoText.opacity(0.55))
                .tracking(0.5)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 18, horizontalPadding: 14, verticalPadding: 14, lipHeight: 5, accent: tint)
    }

    // MARK: - Settings preview

    private var settingsPreview: some View {
        Button {
            Haptics.medium()
            showSettings = true
        } label: {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    Circle().fill(manager.settings.challengeType.tint.opacity(0.15)).frame(width: 42, height: 42)
                    Image(systemName: manager.settings.challengeType.icon)
                        .foregroundStyle(manager.settings.challengeType.tint)
                        .font(.system(size: 17, weight: .bold))
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Challenge: \(manager.settings.challengeType.rawValue) · \(manager.settings.difficulty.label)")
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.duoText)
                    Text("Unlocks for \(manager.settings.unlockDuration.label) per win — tap to change.")
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.duoText.opacity(0.55))
                }

                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(WSColor.duoText.opacity(0.4))
                    .font(.system(size: 13, weight: .bold))
            }
        }
        .buttonStyle(WSBouncyButtonStyle())
        .wsChunkyCard(horizontalPadding: 14, verticalPadding: 14, lipHeight: 5)
    }

    // MARK: - How it works

    private var howItWorks: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("How Focus mode works")
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.duoText)

            stepRow(
                num: 1,
                title: "Pick your distractors",
                blurb: "Apple's privacy-first picker lets you shield apps + categories without WriteScholar ever seeing the bundle IDs.",
                icon: "hand.raised.fill",
                tint: WSColor.duoPurple
            )
            stepRow(
                num: 2,
                title: "iOS shields them",
                blurb: "Tapping a blocked app shows the iOS shield. From there you bounce back here for a quick challenge.",
                icon: "lock.shield.fill",
                tint: WSColor.duoBlue
            )
            stepRow(
                num: 3,
                title: "Earn an unlock window",
                blurb: "Pass 4 of 5 \(manager.settings.challengeType.rawValue.lowercased()) prompts and apps unlock for \(manager.settings.unlockDuration.label).",
                icon: "lock.open.fill",
                tint: WSColor.duoGreen
            )

            Button {
                Haptics.medium()
                showChallenge = true
            } label: {
                Label("Try a practice challenge", systemImage: "play.fill")
            }
            .buttonStyle(WSDuoPillButtonStyle(palette: .info))
            .padding(.top, 4)
        }
        .wsChunkyCard(accent: WSColor.duoBlue)
    }

    private func stepRow(num: Int, title: String, blurb: String, icon: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle().fill(tint.opacity(0.15)).frame(width: 38, height: 38)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 14, weight: .bold))
                Text("\(num)")
                    .font(WSFont.sans(9, weight: .black))
                    .foregroundStyle(.white)
                    .padding(4)
                    .background(Circle().fill(tint))
                    .offset(x: 14, y: -14)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.duoText)
                Text(blurb)
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
            }
            Spacer()
        }
    }

    // MARK: - Web sync hint

    private var webSyncHint: some View {
        HStack(spacing: 12) {
            Image(systemName: "globe")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(WSColor.duoBlue)
            VStack(alignment: .leading, spacing: 2) {
                Text("Block sites on desktop too")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.duoText)
                Text("Install the WriteScholar Chrome extension to shield TikTok, YouTube and friends in the browser. Same unlock challenge, fully synced.")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
            }
            Spacer()
        }
        .wsChunkyCard(horizontalPadding: 14, verticalPadding: 14, lipHeight: 5, accent: WSColor.duoBlue)
    }
}

#Preview {
    FocusTabView()
}
