//
//  GameLaunchSheet.swift
//  WriteScholar
//
//  Pre-launch mode picker (prototype: mode choice moved off the arcade
//  rows into a clean sheet). Shows the game's hero + a list of modes;
//  picking one hands the mode back to GamesTabView to build the pool.
//

import SwiftUI

/// A launch option for an arcade game.
struct GameMode: Identifiable {
    enum Source: Equatable {
        case builtIn(String)   // key: playForFun / mentalMath / capitals / flags / science …
        case myNotes           // route through the study-pack picker
    }
    var id: String { label }
    let label: String
    let icon: String
    let source: Source
}

struct GameLaunchSheet: View {
    let game: ArcadeGame
    let modes: [GameMode]
    var onPick: (GameMode) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                hero
                Text("Choose a mode")
                    .wsBody(.small, weight: .black)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .textCase(.uppercase)
                    .tracking(1)

                VStack(spacing: 12) {
                    ForEach(Array(modes.enumerated()), id: \.element.id) { (i, mode) in
                        Button {
                            Haptics.medium()
                            dismiss()
                            onPick(mode)
                        } label: {
                            WSListRowCard(
                                icon: mode.icon,
                                iconTint: mode.source == .myNotes ? WSColor.duoPurple : game.tint,
                                title: mode.label,
                                subtitle: mode.source == .myNotes ? "Use a saved study pack" : nil
                            )
                        }
                        .buttonStyle(WSBouncyButtonStyle())
                        .wsStaggerEntry(i)
                    }
                }
            }
            .padding(20)
        }
        .background(WSColor.background.ignoresSafeArea())
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var hero: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(game.tint.opacity(0.16))
                    .frame(width: 60, height: 60)
                Image(systemName: game.icon)
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(game.tint)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(game.title)
                    .wsHeadline(.medium, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text(game.blurb)
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
        .padding(.top, 6)
    }
}

#Preview {
    GameLaunchSheet(game: .quizRun, modes: [
        GameMode(label: "Play for Fun", icon: "sparkles", source: .builtIn("playForFun")),
        GameMode(label: "My Notes", icon: "doc.text.fill", source: .myNotes),
        GameMode(label: "Science", icon: "atom", source: .builtIn("science")),
    ], onPick: { _ in })
}
