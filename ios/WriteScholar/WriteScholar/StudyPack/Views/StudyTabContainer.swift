//
//  StudyTabContainer.swift
//  WriteScholar
//
//  Study tab flow: saved-packs LIST (mockup #3) → create → generating →
//  pack home. Users with saved packs land on the list; brand-new users
//  (or a "Study Pack" tool-picker intent) land straight in the creator.
//

import SwiftUI

struct StudyTabContainer: View {
    @StateObject private var coordinator = StudyPackCoordinator()
    @State private var presentedGame: StudyHubGame? = nil
    @State private var celebrate: Int = 0
    /// True while the saved-packs LIST is the visible surface (the default
    /// landing — new users see the list's empty state). A "Study Pack"
    /// tool-picker intent flips to the creator in `onAppear`.
    @State private var showList = true
    @State private var resolvedIntent = false

    var onOpenFocus: () -> Void = {}

    private var hasSavedPacks: Bool {
        LibraryStore.shared.items.contains { $0.kind == .studyPack }
    }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            switch coordinator.phase {
            case .input:
                if showList {
                    StudyPacksListView(
                        onOpen: { pack, itemID in
                            StudyPackProgressStore.shared.open(pack, itemID: itemID)
                            withAnimation(.easeInOut(duration: 0.35)) {
                                coordinator.phase = .home(pack)
                            }
                        },
                        onNewPack: {
                            withAnimation(.easeInOut(duration: 0.3)) { showList = false }
                        }
                    )
                    .transition(.opacity)
                } else {
                    StudyPackInputView(coordinator: coordinator) { pack in
                        // Bind progress tracking to the library row the
                        // generation recorder just created (matched by
                        // title — persistence keys off that item id).
                        let itemID = LibraryStore.shared.items
                            .first { $0.kind == .studyPack && $0.title == pack.displayTitle }?
                            .id
                        StudyPackProgressStore.shared.open(pack, itemID: itemID)
                        withAnimation(.easeInOut(duration: 0.35)) {
                            coordinator.phase = .home(pack)
                        }
                    }
                    .transition(.opacity)
                    .overlay(alignment: .topTrailing) {
                        // Back to the saved-packs list (only when one exists).
                        if hasSavedPacks {
                            Button {
                                Haptics.light()
                                withAnimation(.easeInOut(duration: 0.3)) { showList = true }
                            } label: {
                                Image(systemName: "square.grid.2x2")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundStyle(WSColor.duoPurple)
                                    .frame(width: 38, height: 38)
                                    .background(
                                        Circle()
                                            .fill(WSColor.backgroundElevated)
                                            .shadow(color: Color.black.opacity(0.06), radius: 5, y: 2)
                                    )
                            }
                            .buttonStyle(WSBouncyButtonStyle())
                            .padding(.top, 14)
                            .padding(.trailing, 18)
                            .accessibilityLabel("Your packs")
                        }
                    }
                }

            case .generating:
                StudyPackGeneratingView(statusText: coordinator.statusText)
                    .transition(.opacity)

            case .home(let pack):
                StudyPackHomeView(pack: pack, coordinator: coordinator, onPlayGame: { game in
                    presentedGame = game
                })
                .transition(.opacity.combined(with: .scale(scale: 1.01)))
            }

            WSConfettiView(trigger: $celebrate)
                .allowsHitTesting(false)
        }
        // Don't let a swipe-down throw away an in-flight generation.
        .interactiveDismissDisabled(coordinator.phase == .generating)
        .animation(.easeInOut(duration: 0.35), value: coordinator.phase)
        .onAppear {
            guard !resolvedIntent else { return }
            resolvedIntent = true
            // "Study Pack" intent (or no saved packs) → open the creator.
            if StudyLaunchIntent.pending == .create {
                StudyLaunchIntent.pending = nil
                showList = false
            } else if !hasSavedPacks {
                showList = false
            }
        }
        .onChange(of: coordinator.phase) { _, newPhase in
            switch newPhase {
            case .home:
                celebrate += 1
            case .input:
                // Leaving a pack — return to the list when packs exist and
                // stop attributing progress to the closed pack.
                StudyPackProgressStore.shared.closeCurrent()
                if hasSavedPacks { showList = true }
            default:
                break
            }
        }
        .fullScreenCover(item: $presentedGame) { game in
            ZStack(alignment: .topLeading) {
                switch game {
                case .craterBlast(let p): CraterBlastView(craterBlast: p)
                case .wordTower(let p):   WordTowerView(wordTower: p)
                case .wordBlitz(let p):   WordBlitzView(wordBlitz: p)
                }
                Button {
                    Haptics.light()
                    presentedGame = nil
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(WSColor.foreground)
                        .padding(10)
                        .background(Circle().fill(WSColor.backgroundElevated))
                        .overlay(Circle().stroke(WSColor.hairline, lineWidth: 1))
                        .shadow(color: Color.black.opacity(0.1), radius: 6, y: 2)
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
