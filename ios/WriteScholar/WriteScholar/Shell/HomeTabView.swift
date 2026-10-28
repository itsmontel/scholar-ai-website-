//
//  HomeTabView.swift
//  WriteScholar
//
//  Sticker arcade home:
//
//    • Header — "Hey {name}" / "Let's lock in." + streak chip, bell, avatar.
//    • Streak card — purple sticker, big day count, this week's dots, the
//      jumping mascot hanging off the corner.
//    • Daily quest — today's XP goal with a striped bar + wiggling reward.
//    • Pick your move — four colored tiles (essay, pack, arcade, Study Mode).
//    • Jump back in — recent library items with a pulsing play button.
//
//  Detail still lives one tap away in the existing sheets (Streak, Daily
//  Goal, History, Settings, Profile).
//

import SwiftUI

struct HomeTabView: View {
    @EnvironmentObject var session: AuthSession
    @Binding var onboardingComplete: Bool
    /// Routes feature launches (Study Packs, Arcade, Focus, Library…) up to
    /// the shell, which decides whether to switch tab or present a screen.
    var onRoute: (AppRoute) -> Void = { _ in }
    /// Opens the ⊕ "what would you like to work on?" tool picker.
    var onOpenToolPicker: () -> Void = {}

    @State private var showStreakSheet = false
    @State private var showDailyGoalSheet = false
    @State private var showHistorySheet = false
    @State private var celebrateGoalHit: Int = 0
    @State private var streak: StreakAPI.StreakInfo?
    @State private var hasUnseenActivity = false
    @State private var usage: UsageAPI.Usage?
    @Environment(\.openURL) private var openURL

    @StateObject private var dailyGoal = DailyGoalStore.shared
    @ObservedObject private var library = LibraryStore.shared

