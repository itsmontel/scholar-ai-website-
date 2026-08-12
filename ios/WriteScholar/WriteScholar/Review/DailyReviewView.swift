//
//  DailyReviewView.swift
//  WriteScholar
//
//  The "Review" tab (prototype screen #4):
//
//    Daily Review
//    M  T  W  T  F  S  S      ← week strip, today = filled purple
//    ┌ You're on a roll! 🔥  14 days in a row      🐻 ┐   (cream card)
//    ┌ 5 questions left · ~2 min   [Start review] ┐
//    Review streak — Keep it up!   🔥10  🔥20  🔥30  🔥50
//    Recent activity …
//
//  "Start review" runs an aggregated flashcard deck from every saved pack.
//

import SwiftUI

struct DailyReviewView: View {
    var onStartReview: () -> Void = {}

    @State private var streak: StreakAPI.StreakInfo?
    @State private var streakLoaded = false
    @State private var showHistory = false
    @State private var reviewDeck: ReviewDeck?
    @State private var dueCards: [Flashcard] = []

    @StateObject private var dailyGoal = DailyGoalStore.shared

    /// Identifiable wrapper so the aggregated deck can drive `.sheet(item:)`.
    private struct ReviewDeck: Identifiable {
        let id = UUID()
        let flashcards: Flashcards
    }

    private var current: Int  { streak?.currentStreak ?? 0 }
    private var longest: Int  { streak?.longestStreak ?? 0 }
    private var thisWeek: Int { streak?.weekActivities.count ?? 0 }

    private let milestones = [10, 20, 30, 50]

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                header.wsStaggerEntry(0)
                weekStrip.wsStaggerEntry(1)
                banner.wsStaggerEntry(2)
                startCard.wsStaggerEntry(3)
                reviewStreakSection.wsStaggerEntry(4)
                recentActivity.wsStaggerEntry(5)
                statChips.wsStaggerEntry(6)

