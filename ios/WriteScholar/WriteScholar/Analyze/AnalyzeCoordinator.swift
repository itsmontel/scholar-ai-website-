//
//  AnalyzeCoordinator.swift
//  WriteScholar
//
//  Three-phase coordinator: input → generating → results. Mirrors the
//  StudyPackCoordinator pattern so the UX feels uniform across tabs.
//

import Foundation
import SwiftUI

@MainActor
final class AnalyzeCoordinator: ObservableObject {
    /// Not Equatable — `AnalysisResult` carries non-Equatable payloads.
    /// Views switch on the cases directly; transition animations are
    /// keyed off a stable `String` tag inside the container view.
    enum Phase {
        case input
        case generating(content: String)
        case results(content: String, result: AnalysisResult)
    }

    @Published var phase: Phase = .input
    @Published var errorMessage: String?
    @Published var gradingStyle: AnalyzeAPI.GradingStyle = .us

    var isGenerating: Bool {
        if case .generating = phase { return true }
        return false
    }

    func analyze(text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        errorMessage = nil
        Haptics.medium()
        withAnimation(.easeInOut(duration: 0.35)) {
            phase = .generating(content: trimmed)
        }

        do {
            let result = try await AnalyzeAPI.analyze(text: trimmed, gradingStyle: gradingStyle)
            Haptics.success()
            withAnimation(.spring(response: 0.55, dampingFraction: 0.85)) {
                phase = .results(content: trimmed, result: result)
            }
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
            withAnimation(.easeInOut(duration: 0.3)) {
                phase = .input
            }
        }
    }

    func reset() {
        errorMessage = nil
        withAnimation(.easeInOut(duration: 0.3)) {
            phase = .input
        }
    }
}
