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
            WSColor.duoSurface.ignoresSafeArea()

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 18, pinnedViews: []) {
                    mascotHero
                    topBar
                    heroCapsule
                    if showSearch { searchBar }
                    segmentedFilter
                    contentArea
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
            .scrollDismissesKeyboard(.interactively)
            .refreshable {
                store.lastSyncedAt = Date()
                Haptics.light()
            }
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

    // MARK: - Mascot hero (Duolingo-energy header with mascot-laptop)

    private var mascotHero: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(WSColor.duoPurpleLight)
                    .frame(width: 180, height: 180)

                WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                    .frame(width: 140, height: 140)
                    .shadow(color: WSColor.duoPurple.opacity(0.30), radius: 16, y: 8)
                    .wsBobbing(amount: 6, duration: 2.6)
            }

            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "books.vertical.fill")
                        .font(.system(size: 11, weight: .heavy))
                    Text("LIBRARY")
                        .font(WSFont.sans(11, weight: .black))
                        .tracking(0.8)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(WSColor.duoPurple)
                        .shadow(color: WSColor.duoPurple.opacity(0.35), radius: 6, y: 3)
                )

                Text("Your ")
                    .font(WSFont.headline(28))
                    .foregroundStyle(WSColor.duoText)
                +
                Text("shelf")
                    .font(WSFont.headline(28))
                    .foregroundStyle(WSColor.duoBlue)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    // MARK: - Top bar (utility row -- search + sort)

    private var topBar: some View {
        HStack(spacing: 12) {
            Spacer()

            // Search toggle
            iconButton(systemImage: showSearch ? "xmark" : "magnifyingglass") {
                Haptics.selection()
                withAnimation(.wsBouncePop) {
                    showSearch.toggle()
                    if !showSearch { store.searchQuery = "" }
                }
                if showSearch {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { searchFocused = true }
                }
            }

            // Sort menu
            Menu {
                Picker("Sort", selection: $store.sort) {
                    ForEach(LibrarySort.allCases) { s in
                        Label(s.label, systemImage: s.icon).tag(s)
                    }
                }
            } label: {
                ZStack {
                    Circle().fill(WSColor.backgroundElevated).frame(width: 40, height: 40)
                        .overlay(Circle().stroke(WSColor.duoBorder, lineWidth: 2))
                    Image(systemName: "arrow.up.arrow.down")
                        .foregroundStyle(WSColor.duoText)
                        .font(.system(size: 14, weight: .heavy))
                }
            }
            .accessibilityLabel("Sort library")
        }
    }

    private func iconButton(systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack {
                Circle().fill(WSColor.backgroundElevated).frame(width: 40, height: 40)
                    .overlay(Circle().stroke(WSColor.duoBorder, lineWidth: 2))
                Image(systemName: systemImage)
                    .foregroundStyle(WSColor.duoText)
                    .font(.system(size: 14, weight: .heavy))
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Hero capsule

    private var heroCapsule: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(WSColor.duoPurple)
                    .frame(width: 48, height: 48)
                Image(systemName: "books.vertical.fill")
                    .foregroundStyle(.white)
                    .font(.system(size: 20, weight: .heavy))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("\(store.totalCount) item\(store.totalCount == 1 ? "" : "s")")
                    .font(WSFont.headline(18))
                    .foregroundStyle(WSColor.duoText)
                Text(heroSubtitle)
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
            }
            Spacer()
            if let last = store.lastSyncedAt {
                HStack(spacing: 4) {
                    Circle().fill(WSColor.duoGreen).frame(width: 6, height: 6)
                    Text("Synced \(LibraryRelativeFormatter.compact(last))")
                        .font(WSFont.sans(10, weight: .bold))
                        .foregroundStyle(WSColor.duoText.opacity(0.55))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: WSColor.duoPurple)
    }

    private var heroSubtitle: String {
        if store.totalCount == 0 { return "Generate your first study pack to begin." }
        let p = store.studyPackCount, e = store.essayCount, d = store.documentCount
        var parts: [String] = []
        if p > 0 { parts.append("\(p) pack\(p == 1 ? "" : "s")") }
        if e > 0 { parts.append("\(e) essay\(e == 1 ? "" : "s")") }
        if d > 0 { parts.append("\(d) doc\(d == 1 ? "" : "s")") }
        return parts.isEmpty ? "Just getting started." : parts.joined(separator: " · ")
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
        HStack(spacing: 0) {
            ForEach(LibraryFilter.allCases) { f in
                segmentedItem(f)
            }
        }
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(WSColor.duoBorder, lineWidth: 2)
                )
        )
    }

    private func segmentedItem(_ f: LibraryFilter) -> some View {
        let active = store.filter == f
        let count  = matchCount(for: f)
        return Button {
            Haptics.selection()
            withAnimation(.wsBouncePop) { store.filter = f }
        } label: {
            VStack(spacing: 2) {
                HStack(spacing: 5) {
                    Image(systemName: f.icon).font(.system(size: 11, weight: .heavy))
                    Text(filterShortLabel(f))
                        .font(WSFont.sans(12, weight: .black))
                }
                .foregroundStyle(active ? .white : WSColor.duoText)

                Text("\(count)")
                    .font(WSFont.sans(9, weight: .black))
                    .foregroundStyle(active ? .white.opacity(0.85) : WSColor.duoText.opacity(0.55))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(
                Group {
                    if active {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(segmentColor(for: f))
                    } else {
                        Color.clear
                    }
                }
            )
        }
        .buttonStyle(.plain)
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

    private func matchCount(for f: LibraryFilter) -> Int {
        store.items.filter { f.matches($0) }.count
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
            // Featured "Continue" card -- only when no slice is active
            if let mostRecent = store.mostRecent,
               store.sort == .recent,
               store.searchQuery.isEmpty,
               store.filter == .all {
                LibraryHeroFeaturedCard(item: mostRecent) {
                    store.markOpened(mostRecent.id)
                    presentedItem = mostRecent
                }
                .padding(.top, 4)
            }

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
