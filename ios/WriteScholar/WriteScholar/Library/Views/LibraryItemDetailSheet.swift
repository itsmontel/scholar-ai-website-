//
//  LibraryItemDetailSheet.swift
//  WriteScholar
//
//  The full sheet shown when a library card is tapped. Surfaces:
//
//    • A kind-tinted hero with the title and metadata chips
//    • Snippet preview (first 1k chars of the source content)
//    • Quick actions (Open · Share · Pin · Delete · Open on web)
//    • Provenance card (when this was created, where it was synced from)
//    • Tags (sample data uses these — placeholder for upcoming Folders)
//
//  The sheet doesn't try to actually re-render the full study pack /
//  essay analysis. That'll come in a future pass when the per-kind deep
//  links land.
//

import SwiftUI

struct LibraryItemDetailSheet: View {
    let item: LibraryItem
    var onOpenSource: () -> Void = {}
    var onPinToggle:  () -> Void = {}
    var onDelete:     () -> Void = {}

    @Environment(\.dismiss) private var dismiss

    @State private var showDeleteConfirm = false

    var body: some View {
        NavigationStack {
            ZStack {
                WSGradient.heroBackdrop.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        heroBlock
                        actionsRow
                        if let snippet = item.snippet, !snippet.isEmpty {
                            snippetCard(snippet)
                        }
                        provenanceCard
                        if !item.tags.isEmpty { tagsCard }
                        Spacer(minLength: 12)
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 14)
                    .padding(.bottom, 32)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Menu {
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
                            showDeleteConfirm = true
                        } label: {
                            Label("Remove from library", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .foregroundStyle(WSColor.foreground)
                    }
                }
            }
            .alert("Remove from library?", isPresented: $showDeleteConfirm) {
                Button("Remove", role: .destructive) {
                    onDelete()
                    dismiss()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This won't delete the original — just removes it from your library shelf.")
            }
        }
    }

    // MARK: - Hero block

    private var heroBlock: some View {
        VStack(alignment: .leading, spacing: 14) {
            ZStack(alignment: .topLeading) {
                LinearGradient(colors: item.kind.heroGradient,
                               startPoint: .topLeading, endPoint: .bottomTrailing)

                Canvas { ctx, size in
                    for i in 0..<16 {
                        let x = (sin(Double(i) * 6.31) + 1) / 2 * size.width
                        let y = (cos(Double(i) * 4.21) + 1) / 2 * size.height
                        ctx.fill(
                            Path(ellipseIn: CGRect(x: x, y: y, width: 2, height: 2)),
                            with: .color(.white.opacity(0.50))
                        )
                    }
                }
                .allowsHitTesting(false)

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(item.kind.label.uppercased())
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .tracking(0.7)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Color.white.opacity(0.22)))
                        Spacer()
                        ZStack {
                            Circle().fill(Color.white.opacity(0.18)).frame(width: 50, height: 50)
                            Image(systemName: item.kind.icon)
                                .font(.system(size: 22, weight: .heavy))
                                .foregroundStyle(.white)
                        }
                    }

