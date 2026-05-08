//
//  LibraryItemCard.swift
//  WriteScholar
//
//  The card rendered for every row in the Library list. Three visual
//  variants are dispatched off `item.kind`:
//
//    • Study Pack    — violet brand stripe, graduation icon, chips for
//                       quiz/flashcard/lesson counts.
//    • Essay Analysis — indigo stripe, doc-magnifier icon, grade chip.
//    • Document       — amber stripe, file icon, page-count chip.
//
//  All three share the same skeleton (icon · title block · chevron) so
//  the user gets a consistent rhythm scrolling through a mixed list.
//
//  The pinned variant promotes a card with a thicker tinted border + a
//  small "PINNED" badge in the corner.
//
//  The "featured hero" variant (used for the most-recent-item splash on
//  the Library landing) renders on a full kind-gradient with white text
//  and lives in `LibraryHeroFeaturedCard` below.
//

import SwiftUI

// MARK: - Standard list card

struct LibraryItemCard: View {
    let item: LibraryItem
    var onTap: () -> Void
    var onPinToggle: () -> Void
    var onDelete: () -> Void

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
        ZStack(alignment: .top) {
            // Chunky bottom lip in the kind tint
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(item.kind.tint.opacity(item.isPinned ? 0.45 : 0.22))
                .padding(.top, item.isPinned ? 6 : 5)
                .padding(.horizontal, 1)

            // Top face
            HStack(alignment: .top, spacing: 0) {
                Rectangle()
                    .fill(item.kind.tint)
                    .frame(width: 4)

                HStack(alignment: .top, spacing: 14) {
                    iconBlock
                    contentBlock
                    Spacer(minLength: 0)
                    trailingBlock
                }
                .padding(14)
            }
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(WSColor.backgroundElevated)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(item.isPinned ? item.kind.tint.opacity(0.55) : WSColor.hairline,
                            lineWidth: item.isPinned ? 1.5 : 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .compositingGroup()
        .shadow(color: item.kind.tint.opacity(item.isPinned ? 0.20 : 0.08),
                radius: item.isPinned ? 14 : 8,
                y: item.isPinned ? 6 : 3)
    }

    // MARK: - Icon block

    private var iconBlock: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(
                    LinearGradient(colors: item.kind.heroGradient,
                                   startPoint: .topLeading, endPoint: .bottomTrailing)
                )
                .frame(width: 52, height: 52)
                .shadow(color: item.kind.tint.opacity(0.30), radius: 8, y: 3)

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
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundStyle(item.kind.tint)
                    .tracking(0.6)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(item.kind.tint.opacity(0.13)))

                if item.isPinned {
                    Label("PINNED", systemImage: "pin.fill")
                        .labelStyle(.titleAndIcon)
                        .font(.system(size: 8, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.foregroundMuted)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(WSColor.surface))
                }

                if item.source == .web {
                    HStack(spacing: 3) {
                        Image(systemName: "globe").font(.system(size: 8, weight: .bold))
                        Text("WEB")
                            .font(.system(size: 8, weight: .black, design: .rounded))
                    }
                    .foregroundStyle(Color(hex: 0x10B981))
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(Color(hex: 0x10B981).opacity(0.14)))
                }

                // Brand-new badge for items created in the last 30 minutes.
                // Gives the library a bit of life right after a fresh pack
                // generation without permanently cluttering the row.
                if Date().timeIntervalSince(item.createdAt) < 30 * 60 {
                    HStack(spacing: 3) {
                        Image(systemName: "sparkles").font(.system(size: 8, weight: .bold))
                        Text("NEW")
                            .font(.system(size: 8, weight: .black, design: .rounded))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 7)
                    .padding(.vertical, 3)
                    .background(
                        Capsule().fill(
                            LinearGradient(colors: [Color(hex: 0xF59E0B), Color(hex: 0xEF4444)],
                                           startPoint: .leading, endPoint: .trailing)
                        )
                    )
                    .shadow(color: Color(hex: 0xF59E0B).opacity(0.4), radius: 4, y: 1)
                }
            }

            Text(item.title)
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(WSColor.foreground)
                .lineLimit(2)
                .multilineTextAlignment(.leading)

            if let subtitle = item.subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }

            if let snippet = item.snippet, !snippet.isEmpty {
                Text(snippet)
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted.opacity(0.85))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .padding(.top, 1)
            }

            if !item.chips.isEmpty {
                LibraryChipRow(chips: item.chips, tint: item.kind.tint)
                    .padding(.top, 6)
            }
        }
    }

    // MARK: - Trailing block

    private var trailingBlock: some View {
        VStack(alignment: .trailing, spacing: 8) {
            Text(LibraryRelativeFormatter.compact(item.createdAt))
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(WSColor.foregroundMuted)

            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(WSColor.foregroundMuted)
                .padding(6)
                .background(Circle().fill(WSColor.surface))
        }
    }
}

