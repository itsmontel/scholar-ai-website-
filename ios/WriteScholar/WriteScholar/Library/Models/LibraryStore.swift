//
//  LibraryStore.swift
//  WriteScholar
//
//  Single source of truth for the Library tab.
//
//  Today: persists to UserDefaults as JSON, with a small seed of demo
//  rows so the new tab never feels empty on a fresh install.
//
//  Tomorrow: a `LibrarySyncService` will hydrate from the website's
//  `/api/library` endpoint and stream changes back. The view layer
//  doesn't need to change — it always reads from `@Published items`.
//
//  Threading: marked @MainActor so all mutations happen on the main
//  thread. Background sync code should hop to MainActor before writing.
//

import Foundation
import SwiftUI
import Combine

@MainActor
final class LibraryStore: ObservableObject {

    // MARK: - Singleton

    static let shared = LibraryStore()

    // MARK: - Published state

    /// Flat list of every entry. The view layer slices + sorts this.
    @Published private(set) var items: [LibraryItem] = []

    /// User's chosen sort order. Persisted across launches.
    @Published var sort: LibrarySort = .recent {
        didSet { persistSort() }
    }

    /// Currently active filter chip. Not persisted — resets to .all on
    /// each launch since it's a transient UI state.
    @Published var filter: LibraryFilter = .all

    /// Search query bound to the search bar. Empty = no filtering.
    @Published var searchQuery: String = ""

    /// Set true while a sync is in flight (future use).
    @Published var isSyncing: Bool = false

    /// Last completed sync timestamp (future use).
    @Published var lastSyncedAt: Date?

    // MARK: - Storage

    private let defaults: UserDefaults = .standard

    private enum Keys {
        static let items   = "ws.library.items.v1"
        static let sort    = "ws.library.sort"
        static let lastSync = "ws.library.lastSyncedAt"
    }

    // MARK: - Init

    private init() {
        loadFromDisk()
        loadSort()
        if items.isEmpty {
            seedDemoIfFirstRun()
        }
    }

    // MARK: - Computed slices

    /// Items after applying filter + search + sort. The view binds
    /// straight to this via the convenience `visibleItems` property.
    var visibleItems: [LibraryItem] {
        let filtered = items.filter { item in
            guard filter.matches(item) else { return false }
            guard !searchQuery.isEmpty else { return true }
            let q = searchQuery.lowercased()
            if item.title.lowercased().contains(q) { return true }
            if let s = item.subtitle?.lowercased(), s.contains(q) { return true }
            if let s = item.snippet?.lowercased(),  s.contains(q) { return true }
            if item.tags.contains(where: { $0.lowercased().contains(q) }) { return true }
            return false
        }
        return sort.apply(to: filtered)
    }

    /// Visible items grouped by recency bucket. Used when sort == .recent.
    var visibleItemsByBucket: [(LibraryRecencyBucket, [LibraryItem])] {
        let now = Date()
        var buckets: [LibraryRecencyBucket: [LibraryItem]] = [:]
        for item in visibleItems {
            let b = LibraryRecencyBucket.bucket(for: item.createdAt, now: now)
            buckets[b, default: []].append(item)
        }
        return LibraryRecencyBucket.allCases
            .compactMap { b in buckets[b].map { (b, $0) } }
    }

    /// Visible items grouped by kind. Used when sort == .kind.
    var visibleItemsByKind: [(LibraryItemKind, [LibraryItem])] {
        var buckets: [LibraryItemKind: [LibraryItem]] = [:]
        for item in visibleItems {
            buckets[item.kind, default: []].append(item)
        }
        return LibraryItemKind.allCases
            .compactMap { k in buckets[k].map { (k, $0) } }
    }

    // MARK: - Mutating API

    func add(_ item: LibraryItem) {
        // De-dupe by id
        if let i = items.firstIndex(where: { $0.id == item.id }) {
            items[i] = item
        } else {
            items.append(item)
        }
        persist()
    }

    func remove(_ id: String) {
        items.removeAll { $0.id == id }
        persist()
        // Drop the on-disk pack JSON if there was one. No-op for non-pack items.
        StudyPackPersistence.shared.delete(for: id)
        Haptics.warning()
    }

    func clearAll() {
        // Wipe persisted pack files for every study-pack entry first.
        for item in items where item.kind == .studyPack {
            StudyPackPersistence.shared.delete(for: item.id)
        }
        items.removeAll()
        persist()
        Haptics.warning()
    }

    func togglePin(_ id: String) {
        guard let i = items.firstIndex(where: { $0.id == id }) else { return }
        items[i].isPinned.toggle()
        persist()
        Haptics.selection()
    }

    func markOpened(_ id: String) {
        guard let i = items.firstIndex(where: { $0.id == id }) else { return }
        items[i].lastOpenedAt = Date()
        persist()
    }

