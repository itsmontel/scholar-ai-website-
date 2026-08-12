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

    /// Tile tint — documents vary by file type (mockup: blue W for Word,
    /// red for PDF, yellow for a generic doc).
    private var accentColor: Color {
        switch item.kind {
        case .studyPack:     return WSColor.duoPurple
        case .essayAnalysis: return WSColor.duoBlue
        case .document:
            switch docExtension {
            case "pdf":          return WSColor.duoRed
            case "doc", "docx":  return WSColor.duoBlue
            default:             return WSColor.duoYellowDark
            }
        }
    }

    private var tileIcon: String {
        switch item.kind {
        case .studyPack:     return "graduationcap.fill"
        case .essayAnalysis: return "doc.text.magnifyingglass"
        case .document:
            switch docExtension {
            case "pdf":          return "doc.richtext.fill"
            case "doc", "docx":  return "doc.fill"
            default:             return "doc.plaintext.fill"
            }
        }
    }

    private var docExtension: String {
        (item.title as NSString).pathExtension.lowercased()
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

    // MARK: - Body (mockup row: pastel tile · title · one meta line · chevron)

    private var cardBody: some View {
        HStack(alignment: .center, spacing: 14) {
            iconBlock
            contentBlock
            Spacer(minLength: 8)
            trailingBlock
        }
        .wsChunkyCard(
            cornerRadius: 18,
            horizontalPadding: 14,
            verticalPadding: 14
        )
    }

    // MARK: - Icon block (pastel tile + saturated glyph)

    private var iconBlock: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(accentColor.opacity(0.14))
                .frame(width: 48, height: 48)

            Image(systemName: tileIcon)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(accentColor)
        }
        .overlay(alignment: .topTrailing) {
            if item.isPinned {
                Image(systemName: "pin.fill")
                    .font(.system(size: 8, weight: .black))
                    .foregroundStyle(.white)
                    .padding(4)
                    .background(Circle().fill(WSColor.duoOrange))
                    .offset(x: 5, y: -5)
            }
        }
    }

    // MARK: - Center content (title + single meta line)

    private var contentBlock: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(item.title)
                .wsBody(.large, weight: .bold)
                .foregroundStyle(WSColor.foreground)
                .lineLimit(1)
                .multilineTextAlignment(.leading)

            Text(metaLine)
                .wsBody(.small)
                .foregroundStyle(WSColor.foregroundMuted)
                .lineLimit(1)
        }
    }

    /// "Study Pack · 18 cards · Edited 2h ago" — the mockup's single
    /// muted meta line (kind + first chip + recency, web dot when synced).
    private var metaLine: String {
        var parts = [item.kind.label]
        if let chip = item.chips.first { parts.append(chip.label) }
        parts.append("Edited \(LibraryRelativeFormatter.compact(item.lastOpenedAt ?? item.createdAt))")
        if item.source == .web { parts.append("Web") }
        return parts.joined(separator: " · ")
    }

    // MARK: - Trailing block

    @ViewBuilder
    private var trailingBlock: some View {
        if let progress = item.progress {
            WSProgressRing(progress: progress, tint: accentColor, size: 42, lineWidth: 4.5)
        } else {
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(WSColor.foregroundMuted.opacity(0.6))
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
