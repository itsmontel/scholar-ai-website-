//
//  StudyTabContainer.swift
//  WriteScholar
//
//  New top-level container for the Study tab. Replaces the old
//  StudyPackTabContainer which dropped users straight into the paste
//  view.
//
//  Behaviour:
//    • Phase .input    → render StudyHubView (the new hub landing).
//                        The hub presents the existing paste flow as a
//                        sheet, presents games as fullScreenCover, and
//                        bubbles a Focus shortcut up to MainTabView.
//    • Phase .generating → render StudyPackGeneratingView inline.
//    • Phase .home(pack) → render StudyPackHomeView inline (existing
//                          quiz/flashcards/lesson UI).
//
//  The StudyPackTabContainer file is preserved for #Preview / legacy
//  but is no longer wired into MainTabView.
//

import SwiftUI

struct StudyTabContainer: View {
    @StateObject private var coordinator = StudyPackCoordinator()

    @State private var pasteSheetOpen: Bool = false
    @State private var presentedGame:  StudyHubGame? = nil

    /// Bumped once each time a fresh pack lands on .home — fires the
    /// confetti overlay so generation feels like a *win*.
    @State private var celebrate: Int = 0

    /// Optional callback so the hub's Focus shortcut can hop to the
    /// Focus tab. MainTabView doesn't currently pipe one in, so by
    /// default we just no-op.
    var onOpenFocus: () -> Void = {}

    var body: some View {
        ZStack {
            switch coordinator.phase {
            case .input:
                StudyHubView(
                    onPaste:      { pasteSheetOpen = true },
                    onPlayGame:   { game in presentedGame = game },
                    onOpenFocus:  { onOpenFocus() }
                )
                .transition(.opacity)

            case .generating:
                StudyPackGeneratingView()
                    .transition(.opacity)

            case .home(let pack):
                StudyPackHomeView(pack: pack, coordinator: coordinator)
                    .transition(.opacity.combined(with: .scale(scale: 1.01)))
            }

            // Confetti overlay sits on top of every phase. It only fires
            // when `celebrate` changes, so it's free until the moment
            // the pack lands.
            WSConfettiView(trigger: $celebrate)
                .allowsHitTesting(false)
        }
        .animation(.easeInOut(duration: 0.35), value: coordinator.phase)
        // Paste flow as a sheet
        .sheet(isPresented: $pasteSheetOpen) {
            NavigationStack {
                StudyPackInputView(coordinator: coordinator)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("Close") {
                                pasteSheetOpen = false
                            }
                            .foregroundStyle(WSColor.foregroundMuted)
                        }
                    }
            }
        }
        // Auto-dismiss the paste sheet when generation kicks off so the
        // user sees the loading screen and pack inline instead of behind
        // a half-mounted sheet. Also fires the confetti the moment a
        // freshly-generated pack lands on .home.
        .onChange(of: coordinator.phase) { _, newPhase in
            if case .generating = newPhase {
                pasteSheetOpen = false
            }
            if case .home = newPhase {
                celebrate += 1
            }
        }
        // Games as fullScreenCover with a top-left close button
        .fullScreenCover(item: $presentedGame) { game in
            ZStack(alignment: .topLeading) {
                switch game {
                case .craterBlast(let pack): CraterBlastView(craterBlast: pack)
                case .wordTower(let pack):   WordTowerView(wordTower: pack)
                }

                Button {
                    Haptics.light()
                    presentedGame = nil
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(10)
                        .background(Circle().fill(Color.black.opacity(0.45)))
                }
                .buttonStyle(.plain)
                .padding(.top, 14)
                .padding(.leading, 14)
            }
        }
    }
}

#Preview {
    StudyTabContainer()
}
