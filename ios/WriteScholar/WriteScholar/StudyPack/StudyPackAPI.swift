//
//  StudyPackAPI.swift
//  WriteScholar
//
//  Endpoint helpers for the study-pack flow. Mirrors the desktop dashboard:
//  packs can be built from pasted notes, a typed topic, an uploaded
//  document (PDF/DOCX/TXT), a photo of notes, or a YouTube link.
//

import Foundation

enum StudyPackAPI {

    // MARK: - Generate

    private struct GenerateNotesRequest: Encodable {
        let text: String
    }

    private struct GenerateTopicRequest: Encodable {
        let inputType = "topic"
        let topic: String
    }

    /// Generates a unified study pack (lesson + flashcards + quiz + games)
    /// from raw notes text.
    static func generate(text: String) async throws -> StudyPack {
        try await APIClient.shared.post(
            path: "analysis/generate-study-pack",
            body: GenerateNotesRequest(text: text),
            requiresAuth: true
        )
    }

    /// Generates a full study pack from a typed topic — the backend writes
    /// the underlying notes for us, then builds the pack (desktop parity).
    static func generateFromTopic(_ topic: String) async throws -> StudyPack {
        try await APIClient.shared.post(
            path: "analysis/generate-study-pack",
            body: GenerateTopicRequest(topic: topic),
            requiresAuth: true
        )
    }

    // MARK: - Source extraction (→ text, then call generate)

    private struct ExtractedText: Decodable {
        let content: String
        let wordCount: Int?
        let title: String?
    }

    private struct YouTubeRequest: Encodable {
        let url: String
    }

    /// Parses an uploaded document (PDF / DOCX / DOC / TXT) into plain text.
    static func parseDocument(data: Data, fileName: String, mimeType: String) async throws -> String {
        let result: ExtractedText = try await APIClient.shared.upload(
            path: "analysis/parse-document",
            fileField: "file",
            fileName: fileName,
            mimeType: mimeType,
            fileData: data
        )
        return result.content
    }

    /// OCR / transcribes a photo of notes into plain text.
    static func extractImageText(data: Data, fileName: String, mimeType: String) async throws -> String {
        let result: ExtractedText = try await APIClient.shared.upload(
            path: "analysis/extract-image-text",
            fileField: "image",
            fileName: fileName,
            mimeType: mimeType,
            fileData: data
        )
        return result.content
    }

    /// Fetches a YouTube video's transcript as plain text. Returns the text
    /// plus an optional video title for nicer pack naming.
    static func extractYouTube(url: String) async throws -> (text: String, title: String?) {
        let result: ExtractedText = try await APIClient.shared.post(
            path: "analysis/extract-youtube",
            body: YouTubeRequest(url: url),
            requiresAuth: true
        )
        return (result.content, result.title)
    }
}
