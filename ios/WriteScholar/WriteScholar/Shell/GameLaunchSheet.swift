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

    private let modeFills: [Color] = [WSColor.lime, WSColor.sky, WSColor.orange, WSColor.pink, WSColor.sun, WSColor.purple]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                hero
                Text("Pick a mode")
                    .font(WSFont.headline(22, weight: .black))
                    .foregroundStyle(.white)

                VStack(spacing: 12) {
                    ForEach(Array(modes.enumerated()), id: \.element.id) { (i, mode) in
                        Button {
                            Haptics.medium()
                            dismiss()
                            onPick(mode)
                        } label: {
                            HStack(spacing: 14) {
                                Image(systemName: mode.icon)
                                    .font(.system(size: 17, weight: .black))
                                    .foregroundStyle(WSColor.inkText)
                                    .frame(width: 42, height: 42)
                                    .background(Circle().fill(Color.white))
                                    .overlay(Circle().strokeBorder(Color.black, lineWidth: WSSticker.stroke))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(mode.label)
                                        .font(WSFont.headline(18, weight: .black))
                                    if mode.source == .myNotes {
                                        Text("Built from a saved study pack")
                                            .font(WSFont.sans(13, weight: .bold))
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                Image(systemName: "play.fill")
                                    .font(.system(size: 14, weight: .black))
                            }
                            .foregroundStyle(mode.source == .myNotes ? .white : WSColor.inkText)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .wsSticker(fill: mode.source == .myNotes ? WSColor.purple : modeFills[i % modeFills.count],
                                       radius: 20, depth: 4, stroke: .black)
                        }
                        .buttonStyle(WSStickerPressStyle())
                        .wsPop(delay: 0.05 * Double(i))
                    }
                }
            }
            .padding(20)
        }
        .background(WSColor.arcadeNight.ignoresSafeArea())
        .environment(\.colorScheme, .dark)
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var hero: some View {
        HStack(spacing: 14) {
            ArcadePreview(game: game)
                .frame(width: 110, height: 76)
                .background(Color.black.opacity(0.35))
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(WSColor.lime, lineWidth: 2.5))
            VStack(alignment: .leading, spacing: 3) {
                Text(game.title)
                    .font(WSFont.headline(28, weight: .black))
                    .tracking(-0.6)
                    .foregroundStyle(WSColor.lime)
                Text(game.blurb)
                    .font(WSFont.sans(14, weight: .bold))
                    .foregroundStyle(Color(hex: 0xD9D2F2))
            }
            Spacer()
        }
        .padding(.top, 10)
    }
}

#Preview {
    GameLaunchSheet(game: .quizRun, modes: [
        GameMode(label: "Play for Fun", icon: "sparkles", source: .builtIn("playForFun")),
        GameMode(label: "My Notes", icon: "doc.text.fill", source: .myNotes),
        GameMode(label: "Science", icon: "atom", source: .builtIn("science")),
    ], onPick: { _ in })
}