// MARK: - Chip row

/// Horizontal scrolling row of metadata chips. Stays inside the card so
/// long lists of chips don't break the layout.
struct LibraryChipRow: View {
    let chips: [LibraryMetaChip]
    var tint: Color = WSColor.brandPrimary

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(chips) { chip in
                    HStack(spacing: 4) {
                        Image(systemName: chip.icon)
                            .font(.system(size: 9, weight: .bold))
                        Text(chip.label)
                            .font(.system(size: 11, weight: .semibold, design: .rounded))
                    }
                    .foregroundStyle(tint)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(tint.opacity(0.10))
                            .overlay(Capsule().stroke(tint.opacity(0.22), lineWidth: 0.5))
                    )
                }
            }
        }
    }
}

// MARK: - Featured hero card

/// Big splash card highlighting the most-recent item. Shown above the
/// list when `mostRecent` is non-nil. Tapping behaves like the regular
/// card but on a richer canvas.
struct LibraryHeroFeaturedCard: View {
    let item: LibraryItem
    var onTap: () -> Void

    var body: some View {
        Button(action: {
            Haptics.medium()
            onTap()
        }) {
            ZStack(alignment: .topLeading) {
                LinearGradient(
                    colors: item.kind.heroGradient,
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                // Decorative starburst dots
                Canvas { ctx, size in
                    for i in 0..<14 {
                        let x = (sin(Double(i) * 6.31) + 1) / 2 * size.width
                        let y = (cos(Double(i) * 4.21) + 1) / 2 * size.height
                        ctx.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: 2, height: 2)),
                            with: .color(.white.opacity(0.45))
                        )
                    }
                }
                .allowsHitTesting(false)

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("CONTINUE")
                            .font(.system(size: 9, weight: .black, design: .rounded))
                            .tracking(0.7)
                            .foregroundStyle(.white.opacity(0.85))
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Color.white.opacity(0.20)))
                        Spacer()
                        ZStack {
                            Circle().fill(Color.white.opacity(0.18)).frame(width: 42, height: 42)
                            Image(systemName: item.kind.icon)
                                .font(.system(size: 18, weight: .heavy))
                                .foregroundStyle(.white)
                        }
                    }

                    Text(item.title)
                        .wsHeadline(.medium, weight: .bold)
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
                                        .font(.system(size: 10, weight: .bold, design: .rounded))
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(Capsule().fill(Color.white.opacity(0.18)))
                            }
                        }
                        .padding(.top, 4)
                    }

                    HStack(spacing: 6) {
                        Image(systemName: "arrow.right.circle.fill")
                        Text("Open")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
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
            .shadow(color: item.kind.tint.opacity(0.40), radius: 20, y: 10)
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
                snippet: "The light-dependent reactions take place in the thylakoid membrane and produce ATP and NADPH from sunlight, water, and ADP…",
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
                snippet: "Fitzgerald's portrayal of Gatsby's pursuit of Daisy mirrors the broader disillusionment of the Jazz Age…",
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
    .background(WSColor.background)
}
