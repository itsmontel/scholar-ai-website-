//
//  LibraryTabView.swift
//  WriteScholar
//
//  Top-level Library tab — Duolingo-style design.
//
//    1. Top bar           -- "Library" title + sort menu + search button
//    2. Hero stat capsule -- total count + a one-line subtitle
//    3. Search bar        -- slides in/out
//    4. Segmented filter  -- All / Packs / Essays / Docs
//    5. Continue card     -- Big featured card for the most-recent item
//    6. Section list      -- Today / Yesterday / This week / etc.
//    7. Empty state       -- full LibraryEmptyState when nothing exists
//

import SwiftUI

struct LibraryTabView: View {

    /// MainTabView passes this in so the empty-state CTAs can switch tab.
    /// Default no-op for previews.
    var onJumpToTab: (LibraryJumpDestination) -> Void = { _ in }

    @StateObject private var store = LibraryStore.shared

    @State private var showSearch:        Bool = false
    @State private var presentedItem:     LibraryItem? = nil
    @State private var deleteConfirmItem: LibraryItem? = nil
    @FocusState private var searchFocused: Bool

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16, pinnedViews: []) {
                    header
                    if showSearch { searchBar }
                    segmentedFilter
                    contentArea
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)
                .padding(.bottom, 96)
            }
            .scrollDismissesKeyboard(.interactively)
            .refreshable {
                store.lastSyncedAt = Date()
                Haptics.light()
            }

            newButton
        }
        .sheet(item: $presentedItem) { item in
            LibraryItemDetailSheet(
                item: item,
                onOpenSource: {
                    store.markOpened(item.id)
                    handleOpenSource(item)
                },
                onPinToggle: { store.togglePin(item.id) },
                onDelete:    { store.remove(item.id) }
            )
        }
        .alert("Remove from library?", isPresented: deleteConfirmIsPresented) {
            Button("Remove", role: .destructive) {
                if let id = deleteConfirmItem?.id { store.remove(id) }
                deleteConfirmItem = nil
            }
            Button("Cancel", role: .cancel) { deleteConfirmItem = nil }
        } message: {
            Text("This won't delete the original — just removes it from your library shelf.")
        }
    }

    // MARK: - Helpers

    private var deleteConfirmIsPresented: Binding<Bool> {
        Binding(
            get:  { deleteConfirmItem != nil },
            set:  { if !$0 { deleteConfirmItem = nil } }
        )
    }

    private func handleOpenSource(_ item: LibraryItem) {
        switch item.kind {
        case .studyPack:     onJumpToTab(.study)
        case .essayAnalysis: onJumpToTab(.study)
        case .document:      onJumpToTab(.study)
        }
    }

    // MARK: - Header ("My Stuff" + search + sort)

    private var header: some View {
        HStack(alignment: .center, spacing: 10) {
            Text("My Stuff")
                .wsHeadline(.large, weight: .black)
                .foregroundStyle(WSColor.foreground)
            Spacer()
            Button {
                Haptics.selection()
                withAnimation(.wsBouncePop) {
                    showSearch.toggle()
                    if !showSearch { store.searchQuery = "" }
                }
                if showSearch {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { searchFocused = true }
                }
            } label: {
                circleIcon(showSearch ? "xmark" : "magnifyingglass")
            }
            .buttonStyle(.plain)

            Menu {
                Picker("Sort", selection: $store.sort) {
                    ForEach(LibrarySort.allCases) { s in
                        Label(s.label, systemImage: s.icon).tag(s)
                    }
                }
            } label: {
                circleIcon("arrow.up.arrow.down")
            }
            .accessibilityLabel("Sort library")
        }
        .padding(.top, 2)
    }

    private func circleIcon(_ systemImage: String) -> some View {
        Image(systemName: systemImage)
            .font(.system(size: 15, weight: .bold))
            .foregroundStyle(WSColor.duoPurple)
            .frame(width: 42, height: 42)
            .background(
                Circle()
                    .fill(WSColor.backgroundElevated)
                    .shadow(color: Color.black.opacity(0.05), radius: 6, y: 2)
            )
    }

    // MARK: - Floating "New" button

    private var newButton: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                Button {
                    Haptics.medium()
                    onJumpToTab(.study)
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "plus").font(.system(size: 15, weight: .bold))
                        Text("New").wsBody(.medium, weight: .bold)
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 13)
                    .background(
                        Capsule()
                            .fill(WSColor.duoPurple)
                            .shadow(color: WSColor.duoPurple.opacity(0.4), radius: 10, y: 5)
                    )
                }
                .buttonStyle(.plain)
                .padding(.trailing, 18)
                .padding(.bottom, 18)
            }
        }
    }

    // MARK: - Search bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(WSColor.duoText.opacity(0.4))
                .font(.system(size: 14, weight: .heavy))
            TextField("Search titles, snippets, tags...", text: $store.searchQuery)
                .textFieldStyle(.plain)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .submitLabel(.search)
                .focused($searchFocused)
                .foregroundStyle(WSColor.duoText)
            if !store.searchQuery.isEmpty {
                Button {
                    Haptics.light()
                    store.searchQuery = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(WSColor.duoText.opacity(0.4))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(WSColor.duoPurple.opacity(0.40), lineWidth: 2)
                )
        )
        .transition(.opacity.combined(with: .move(edge: .top)))
    }

    // MARK: - Segmented filter

    private var segmentedFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(LibraryFilter.allCases) { f in
                    let active = store.filter == f
                    Button {
                        Haptics.selection()
                        withAnimation(.wsBouncePop) { store.filter = f }
                    } label: {
                        Text(filterShortLabel(f))
                            .wsBody(.small, weight: .bold)
                            .foregroundStyle(active ? .white : WSColor.foregroundMuted)
                            .padding(.vertical, 9)
                            .padding(.horizontal, 16)
                            .background(
                                Capsule()
                                    .fill(active ? segmentColor(for: f) : WSColor.backgroundElevated)
                                    .overlay(Capsule().stroke(WSColor.hairline, lineWidth: active ? 0 : 1))
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, 2)
        }
    }

    private func segmentColor(for f: LibraryFilter) -> Color {
        switch f {
        case .all:        return WSColor.duoPurple
        case .studyPacks: return WSColor.duoBlue
        case .essays:     return WSColor.duoOrange
        case .documents:  return WSColor.duoGreen
        }
    }

    private func filterShortLabel(_ f: LibraryFilter) -> String {
        switch f {
        case .all:        return "All"
        case .studyPacks: return "Packs"
        case .essays:     return "Essays"
        case .documents:  return "Docs"
        }
    }

    // MARK: - Content area

    @ViewBuilder
    private var contentArea: some View {
        if store.items.isEmpty {
            LibraryEmptyState(
                onCreateStudyPack: { onJumpToTab(.study) },
                onAnalyzeEssay:    { onJumpToTab(.study) },
                onUploadDoc:       { onJumpToTab(.study) }
            )
            .padding(.top, 6)
        } else if store.visibleItems.isEmpty {
            LibraryFilteredEmptyState(
                filter: store.filter,
                query: store.searchQuery
            ) {
                store.filter = .all
                store.searchQuery = ""
                if showSearch {
                    withAnimation(.wsBouncePop) { showSearch = false }
                }
            }
            .padding(.top, 6)
        } else {
            // Grouped list
            switch store.sort {
            case .recent:
                ForEach(store.visibleItemsByBucket, id: \.0) { (bucket, items) in
                    sectionHeader(label: bucket.rawValue, count: items.count)
                    itemList(items)
                }
            case .kind:
                ForEach(store.visibleItemsByKind, id: \.0) { (kind, items) in
                    sectionHeader(label: kind.pluralLabel,
                                  count: items.count,
                                  icon: kind.icon,
                                  tint: kind.tint)
                    itemList(items)
                }
            case .alphabetical, .oldest:
                itemList(store.visibleItems)
            }
        }
    }

    private func sectionHeader(label: String, count: Int, icon: String? = nil, tint: Color = WSColor.duoText) -> some View {
        HStack(spacing: 8) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(tint)
            }
            Text(label.uppercased())
                .font(WSFont.sans(10, weight: .black))
                .tracking(0.8)
                .foregroundStyle(tint == WSColor.duoText ? WSColor.duoText.opacity(0.55) : tint)
            Rectangle()
                .fill(WSColor.duoBorder)
                .frame(height: 2)
            Text("\(count)")
                .font(WSFont.sans(10, weight: .black))
                .foregroundStyle(WSColor.duoText.opacity(0.55))
                .padding(.horizontal, 7)
                .padding(.vertical, 2)
                .background(
                    Capsule()
                        .fill(WSColor.backgroundElevated)
                        .overlay(Capsule().stroke(WSColor.duoBorder, lineWidth: 2))
                )
        }
        .padding(.top, 8)
    }

    private func itemList(_ items: [LibraryItem]) -> some View {
        VStack(spacing: 10) {
            ForEach(items) { item in
                LibraryItemCard(
                    item: item,
                    onTap: {
                        store.markOpened(item.id)
                        presentedItem = item
                    },
                    onPinToggle: { store.togglePin(item.id) },
                    onDelete:    { deleteConfirmItem = item }
                )
            }
        }
    }
}

// MARK: - Cross-tab jump destination

/// Where the Library wants to send the user when they tap a CTA.
/// MainTabView translates each case into its corresponding `Tab`.
enum LibraryJumpDestination {
    case study
    case games
    case focus
}

// MARK: - Preview

#Preview {
    LibraryTabView()
}
