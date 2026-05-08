//
//  StudyPackPersistence.swift
//  WriteScholar
//
//  On-device store for the *full* StudyPack JSON behind every Library
//  item of kind `.studyPack`. The `LibraryItem` itself only carries
//  metadata (title, chips, snippet) so the Library list stays lean —
//  we store the playable game/quiz/flashcard data here, in a separate
//  JSON file per pack inside Application Support.
//
//  Read: `Games` tab's "My Notes" mode lists items where `loadPack(for:)`
//  returns a pack with non-empty `craterBlast.questions` or
//  `wordTower.questions`, then launches the chosen game with those
//  questions instead of the preset desktop word banks.
//
//  Write: `LibraryStore.recordStudyPack(_:)` calls `save(_:for:)` so the
//  pack is persisted at the same time the LibraryItem metadata is added.
//
//  Cleanup: `LibraryStore.delete(_:)` calls `delete(for:)` so we don't
//  leak orphaned files when the user removes a pack from the library.
//

import Foundation

@MainActor
final class StudyPackPersistence {
    static let shared = StudyPackPersistence()

    private let fm = FileManager.default
    private init() {}

    /// Application Support / WriteScholarPacks / <id>.json
    /// `itemID` is the LibraryItem's String id (matches the model).
    private func packURL(for itemID: String) -> URL {
        let base = (try? fm.url(for: .applicationSupportDirectory,
                                in: .userDomainMask,
                                appropriateFor: nil,
                                create: true))
            ?? fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("WriteScholarPacks", isDirectory: true)
        if !fm.fileExists(atPath: dir.path) {
            try? fm.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        // Sanitize — IDs should already be UUID strings but defend against
        // anything containing slashes or `..` that could escape the folder.
        let safe = itemID.replacingOccurrences(of: "/", with: "_")
                          .replacingOccurrences(of: "..", with: "_")
        return dir.appendingPathComponent("\(safe).json")
    }

    /// Persist the full pack for the given library item ID. Silent on
    /// failure — the item still renders, just without playable game data.
    func save(_ pack: StudyPack, for itemID: String) {
        let url = packURL(for: itemID)
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        guard let data = try? encoder.encode(pack) else { return }
        try? data.write(to: url, options: [.atomic])
    }

    /// Load the full pack, or nil if it was never saved (older library
    /// items pre-dating this store) or the file vanished.
    func loadPack(for itemID: String) -> StudyPack? {
        let url = packURL(for: itemID)
        guard let data = try? Data(contentsOf: url) else { return nil }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try? decoder.decode(StudyPack.self, from: data)
    }

    /// Delete the saved pack file. Safe to call for IDs we never wrote.
    func delete(for itemID: String) {
        let url = packURL(for: itemID)
        try? fm.removeItem(at: url)
    }
}
