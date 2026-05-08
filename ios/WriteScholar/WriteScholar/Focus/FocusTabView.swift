//
//  FocusTabView.swift
//  WriteScholar
//
//  Landing screen for the Focus tab. Layout (top → bottom):
//
//    1. Top bar:           "FOCUS" eyebrow + mascot
//    2. Status hero:       Big lock + "Focus is on / Unlocked / Off"
//                          + countdown if currently unlocked
//                          + primary CTA (pick apps / try unlock / settings)
//    3. Stat tiles:        Apps blocked · Today's wins · Lifetime wins
//    4. Settings preview:  Challenge type + duration + difficulty (tap → sheet)
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
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Multi-color brand orbs (mint / emerald / amber / purple)
            Circle()
                .fill(Color(hex: 0x10B981).opacity(0.18))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: -180, y: -300)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0x34D399).opacity(0.16))
                .frame(width: 320, height: 320)
                .blur(radius: 80)
                .offset(x: 220, y: -120)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xF59E0B).opacity(0.14))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: -200, y: 320)
                .ignoresSafeArea()
            Circle()
                .fill(WSColor.brandPrimary.opacity(0.14))
                .frame(width: 320, height: 320)
                .blur(radius: 90)
                .offset(x: 220, y: 480)
                .ignoresSafeArea()

            // Faint sprinkle dots
            Canvas { ctx, size in
                for i in 0..<32 {
                    let seed = Double(i) * 137.508
                    let x = ((seed * 7).truncatingRemainder(dividingBy: 100)) / 100 * size.width
                    let y = ((seed * 3).truncatingRemainder(dividingBy: 100)) / 100 * size.height
                    let r = (seed.truncatingRemainder(dividingBy: 2)) + 1.2
                    ctx.fill(
                        Path(ellipseIn: CGRect(x: x, y: y, width: r * 2, height: r * 2)),
                        with: .color(.white.opacity(0.30))
                    )
                }
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)

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
            // If the unlock window just expired, the manager re-applies
            // shields via its internal timer. Force a re-render so the
            // status hero swaps back to "Focus is on".
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
                // Pulsing emerald halo
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color(hex: 0x10B981).opacity(0.55), .clear],
                            center: .center, startRadius: 8, endRadius: 110
                        )
                    )
                    .frame(width: 220, height: 220)
                    .blur(radius: 18)

                // Six sparkle satellites
                ForEach(0..<6, id: \.self) { i in
                    let angle = Double(i) * (.pi * 2 / 6)
                    let radius: Double = 110
                    Image(systemName: i.isMultiple(of: 2) ? "sparkle" : "star.fill")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(focusSparkleColor(for: i))
                        .offset(x: CGFloat(cos(angle) * radius),
                                y: CGFloat(sin(angle) * radius))
                        .opacity(0.85)
                }

                WSAnimatedImage(name: "mascot-paper", ext: "webp")
                    .frame(width: 170, height: 170)
                    .shadow(color: Color(hex: 0x10B981).opacity(0.45), radius: 22, y: 12)
                    .wsBobbing(amount: 6, duration: 2.6)
            }

            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "shield.lefthalf.filled")
                        .font(.system(size: 11, weight: .heavy))
                    Text("FOCUS")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .tracking(0.8)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(LinearGradient(colors: [Color(hex: 0x34D399), Color(hex: 0x059669)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .shadow(color: Color(hex: 0x10B981).opacity(0.45), radius: 8, y: 3)
                )

                Text("Earn your ")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
                +
                Text("free time")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [Color(hex: 0x34D399), Color(hex: 0x059669)],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                +
                Text(" 🛡️")
                    .font(.system(size: 28, weight: .black, design: .rounded))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    private func focusSparkleColor(for i: Int) -> Color {
        let palette: [Color] = [
            Color(hex: 0x34D399),  // mint
            Color(hex: 0xFBBF24),  // gold
            Color(hex: 0x60A5FA),  // sky
            Color(hex: 0xA78BFA),  // lavender
            Color(hex: 0xF87171),  // coral
            Color(hex: 0xF472B6),  // pink
        ]
        return palette[i % palette.count]
    }

    // MARK: - Top bar (utility row — settings only)

    private var topBar: some View {
        HStack(spacing: 10) {
            Spacer()
            Button {
                Haptics.medium()
                showSettings = true
            } label: {
                ZStack {
                    Circle().fill(WSColor.backgroundElevated).frame(width: 38, height: 38)
                        .overlay(Circle().stroke(WSColor.hairline, lineWidth: 1))
                        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
                    Image(systemName: "slider.horizontal.3")
                        .foregroundStyle(WSColor.foreground)
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
                // Animated halo behind the lock icon
                Circle()
                    .fill(
                        RadialGradient(
                            colors: heroHaloColors,
                            center: .center,
                            startRadius: 6,
                            endRadius: 110
                        )
                    )
                    .frame(width: 220, height: 220)
                    .blur(radius: 18)

                Circle()
                    .fill(WSColor.backgroundElevated)
                    .frame(width: 130, height: 130)
                    .overlay(
                        Circle().stroke(heroBorderColor, lineWidth: 2)
                    )
                    .shadow(color: heroBorderColor.opacity(0.40), radius: 20, y: 8)

                Image(systemName: heroIcon)
                    .font(.system(size: 56, weight: .heavy))
                    .foregroundStyle(heroIconStyle)
            }
            .padding(.top, 6)

            Text(manager.statusHeadline)
                .wsHeadline(.large, weight: .bold)
                .foregroundStyle(WSColor.foreground)

            Text(heroSubtitle)
                .wsBody(.medium)
                .multilineTextAlignment(.center)
                .foregroundStyle(WSColor.foregroundMuted)
                .padding(.horizontal, 6)

            heroCTA
                .padding(.top, 6)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 22)
        .padding(.horizontal, 18)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
                .shadow(color: WSColor.brandPrimary.opacity(0.10), radius: 14, y: 6)
        )
    }

    private var heroIcon: String {
        if !manager.hasBlockedApps { return "moon.zzz.fill" }
        if !manager.isAuthorized   { return "exclamationmark.shield.fill" }
        if manager.isCurrentlyUnlocked { return "lock.open.fill" }
        return "lock.fill"
    }

    private var heroIconStyle: AnyShapeStyle {
        if !manager.hasBlockedApps {
            return AnyShapeStyle(LinearGradient(colors: [Color(hex: 0x94A3B8), Color(hex: 0x64748B)],
                                                startPoint: .top, endPoint: .bottom))
        }
        if !manager.isAuthorized {
            return AnyShapeStyle(LinearGradient(colors: [Color(hex: 0xF59E0B), Color(hex: 0xEF4444)],
                                                startPoint: .top, endPoint: .bottom))
        }
        if manager.isCurrentlyUnlocked {
            return AnyShapeStyle(LinearGradient(colors: [Color(hex: 0x34D399), Color(hex: 0x059669)],
                                                startPoint: .top, endPoint: .bottom))
        }
        return AnyShapeStyle(WSGradient.brand)
    }

    private var heroBorderColor: Color {
        if !manager.hasBlockedApps   { return WSColor.hairline }
        if !manager.isAuthorized     { return Color(hex: 0xF59E0B) }
        if manager.isCurrentlyUnlocked { return Color(hex: 0x10B981) }
        return WSColor.brandPrimary
    }

    private var heroHaloColors: [Color] {
        if !manager.hasBlockedApps      { return [Color(hex: 0x94A3B8).opacity(0.20), .clear] }
        if !manager.isAuthorized        { return [Color(hex: 0xF59E0B).opacity(0.40), .clear] }
        if manager.isCurrentlyUnlocked  { return [Color(hex: 0x10B981).opacity(0.45), .clear] }
        return [WSColor.brandPrimary.opacity(0.40), .clear]
    }

    private var heroSubtitle: String {
        // nowTick keeps this string fresh once a second
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
            .buttonStyle(WSPrimaryButtonStyle())
        } else if !manager.isAuthorized {
            Button {
                Haptics.medium()
                Task { await manager.requestAuthorization() }
            } label: {
                Label("Allow Screen Time", systemImage: "lock.shield.fill")
            }
            .buttonStyle(WSPrimaryButtonStyle())
        } else if manager.isCurrentlyUnlocked {
            VStack(spacing: 8) {
                Text("Time remaining")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                Text(manager.unlockTimeRemainingString)
                    .font(.system(size: 28, weight: .heavy, design: .rounded))
                    .foregroundStyle(Color(hex: 0x10B981))
            }
        } else {
            Button {
                Haptics.medium()
                showChallenge = true
            } label: {
                Label("Solve to unlock", systemImage: "puzzlepiece.fill")
            }
            .buttonStyle(WSPrimaryButtonStyle())
        }
    }

    // MARK: - Stat tiles

    private var statTiles: some View {
        HStack(spacing: 10) {
            statTile(
                icon: "shield.lefthalf.filled",
                label: "Blocked",
                value: "\(manager.blockedItemsCount)",
                tint: WSColor.brandPrimary
            )
            statTile(
                icon: "checkmark.circle.fill",
                label: "Today",
                value: "\(manager.stats.challengesPassedToday)",
                tint: Color(hex: 0x10B981)
            )
            statTile(
                icon: "trophy.fill",
                label: "Total",
                value: "\(manager.stats.totalChallengesPassed)",
                tint: Color(hex: 0xF59E0B)
            )
        }
    }

    private func statTile(icon: String, label: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                Circle().fill(tint.opacity(0.16)).frame(width: 36, height: 36)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 15, weight: .bold))
            }
            Text(value)
                .font(.system(size: 24, weight: .heavy, design: .rounded))
                .foregroundStyle(WSColor.foreground)
            Text(label.uppercased())
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.foregroundMuted)
                .tracking(0.5)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.05), radius: 8, y: 3)
        )
    }

    // MARK: - Settings preview

    private var settingsPreview: some View {
        Button {
            Haptics.medium()
            showSettings = true
        } label: {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    Circle().fill(manager.settings.challengeType.tint.opacity(0.16)).frame(width: 42, height: 42)
                    Image(systemName: manager.settings.challengeType.icon)
                        .foregroundStyle(manager.settings.challengeType.tint)
                        .font(.system(size: 17, weight: .bold))
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Challenge: \(manager.settings.challengeType.rawValue) · \(manager.settings.difficulty.label)")
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                    Text("Unlocks for \(manager.settings.unlockDuration.label) per win — tap to change.")
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }

                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(WSColor.foregroundMuted)
                    .font(.system(size: 13, weight: .bold))
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(WSColor.hairline, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - How it works

    private var howItWorks: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("How Focus mode works")
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(WSColor.foreground)

            stepRow(
                num: 1,
                title: "Pick your distractors",
                blurb: "Apple's privacy-first picker lets you shield apps + categories without WriteScholar ever seeing the bundle IDs.",
                icon: "hand.raised.fill",
                tint: WSColor.brandPrimary
            )
            stepRow(
                num: 2,
                title: "iOS shields them",
                blurb: "Tapping a blocked app shows the iOS shield. From there you bounce back here for a quick challenge.",
                icon: "lock.shield.fill",
                tint: Color(hex: 0xD946EF)
            )
            stepRow(
                num: 3,
                title: "Earn an unlock window",
                blurb: "Pass 4 of 5 \(manager.settings.challengeType.rawValue.lowercased()) prompts and apps unlock for \(manager.settings.unlockDuration.label).",
                icon: "lock.open.fill",
                tint: Color(hex: 0x10B981)
            )

            Button {
                Haptics.medium()
                showChallenge = true
            } label: {
                Label("Try a practice challenge", systemImage: "play.fill")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.brandPrimary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Capsule().fill(WSColor.brandSoft))
            }
            .buttonStyle(.plain)
            .padding(.top, 4)
        }
        .padding(14)
        .wsCard(elevation: .low)
    }

    private func stepRow(num: Int, title: String, blurb: String, icon: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle().fill(tint.opacity(0.18)).frame(width: 38, height: 38)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 14, weight: .bold))
                Text("\(num)")
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(4)
                    .background(Circle().fill(tint))
                    .offset(x: 14, y: -14)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).wsBody(.medium, weight: .bold).foregroundStyle(WSColor.foreground)
                Text(blurb).wsBody(.caption).foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
    }

    // MARK: - Web sync hint

    private var webSyncHint: some View {
        HStack(spacing: 12) {
            Image(systemName: "globe")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color(hex: 0x6366F1))
            VStack(alignment: .leading, spacing: 2) {
                Text("Block sites on desktop too")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text("Install the WriteScholar Chrome extension to shield TikTok, YouTube and friends in the browser. Same unlock challenge, fully synced.")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(hex: 0x6366F1).opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color(hex: 0x6366F1).opacity(0.25), lineWidth: 1)
                )
        )
    }
}

#Preview {
    FocusTabView()
}
