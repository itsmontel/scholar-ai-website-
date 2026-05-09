//
//  LibraryItemCard.swift
//  WriteScholar
//
//  The card rendered for every row in the Library list — Duolingo-style
//  chunky 3D card design. Three visual variants dispatched off `item.kind`:
//
//    * Study Pack    -- purple accent, graduation icon
//    * Essay Analysis -- blue accent, doc-magnifier icon
//    * Document       -- orange accent, file icon
//
//  All three share the same skeleton so the user gets a consistent
//  rhythm scrolling through a mixed list.
//

import SwiftUI

// MARK: - Standard list card

struct LibraryItemCard: View {
    let item: LibraryItem
    var onTap: () -> Void
    var onPinToggle: () -> Void
    var onDelete: () -> Void

    private var accentColor: Color {
        switch item.kind {
        case .studyPack:     return WSColor.duoPurple
        case .essayAnalysis: return WSColor.duoBlue
        case .document:      return WSColor.duoOrange
        }
    }

    var body: some View {
        Button(action: {
            Haptics.light()
            onTap()
        }) {
            cardBody
        }
        .buttonStyle(LibraryCardPressStyle())
        .contextMenu {
            Button {
                onPinToggle()
            } label: {
                Label(item.isPinned ? "Unpin" : "Pin to top",
                      systemImage: item.isPinned ? "pin.slash.fill" : "pin.fill")
            }
            if let url = item.webURL {
                Link(destination: url) {
                    Label("Open on web", systemImage: "globe")
                }
            }
            Divider()
            Button(role: .destructive) {
                onDelete()
            } label: {
                Label("Remove from library", systemImage: "trash")
            }
        }
    }

    // MARK: - Body

    private var cardBody: some View {
        HStack(alignment: .top, spacing: 14) {
            iconBlock
            contentBlock
            Spacer(minLength: 0)
            trailingBlock
        }
        .wsChunkyCard(
            cornerRadius: 18,
            horizontalPadding: 14,
            verticalPadding: 14,
            lipHeight: item.isPinned ? 6 : 5,
            accent: accentColor
        )
    }

    // MARK: - Icon block

    private var iconBlock: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(accentColor)
                .frame(width: 52, height: 52)

            Image(systemName: item.kind.icon)
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(.white)
        }
    }

    // MARK: - Center content

    private var contentBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Top row: kind label + pin badge + source dot
            HStack(spacing: 6) {
                Text(item.kind.label.uppercased())
                    .font(WSFont.sans(9, weight: .black))
                    .foregroundStyle(accentColor)
                    .tracking(0.6)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(accentColor.opacity(0.12)))

                if item.isPinned {
                    Label("PINNED", systemImage: "pin.fill")
                        .labelStyle(.titleAndIcon)
                        .font(WSFont.sans(8, weight: .black))
                        .foregroundStyle(WSColor.duoOrange)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(WSColor.duoOrangeLight))
                }

                if item.source == .web {
                    HStack(spacing: 3) {
                        Image(systemName: "globe").font(.system(size: 8, weight: .bold))
                        Text("WEB")
                            .font(WSFont.sans(8, weight: .black))
                    }
                    .foregroundStyle(WSColor.duoGreen)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(WSColor.duoGreenLight))
                }

                if Date().timeIntervalSince(item.createdAt) < 30 * 60 {
                    HStack(spacing: 3) {
                        Image(systemName: "sparkles").font(.system(size: 8, weight: .bold))
                        Text("NEW")
                            .font(WSFont.sans(8, weight: .black))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(
                        Capsule().fill(WSColor.duoOrange)
                    )
                }
            }

            Text(item.title)
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(WSColor.duoText)
                .lineLimit(2)
                .multilineTextAlignment(.leading)

            if let subtitle = item.subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
            }

            if let snippet = item.snippet, !snippet.isEmpty {
                Text(snippet)
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.duoText.opacity(0.45))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .padding(.top, 1)
            }

            if !item.chips.isEmpty {
                LibraryChipRow(chips: item.chips, tint: accentColor)
                    .padding(.top, 6)
            }
        }
    }

    // MARK: - Trailing block

    private var trailingBlock: some View {
        VStack(alignment: .trailing, spacing: 8) {
            Text(LibraryRelativeFormatter.compact(item.createdAt))
                .font(WSFont.sans(11, weight: .semibold))
                .foregroundStyle(WSColor.duoText.opacity(0.55))

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(WSColor.duoText.opacity(0.4))
                .padding(6)
                .background(
                    Circle()
                        .fill(WSColor.backgroundElevated)
                        .overlay(Circle().stroke(WSColor.duoBorder, lineWidth: 2))
                )
        }
    }
}

// MARK: - Chip row

