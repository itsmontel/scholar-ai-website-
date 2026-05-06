//
//  GamesTabView.swift
//  WriteScholar
//
//  Lightweight games hub. Library + recent-pack picker land in Chapter 6;
//  for now we ship two evergreen demo packs so the user can try Crater
//  Blast and Word Tower without first generating a study pack.
//

import SwiftUI

struct GamesTabView: View {
    @State private var presented: GameKind? = nil

    enum GameKind: Identifiable, Hashable {
        case craterBlast
        case wordTower
        var id: Self { self }
    }

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Soft brand orbs
            Circle()
                .fill(Color(hex: 0xEF4444).opacity(0.10))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -180, y: -260)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0x10B981).opacity(0.10))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: 200, y: 320)
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    headerBlock
                    gameCard(
                        kind: .craterBlast,
                        title: "Crater Blast",
                        subtitle: "Boss-battle quiz arcade. Hit the boss with the right answer before your hearts run out.",
                        gradient: [Color(hex: 0xEF4444), Color(hex: 0xB91C1C), Color(hex: 0x4C1D95)],
                        icon: "burst.fill",
                        accent: Color(hex: 0xFBBF24)
                    )
                    gameCard(
                        kind: .wordTower,
                        title: "Word Tower",
                        subtitle: "Stack the right words. Tap correct items only — wrong taps cost a heart.",
                        gradient: [Color(hex: 0x10B981), Color(hex: 0x059669), Color(hex: 0x312E81)],
                        icon: "building.2.fill",
                        accent: Color(hex: 0xFBBF24)
                    )
                    libraryHint
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 18)
            }
        }
        .fullScreenCover(item: $presented) { kind in
            ZStack(alignment: .topLeading) {
                switch kind {
                case .craterBlast: CraterBlastView(craterBlast: GamesDemoData.craterBlast)
                case .wordTower:   WordTowerView(wordTower: GamesDemoData.wordTower)
                }

                Button {
                    Haptics.light()
                    presented = nil
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

    // MARK: - Header

    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Text("GAMES")
                    .wsEyebrow()
                    .foregroundStyle(Color(hex: 0xEF4444))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(Color(hex: 0xEF4444).opacity(0.15)))
                Spacer()
                WSAnimatedImage(name: "mascot-dance", ext: "webp")
                    .frame(width: 56, height: 56)
                    .shadow(color: Color(hex: 0xD946EF).opacity(0.30), radius: 8, y: 4)
            }
            Text("Beat the boss. Build the tower.")
                .wsHeadline(.large, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
            Text("Quick demos to try the games. Play your own subject on a real pack from the Study tab.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
        }
    }

    // MARK: - Game card

    private func gameCard(kind: GameKind, title: String, subtitle: String, gradient: [Color], icon: String, accent: Color) -> some View {
        Button {
            Haptics.medium()
            presented = kind
        } label: {
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: gradient, startPoint: .topLeading, endPoint: .bottomTrailing)
                    .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))

                Canvas { ctx, size in
                    for i in 0..<16 {
                        let x = (sin(Double(i) * 6.31) + 1) / 2 * size.width
                        let y = (cos(Double(i) * 4.21) + 1) / 2 * size.height
                        ctx.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: 2, height: 2)),
                            with: .color(.white.opacity(0.5))
                        )
                    }
                }
                .allowsHitTesting(false)

                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        ZStack {
                            Circle()
                                .fill(Color.white.opacity(0.18))
                                .frame(width: 56, height: 56)
                            Image(systemName: icon)
                                .font(.system(size: 26, weight: .bold))
                                .foregroundStyle(accent)
                        }
                        Spacer()
                        Image(systemName: "play.fill")
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(Circle().fill(Color.white.opacity(0.18)))
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(title)
                            .wsHeadline(.medium, weight: .bold)
                            .foregroundStyle(.white)
                        Text(subtitle)
                            .wsBody(.small)
                            .foregroundStyle(.white.opacity(0.85))
                    }
                }
                .padding(20)
            }
            .frame(height: 180)
            .shadow(color: gradient.first?.opacity(0.30) ?? .clear, radius: 16, y: 8)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Library hint (Chapter 6)

    private var libraryHint: some View {
        HStack(spacing: 12) {
            Image(systemName: "books.vertical.fill")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(Color(hex: 0x6366F1))
            VStack(alignment: .leading, spacing: 2) {
                Text("Play your own packs")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text("Generate a study pack on the Study tab to play with your own subjects. Library lands in Chapter 6.")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(hex: 0x6366F1).opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color(hex: 0x6366F1).opacity(0.25), lineWidth: 1)
                )
        )
    }
}

