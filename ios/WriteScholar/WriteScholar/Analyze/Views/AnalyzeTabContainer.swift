//
//  AnalyzeTabContainer.swift
//  WriteScholar
//
//  Owns the AnalyzeCoordinator and renders one of three views per phase.
//

import SwiftUI

struct AnalyzeTabContainer: View {
    @StateObject private var coordinator = AnalyzeCoordinator()

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            switch coordinator.phase {
            case .input:
                AnalyzeInputView(coordinator: coordinator)
                    .transition(.opacity)

            case .generating:
                AnalyzeGeneratingView()
                    .transition(.opacity)

            case .results(let content, let result):
                AnalyzeResultsView(
                    content: content,
                    result: result,
                    coordinator: coordinator
                )
                .transition(.opacity.combined(with: .scale(scale: 1.01)))
            }
        }
        .animation(.easeInOut(duration: 0.35), value: phaseTag)
    }

    /// Stable identifier used for `.animation(value:)` since `Phase` itself
    /// holds non-Equatable payloads in Swift 6.
    private var phaseTag: String {
        switch coordinator.phase {
        case .input:      return "input"
        case .generating: return "generating"
        case .results:    return "results"
        }
    }
}

#Preview {
    AnalyzeTabContainer()
}
