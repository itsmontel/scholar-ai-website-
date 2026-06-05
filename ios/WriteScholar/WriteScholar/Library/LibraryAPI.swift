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
