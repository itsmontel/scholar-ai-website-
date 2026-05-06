//
//  StudyPackAPI.swift
//  WriteScholar
//
//  Endpoint helpers for /api/analysis/generate-study-pack and friends.
//

import Foundation

enum StudyPackAPI {
    struct GenerateRequest: Encodable {
        let text: String
    }

    /// Generates a unified study pack (lesson + flashcards + quiz + ...).
    /// Returns the typed pack — limit metadata in the envelope's top-level
    /// fields is ignored for now (Chapter 6 surfaces it in Settings).
    static func generate(text: String) async throws -> StudyPack {
        try await APIClient.shared.post(
            path: "analysis/generate-study-pack",
            body: GenerateRequest(text: text),
            requiresAuth: true
        )
    }
}
