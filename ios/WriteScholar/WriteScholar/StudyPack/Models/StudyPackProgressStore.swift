//
//  StudyPackProgressStore.swift
//  WriteScholar
//
//  Durable per-pack study progress — the number behind the mockup's
//  progress bars (Study Packs rows) and rings (Home's Continue studying).
//
//  Keyed by LibraryItem.id (same keying as StudyPackPersistence). Each
//  record tracks how much of the pack's lesson / flashcards / quiz the
//  user has touched plus the component totals, captured when the pack
//  opens. After every update the weighted fraction is pushed into
//  LibraryStore.setProgress so every surface reads ONE number from
//  LibraryItem.progress.
//
//  Views record through the *ambient* current pack (set by the study
//  container when a pack opens) so LessonView/FlashcardsView/QuizView
//  don't need the library id threaded through their inits.
//

import Foundation

@MainActor
final class StudyPackProgressStore: ObservableObject {

    static let shared = StudyPackProgressStore()

    struct PackProgress: Codable, Equatable {
        var slidesSeen: Int = 0
        var cardsReviewed: Int = 0
        var quizBestCorrect: Int = 0
        var totalSlides: Int = 0
        var totalCards: Int = 0
        var totalQuestions: Int = 0

        /// Weighted completion across the components the pack actually has.
        var fraction: Double {
            var parts: [Double] = []
            if totalSlides > 0    { parts.append(min(1, Double(slidesSeen) / Double(totalSlides))) }
            if totalCards > 0     { parts.append(min(1, Double(cardsReviewed) / Double(totalCards))) }
            if totalQuestions > 0 { parts.append(min(1, Double(quizBestCorrect) / Double(totalQuestions))) }
            guard !parts.isEmpty else { return 0 }
            return parts.reduce(0, +) / Double(parts.count)
        }
    }

    @Published private(set) var byItem: [String: PackProgress] = [:]

    /// The library item id of the pack currently open in the study flow.
    /// nil when the open pack was never saved (shouldn't happen in practice —
    /// generation records to the library immediately).
    private(set) var currentItemID: String? = nil

    private let defaults: UserDefaults = .standard
    private static let key = "ws.studyPack.progress.v1"

    private init() { load() }

    // MARK: - Session

    /// Call when a pack opens. Captures component totals and makes the
    /// pack the ambient target for the record(...) calls below.
    func open(_ pack: StudyPack, itemID: String?) {
        currentItemID = itemID
        guard let itemID else { return }
        var rec = byItem[itemID] ?? PackProgress()
        rec.totalSlides    = pack.lesson?.slides.count ?? 0
        rec.totalCards     = pack.flashcards?.cards.count ?? 0
        rec.totalQuestions = pack.quiz?.questions.count ?? 0
        byItem[itemID] = rec
        persistAndSync(itemID)
    }

    func closeCurrent() {
        currentItemID = nil
    }

    // MARK: - Recording (ambient pack)

    /// Highest lesson-slide index the user has reached (1-based count).
    func recordSlidesSeen(_ count: Int) {
        mutateCurrent { $0.slidesSeen = max($0.slidesSeen, count) }
    }

    /// Cards graded this session — accumulates up to the deck size.
    func recordCardsReviewed(_ count: Int) {
        mutateCurrent { $0.cardsReviewed = min($0.totalCards == 0 ? count : $0.totalCards,
                                               max($0.cardsReviewed, count)) }
    }

    /// Best quiz score (correct answers) — only ratchets upward.
    func recordQuizScore(correct: Int) {
        mutateCurrent { $0.quizBestCorrect = max($0.quizBestCorrect, correct) }
    }

    private func mutateCurrent(_ mutate: (inout PackProgress) -> Void) {
        guard let id = currentItemID else { return }
        var rec = byItem[id] ?? PackProgress()
        mutate(&rec)
        byItem[id] = rec
        persistAndSync(id)
    }

    // MARK: - Persistence + library sync

    private func persistAndSync(_ id: String) {
        persist()
        if let rec = byItem[id] {
            LibraryStore.shared.setProgress(id, progress: rec.fraction)
        }
    }

    private func load() {
        guard let data = defaults.data(forKey: Self.key),
              let decoded = try? JSONDecoder().decode([String: PackProgress].self, from: data) else { return }
        byItem = decoded
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(byItem) else { return }
        defaults.set(data, forKey: Self.key)
    }
}
