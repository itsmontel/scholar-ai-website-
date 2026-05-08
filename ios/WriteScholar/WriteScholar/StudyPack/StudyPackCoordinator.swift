//
//  StudyPackCoordinator.swift
//  WriteScholar
//
//  ObservableObject driving the Study tab's three-phase flow:
//  input → generating → home (with the generated pack).
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

    var isGenerating: Bool {
        if case .generating = phase { return true }
        return false
    }

    func generate(text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        errorMessage = nil
        withAnimation(.easeInOut(duration: 0.35)) {
            phase = .generating
        }
        Haptics.medium()

        do {
            let pack = try await StudyPackAPI.generate(text: trimmed)
            Haptics.success()
            // Record into the user's Library shelf so it's reachable from
            // the Library tab without needing the website to round-trip.
            LibraryStore.shared.recordStudyPack(pack)
            withAnimation(.spring(response: 0.55, dampingFraction: 0.85)) {
                phase = .home(pack)
            }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
            withAnimation(.easeInOut(duration: 0.3)) {
                phase = .input
            }
        }
    }

    /// Called when the user taps "New study pack" from the home view.
    func reset() {
        errorMessage = nil
        withAnimation(.easeInOut(duration: 0.3)) {
            phase = .input
        }
    }
}
