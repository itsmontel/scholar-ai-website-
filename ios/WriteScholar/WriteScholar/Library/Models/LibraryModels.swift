//
//  LibraryModels.swift
//  WriteScholar
//
//  Lightweight value types backing the Library tab.
//
//  The Library is the user's single shelf for everything they've created
//  in WriteScholar — study packs, essay analyses, and uploaded source
//  documents. Each entry is a `LibraryItem`. Items live in a flat list
//  on `LibraryStore`; the view layer slices them by `LibraryFilter` and
//  orders them by `LibrarySort`.
//
//  Persistence (today): JSON in UserDefaults under `ws.library.items`.
//  Persistence (later): the same `LibraryItem` shape will hydrate from
//  the website's `/api/library` endpoint, with `serverID` carrying the
//  remote row id and `source` flipping to `.web` for synced rows.
//

import Foundation
import SwiftUI

// MARK: - Item kind

/// Top-level category for a library entry. Drives every visual:
/// icon, tint, hero gradient, even the empty-state copy.
enum LibraryItemKind: String, Codable, CaseIterable, Identifiable {
    case studyPack
    case essayAnalysis
    case document

    var id: String { rawValue }

    var label: String {
        switch self {
        case .studyPack:     return "Study Pack"
        case .essayAnalysis: return "Essay Analysis"
        case .document:      return "Document"
        }
    }

    var pluralLabel: String {
        switch self {
        case .studyPack:     return "Study Packs"
        case .essayAnalysis: return "Essays"
        case .document:      return "Documents"
        }
    }

    var icon: String {
        switch self {
        case .studyPack:     return "graduationcap.fill"
        case .essayAnalysis: return "doc.text.magnifyingglass"
        case .document:      return "doc.fill"
        }
    }

    /// Solid brand-aligned tint used on the icon circle + side stripe.
    var tint: Color {
        switch self {
        case .studyPack:     return WSColor.duoPurple
        case .essayAnalysis: return WSColor.duoBlue
        case .document:      return WSColor.duoOrange
        }
    }

    /// Two-stop gradient used on the "kind hero" card behind a featured item.
    var heroGradient: [Color] {
        switch self {
        case .studyPack:
            return [WSColor.duoPurple, WSColor.duoPurpleDark]
        case .essayAnalysis:
            return [WSColor.duoBlue, WSColor.duoBlueDark]
        case .document:
            return [WSColor.duoOrange, WSColor.duoOrangeDark]
        }
    }

    /// One-line description used on empty-state cards + the create-new chips.
    var blurb: String {
        switch self {
        case .studyPack:
            return "Quizzes, flashcards, lessons and games made from your notes."
        case .essayAnalysis:
            return "AI-graded essays with inline annotations and rewrite suggestions."
        case .document:
            return "PDFs, photos of notes and lecture handouts you've uploaded."
        }
    }
}

// MARK: - Item provenance

/// Where the entry was created. Drives the small "synced" badge so the
/// user can tell at a glance whether something will sync back to the web.
enum LibraryItemSource: String, Codable, Equatable {
    case device     // Created on this iPhone/iPad
    case web        // Synced from writescholar.com

    var icon: String {
        switch self {
        case .device: return "iphone"
        case .web:    return "globe"
        }
    }

    var label: String {
        switch self {
        case .device: return "On this device"
        case .web:    return "Synced from web"
        }
    }
}

// MARK: - Metadata chip

/// Small badge shown on a library card. The view renders these in a
/// horizontal row beneath the card title — e.g. "12 cards · Quiz: 8 qs".
struct LibraryMetaChip: Codable, Equatable, Hashable, Identifiable {
    let id: String
    let icon: String
    let label: String

    init(icon: String, label: String) {
        self.id = "\(icon)-\(label)"
        self.icon = icon
        self.label = label
    }
}

// MARK: - The item itself

/// A single shelf entry. Codable so we can round-trip through UserDefaults
/// today and through the website API tomorrow without changing shape.
struct LibraryItem: Codable, Equatable, Identifiable, Hashable {

    /// Stable local UUID. We keep this even when `serverID` is set so the
    /// list stays referentially stable while a sync is in flight.
    let id: String

    /// Set once the row has been written to writescholar.com. Lets the
    /// detail sheet deep-link into the web reader.
    var serverID: String?

    let kind: LibraryItemKind
    let source: LibraryItemSource

    /// Display title — pack name, essay first line, or document filename.
    var title: String

    /// One-line subtitle shown beneath the title (e.g. course / class).
    var subtitle: String?

    /// 1–3 sentence preview pulled from the source content. Renders as
    /// muted body text on the card.
    var snippet: String?

    /// Small chips beneath the snippet ("12 cards", "B+", "2.1k words").
    var chips: [LibraryMetaChip]

    /// Optional URL into the web reader — set when the row has a serverID.
    var webURL: URL?

    /// Whether the user has pinned this row to the top of the list.
    var isPinned: Bool

    /// Free-form tags. Reserved for the upcoming "Folders" feature.
    var tags: [String]

    /// Study progress 0…1 (fraction of the pack's components attempted).
    /// Optional so rows persisted before this field existed decode fine;
    /// nil = no progress tracking for this kind (documents, essays).
    var progress: Double? = nil

    let createdAt: Date
    var lastOpenedAt: Date?

    // MARK: - Convenience