    // MARK: - Convenience recorders (called by coordinators on completion)

    /// Record a freshly-generated study pack into the library, and
    /// log it to the daily-goal activity feed (no XP — generation
    /// itself is now 0 XP; the user earns XP by *using* the pack).
    func recordStudyPack(_ pack: StudyPack) {
        DailyGoalStore.shared.record(
            .studyPackGenerated,
            title: pack.quiz?.title ?? pack.flashcards?.title ?? pack.lesson?.title ?? "Study pack",
            subtitle: pack.originalNotes.map { String($0.prefix(80)) }
        )
        recordStudyPackInternal(pack)
    }

    private func recordStudyPackInternal(_ pack: StudyPack) {
        var chips: [LibraryMetaChip] = []
        if let q = pack.quiz {
            chips.append(.init(icon: "checkmark.bubble.fill", label: "Quiz · \(q.questions.count) qs"))
        }
        if let f = pack.flashcards {
            chips.append(.init(icon: "rectangle.on.rectangle.angled.fill", label: "\(f.cards.count) cards"))
        }
        if let l = pack.lesson {
            chips.append(.init(icon: "book.pages.fill", label: "Lesson · \(l.slides.count) slides"))
        }
        if let cw = pack.crossword, let words = cw.words {
            chips.append(.init(icon: "grid", label: "Crossword · \(words.count) words"))
        }
        if let cb = pack.craterBlast, !cb.questions.isEmpty {
            chips.append(.init(icon: "burst.fill", label: "Crater Blast"))
        }
        if let wt = pack.wordTower, !wt.questions.isEmpty {
            chips.append(.init(icon: "building.2.fill", label: "Word Tower"))
        }
        if let wb = pack.wordBlitz, !wb.questions.isEmpty {
            chips.append(.init(icon: "bolt.fill", label: "Word Blitz"))
        }

        let snippet = pack.originalNotes
            .map { String($0.prefix(160)).trimmingCharacters(in: .whitespacesAndNewlines) }

        let item = LibraryItem(
            kind: .studyPack,
            title: pack.displayTitle,
            subtitle: "Study pack",
            snippet: snippet,
            chips: chips
        )
        add(item)
        // Persist the FULL pack JSON to disk so the Games tab's "My Notes"
        // mode can launch Crater Blast / Word Tower with these questions.
        // LibraryItem itself only carries the metadata above.
        StudyPackPersistence.shared.save(pack, for: item.id)
        Haptics.success()
    }

    /// Record an essay analysis result. We pull the title from the first
    /// non-empty line of the essay and surface the grade in the chips.
    /// Note: essay analysis is desktop-only on mobile, so this currently
    /// only fires from web-synced rows. Kept for forward-compat.
    func recordEssayAnalysis(_ result: AnalysisResult, content: String) {
        let firstLine = content
            .split(whereSeparator: \.isNewline)
            .first(where: { !$0.trimmingCharacters(in: .whitespaces).isEmpty })
            .map(String.init)?
            .trimmingCharacters(in: .whitespaces)
        let title = (firstLine?.isEmpty == false ? firstLine! : "Untitled essay")
            .prefix(80)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        var chips: [LibraryMetaChip] = []
        if let grade = result.gradeEstimate {
            chips.append(.init(icon: "rosette", label: grade))
        }
        if let score = result.overallScore {
            chips.append(.init(icon: "gauge.with.needle.fill", label: "\(Int(score))/100"))
        }
        if let clarity = result.clarityRating {
            chips.append(.init(icon: "sparkles", label: clarity))
        }
        let words = content.split(whereSeparator: { $0.isWhitespace || $0.isNewline }).count
        chips.append(.init(icon: "textformat", label: "\(words) words"))

        let snippet = String(content.prefix(180))

        let item = LibraryItem(
            kind: .essayAnalysis,
            title: String(title),
            subtitle: "Essay analysis",
            snippet: snippet,
            chips: chips
        )
        add(item)
        Haptics.success()
    }

    /// Record an uploaded source document (PDF, photo OCR, etc.).
    func recordDocument(filename: String, sizeBytes: Int? = nil, pageCount: Int? = nil, snippet: String? = nil) {
        var chips: [LibraryMetaChip] = []
        if let p = pageCount { chips.append(.init(icon: "doc.text",  label: "\(p) pages")) }
        if let b = sizeBytes { chips.append(.init(icon: "internaldrive.fill", label: ByteCountFormatter.string(fromByteCount: Int64(b), countStyle: .file))) }
        let item = LibraryItem(
            kind: .document,
            title: filename,
            subtitle: "Source document",
            snippet: snippet,
            chips: chips
        )
        add(item)
        Haptics.success()
    }

    // MARK: - Persistence

