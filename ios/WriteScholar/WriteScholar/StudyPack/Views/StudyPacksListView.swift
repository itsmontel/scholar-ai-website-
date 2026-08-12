//
//  StudyPacksListView.swift
//  WriteScholar
//
//  Prototype screen #3 — the Study Packs list:
//
//    ‹  Study Packs
//    [🔍 Search packs…]
//    (All) Notes Flashcards Quizzes
//    ┌───────────────────────────────┐
//    │ 🎓 Biology Midterm Pack       │
//    │    24 cards · 3 quizzes · 2d  │
//    │    ▰▰▰▰▱▱▱▱▱          45%     │
//    └───────────────────────────────┘
//    …                    [+ New pack]
//
//  Rows read straight from LibraryStore (.studyPack items); the progress
//  bar is LibraryItem.progress, kept fresh by StudyPackProgressStore.
//

import SwiftUI

struct StudyPacksListView: View {
    /// Open a saved pack (already loaded from disk).
    var onOpen: (StudyPack, String) -> Void
    /// Jump to the pack creator.
    var onNewPack: () -> Void

    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var library = LibraryStore.shared

    @State private var searchText = ""
    @State private var filter = "All"
    @State private var missingPackAlert = false

    private let filters = ["All", "Notes", "Flashcards", "Quizzes"]

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    header.wsStaggerEntry(0)
                    WSSearchField(placeholder: "Search packs…", text: $searchText)
                        .wsStaggerEntry(1)
                    WSSegmentedPills(options: filters, selection: $filter, tint: WSColor.duoPurple)
                        .wsStaggerEntry(2)

                    if packs.isEmpty {
                        emptyState.wsStaggerEntry(3)
                    } else if visiblePacks.isEmpty {
                        noResults.wsStaggerEntry(3)
                    } else {
                        VStack(spacing: 12) {
                            ForEach(Array(visiblePacks.enumerated()), id: \.element.id) { (i, item) in
                                packRow(item)
                                    .wsStaggerEntry(min(i, 8) + 3)
                            }
                        }
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)
                .padding(.bottom, 100)   // clear the floating pill
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .overlay(alignment: .bottomTrailing) { newPackPill }
        .alert("Pack not on this device", isPresented: $missingPackAlert) {
            Button("New pack") { onNewPack() }
            Button("OK", role: .cancel) {}
        } message: {
            Text("This pack's content isn't stored on this device anymore. Generate it again to keep studying.")
        }
    }

    // MARK: - Header (‹ + centered title)

    private var header: some View {
        HStack {
            Button {
                Haptics.light()
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .frame(width: 38, height: 38)
                    .background(
                        Circle()
                            .fill(WSColor.backgroundElevated)
                            .shadow(color: Color.black.opacity(0.05), radius: 5, y: 2)
                    )
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Back")

            Spacer()
            Text("Study Packs")
                .wsHeadline(.medium, weight: .black)
                .foregroundStyle(WSColor.foreground)
            Spacer()

            // Invisible twin keeps the title optically centered.
            Color.clear.frame(width: 38, height: 38)
        }
        .padding(.top, 6)
    }

    // MARK: - Rows

    private var packs: [LibraryItem] {
        library.items
            .filter { $0.kind == .studyPack }
            .sorted { ($0.lastOpenedAt ?? $0.createdAt) > ($1.lastOpenedAt ?? $1.createdAt) }
    }

    private var visiblePacks: [LibraryItem] {
        packs.filter { item in
            matchesFilter(item) && matchesSearch(item)
        }
    }

    private func matchesFilter(_ item: LibraryItem) -> Bool {
        switch filter {
        case "Notes":      return item.chips.contains { $0.icon == "book.pages.fill" }
        case "Flashcards": return item.chips.contains { $0.icon == "rectangle.on.rectangle.angled.fill" }
        case "Quizzes":    return item.chips.contains { $0.icon == "checkmark.bubble.fill" }
        default:           return true
        }
    }

    private func matchesSearch(_ item: LibraryItem) -> Bool {
        let q = searchText.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return true }
        return item.title.localizedCaseInsensitiveContains(q)
            || (item.snippet?.localizedCaseInsensitiveContains(q) ?? false)
    }

    private func packRow(_ item: LibraryItem) -> some View {
        Button {
            guard let pack = StudyPackPersistence.shared.loadPack(for: item.id) else {
                Haptics.warning()
                missingPackAlert = true
                return
            }
            Haptics.medium()
            library.markOpened(item.id)
            onOpen(pack, item.id)
        } label: {
            WSListRowCard(icon: "graduationcap.fill",
                          iconTint: WSColor.duoPurple,
                          title: item.title,
                          subtitle: rowMeta(item),
                          progress: item.progress ?? 0,
                          progressTint: WSColor.duoPurple)
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    /// "24 cards · Quiz · 12 qs · Edited 2d ago"
    private func rowMeta(_ item: LibraryItem) -> String {
        var parts = item.chips.prefix(2).map(\.label)
        parts.append("Edited \(LibraryRelativeFormatter.compact(item.lastOpenedAt ?? item.createdAt))")
        return parts.joined(separator: " · ")
    }

    // MARK: - Empty / no-results states

    private var emptyState: some View {
        VStack(spacing: 14) {
            WSMascotHero(asset: "mascot-paper", size: 120, haloTint: WSColor.duoPurple)
            Text("No packs yet")
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.foreground)
            Text("Paste your notes and we'll turn them into a lesson, flashcards, a quiz and games.")
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
            Button {
                Haptics.medium()
                onNewPack()
            } label: {
                Text("Make my first pack")
            }
            .buttonStyle(WSDuoPrimaryButtonStyle())
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 34)
    }

    private var noResults: some View {
        VStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 26, weight: .bold))
                .foregroundStyle(WSColor.foregroundMuted.opacity(0.5))
            Text("No packs match")
                .wsBody(.large, weight: .bold)
                .foregroundStyle(WSColor.foreground)
            Text("Try a different search or filter.")
                .wsBody(.small)
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 40)
    }

    // MARK: - Floating "+ New pack"

    private var newPackPill: some View {
        Button {
            Haptics.medium()
            onNewPack()
        } label: {
            HStack(spacing: 7) {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .black))
                Text("New pack")
                    .font(WSFont.sans(15, weight: .black))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(
                Capsule()
                    .fill(WSColor.duoPurple)
                    .shadow(color: WSColor.duoPurple.opacity(0.4), radius: 12, y: 5)
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
        .padding(.trailing, 18)
        .padding(.bottom, 22)
        .accessibilityLabel("New pack")
    }
}

#Preview {
    StudyPacksListView(onOpen: { _, _ in }, onNewPack: {})
}