                Button {
                    Haptics.light()
                    showHistory = true
                } label: {
                    HStack(spacing: 4) {
                        Text("View full activity").wsBody(.small, weight: .bold)
                        Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(WSColor.duoPurple)
                }
                .buttonStyle(.plain)
                .padding(.top, 2)

                Spacer(minLength: 8)
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 28)
        }
        .background(WSColor.background.ignoresSafeArea())
        .task {
            rebuildDueCards()
            await loadStreak()
        }
        .sheet(isPresented: $showHistory) {
            HistorySheet().presentationDetents([.large, .medium])
        }
        .sheet(item: $reviewDeck) { deck in
            NavigationStack {
                FlashcardsView(flashcards: deck.flashcards)
                    .navigationTitle("Daily Review")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Done") { reviewDeck = nil }
                                .foregroundStyle(WSColor.duoPurple)
                        }
                    }
            }
            .onDisappear { rebuildDueCards() }
        }
    }

    // MARK: - Title header

    private var header: some View {
        Text("Daily Review")
            .wsHeadline(.large, weight: .black)
            .foregroundStyle(WSColor.foreground)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 4)
    }

    // MARK: - Week calendar strip

    private var weekStrip: some View {
        // Active = any day in the trailing week with recorded XP activity.
        let fmtDays = dailyGoal.lastDays(7)
            .filter { !$0.entries.isEmpty }
            .map(\.id)
        return WSWeekCalendarStrip.currentWeek(activeDates: Set(fmtDays))
            .padding(.vertical, 4)
    }

    // MARK: - On-a-roll banner (cream)

    private var banner: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(current > 0 ? "You're on a roll! 🔥" : "Let's get rolling 🔥")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text(bannerSubtitle)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .redacted(reason: streakLoaded ? [] : .placeholder)
            }
            Spacer()
            WSAnimatedImage(name: "mascot-paper", ext: "webp")
                .frame(width: 76, height: 76)
                .wsBobbing()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(WSColor.bannerCream)
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(WSColor.duoYellow.opacity(0.35), lineWidth: 1.5)
                )
                .shadow(color: WSColor.duoYellow.opacity(0.18), radius: 12, y: 6)
        )
    }

    private var bannerSubtitle: String {
        guard streakLoaded else { return "Loading your streak…" }
        return current > 0
            ? "\(current) day\(current == 1 ? "" : "s") in a row"
            : "Do one review to start your streak today"
    }

    // MARK: - Start card ("5 questions left · ~2 min")

    private var startCard: some View {
        VStack(spacing: 12) {
            if dueCards.isEmpty {
                // Empty deck — no dead-end silent reroute.
                WSAnimatedImage(name: "mascot-study", ext: "webp")
                    .frame(width: 72, height: 72)
                Text("Nothing to review yet")
                    .wsHeadline(.medium, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text("Make a study pack and its flashcards will show up here every day.")
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                Button {
                    Haptics.medium()
                    onStartReview()
                } label: {
                    Text("Create a study pack").frame(maxWidth: .infinity)
                }
                .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
            } else {
                Text("\(dueCards.count)")
                    .font(WSFont.headline(52, weight: .black))
                    .foregroundStyle(WSColor.duoPurple)
                Text("question\(dueCards.count == 1 ? "" : "s") left")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text("~\(estimatedMinutes) min")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
                Button {
                    Haptics.medium()
                    reviewDeck = ReviewDeck(flashcards: Flashcards(title: "Daily Review", cards: dueCards))
                } label: {
                    Text("Start review").frame(maxWidth: .infinity)
                }
                .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
                .padding(.top, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(22)
        .wsChunkyCard(cornerRadius: 24)
    }

    private var estimatedMinutes: Int {
        max(1, Int((Double(dueCards.count) * 25.0 / 60.0).rounded()))
    }

    // MARK: - Review streak milestones

    private var reviewStreakSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            WSSectionHeader(title: "Review streak", note: "Keep it up!")
            HStack(spacing: 10) {
                ForEach(milestones, id: \.self) { m in
                    let reached = current >= m
                    VStack(spacing: 6) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(reached ? WSColor.duoOrange : WSColor.foregroundMuted.opacity(0.35))
                        Text("\(m)")
                            .wsBody(.small, weight: .bold)
                            .foregroundStyle(reached ? WSColor.foreground : WSColor.foregroundMuted)
                        Text("days")
                            .wsBody(.small)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    .frame(maxWidth: .infinity)
                    .wsChunkyCard(cornerRadius: 16, horizontalPadding: 6, verticalPadding: 12)
                }
            }
        }
    }

    // MARK: - Recent activity

    @ViewBuilder
    private var recentActivity: some View {
        let recent = recentEntries
        if !recent.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                WSSectionHeader(title: "Recent activity")
                VStack(spacing: 10) {
                    ForEach(recent, id: \.entry.id) { pair in
                        HStack(spacing: 12) {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(WSColor.duoPurple.opacity(0.12))
                                .frame(width: 40, height: 40)
                                .overlay(
                                    Image(systemName: pair.entry.activity.icon)
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundStyle(WSColor.duoPurple)
                                )
                            VStack(alignment: .leading, spacing: 2) {
                                Text(pair.entry.title ?? pair.entry.activity.label)
                                    .wsBody(.medium, weight: .bold)
                                    .foregroundStyle(WSColor.foreground)
                                    .lineLimit(1)
                                Text(relative(pair.entry.at))
                                    .wsBody(.small)
                                    .foregroundStyle(WSColor.foregroundMuted)
                            }
                            Spacer()
                            if pair.entry.xp > 0 {
                                Text("+\(pair.entry.xp) XP")
                                    .wsBody(.small, weight: .bold)
                                    .foregroundStyle(WSColor.duoGreen)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .wsChunkyCard(cornerRadius: 18, horizontalPadding: 14, verticalPadding: 12)
                    }
                }
            }
        }
    }

    /// Latest 3 activity entries across the trailing week (excluding the
    /// silent daily check-in).
    private var recentEntries: [(day: DailyGoalStore.DayLog, entry: DailyGoalStore.DayLog.Entry)] {
        dailyGoal.lastDays(7)
            .flatMap { day in day.entries.map { (day: day, entry: $0) } }
            .filter { $0.entry.activity != .dailyOpen }
            .sorted { $0.entry.at > $1.entry.at }
            .prefix(3)
            .map { $0 }
    }

    private func relative(_ date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        if interval < 60 { return "just now" }
        if interval < 3600 { return "\(Int(interval / 60))m ago" }
        if interval < 86_400 { return "\(Int(interval / 3600))h ago" }
        return "\(Int(interval / 86_400))d ago"
    }

    // MARK: - Stat chips

    private var statChips: some View {
        HStack(spacing: 10) {
            WSStatChip(icon: "flame.fill",  value: streakLoaded ? "\(current)" : "–",  label: "current",   tint: WSColor.duoOrange)
            WSStatChip(icon: "trophy.fill", value: streakLoaded ? "\(longest)" : "–",  label: "longest",   tint: WSColor.duoPurple)
            WSStatChip(icon: "calendar",    value: streakLoaded ? "\(thisWeek)" : "–", label: "this week", tint: WSColor.duoBlue)
        }
    }

    // MARK: - Data

    private func loadStreak() async {
        defer { streakLoaded = true }
        do { streak = try await StreakAPI.fetch() } catch { /* keep nil → zeros */ }
    }

    /// Aggregates flashcards from every saved study pack into one shuffled
    /// review deck (capped at 20).
    private func rebuildDueCards() {
        let cards = LibraryStore.shared.items
            .filter { $0.kind == .studyPack }
            .compactMap { StudyPackPersistence.shared.loadPack(for: $0.id) }
            .compactMap { $0.flashcards?.cards }
            .flatMap { $0 }
        dueCards = Array(cards.shuffled().prefix(20))
    }
}

#Preview {
    DailyReviewView()
}