                    Text(item.title)
                        .wsHeadline(.medium, weight: .bold)
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.leading)
                        .padding(.top, 2)

                    if let subtitle = item.subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .wsBody(.small, weight: .semibold)
                            .foregroundStyle(.white.opacity(0.85))
                    }

                    if !item.chips.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(item.chips) { chip in
                                    HStack(spacing: 4) {
                                        Image(systemName: chip.icon).font(.system(size: 10, weight: .bold))
                                        Text(chip.label)
                                            .font(.system(size: 11, weight: .bold, design: .rounded))
                                    }
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Capsule().fill(Color.white.opacity(0.22)))
                                }
                            }
                        }
                        .padding(.top, 4)
                    }
                }
                .padding(18)
            }
            .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(Color.white.opacity(0.18), lineWidth: 1)
            )
            .shadow(color: item.kind.tint.opacity(0.40), radius: 18, y: 8)
        }
    }

    // MARK: - Actions row

    private var actionsRow: some View {
        HStack(spacing: 10) {
            actionTile(
                icon: "arrow.up.right.square.fill",
                label: openLabel,
                tint: item.kind.tint,
                primary: true
            ) {
                onOpenSource()
                dismiss()
            }

            actionTile(
                icon: item.isPinned ? "pin.slash.fill" : "pin.fill",
                label: item.isPinned ? "Unpin" : "Pin",
                tint: WSColor.brandPrimary
            ) {
                onPinToggle()
            }

            ShareLink(item: shareText) {
                actionTileLabel(icon: "square.and.arrow.up.fill", label: "Share", tint: Color(hex: 0x10B981))
            }
            .buttonStyle(.plain)
        }
    }

    private var openLabel: String {
        switch item.kind {
        case .studyPack:     return "Open pack"
        case .essayAnalysis: return "Open essay"
        case .document:      return "Open file"
        }
    }

    private var shareText: String {
        var parts: [String] = ["\(item.kind.label): \(item.title)"]
        if let subtitle = item.subtitle { parts.append(subtitle) }
        if let snippet = item.snippet { parts.append(snippet) }
        parts.append("Made with WriteScholar")
        return parts.joined(separator: "\n\n")
    }

    private func actionTile(icon: String, label: String, tint: Color, primary: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: {
            Haptics.medium()
            action()
        }) {
            actionTileLabel(icon: icon, label: label, tint: tint, primary: primary)
        }
        .buttonStyle(.plain)
    }

    private func actionTileLabel(icon: String, label: String, tint: Color, primary: Bool = false) -> some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 17, weight: .heavy))
                .foregroundStyle(primary ? .white : tint)
            Text(label)
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(primary ? .white : WSColor.foreground)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(primary ? AnyShapeStyle(LinearGradient(colors: item.kind.heroGradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                              : AnyShapeStyle(WSColor.backgroundElevated))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(primary ? Color.white.opacity(0.15) : tint.opacity(0.20), lineWidth: 1)
                )
                .shadow(color: tint.opacity(primary ? 0.30 : 0.10), radius: primary ? 10 : 4, y: primary ? 4 : 1)
        )
    }

    // MARK: - Snippet card

    private func snippetCard(_ snippet: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: "text.alignleft")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(item.kind.tint)
                Text("Preview")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Text(snippet)
                .wsBody(.medium)
                .foregroundStyle(WSColor.foreground)
                .multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .wsCard(elevation: .low)
    }

    // MARK: - Provenance

    private var provenanceCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "info.circle.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
                Text("Details")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }

            provenanceRow(icon: "calendar", label: "Created", value: LibraryRelativeFormatter.long(item.createdAt))
            if let opened = item.lastOpenedAt {
                provenanceRow(icon: "eye.fill", label: "Last opened", value: LibraryRelativeFormatter.long(opened))
            }
            provenanceRow(icon: item.source.icon, label: "Source", value: item.source.label)
            if item.serverID != nil {
                provenanceRow(icon: "checkmark.icloud.fill", label: "Sync", value: "Available on writescholar.com")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .wsCard(elevation: .low)
    }

    private func provenanceRow(icon: String, label: String, value: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .frame(width: 18)
                .foregroundStyle(item.kind.tint)
                .font(.system(size: 13, weight: .bold))
            Text(label)
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(width: 90, alignment: .leading)
            Text(value)
                .wsBody(.caption)
                .foregroundStyle(WSColor.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Tags

    private var tagsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "tag.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(WSColor.brandPrimary)
                Text("Tags")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            FlowingTagRow(tags: item.tags, tint: item.kind.tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .wsCard(elevation: .low)
    }
}

// MARK: - Flowing tag row

/// Simple wrapping tag row. Falls back to a horizontal scroller for very
/// long tag lists so the layout never breaks.
private struct FlowingTagRow: View {
    let tags: [String]
    let tint: Color

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(tags, id: \.self) { tag in
                    Text(tag.hasPrefix("#") ? tag : "#\(tag)")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(tint)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 4)
                        .background(
                            Capsule()
                                .fill(tint.opacity(0.10))
                                .overlay(Capsule().stroke(tint.opacity(0.25), lineWidth: 0.5))
                        )
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    LibraryItemDetailSheet(
        item: LibraryItem(
            kind: .studyPack,
            title: "Photosynthesis & Cell Respiration",
            subtitle: "AP Biology · Chapter 9",
            snippet: "The light-dependent reactions take place in the thylakoid membrane and produce ATP and NADPH from sunlight, water, and ADP. The Calvin cycle then uses that ATP to fix CO2 into glucose…",
            chips: [
                .init(icon: "checkmark.bubble.fill", label: "Quiz · 12 qs"),
                .init(icon: "rectangle.on.rectangle.angled.fill", label: "18 cards"),
                .init(icon: "book.pages.fill", label: "Lesson · 6 slides")
            ],
            tags: ["#sample", "biology"]
        )
    )
}
