//
//  FocusTabView.swift
//  WriteScholar
//
//  Landing screen for the Focus tab — Duolingo-style design.
//
//    1. Mascot hero, settings button in its top-right corner
//    2. Study Mode card:  on/off, all apps vs chosen apps, unlock length
//    3. Preview:          a tappable copy of the question screen
//    4. Stat tiles:       right today · missed today · questions ready
//    5. Unlock everything: the 5-question challenge that opens every app
//    6. How it works:     three-step explainer
//    7. Web sync hint:    site gating lives in the Chrome extension
//

import SwiftUI
import FamilyControls

struct FocusTabView: View {
    @StateObject private var manager = FocusManager.shared

    @State private var showAppPicker  = false
    @State private var showSettings   = false
    @State private var showChallenge  = false
    @State private var showPacks      = false
    @State private var showAllowedPicker = false
    @State private var allowedDraft   = FamilyActivitySelection()

    @State private var nowTick: Date = Date()
    private let countdownTimer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    mascotHero
                        .overlay(alignment: .topTrailing) { settingsButton }
                    StudyModeCard(
                        manager: manager,
                        onChooseApps: { showAppPicker = true },
                        onChooseAllowed: {
                            allowedDraft = manager.allowedSelection
                            showAllowedPicker = true
                        }
                    )
                    StudyGatePreview(
                        question: manager.studyNextQuestion,
                        deckCount: manager.studyDeckCount,
                        packCount: manager.studyPackCount,
                        usesTopicBanks: manager.studyUsesTopicBanks,
                        packsLabel: packsLabel,
                        onChoosePacks: { showPacks = true }
                    )
                    statTiles
                    if manager.isStudyModeGating || manager.isCurrentlyUnlocked {
                        unlockEverythingCard
                    }
                    howItWorks
                    webSyncHint
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
            .refreshable {
                manager.refreshStudyMode()
                nowTick = Date()
            }
        }
        .onAppear { manager.refreshStudyMode() }
        .onReceive(countdownTimer) { now in
            nowTick = now
        }
        .sheet(isPresented: $showAppPicker) {
            FocusBlockedAppsView(manager: manager)
        }
        .sheet(isPresented: $showSettings) {
            FocusSettingsSheet(manager: manager)
        }
        .sheet(isPresented: $showPacks) {
            StudyModePacksSheet(manager: manager)
        }
        .familyActivityPicker(isPresented: $showAllowedPicker, selection: $allowedDraft)
        .onChange(of: showAllowedPicker) { _, isShowing in
            if !isShowing { manager.updateAllowedSelection(allowedDraft) }
        }
        .fullScreenCover(isPresented: $showChallenge) {
            FocusUnlockChallenge(manager: manager) { _ in
                showChallenge = false
            }
        }
    }

    private var packsLabel: String {
        let ids = manager.studyConfig.packIDs
        if ids.isEmpty { return "all packs" }
        return "\(ids.count) pack\(ids.count == 1 ? "" : "s")"
    }

    // MARK: - Mascot hero (Duolingo-energy header with mascot-paper)

    private var mascotHero: some View {
        VStack(spacing: 10) {
            WSAnimatedImage(name: "mascot-paper", ext: "webp")
                .frame(width: 150, height: 150)
                .wsMascotBob(amount: 7, rock: 3, duration: 1.4)
                .background(
                    WSStarburst(points: 16, inset: 0.86)
                        .fill(WSColor.lime)
                        .overlay(WSStarburst(points: 16, inset: 0.86).stroke(WSColor.ink, lineWidth: 2.5))
                        .frame(width: 170, height: 170)
                        .wsSpin(period: 24)
                )

            VStack(spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 11, weight: .black))
                    Text("STUDY MODE")
                        .font(WSFont.sans(11, weight: .black))
                        .tracking(1.2)
                }
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .wsStickerCapsule(fill: WSColor.orange, depth: 2)

                (Text("Earn your ")
                    .foregroundStyle(WSColor.foreground)
                +
                Text("scroll time.")
                    .foregroundStyle(WSColor.purple))
                    .font(WSFont.headline(34, weight: .black))
                    .tracking(-1)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    // MARK: - Settings button (top-right of the hero)

    private var settingsButton: some View {
        HStack(spacing: 10) {
            Button {
                Haptics.medium()
                showSettings = true
            } label: {
                Image(systemName: "slider.horizontal.3")
                    .foregroundStyle(WSColor.foreground)
                    .font(.system(size: 15, weight: .black))
                    .frame(width: 40, height: 40)
                    .wsStickerCircle(fill: WSColor.backgroundElevated, depth: 3)
                    .padding(.bottom, 3)
            }
            .buttonStyle(WSStickerPressStyle())
            .accessibilityLabel("Focus settings")
        }
    }

    // MARK: - Stat tiles

    private var statTiles: some View {
        HStack(spacing: 10) {
            statTile(
                icon: "checkmark.circle.fill",
                label: "Right today",
                value: "\(manager.studyToday.right)",
                tint: WSColor.lime
            )
            statTile(
                icon: "arrow.uturn.backward.circle.fill",
                label: "Missed",
                value: "\(manager.studyToday.wrong)",
                tint: WSColor.pink
            )
            statTile(
                icon: "rectangle.stack.fill",
                label: "Questions",
                value: "\(manager.studyDeckCount)",
                tint: WSColor.sky
            )
        }
    }

    private func statTile(icon: String, label: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(WSColor.inkText)
                .font(.system(size: 15, weight: .black))
                .frame(width: 36, height: 36)
                .wsStickerCircle(fill: tint)
            Text(value)
                .font(WSFont.headline(28, weight: .black))
                .foregroundStyle(WSColor.foreground)
                .contentTransition(.numericText())
            Text(label.uppercased())
                .font(WSFont.sans(10, weight: .black))
                .foregroundStyle(WSColor.foregroundMuted)
                .tracking(0.5)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 20, horizontalPadding: 14, verticalPadding: 14)
    }

    // MARK: - Unlock everything

    /// The original 5-question challenge, now the "I need my whole phone
    /// for a while" option next to the one-question-per-app flow.
    private var unlockEverythingCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: manager.isCurrentlyUnlocked ? "lock.open.fill" : "bolt.fill")
                    .font(.system(size: 17, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 44, height: 44)
                    .wsStickerCircle(fill: manager.isCurrentlyUnlocked ? WSColor.lime : WSColor.sky)
                VStack(alignment: .leading, spacing: 2) {
                    Text(manager.isCurrentlyUnlocked ? "Everything is open" : "Need everything open?")
                        .font(WSFont.headline(17, weight: .black))
                        .foregroundStyle(WSColor.foreground)
                    Text(unlockEverythingDetail)
                        .wsBody(.caption, weight: .semibold)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }

            if manager.isCurrentlyUnlocked {
                Text(manager.unlockTimeRemainingString)
                    .font(WSFont.headline(34, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .monospacedDigit()
                    .frame(maxWidth: .infinity)
            } else {
                HStack(spacing: 10) {
                    Button {
                        Haptics.medium()
                        showChallenge = true
                    } label: {
                        Label("Take the challenge", systemImage: "play.fill")
                    }
                    .buttonStyle(WSStickerButtonStyle(fill: WSColor.sky, foreground: WSColor.inkText, radius: 999, depth: 3,
                                                      fullWidth: false, height: 46, font: WSFont.headline(15, weight: .black)))

                    Button {
                        Haptics.medium()
                        showSettings = true
                    } label: {
                        Text("Settings")
                    }
                    .buttonStyle(WSTertiaryButtonStyle())
                }
            }
        }
        .wsChunkyCard(horizontalPadding: 14, verticalPadding: 14)
    }

    private var unlockEverythingDetail: String {
        _ = nowTick
        if manager.isCurrentlyUnlocked {
            return "Apps won't ask questions until the timer runs out."
        }
        let s = manager.settings
        return "Get \(s.difficulty.requiredCorrect) of \(s.difficulty.totalQuestions) right and every app opens for \(s.unlockDuration.label) without asking."
    }

    // MARK: - How it works

    private var howItWorks: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("How Study Mode works")
                .font(WSFont.headline(22, weight: .black))
                .foregroundStyle(WSColor.foreground)

            stepRow(
                num: 1,
                title: "Choose your apps",
                blurb: "All of them, or just the ones that pull you in. Apple's picker keeps the list private, even from us.",
                icon: "hand.tap.fill",
                tint: WSColor.pink
            )
            stepRow(
                num: 2,
                title: "Answer one question",
                blurb: "Open one and it asks a question from your study packs first. Two answers, one tap.",
                icon: "questionmark.bubble.fill",
                tint: WSColor.sky
            )
            stepRow(
                num: 3,
                title: "It opens for \(manager.studyConfig.unlockMinutes) min",
                blurb: "Right answer and you're in. Wrong answer, you see the right one and get another go.",
                icon: "lock.open.fill",
                tint: WSColor.lime
            )
        }
        .wsChunkyCard()
    }

    private func stepRow(num: Int, title: String, blurb: String, icon: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(num)")
                .font(WSFont.headline(17, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 38, height: 38)
                .wsStickerCircle(fill: tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(WSFont.headline(16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                Text(blurb)
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
    }

    // MARK: - Web sync hint

    private var webSyncHint: some View {
        HStack(spacing: 12) {
            Image(systemName: "globe")
                .font(.system(size: 18, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 42, height: 42)
                .wsStickerCircle(fill: WSColor.sky)
            VStack(alignment: .leading, spacing: 2) {
                Text("Study on desktop too")
                    .font(WSFont.headline(16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                Text("Install the WriteScholar Chrome extension to get the same question before TikTok, YouTube and friends open in your browser.")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
        .wsChunkyCard(horizontalPadding: 14, verticalPadding: 14)
    }
}

#Preview {
    FocusTabView()
}