// MARK: - Demo data for the Games tab

private enum GamesDemoData {
    static let craterBlast: CraterBlast = {
        let qs: [CraterBlastQuestion] = [
            decode(CraterBlastQuestion.self, """
            {"id":"d1","prompt":"Which organelle is the powerhouse of the cell?",
             "answers":["Mitochondria","Ribosome","Nucleus","Lysosome"],"correctIndex":0}
            """),
            decode(CraterBlastQuestion.self, """
            {"id":"d2","prompt":"What pigment makes blood red?",
             "answers":["Hemoglobin","Keratin","Insulin","Collagen"],"correctIndex":0}
            """),
            decode(CraterBlastQuestion.self, """
            {"id":"d3","prompt":"What does ATP stand for?",
             "answers":["Adenosine TP","Active TP","Acid TP","ATP molecule"],"correctIndex":0}
            """),
            decode(CraterBlastQuestion.self, """
            {"id":"d4","prompt":"DNA pairs with which molecule?",
             "answers":["RNA","ATP","Sugar","Lipid"],"correctIndex":0}
            """),
            decode(CraterBlastQuestion.self, """
            {"id":"d5","prompt":"Which is the smallest particle of an element?",
             "answers":["Atom","Cell","Quark","Photon"],"correctIndex":0}
            """),
            decode(CraterBlastQuestion.self, """
            {"id":"d6","prompt":"Pythagoras' theorem applies to which shape?",
             "answers":["Right triangle","Square","Circle","Pentagon"],"correctIndex":0}
            """),
        ]
        return CraterBlast(title: "Demo · Mixed", questions: qs)
    }()

    static let wordTower: WordTower = {
        let qs: [WordTowerQuestion] = [
            decode(WordTowerQuestion.self, """
            {"id":"d1","prompt":"Which are organelles?","items":[
              {"text":"Nucleus","isCorrect":true},
              {"text":"Mitochondria","isCorrect":true},
              {"text":"Polygon","isCorrect":false},
              {"text":"Lysosome","isCorrect":true},
              {"text":"Velocity","isCorrect":false},
              {"text":"Cosine","isCorrect":false}
            ]}
            """),
            decode(WordTowerQuestion.self, """
            {"id":"d2","prompt":"Which are noble gases?","items":[
              {"text":"Helium","isCorrect":true},
              {"text":"Argon","isCorrect":true},
              {"text":"Sodium","isCorrect":false},
              {"text":"Neon","isCorrect":true},
              {"text":"Carbon","isCorrect":false},
              {"text":"Iron","isCorrect":false}
            ]}
            """),
            decode(WordTowerQuestion.self, """
            {"id":"d3","prompt":"Which are prime numbers?","items":[
              {"text":"2","isCorrect":true},
              {"text":"3","isCorrect":true},
              {"text":"4","isCorrect":false},
              {"text":"7","isCorrect":true},
              {"text":"9","isCorrect":false},
              {"text":"15","isCorrect":false}
            ]}
            """),
        ]
        return WordTower(title: "Demo · Mixed", questions: qs)
    }()

    private static func decode<T: Decodable>(_ type: T.Type, _ json: String) -> T {
        try! JSONDecoder().decode(T.self, from: Data(json.utf8))
    }
}

#Preview {
    GamesTabView()
}