    private func persist() {
        guard let data = try? JSONEncoder().encode(items) else { return }
        defaults.set(data, forKey: Keys.items)
    }

    private func loadFromDisk() {
        guard let data = defaults.data(forKey: Keys.items),
              let decoded = try? JSONDecoder().decode([LibraryItem].self, from: data) else {
            return
        }
        items = decoded
    }

    private func persistSort() {
        defaults.set(sort.rawValue, forKey: Keys.sort)
    }

    private func loadSort() {
        if let raw = defaults.string(forKey: Keys.sort), let s = LibrarySort(rawValue: raw) {
            sort = s
        }
        if let d = defaults.object(forKey: Keys.lastSync) as? Date {
            lastSyncedAt = d
        }
    }

    // MARK: - Demo seed

    /// Seed with a few realistic-looking entries so the very first launch
    /// of the new Library tab feels lived-in. Tagged with `#sample` so we
    /// can clear them later if we want.
    private func seedDemoIfFirstRun() {
        let cal = Calendar.current
        let now = Date()
        let yesterday = cal.date(byAdding: .day, value: -1, to: now) ?? now
        let lastWeek  = cal.date(byAdding: .day, value: -5, to: now) ?? now
        let lastMonth = cal.date(byAdding: .day, value: -22, to: now) ?? now

        items = [
            LibraryItem(
                kind: .studyPack,
                title: "Photosynthesis & Cell Respiration",
                subtitle: "AP Biology · Chapter 9",
                snippet: "The light-dependent reactions take place in the thylakoid membrane and produce ATP and NADPH from sunlight, water, and ADP…",
                chips: [
                    .init(icon: "checkmark.bubble.fill", label: "Quiz · 12 qs"),
                    .init(icon: "rectangle.on.rectangle.angled.fill", label: "18 cards"),
                    .init(icon: "book.pages.fill", label: "Lesson · 6 slides")
                ],
                tags: ["#sample", "biology"],
                createdAt: now.addingTimeInterval(-60 * 38) // 38 mins ago
            ),
            LibraryItem(
                kind: .essayAnalysis,
                title: "The Great Gatsby and the American Dream",
                subtitle: "AP English · Take-home essay",
                snippet: "Fitzgerald's portrayal of Gatsby's pursuit of Daisy mirrors the broader disillusionment of the Jazz Age, suggesting that the American Dream is itself a kind of beautiful fiction…",
                chips: [
                    .init(icon: "rosette", label: "B+"),
                    .init(icon: "gauge.with.needle.fill", label: "84/100"),
                    .init(icon: "sparkles", label: "Clear"),
                    .init(icon: "textformat", label: "1,240 words")
                ],
                tags: ["#sample", "english"],
                createdAt: yesterday.addingTimeInterval(-60 * 60 * 3)
            ),
            LibraryItem(
                kind: .document,
                title: "Kinematics — Lecture 4 slides.pdf",
                subtitle: "Physics 1 · Prof. Hayes",
                snippet: "Equations of motion, projectile trajectories, and worked examples for constant-acceleration problems.",
                chips: [
                    .init(icon: "doc.text", label: "32 pages"),
                    .init(icon: "internaldrive.fill", label: "4.2 MB")
                ],
                tags: ["#sample", "physics"],
                createdAt: lastWeek
            ),
            LibraryItem(
                kind: .studyPack,
                title: "French Revolution causes & timeline",
                subtitle: "World History · Unit 5",
                snippet: "Tax inequality, Enlightenment philosophy, and a financial crisis from foreign wars converged in 1789 to topple the Ancien Régime…",
                chips: [
                    .init(icon: "checkmark.bubble.fill", label: "Quiz · 10 qs"),
                    .init(icon: "rectangle.on.rectangle.angled.fill", label: "24 cards"),
                    .init(icon: "grid", label: "Crossword · 14 words")
                ],
                tags: ["#sample", "history"],
                createdAt: lastWeek.addingTimeInterval(-60 * 60 * 8)
            ),
            LibraryItem(
                kind: .essayAnalysis,
                title: "Climate change and intergenerational justice",
                subtitle: "Philosophy 101 · Persuasive essay",
                snippet: "If we accept that we owe future generations a habitable planet, then the moral weight of present-day emissions is far heavier than market prices suggest…",
                chips: [
                    .init(icon: "rosette", label: "A−"),
                    .init(icon: "gauge.with.needle.fill", label: "91/100"),
                    .init(icon: "sparkles", label: "Strong"),
                    .init(icon: "textformat", label: "980 words")
                ],
                source: .web,
                tags: ["#sample", "philosophy"],
                createdAt: lastMonth
            )
        ]
        // Pin the most recent so the user sees what pinning looks like
        if var first = items.first {
            first.isPinned = true
            items[0] = first
        }
        persist()
    }
}
