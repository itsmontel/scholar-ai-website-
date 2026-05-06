//
//  StudyPackTabContainer.swift
//  WriteScholar
//
//  Holds the StudyPackCoordinator for the Study tab and renders one
//  of three views based on its phase.
//

import SwiftUI

struct StudyPackTabContainer: View {
    @StateObject private var coordinator = StudyPackCoordinator()

    var body: some View {
        ZStack {
            switch coordinator.phase {
            case .input:
                StudyPackInputView(coordinator: coordinator)
                    .transition(.opacity)

            case .generating:
                StudyPackGeneratingView()
                    .transition(.opacity)

            case .home(let pack):
                StudyPackHomeView(pack: pack, coordinator: coordinator)
                    .transition(.opacity.combined(with: .scale(scale: 1.01)))
            }
        }
        .animation(.easeInOut(duration: 0.35), value: coordinator.phase)
    }
}

#Preview {
    StudyPackTabContainer()
}
