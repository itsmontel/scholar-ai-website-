//
//  DailyReviewView.swift
//  WriteScholar
//
//  The "Review" tab (prototype screen #4): on-a-roll banner, a start-review
//  CTA, review-streak flame milestones, and streak stats. "Start review"
//  bubbles up to the shell (→ Study Packs) and "View full activity" opens
//  the existing HistorySheet.
//

import SwiftUI

struct DailyReviewView: View {
    var onStartReview: () -> Void = {}

    @State private var streak: StreakAPI.StreakInfo?
    @State private var showHistory = false
    @State private var reviewDeck: ReviewDeck?

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
                banner
                startCard
                reviewStreakSection
                statChips
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
        .task { await loadStreak() }
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
        }
    }

    private var banner: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text("You're on a roll! 🔥")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text(current > 0 ? "\(current) day\(current == 1 ? "" : "s") in a row" : "Start your streak today")
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            WSMascotHero(asset: "mascot-dance", size: 72, haloTint: WSColor.duoOrange)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .wsChunkyCard(cornerRadius: 22)
    }

    private var startCard: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle().fill(WSColor.duoPurple.opacity(0.15)).frame(width: 64, height: 64)
                Image(systemName: "bolt.heart.fill")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(WSColor.duoPurple)
            }
            Text("Ready for today's review?")
                .wsHeadline(.medium, weight: .black)
                .foregroundStyle(WSColor.foreground)
                .multilineTextAlignment(.center)
            Text("Run through your saved packs' flashcards to lock it in.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
            Button {
                Haptics.medium()
                if let deck = buildReviewDeck() {
                    reviewDeck = ReviewDeck(flashcards: deck)
                } else {
                    onStartReview()   // no packs yet → go create one
                }
            } label: {
                Text("Start review").frame(maxWidth: .infinity)
            }
            .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
        }
        .frame(maxWidth: .infinity)
        .padding(22)
        .wsChunkyCard(cornerRadius: 24)
    }

    private var reviewStreakSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            WSSectionHeader(title: "Review streak")
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

    private var statChips: some View {
        HStack(spacing: 10) {
            WSStatChip(icon: "flame.fill",  value: "\(current)",  label: "current",   tint: WSColor.duoOrange)
            WSStatChip(icon: "trophy.fill", value: "\(longest)",  label: "longest",   tint: WSColor.duoPurple)
            WSStatChip(icon: "calendar",    value: "\(thisWeek)", label: "this week", tint: WSColor.duoBlue)
        }
    }

    private func loadStreak() async {
        do { streak = try await StreakAPI.fetch() } catch { /* keep nil → zeros */ }
    }

    /// Aggregates flashcards from every saved study pack into one shuffled
    /// review deck (capped at 20). Returns nil if the user has no packs yet.
    @MainActor
    private func buildReviewDeck() -> Flashcards? {
        let cards = LibraryStore.shared.items
            .filter { $0.kind == .studyPack }
            .compactMap { StudyPackPersistence.shared.loadPack(for: $0.id) }
            .compactMap { $0.flashcards?.cards }
            .flatMap { $0 }
        guard !cards.isEmpty else { return nil }
        return Flashcards(title: "Daily Review", cards: Array(cards.shuffled().prefix(20)))
    }
}

#Preview {
    DailyReviewView()
}