    /// Stamp for the bell's unread dot — set when the History sheet opens.
    private static let lastSeenKey = "ws.history.lastSeenAt"

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 18) {
                    greetingRow
                    streakCard.wsPop(delay: 0.05)
                    if let usage, !usage.isPaid {
                        trialCard.wsPop(delay: 0.1)
                    }
                    dailyQuestCard.wsPop(delay: 0.12)
                    pickYourMove
                    continueStudying
                    Spacer(minLength: 8)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 28)
            }
            .refreshable { await refreshAll() }

            WSConfettiView(trigger: $celebrateGoalHit)
                .allowsHitTesting(false)
        }
        .task {
            computeUnseenActivity()
            await OnboardingAnswers.uploadIfNeeded()
            await refreshAll()
        }
        .onChange(of: dailyGoal.goalJustHit) { _, newValue in
            if newValue != nil {
                celebrateGoalHit += 1
                NotificationService.shared.refreshAll()
            }
        }
        .onChange(of: showHistorySheet) { _, open in
            if open {
                UserDefaults.standard.set(Date(), forKey: Self.lastSeenKey)
            } else {
                computeUnseenActivity()
            }
        }
        .sheet(isPresented: $showStreakSheet) {
            StreakInsightsSheet(streak: streak, stats: session.achievementStats)
        }
        .sheet(isPresented: $showDailyGoalSheet) {
            DailyGoalSheet(store: dailyGoal)
                .presentationDetents([.large])
        }
        .sheet(isPresented: $showHistorySheet) {
            HistorySheet()
                .presentationDetents([.large, .medium])
        }
    }

    // MARK: - Header

    private var greetingRow: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 10) {
                Text("Hey \(firstName)")
                    .font(WSFont.sans(16, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .lineLimit(1)
                Spacer()
                if let usage {
                    CreditChip(text: usage.credits?.isTrial == true ? "\(usage.creditsRemaining) free" : "\(usage.creditsRemaining)")
                        .accessibilityLabel("\(usage.creditsRemaining) credits")
                }
                Button {
                    Haptics.light()
                    showHistorySheet = true
                } label: {
                    Image(systemName: "bell.fill")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(WSColor.foreground)
                        .frame(width: 40, height: 40)
                        .wsStickerCircle(fill: WSColor.backgroundElevated)
                        .overlay(alignment: .topTrailing) {
                            if hasUnseenActivity {
                                Circle()
                                    .fill(WSColor.pink)
                                    .overlay(Circle().strokeBorder(WSColor.ink, lineWidth: 2))
                                    .frame(width: 13, height: 13)
                                    .offset(x: 1, y: -1)
                            }
                        }
                }
                .buttonStyle(WSStickerPressStyle())
                .accessibilityLabel("Recent activity")

                Button {
                    Haptics.medium()
                    onRoute(.profile)
                } label: {
                    WSAnimatedImage(name: "mascot-study", ext: "webp")
                        .frame(width: 34, height: 34)
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())
                        .wsStickerCircle(fill: WSColor.lime)
                }
                .buttonStyle(WSStickerPressStyle())
                .accessibilityLabel("Open profile")
            }
            HStack(alignment: .center) {
                Text(headline)
                    .font(WSFont.headline(36, weight: .black))
                    .tracking(-1)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                Spacer(minLength: 8)
                Button { Haptics.light(); showStreakSheet = true } label: {
                    HStack(spacing: 5) {
                        WSFlameIcon(size: 17, lit: streak?.hasActivityToday ?? false || (streak?.currentStreak ?? 0) > 0)
                        Text("\(streak?.currentStreak ?? 0)")
                            .font(WSFont.headline(18, weight: .black))
                            .foregroundStyle(WSColor.inkText)
                            .contentTransition(.numericText())
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .wsStickerCapsule(fill: WSColor.lime)
                }
                .buttonStyle(WSStickerPressStyle())
                .wsPop(delay: 0.1)
                .accessibilityLabel("\(streak?.currentStreak ?? 0) day streak")
            }
        }
        .padding(.top, 4)
    }

    /// Rotates by time of day so the header doesn't read the same at 8am
    /// and midnight.
    private var headline: String {
        switch Calendar.current.component(.hour, from: Date()) {
        case 5..<12:  return "Morning grind."
        case 12..<18: return "Let's lock in."
        case 18..<23: return "Night shift."
        default:      return "Still up? Same."
        }
    }

    // MARK: - Streak card

    private var streakCard: some View {
        let days = streak?.currentStreak ?? 0
        return Button {
            Haptics.light()
            showStreakSheet = true
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                WSKicker(text: "Your streak", color: WSColor.lime)
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("\(days)")
                        .font(WSFont.headline(68, weight: .black))
                        .tracking(-2.5)
                        .contentTransition(.numericText())
                    Text(days == 1 ? "day" : "days")
                        .font(WSFont.headline(22, weight: .black))
                }
                .padding(.top, 2)
                Text(streakLine)
                    .font(WSFont.sans(14, weight: .bold))
                    .frame(maxWidth: 220, alignment: .leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.top, 4)
                    .padding(.bottom, 16)
                weekDots
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 18)
            .wsSticker(fill: WSColor.purple, radius: 28, depth: 5)
            .overlay(alignment: .topTrailing) {
                WSAnimatedImage(name: "mascot-jumping-joy", ext: "webp")
                    .frame(width: 128, height: 128)
                    .wsMascotBob(amount: 9, rock: 3, duration: 1.3)
                    .offset(x: 2, y: -34)
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)
            }
        }
        .buttonStyle(WSStickerPressStyle(tilt: 0))
        .padding(.top, 26)
        .accessibilityLabel("\(days) day streak. Open streak details")
    }

    private var streakLine: String {
        guard let streak else { return "Do one thing today to start a streak." }
        if streak.hasActivityToday { return "Today's done. Scholar is proud of you." }
        if streak.currentStreak == 0 { return "One quiz today starts your streak." }
        return "One quiz today keeps it alive. Don't let Scholar down."
    }

    /// Monday-first week: done days are lime checks, today pulses with a
    /// flame until it's done, the rest are dashed outlines.
    private var weekDots: some View {
        let cal = Calendar(identifier: .iso8601)
        let today = cal.startOfDay(for: Date())
        let monday = cal.date(from: cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: today)) ?? today
        let active = Set(streak?.weekActivities ?? [])
        let f = DateFormatter()
        f.calendar = cal
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        let letters = ["M", "T", "W", "T", "F", "S", "S"]
        return HStack(spacing: 0) {
            ForEach(0..<7, id: \.self) { i in
                let day = cal.date(byAdding: .day, value: i, to: monday) ?? monday
                let isToday = day == today
                let done = active.contains(f.string(from: day)) || (isToday && streak?.hasActivityToday == true)
                VStack(spacing: 5) {
                    Group {
                        if done {
                            Image(systemName: "checkmark")
                                .font(.system(size: 13, weight: .black))
                                .foregroundStyle(WSColor.inkText)
                                .frame(width: 34, height: 34)
                                .wsStickerCircle(fill: WSColor.lime)
                        } else if isToday {
                            WSFlameIcon(size: 15)
                                .frame(width: 34, height: 34)
                                .wsStickerCircle(fill: .white)
                                .wsPulse(scale: 1.12, duration: 0.7)
                        } else {
                            Circle()
                                .strokeBorder(Color.white.opacity(0.6), style: StrokeStyle(lineWidth: 2.5, dash: [4, 3]))
                                .frame(width: 34, height: 34)
                        }
                    }
                    Text(letters[i])
                        .font(WSFont.sans(11, weight: .heavy))
                        .foregroundStyle(isToday ? WSColor.lime : Color.white.opacity(done ? 1 : 0.8))
                }
                .frame(maxWidth: .infinity)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("This week: \(active.count) active days")
    }

    // MARK: - Free trial card (free accounts have no credits)

    private var trialCard: some View {
        let fromOnboarding = UserDefaults.standard.bool(forKey: TrialIntent.key)
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                ForEach(0..<OnboardingContent.trialCredits, id: \.self) { _ in CreditCoin(size: 26) }
            }
            Text(fromOnboarding ? "Your plan is ready. Start your free trial." : "Start your free trial")
                .wsHeadline(.medium, weight: .black)
                .foregroundStyle(WSColor.inkText)
            Text("\(OnboardingContent.trialDays) days free with \(OnboardingContent.trialCredits) credits for essay feedback, study packs and citations. Then \(OnboardingContent.proMonthlyPrice)/mo for \(OnboardingContent.proMonthlyCredits) credits. Unused credits roll over.")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.inkMuted)
            Button {
                Haptics.medium()
                if let url = URL(string: "https://writescholar.com/pricing") { openURL(url) }
            } label: {
                Text("Start my free trial").frame(maxWidth: .infinity)
            }
            .buttonStyle(WSDuoPrimaryButtonStyle())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .foregroundStyle(WSColor.inkText)
        .wsChunkyCard(cornerRadius: 24, fillColor: Color(hex: 0xFFF1B8))
    }

    private func computeUnseenActivity() {
        let lastSeen = UserDefaults.standard.object(forKey: Self.lastSeenKey) as? Date ?? .distantPast
        let newest = dailyGoal.todayLog.entries.map(\.at).max() ?? .distantPast
        hasUnseenActivity = newest > lastSeen
    }

    // MARK: - Daily quest

    private var dailyQuestCard: some View {
        let target = max(1, dailyGoal.target.xp)
        let frac = min(1.0, Double(dailyGoal.todayXP) / Double(target))
        let done = dailyGoal.todayXP >= target
        return Button {
            Haptics.light()
            showDailyGoalSheet = true
        } label: {
            HStack(spacing: 14) {
                Image(systemName: done ? "checkmark" : "scope")
                    .font(.system(size: 22, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 48, height: 48)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 15, style: .continuous).fill(done ? WSColor.lime : WSColor.pink)
                            RoundedRectangle(cornerRadius: 15, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                        }
                    )
                VStack(alignment: .leading, spacing: 6) {
                    WSKicker(text: "Daily quest")
                    Text(done ? "Quest cleared" : "Earn \(target) XP")
                        .font(WSFont.headline(18, weight: .black))
                        .foregroundStyle(WSColor.foreground)
                    WSStripeBar(fraction: frac, fill: WSColor.purple)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Text("\(dailyGoal.todayXP)/\(target)")
                    .font(WSFont.headline(15, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .monospacedDigit()
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .wsSticker(fill: WSColor.lime, radius: 12, depth: 0)
                    .wsWiggle()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .wsSticker(radius: 22)
        }
        .buttonStyle(WSStickerPressStyle())
        .accessibilityLabel("Daily quest: \(dailyGoal.todayXP) of \(target) XP")
    }

    // MARK: - Pick your move

    private var pickYourMove: some View {
        VStack(alignment: .leading, spacing: 12) {
            WSSectionHeader(title: "Pick your move",
                            actionTitle: "All tools",
                            action: { Haptics.light(); onOpenToolPicker() })
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                moveTile(title: "Grade my essay", sub: "Know your grade first", icon: "pencil.line", fill: WSColor.pink, delay: 0.18) { onRoute(.essayAnalyzer) }
                moveTile(title: "Study pack", sub: "Notes to quiz in seconds", icon: "square.stack.3d.up.fill", fill: WSColor.lime, delay: 0.24) { onRoute(.studyPacks) }
                moveTile(title: "Arcade", sub: "5 games, your notes", icon: "gamecontroller.fill", fill: WSColor.sky, delay: 0.30) { onRoute(.arcade) }
                moveTile(title: "Study Mode", sub: "Earn your scroll time", icon: "bolt.fill", fill: WSColor.orange, delay: 0.36) { onRoute(.focus) }
            }
        }
    }

    private func moveTile(title: String, sub: String, icon: String, fill: Color, delay: Double, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 42, height: 42)
                    .wsStickerCircle(fill: .white)
                Spacer(minLength: 8)
                Text(title)
                    .font(WSFont.headline(20, weight: .black))
                    .tracking(-0.3)
                    .lineLimit(2)
                    .minimumScaleFactor(0.85)
                    .multilineTextAlignment(.leading)
                Text(sub)
                    .font(WSFont.sans(12.5, weight: .bold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
                    .padding(.top, 2)
            }
            .foregroundStyle(WSColor.inkText)
            .frame(maxWidth: .infinity, minHeight: 132, maxHeight: 132, alignment: .leading)
            .padding(14)
            .wsSticker(fill: fill, radius: 24, depth: 5)
        }
        .buttonStyle(WSStickerPressStyle())
        .wsPop(delay: delay)
    }

    // MARK: - Continue studying

    @ViewBuilder
    private var continueStudying: some View {
        let recent = Array(library.items
            .sorted { ($0.lastOpenedAt ?? $0.createdAt) > ($1.lastOpenedAt ?? $1.createdAt) }
            .prefix(3))

        VStack(alignment: .leading, spacing: 12) {
            WSSectionHeader(title: "Jump back in",
                            actionTitle: recent.isEmpty ? nil : "View all",
                            action: recent.isEmpty ? nil : { Haptics.light(); onRoute(.library) })

            if recent.isEmpty {
                // First-run: friendly empty card instead of a vanished section.
                Button {
                    Haptics.medium()
                    onRoute(.studyPacks)
                } label: {
                    HStack(spacing: 14) {
                        WSAnimatedImage(name: "mascot-paper", ext: "webp")
                            .frame(width: 60, height: 60)
                            .wsMascotBob(amount: 4, rock: 2, duration: 1.6)
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Nothing here yet")
                                .font(WSFont.headline(17, weight: .black))
                                .foregroundStyle(WSColor.foreground)
                            Text("Drop in your notes. Scholar makes the quiz.")
                                .wsBody(.small, weight: .bold)
                                .foregroundStyle(WSColor.foregroundMuted)
                        }
                        Spacer(minLength: 8)
                        playBadge(icon: "plus")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .wsSticker(radius: 22)
                }
                .buttonStyle(WSStickerPressStyle())
            } else {
                ForEach(Array(recent.enumerated()), id: \.element.id) { (i, item) in
                    Button {
                        Haptics.medium()
                        library.markOpened(item.id)
                        library.pendingOpenItemID = item.id
                        onRoute(.library)
                    } label: {
                        HStack(spacing: 14) {
                            WSPackCover(title: item.title, kind: item.kind, size: 74)
                            VStack(alignment: .leading, spacing: 6) {
                                Text(item.title)
                                    .font(WSFont.headline(17, weight: .black))
                                    .foregroundStyle(WSColor.foreground)
                                    .lineLimit(2)
                                    .multilineTextAlignment(.leading)
                                Text(rowMeta(for: item))
                                    .font(WSFont.sans(12.5, weight: .bold))
                                    .foregroundStyle(WSColor.foregroundMuted)
                                    .lineLimit(1)
                                if let progress = item.progress {
                                    WSStripeBar(fraction: progress, fill: WSColor.purple, height: 10, stripes: false)
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            playBadge(icon: "play.fill", pulses: i == 0)
                        }
                        .padding(12)
                        .wsSticker(radius: 22)
                    }
                    .buttonStyle(WSStickerPressStyle())
                }
            }
        }
    }

    private func playBadge(icon: String, pulses: Bool = true) -> some View {
        Image(systemName: icon)
            .font(.system(size: 17, weight: .black))
            .foregroundStyle(WSColor.inkText)
            .frame(width: 46, height: 46)
            .wsStickerCircle(fill: WSColor.lime, depth: 3)
            .modifier(WSOptionalPulse(on: pulses))
            .accessibilityHidden(true)
    }

    /// "Edited 2h ago · 45 cards" — relative recency + the item's first chip.
    private func rowMeta(for item: LibraryItem) -> String {
        var parts = ["Edited \(relativeDate(item.lastOpenedAt ?? item.createdAt))"]
        if let chip = item.chips.first {
            parts.append(chip.label)
        }
        return parts.joined(separator: " · ")
    }

    // MARK: - Derived values

    private var firstName: String {
        let name = session.state.user?.displayName ?? ""
        let f = name.split(separator: " ").first.map(String.init) ?? name
        return f.isEmpty || f == "?" ? "there" : f
    }

    private func relativeDate(_ date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        if interval < 60 { return "just now" }
        if interval < 3600 { return "\(Int(interval / 60))m ago" }
        if interval < 86_400 { return "\(Int(interval / 3600))h ago" }
        let days = Int(interval / 86_400)
        if days < 7 { return "\(days)d ago" }
        let f = DateFormatter()
        f.dateStyle = .medium
        return f.string(from: date)
    }

    // MARK: - Refresh

    private func refreshAll() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await refreshStreak() }
            group.addTask { await refreshUsage() }
            group.addTask { await session.refreshAchievements() }
            group.addTask { await LibraryStore.shared.syncFromBackend() }
        }
    }

    private func refreshUsage() async {
        guard session.state.user?.isLocalGuestAccount != true else { return }
        if let fresh = try? await UsageAPI.fetch() { usage = fresh }
    }

    private func refreshStreak() async {
        if session.state.user?.isLocalGuestAccount == true {
            streak = StreakAPI.StreakInfo(currentStreak: 0, longestStreak: 0,
                                          totalActivityDays: 0, hasActivityToday: false,
                                          weekActivities: [])
            return
        }
        do {
            streak = try await StreakAPI.fetch()
        } catch {
            // Keep last known value
        }
    }
}

#Preview {
    HomeTabView(onboardingComplete: .constant(true))
        .environmentObject(AuthSession())
}

/// Pulses only when `on` (the first "Jump back in" row).
private struct WSOptionalPulse: ViewModifier {
    var on: Bool
    func body(content: Content) -> some View {
        if on { content.wsPulse(scale: 1.1, duration: 0.7) } else { content }
    }
}
