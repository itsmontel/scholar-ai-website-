//
//  WSPackCover.swift
//  WriteScholar
//
//  Sticker cover art for a study pack / library item. The subject is
//  guessed from the title ("Bio 101: Cell Division" → biology) and mapped
//  to a bundled cover illustration (Resources/cover-<subject>.jpg). When a
//  subject has no art, a colored tile with the subject's symbol stands in.
//

import SwiftUI

enum WSPackSubject: String, CaseIterable {
    case biology, chemistry, physics, math, history, literature
    case psychology, economics, computing, language, geography, general

    /// First match wins, so more specific words come first.
    private static let keywords: [(WSPackSubject, [String])] = [
        (.biology,    ["bio", "cell", "mitosis", "dna", "gene", "anatomy", "organ", "ecology", "evolution", "plant", "photosynth"]),
        (.chemistry,  ["chem", "molecule", "atom", "reaction", "acid", "organic", "periodic", "bond"]),
        (.physics,    ["physic", "force", "motion", "energy", "quantum", "electric", "magnet", "wave", "newton"]),
        (.math,       ["math", "calc", "algebra", "geometry", "statistic", "stats", "trig", "equation", "derivative", "integral", "probability"]),
        (.history,    ["hist", "war", "revolution", "empire", "ancient", "civil", "century", "dynasty", "government", "politic"]),
        (.literature, ["lit", "english", "novel", "poem", "poetry", "shakespeare", "essay", "gatsby", "writing", "rhetoric"]),
        (.psychology, ["psych", "brain", "behavior", "behaviour", "cognitive", "mind", "sociology", "social"]),
        (.economics,  ["econ", "market", "finance", "business", "account", "marketing", "supply", "demand", "money"]),
        (.computing,  ["comput", "code", "coding", "program", "python", "java", "algorithm", "data", "software", "cs "]),
        (.language,   ["spanish", "french", "german", "latin", "japanese", "chinese", "vocab", "language", "grammar", "italian"]),
        (.geography,  ["geo", "map", "capital", "country", "countries", "climate", "earth", "continent"]),
    ]

    static func guess(from title: String) -> WSPackSubject {
        let t = " " + title.lowercased() + " "
        for (subject, words) in keywords where words.contains(where: { t.contains($0) }) {
            return subject
        }
        return .general
    }

    var fill: Color {
        switch self {
        case .biology:    return WSColor.lime
        case .chemistry:  return WSColor.sky
        case .physics:    return WSColor.purple
        case .math:       return WSColor.orange
        case .history:    return WSColor.sun
        case .literature: return WSColor.pink
        case .psychology: return WSColor.pinkSoft
        case .economics:  return WSColor.lime
        case .computing:  return WSColor.sky
        case .language:   return WSColor.orange
        case .geography:  return WSColor.sky
        case .general:    return WSColor.purple
        }
    }

    var symbol: String {
        switch self {
        case .biology:    return "leaf.fill"
        case .chemistry:  return "flask.fill"
        case .physics:    return "atom"
        case .math:       return "function"
        case .history:    return "building.columns.fill"
        case .literature: return "book.fill"
        case .psychology: return "brain.head.profile"
        case .economics:  return "chart.line.uptrend.xyaxis"
        case .computing:  return "chevron.left.forwardslash.chevron.right"
        case .language:   return "character.bubble.fill"
        case .geography:  return "globe.americas.fill"
        case .general:    return "sparkles"
        }
    }

    /// Bundled cover art, if this subject has one.
    var image: UIImage? {
        guard let url = Bundle.main.url(forResource: "cover-\(rawValue)", withExtension: "jpg") else { return nil }
        return UIImage(contentsOfFile: url.path)
    }
}

/// Square sticker cover for a pack row or pack header.
struct WSPackCover: View {
    var title: String
    var kind: LibraryItemKind = .studyPack
    var size: CGFloat = 74
    var radius: CGFloat = 16

    var body: some View {
        let subject = WSPackSubject.guess(from: title)
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        ZStack {
            if kind == .studyPack, let img = subject.image {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFill()
            } else {
                shape.fill(kind == .studyPack ? subject.fill : WSStickerTint.face(for: kind.tint))
                Image(systemName: kind == .studyPack ? subject.symbol : kind.icon)
                    .font(.system(size: size * 0.38, weight: .black))
                    .foregroundStyle(WSColor.inkText)
            }
        }
        .frame(width: size, height: size)
        .clipShape(shape)
        .overlay(shape.strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
        .accessibilityHidden(true)
    }
}
