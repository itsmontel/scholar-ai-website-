//
//  StudyTabContainer.swift
//  WriteScholar
//
//  Study tab flow: create → generating → pack home.
//  One screen to create — no hub + sheet double-pick.
//

import SwiftUI

struct StudyTabContainer: View {
    @StateObject private var coordinator = StudyPackCoordinator()
    @State private var presentedGame: StudyHubGame? = nil
    @State private var celebrate: Int = 0

    var onOpenFocus: () -> Void = {}

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            switch coordinator.phase {
            case .input:
                StudyPackInputView(coordinator: coordinator) { pack in
                    withAnimation(.easeInOut(duration: 0.35)) {
                        coordinator.phase = .home(pack)
                    }
                }
                .transition(.opacity)

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
        .animation(.easeInOut(duration: 0.35), value: coordinator.phase)
        .onChange(of: coordinator.phase) { _, newPhase in
            if case .home = newPhase { celebrate += 1 }
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
