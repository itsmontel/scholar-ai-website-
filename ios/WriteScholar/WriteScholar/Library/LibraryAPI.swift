//
//  LibraryAPI.swift
//  WriteScholar
//
//  Pulls the signed-in user's saved content from the backend so the Library
//  reflects everything created on the web/desktop — not just packs generated
//  on this device. Maps each document/essay into a `LibraryItem`.
//
//  GET /api/documents → { data: { documents: [...] } }
//

import Foundation

/// A study pack pulled from the website/desktop account, carrying both the
/// metadata for the Library row and the full playable pack so the games,
/// quiz, flashcards and lesson all work offline once synced.
struct SyncedStudyPack: Sendable {
    let serverID: String
    let title: String
    let createdAt: Date
    let pack: StudyPack
}

enum LibraryAPI {

    /// Fetches the user's documents (essays, uploads, drafts) and maps them to
    /// library items tagged `.web`.
    static func fetchDocuments(limit: Int = 100) async throws -> [LibraryItem] {
        let resp: DocumentsResponse = try await APIClient.shared.get(
            path: "documents",
            query: [
                URLQueryItem(name: "limit", value: "\(limit)"),
                URLQueryItem(name: "sortBy", value: "updated_at"),
                URLQueryItem(name: "sortOrder", value: "desc"),
            ],
            requiresAuth: true
        )
        return resp.documents.map { $0.toLibraryItem() }
    }

    /// Fetches the user's saved study packs (created on web/desktop or any
    /// device) from the shared quiz-history endpoint and decodes the full
    /// pack for each so they're immediately playable after a sync.
    static func fetchStudyPacks(limit: Int = 100) async throws -> [SyncedStudyPack] {
        let rows: [QuizHistoryItemDTO] = try await APIClient.shared.get(
            path: "analysis/quiz-history",
            query: [URLQueryItem(name: "limit", value: "\(limit)")],
            requiresAuth: true
        )
        return rows.compactMap { row in
            guard row.quizType == "study_pack", let pack = row.pack else { return nil }
            return SyncedStudyPack(
                serverID: row.id,
                title: (row.title?.isEmpty == false ? row.title! : pack.displayTitle),
                createdAt: parseISODate(row.createdAt) ?? Date(),
                pack: pack
            )
        }
    }

    // MARK: - Quiz history DTO

    /// One row from GET /api/analysis/quiz-history. Only study-pack rows carry
    /// a decodable `pack`; other rows (lessons / standalone quizzes) leave it
    /// nil so the array still decodes cleanly.
    private struct QuizHistoryItemDTO: Decodable {
        let id: String
        let title: String?
        let quizType: String?
        let createdAt: String?
        let pack: StudyPack?

        enum CodingKeys: String, CodingKey {
            case id, title, questions
            case quizType = "quiz_type"
            case createdAt = "created_at"
        }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: CodingKeys.self)
            if let s = try? c.decode(String.self, forKey: .id) {
                id = s
            } else if let i = try? c.decode(Int.self, forKey: .id) {
                id = String(i)
            } else {
                id = UUID().uuidString
            }
            title = try? c.decode(String.self, forKey: .title)
            quizType = try? c.decode(String.self, forKey: .quizType)
            createdAt = try? c.decode(String.self, forKey: .createdAt)
            if quizType == "study_pack" {
                pack = try? c.decode(StudyPack.self, forKey: .questions)
            } else {
                pack = nil
            }
        }
    }

    private static func parseISODate(_ s: String?) -> Date? {
        guard let s, !s.isEmpty else { return nil }
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: s)
    }

    // MARK: - DTOs

    private struct DocumentsResponse: Decodable {
        let documents: [DocumentDTO]
    }

    private struct DocumentDTO: Decodable {
        let id: String
        let title: String?
        let originalFilename: String?
        let fileType: String?
        let wordCount: Int?
        let contentPreview: String?
        let createdAt: String?
        let updatedAt: String?
        let lastEditedAt: String?
        let analysisStatus: AnalysisStatus?

        struct AnalysisStatus: Decodable { let hasAnalysis: Bool? }

        func toLibraryItem() -> LibraryItem {
            let analyzed = analysisStatus?.hasAnalysis ?? false
            let kind: LibraryItemKind = analyzed ? .essayAnalysis : .document
            let created = parseDate(createdAt) ?? Date()
            let opened = parseDate(lastEditedAt) ?? parseDate(updatedAt)

            var chips: [LibraryMetaChip] = []
            if let wc = wordCount, wc > 0 {
                chips.append(.init(icon: "textformat", label: "\(wc) words"))
            }
            if let ft = fileType, !ft.isEmpty {
                chips.append(.init(icon: "doc.text", label: ft.uppercased()))
            }
            if analyzed {
                chips.append(.init(icon: "checkmark.seal.fill", label: "Analyzed"))
            }

            let displayTitle: String = {
                if let t = title, !t.isEmpty { return t }
                if let f = originalFilename, !f.isEmpty { return f }
                return "Untitled"
            }()

            return LibraryItem(
                id: "web-\(id)",
                kind: kind,
                title: displayTitle,
                subtitle: originalFilename,
                snippet: contentPreview,
                chips: chips,
                source: .web,
                serverID: id,
                createdAt: created,
                lastOpenedAt: opened
            )
        }

        private func parseDate(_ s: String?) -> Date? {
            guard let s, !s.isEmpty else { return nil }
            let f = ISO8601DateFormatter()
            f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let d = f.date(from: s) { return d }
            f.formatOptions = [.withInternetDateTime]
            return f.date(from: s)
        }
    }
}