    /// Used by Hashable / List diffing.
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
        hasher.combine(lastOpenedAt)
        hasher.combine(isPinned)
    }

    static func == (lhs: LibraryItem, rhs: LibraryItem) -> Bool {
        lhs.id == rhs.id
            && lhs.title == rhs.title
            && lhs.lastOpenedAt == rhs.lastOpenedAt
            && lhs.isPinned == rhs.isPinned
            && lhs.chips == rhs.chips
            && lhs.progress == rhs.progress
    }

    // MARK: - Designated init

    init(
        id: String = UUID().uuidString,
        kind: LibraryItemKind,
        title: String,
        subtitle: String? = nil,
        snippet: String? = nil,
        chips: [LibraryMetaChip] = [],
        source: LibraryItemSource = .device,
        serverID: String? = nil,
        webURL: URL? = nil,
        isPinned: Bool = false,
        tags: [String] = [],
        createdAt: Date = Date(),
        lastOpenedAt: Date? = nil
    ) {
        self.id = id
        self.serverID = serverID
        self.kind = kind
        self.source = source
        self.title = title
        self.subtitle = subtitle
        self.snippet = snippet
        self.chips = chips
        self.webURL = webURL
        self.isPinned = isPinned
        self.tags = tags
        self.createdAt = createdAt
        self.lastOpenedAt = lastOpenedAt
    }
}

// MARK: - Filtering

/// The top-of-screen filter bar. Mirrors the website's library tabs.
enum LibraryFilter: String, CaseIterable, Identifiable, Hashable {
    case all
    case studyPacks
    case essays
    case documents

    var id: String { rawValue }

    var label: String {
        switch self {
        case .all:         return "All"
        case .studyPacks:  return "Study Packs"
        case .essays:      return "Essays"
        case .documents:   return "Documents"
        }
    }

    var icon: String {
        switch self {
        case .all:         return "square.stack.3d.up.fill"
        case .studyPacks:  return "graduationcap.fill"
        case .essays:      return "doc.text.magnifyingglass"
        case .documents:   return "doc.fill"
        }
    }

    var tint: Color {
        switch self {
        case .all:         return WSColor.duoPurple
        case .studyPacks:  return WSColor.duoBlue
        case .essays:      return WSColor.duoOrange
        case .documents:   return WSColor.duoGreen
        }
    }

    /// Whether `item` belongs in this filter.
    func matches(_ item: LibraryItem) -> Bool {
        switch self {
        case .all:         return true
        case .studyPacks:  return item.kind == .studyPack
        case .essays:      return item.kind == .essayAnalysis
        case .documents:   return item.kind == .document
        }
    }
}

// MARK: - Sorting

/// Top-right sort menu options. The chosen value is persisted across
/// launches via UserDefaults so the user's preference sticks.
enum LibrarySort: String, CaseIterable, Identifiable, Hashable, Codable {
    case recent
    case oldest
    case alphabetical
    case kind

    var id: String { rawValue }

    var label: String {
        switch self {
        case .recent:       return "Most recent"
        case .oldest:       return "Oldest first"
        case .alphabetical: return "A → Z"
        case .kind:         return "Group by type"
        }
    }

    var icon: String {
        switch self {
        case .recent:       return "clock.arrow.circlepath"
        case .oldest:       return "hourglass.bottomhalf.filled"
        case .alphabetical: return "textformat.abc"
        case .kind:         return "square.grid.3x3.fill"
        }
    }

    /// Apply this sort to a flat item list. Pinned items always float to
    /// the top regardless of the choice.
    func apply(to items: [LibraryItem]) -> [LibraryItem] {
        let pinned = items.filter { $0.isPinned }
        let rest   = items.filter { !$0.isPinned }
        let sortedRest: [LibraryItem]
        switch self {
        case .recent:
            sortedRest = rest.sorted { $0.createdAt > $1.createdAt }
        case .oldest:
            sortedRest = rest.sorted { $0.createdAt < $1.createdAt }
        case .alphabetical:
            sortedRest = rest.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
        case .kind:
            // Stable secondary sort by recency within each kind
            sortedRest = rest.sorted { a, b in
                if a.kind != b.kind { return a.kind.rawValue < b.kind.rawValue }
                return a.createdAt > b.createdAt
            }
        }
        return pinned.sorted { $0.createdAt > $1.createdAt } + sortedRest
    }
}

// MARK: - Recency bucket

/// "Today / Yesterday / This week / Earlier" header used when the list is
/// sorted by recency. The detail sheet also uses these labels.
enum LibraryRecencyBucket: String, CaseIterable, Hashable {
    case today      = "Today"
    case yesterday  = "Yesterday"
    case thisWeek   = "This week"
    case thisMonth  = "This month"
    case earlier    = "Earlier"

    static func bucket(for date: Date, now: Date = Date()) -> LibraryRecencyBucket {
        let cal = Calendar.current
        if cal.isDateInToday(date)     { return .today }
        if cal.isDateInYesterday(date) { return .yesterday }
        if let d = cal.dateComponents([.day], from: date, to: now).day {
            if d < 7  { return .thisWeek }
            if d < 30 { return .thisMonth }
        }
        return .earlier
    }
}

// MARK: - Date formatting helper

/// Compact "5m ago / 2h ago / 3d ago / Mar 14" formatter used on cards.
enum LibraryRelativeFormatter {
    static func compact(_ date: Date, now: Date = Date()) -> String {
        let interval = now.timeIntervalSince(date)
        if interval < 60 {
            return "Just now"
        }
        if interval < 60 * 60 {
            return "\(Int(interval / 60))m ago"
        }
        if interval < 60 * 60 * 24 {
            return "\(Int(interval / 3600))h ago"
        }
        if interval < 60 * 60 * 24 * 7 {
            return "\(Int(interval / 86_400))d ago"
        }
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        return f.string(from: date)
    }

    /// Full "March 14, 2026 at 3:42 PM" style for the detail sheet.
    static func long(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateStyle = .long
        f.timeStyle = .short
        return f.string(from: date)
    }
}
