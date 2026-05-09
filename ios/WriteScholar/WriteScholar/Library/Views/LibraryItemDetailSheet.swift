//
//  LibraryItemDetailSheet.swift
//  WriteScholar
//
//  The full sheet shown when a library card is tapped — Duolingo-style
//  design. Surfaces:
//
//    * A kind-tinted hero with the title and metadata chips
//    * Snippet preview
//    * Quick actions (Open + Share + Pin + Delete + Open on web)
//    * Provenance card
//    * Tags
//

import SwiftUI

struct LibraryItemDetailSheet: View {
    let item: LibraryItem
    var onOpenSource: () -> Void = {}
    var onPinToggle:  () -> Void = {}
    var onDelete:     () -> Void = {}

    @Environment(\.dismiss) private var dismiss

    @State private var showDeleteConfirm = false

    private var accentColor: Color {
        switch item.kind {
        case .studyPack:     return WSColor.duoPurple
        case .essayAnalysis: return WSColor.duoBlue
        case .document:      return WSColor.duoOrange
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.duoSurface.ignoresSafeArea()

                VStack(spacing: 0) {
                    WSChunkyRibbon(color: accentColor)
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
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(WSColor.duoText.opacity(0.55))
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
                            .foregroundStyle(WSColor.duoText)
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
                accentColor

                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(item.kind.label.uppercased())
                            .font(WSFont.sans(10, weight: .black))
                            .tracking(0.7)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Color.white.opacity(0.22)))
                        Spacer()
                        ZStack {
                            Circle().fill(Color.white.opacity(0.20)).frame(width: 50, height: 50)
                            Image(systemName: item.kind.icon)
                                .font(.system(size: 22, weight: .heavy))
                                .foregroundStyle(.white)
                        }
                    }

                    Text(item.title)
                        .wsHeadline(.medium, weight: .black)
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
                                            .font(WSFont.sans(11, weight: .bold))
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
            .shadow(color: accentColor.opacity(0.40), radius: 18, y: 8)
        }
    }

    // MARK: - Actions row

    private var actionsRow: some View {
        HStack(spacing: 10) {
            actionTile(
                icon: "arrow.up.right.square.fill",
                label: openLabel,
                tint: accentColor,
                primary: true
            ) {
                onOpenSource()
                dismiss()
            }

            actionTile(
                icon: item.isPinned ? "pin.slash.fill" : "pin.fill",
                label: item.isPinned ? "Unpin" : "Pin",
                tint: WSColor.duoOrange
            ) {
                onPinToggle()
            }

            ShareLink(item: shareText) {
                actionTileLabel(icon: "square.and.arrow.up.fill", label: "Share", tint: WSColor.duoGreen)
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
                .font(WSFont.sans(11, weight: .bold))
                .foregroundStyle(primary ? .white : WSColor.duoText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            ZStack(alignment: .top) {
                // Chunky lip
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(primary ? tint.opacity(0.7) : WSColor.duoBorder)
                    .padding(.top, 4)
                    .padding(.horizontal, 1)
                // Top face
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(primary ? tint : WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(primary ? Color.clear : WSColor.duoBorder, lineWidth: 2)
                    )
            }
        )
    }

    // MARK: - Snippet card

    private func snippetCard(_ snippet: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: "text.alignleft")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(accentColor)
                Text("Preview")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
            }
            Text(snippet)
                .wsBody(.medium)
                .foregroundStyle(WSColor.duoText)
                .multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(accent: accentColor)
    }

    // MARK: - Provenance

    private var provenanceCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "info.circle.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(WSColor.duoBlue)
                Text("Details")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
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
        .wsChunkyCard(accent: WSColor.duoBlue)
    }

    private func provenanceRow(icon: String, label: String, value: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .frame(width: 18)
                .foregroundStyle(accentColor)
                .font(.system(size: 13, weight: .bold))
            Text(label)
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.duoText.opacity(0.55))
                .frame(width: 90, alignment: .leading)
            Text(value)
                .wsBody(.caption)
                .foregroundStyle(WSColor.duoText)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Tags

    private var tagsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "tag.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(WSColor.duoPurple)
                Text("Tags")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
            }
            FlowingTagRow(tags: item.tags, tint: accentColor)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(accent: WSColor.duoPurple)
    }
}

// MARK: - Flowing tag row

private struct FlowingTagRow: View {
    let tags: [String]
    let tint: Color

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(tags, id: \.self) { tag in
                    Text(tag.hasPrefix("#") ? tag : "#\(tag)")
                        .font(WSFont.sans(11, weight: .bold))
                        .foregroundStyle(tint)
                        .padding(.horizontal, 9)
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

// MARK: - Preview

#Preview {
    LibraryItemDetailSheet(
        item: LibraryItem(
            kind: .studyPack,
            title: "Photosynthesis & Cell Respiration",
            subtitle: "AP Biology · Chapter 9",
            snippet: "The light-dependent reactions take place in the thylakoid membrane and produce ATP and NADPH from sunlight, water, and ADP. The Calvin cycle then uses that ATP to fix CO2 into glucose...",
            chips: [
                .init(icon: "checkmark.bubble.fill", label: "Quiz · 12 qs"),
                .init(icon: "rectangle.on.rectangle.angled.fill", label: "18 cards"),
                .init(icon: "book.pages.fill", label: "Lesson · 6 slides")
            ],
            tags: ["#sample", "biology"]
        )
    )
}