struct LibraryChipRow: View {
    let chips: [LibraryMetaChip]
    var tint: Color = WSColor.duoPurple

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(chips) { chip in
                    HStack(spacing: 4) {
                        Image(systemName: chip.icon)
                            .font(.system(size: 9, weight: .bold))
                        Text(chip.label)
                            .font(WSFont.sans(11, weight: .semibold))
                    }
                    .foregroundStyle(tint)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(tint.opacity(0.10))
                            .overlay(Capsule().stroke(tint.opacity(0.25), lineWidth: 1))
                    )
                }
            }
        }
    }
}

// MARK: - Featured hero card

struct LibraryHeroFeaturedCard: View {
    let item: LibraryItem
    var onTap: () -> Void

    private var accentColor: Color {
        switch item.kind {
        case .studyPack:     return WSColor.duoPurple
        case .essayAnalysis: return WSColor.duoBlue
        case .document:      return WSColor.duoOrange
        }
    }

    var body: some View {
        Button(action: {
            Haptics.medium()
            onTap()
        }) {
            ZStack(alignment: .topLeading) {
                accentColor

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("CONTINUE")
                            .font(WSFont.sans(9, weight: .black))
                            .tracking(0.7)
                            .foregroundStyle(.white.opacity(0.85))
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Color.white.opacity(0.22)))
                        Spacer()
                        ZStack {
                            Circle().fill(Color.white.opacity(0.20)).frame(width: 42, height: 42)
                            Image(systemName: item.kind.icon)
                                .font(.system(size: 18, weight: .heavy))
                                .foregroundStyle(.white)
                        }
                    }

                    Text(item.title)
                        .wsHeadline(.medium, weight: .black)
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                        .padding(.top, 2)

                    if let subtitle = item.subtitle {
                        Text(subtitle)
                            .wsBody(.small, weight: .semibold)
                            .foregroundStyle(.white.opacity(0.80))
                    }

                    if !item.chips.isEmpty {
                        HStack(spacing: 6) {
                            ForEach(item.chips.prefix(3)) { chip in
                                HStack(spacing: 4) {
                                    Image(systemName: chip.icon).font(.system(size: 9, weight: .bold))
                                    Text(chip.label)
                                        .font(WSFont.sans(10, weight: .bold))
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(Capsule().fill(Color.white.opacity(0.20)))
                            }
                        }
                        .padding(.top, 4)
                    }

                    HStack(spacing: 6) {
                        Image(systemName: "arrow.right.circle.fill")
                        Text("Open")
                            .font(WSFont.sans(12, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(Color.white.opacity(0.22)))
                    .padding(.top, 6)
                }
                .padding(18)
            }
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(Color.white.opacity(0.20), lineWidth: 1)
            )
            .shadow(color: accentColor.opacity(0.40), radius: 20, y: 10)
        }
        .buttonStyle(LibraryCardPressStyle())
    }
}

// MARK: - Press style (chunky bouncy press)

private struct LibraryCardPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .offset(y: configuration.isPressed ? 3 : 0)
            .animation(.wsBounceTight, value: configuration.isPressed)
    }
}

// MARK: - Previews

#Preview("Standard card") {
    VStack(spacing: 12) {
        LibraryItemCard(
            item: LibraryItem(
                kind: .studyPack,
                title: "Photosynthesis & Cell Respiration",
                subtitle: "AP Biology · Chapter 9",
                snippet: "The light-dependent reactions take place in the thylakoid membrane and produce ATP and NADPH from sunlight, water, and ADP...",
                chips: [
                    .init(icon: "checkmark.bubble.fill", label: "Quiz · 12 qs"),
                    .init(icon: "rectangle.on.rectangle.angled.fill", label: "18 cards")
                ],
                isPinned: true
            ),
            onTap: {}, onPinToggle: {}, onDelete: {}
        )
        LibraryItemCard(
            item: LibraryItem(
                kind: .essayAnalysis,
                title: "The Great Gatsby and the American Dream",
                subtitle: "AP English",
                snippet: "Fitzgerald's portrayal of Gatsby's pursuit of Daisy mirrors the broader disillusionment of the Jazz Age...",
                chips: [
                    .init(icon: "rosette", label: "B+"),
                    .init(icon: "textformat", label: "1,240 words")
                ]
            ),
            onTap: {}, onPinToggle: {}, onDelete: {}
        )
    }
    .padding()
}

#Preview("Hero featured") {
    LibraryHeroFeaturedCard(
        item: LibraryItem(
            kind: .studyPack,
            title: "Photosynthesis & Cell Respiration",
            subtitle: "AP Biology · Chapter 9",
            chips: [
                .init(icon: "checkmark.bubble.fill", label: "Quiz · 12 qs"),
                .init(icon: "rectangle.on.rectangle.angled.fill", label: "18 cards")
            ]
        ),
        onTap: {}
    )
    .padding()
    .frame(maxHeight: .infinity)
    .background(WSColor.duoSurface)
}
