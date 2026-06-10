//
//  StudyPackCoordinator.swift
//  WriteScholar
//
//  ObservableObject driving the Study tab's three-phase flow:
//  input → generating → home (with the generated pack).
//
//  Packs can be built five ways, matching the desktop dashboard:
//    • Topic     — type a subject, the backend writes the notes + pack
//    • Notes     — paste/type raw notes
//    • Document  — upload a PDF / DOCX / TXT (parsed server-side)
//    • Photo     — a picture of notes (OCR'd server-side)
//    • YouTube   — a video link (transcript fetched server-side)
//

import Foundation
import SwiftUI

@MainActor
final class StudyPackCoordinator: ObservableObject {

    enum Phase: Equatable {
        case input
        case generating
        case home(StudyPack)
    }

    @Published var phase: Phase = .input
    @Published var errorMessage: String?

    /// Contextual line shown in the generating view while a source is being
    /// prepared (e.g. "Reading your PDF...", "Transcribing the video...").
    @Published var statusText: String?

    var isGenerating: Bool {
        if case .generating = phase { return true }
        return false
    }

    // MARK: - Public entry points

    /// Build from a typed topic (desktop "From a topic").
    func generateFromTopic(_ topic: String) async {
        let trimmed = topic.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 2 else {
            errorMessage = "Type a topic to build a pack from."
            return
        }
        await run(status: "Researching \"\(trimmed)\"...") {
            try await StudyPackAPI.generateFromTopic(trimmed)
        }
    }

    /// Build from pasted/typed notes.
    func generate(text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        await run(status: nil) {
            try await StudyPackAPI.generate(text: trimmed)
        }
    }

    /// Build from an uploaded document (PDF / DOCX / DOC / TXT).
    func generateFromDocument(data: Data, fileName: String, mimeType: String) async {
        await run(status: "Reading your document...") {
            let text = try await StudyPackAPI.parseDocument(data: data, fileName: fileName, mimeType: mimeType)
            try Self.assertEnoughText(text, source: "document")
            return try await StudyPackAPI.generate(text: text)
        }
    }

    /// Build from a photo of notes (OCR server-side).
    func generateFromImage(data: Data, fileName: String, mimeType: String) async {
        await run(status: "Reading your photo...") {
            let text = try await StudyPackAPI.extractImageText(data: data, fileName: fileName, mimeType: mimeType)
            try Self.assertEnoughText(text, source: "photo")
            return try await StudyPackAPI.generate(text: text)
        }
    }

    /// Build from a YouTube link (transcript server-side).
    func generateFromYouTube(url: String) async {
        let trimmed = url.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            errorMessage = "Paste a YouTube link to build a pack from."
            return
        }
        await run(status: "Transcribing the video...") {
            let result = try await StudyPackAPI.extractYouTube(url: trimmed)
            try Self.assertEnoughText(result.text, source: "video")
            return try await StudyPackAPI.generate(text: result.text)
        }
    }

    /// Called when the user taps "New study pack" from the home view.
    func reset() {
        errorMessage = nil
        statusText = nil
        withAnimation(.easeInOut(duration: 0.3)) {
            phase = .input
        }
    }

    // MARK: - Shared runner

    /// Drives the input → generating → home transition for any producer,
    /// surfacing errors and recording the pack into the Library on success.
    private func run(status: String?, _ produce: @escaping () async throws -> StudyPack) async {
        errorMessage = nil
        statusText = status
        withAnimation(.easeInOut(duration: 0.35)) {
            phase = .generating
        }
        Haptics.medium()

        do {
            let pack = try await produce()
            Haptics.success()
            // Record into the user's Library shelf so it's reachable from the
            // Library tab without needing the website to round-trip.
            LibraryStore.shared.recordStudyPack(pack)
            statusText = nil
            withAnimation(.spring(response: 0.55, dampingFraction: 0.85)) {
                phase = .home(pack)
            }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
            statusText = nil
            withAnimation(.easeInOut(duration: 0.3)) {
                phase = .input
            }
        }
    }

    /// Guards against near-empty extractions so we don't waste a generation
    /// quota on a blank PDF / unreadable photo / caption-less video.
    private static func assertEnoughText(_ text: String, source: String) throws {
        let words = text.split { $0.isWhitespace || $0.isNewline }.filter { !$0.isEmpty }.count
        guard words >= 40 else {
            throw APIError.badStatus(
                code: 422,
                message: "We couldn't get enough text from that \(source). Try another one or paste your notes."
            )
        }
    }
}
