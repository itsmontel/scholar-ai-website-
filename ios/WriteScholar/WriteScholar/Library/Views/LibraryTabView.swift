//
//  LibraryTabView.swift
//  WriteScholar
//
//  Top-level Library tab. Designed for *clarity* — a single column of
//  ideas the user can scan top → bottom without thinking:
//
//    1. Top bar           — "Library" title · sort menu · search button
//    2. Hero stat capsule — total count + a one-line subtitle (no
//                            separate filter chips above; the segmented
//                            control IS the filter UI)
//    3. Search bar        — slides in/out, native-looking
//    4. Segmented filter  — All / Packs / Essays / Docs (chunky pill,
//                            shows the count next to each label)
//    5. Continue card     — Big featured card for the most-recent item
//                            (only when filter == .all and no search)
//    6. Section list      — Today / Yesterday / This week / etc.
//    7. Empty state       — full LibraryEmptyState when nothing exists,
//                            or a slim LibraryFilteredEmptyState when
//                            the current slice is empty
//
//  All persistence + filtering lives in LibraryStore so this view stays
//  presentation-only.
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
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Multi-color brand orbs (indigo / blue / pink / purple) so
            // the Library tab pops the same way Home does.
            Circle()
                .fill(WSColor.brandPrimary.opacity(0.18))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: -200, y: -300)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0x6366F1).opacity(0.18))
                .frame(width: 320, height: 320)
                .blur(radius: 80)
                .offset(x: 220, y: -120)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0x60A5FA).opacity(0.14))
                .frame(width: 360, height: 360)
                .blur(radius: 90)
                .offset(x: -200, y: 320)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xD946EF).opacity(0.14))
                .frame(width: 320, height: 320)
                .blur(radius: 90)
                .offset(x: 220, y: 480)
                .ignoresSafeArea()

            // Faint sprinkle of dots, like settled confetti
            Canvas { ctx, size in
                for i in 0..<32 {
                    let seed = Double(i) * 137.508
                    let x = ((seed * 7).truncatingRemainder(dividingBy: 100)) / 100 * size.width
                    let y = ((seed * 3).truncatingRemainder(dividingBy: 100)) / 100 * size.height
                    let r = (seed.truncatingRemainder(dividingBy: 2)) + 1.2
                    ctx.fill(
                        Path(ellipseIn: CGRect(x: x, y: y, width: r * 2, height: r * 2)),
                        with: .color(.white.opacity(0.30))
                    )
                }
            }
            .ignoresSafeArea()
            .allowsHitTesting(false)

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
                // Pulsing indigo halo
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [Color(hex: 0x6366F1).opacity(0.55), .clear],
                            center: .center, startRadius: 8, endRadius: 110
                        )
                    )
                    .frame(width: 220, height: 220)
                    .blur(radius: 18)

                // Six sparkle satellites in cool tones
                ForEach(0..<6, id: \.self) { i in
                    let angle = Double(i) * (.pi * 2 / 6)
                    let radius: Double = 110
                    Image(systemName: i.isMultiple(of: 2) ? "sparkle" : "star.fill")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(librarySparkleColor(for: i))
                        .offset(x: CGFloat(cos(angle) * radius),
                                y: CGFloat(sin(angle) * radius))
                        .opacity(0.85)
                }

                WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                    .frame(width: 170, height: 170)
                    .shadow(color: Color(hex: 0x6366F1).opacity(0.45), radius: 22, y: 12)
                    .wsBobbing(amount: 6, duration: 2.6)
            }

            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "books.vertical.fill")
                        .font(.system(size: 11, weight: .heavy))
                    Text("LIBRARY")
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .tracking(0.8)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(LinearGradient(colors: [Color(hex: 0x818CF8), Color(hex: 0x4338CA)],
                                             startPoint: .topLeading, endPoint: .bottomTrailing))
                        .shadow(color: Color(hex: 0x6366F1).opacity(0.45), radius: 8, y: 3)
                )

                Text("Your ")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
                +
                Text("shelf")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [Color(hex: 0x60A5FA), Color(hex: 0x4338CA)],
                                       startPoint: .leading, endPoint: .trailing)
                    )
                +
                Text(" 📚")
                    .font(.system(size: 28, weight: .black, design: .rounded))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }

    private func librarySparkleColor(for i: Int) -> Color {
        let palette: [Color] = [
            Color(hex: 0x60A5FA),  // sky
            Color(hex: 0xA78BFA),  // lavender
            Color(hex: 0xFBBF24),  // gold
            Color(hex: 0xF472B6),  // pink
            Color(hex: 0x34D399),  // mint
            Color(hex: 0xFDA4AF),  // rose
        ]
        return palette[i % palette.count]
    }

    // MARK: - Top bar (utility row — search + sort)

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
                    Circle().fill(WSColor.backgroundElevated).frame(width: 38, height: 38)
                        .overlay(Circle().stroke(WSColor.hairline, lineWidth: 1))
                        .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
                    Image(systemName: "arrow.up.arrow.down")
                        .foregroundStyle(WSColor.foreground)
                        .font(.system(size: 14, weight: .heavy))
                }
            }
            .accessibilityLabel("Sort library")
        }
    }

    private func iconButton(systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack {
                Circle().fill(WSColor.backgroundElevated).frame(width: 38, height: 38)
                    .overlay(Circle().stroke(WSColor.hairline, lineWidth: 1))
                    .shadow(color: .black.opacity(0.05), radius: 4, y: 2)
                Image(systemName: systemImage)
                    .foregroundStyle(WSColor.foreground)
                    .font(.system(size: 14, weight: .heavy))
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Hero capsule
    //
    // A small, calm header that doesn't compete with the list. Just
    // shows total count + a one-line context line. No big mascot —
    // the list IS the hero.

    private var heroCapsule: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(WSGradient.brand)
                    .frame(width: 48, height: 48)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(.white.opacity(0.30), lineWidth: 1)
                    )
                    .shadow(color: WSColor.brandPrimary.opacity(0.40), radius: 8, y: 3)
                Image(systemName: "books.vertical.fill")
                    .foregroundStyle(.white)
                    .font(.system(size: 20, weight: .heavy))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("\(store.totalCount) item\(store.totalCount == 1 ? "" : "s")")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
                Text(heroSubtitle)
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            if let last = store.lastSyncedAt {
                HStack(spacing: 4) {
                    Circle().fill(Color(hex: 0x10B981)).frame(width: 6, height: 6)
                    Text("Synced \(LibraryRelativeFormatter.compact(last))")
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(verticalPadding: 14, accent: WSColor.brandPrimary)
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
                .foregroundStyle(WSColor.foregroundMuted)
                .font(.system(size: 14, weight: .heavy))
            TextField("Search titles, snippets, tags…", text: $store.searchQuery)
                .textFieldStyle(.plain)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .submitLabel(.search)
                .focused($searchFocused)
                .foregroundStyle(WSColor.foreground)
            if !store.searchQuery.isEmpty {
                Button {
                    Haptics.light()
                    store.searchQuery = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(WSColor.foregroundMuted)
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
                        .stroke(WSColor.brandPrimary.opacity(0.30), lineWidth: 1)
                )
        )
        .transition(.opacity.combined(with: .move(edge: .top)))
    }

    // MARK: - Segmented filter

    /// A single segmented control replaces the old "stat tile + filter
    /// chips" combo. One control, one source of truth, fewer taps.
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
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.05), radius: 6, y: 2)
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
                        .font(.system(size: 12, weight: .black, design: .rounded))
                }
                .foregroundStyle(active ? .white : WSColor.foreground)

                Text("\(count)")
                    .font(.system(size: 9, weight: .black, design: .rounded))
                    .foregroundStyle(active ? .white.opacity(0.85) : WSColor.foregroundMuted)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(
                Group {
                    if active {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(
                                LinearGradient(colors: [f.tint, f.tint.opacity(0.78)],
                                               startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            .shadow(color: f.tint.opacity(0.40), radius: 6, y: 2)
                    } else {
                        Color.clear
                    }
                }
            )
        }
        .buttonStyle(.plain)
    }

    /// Shorter labels so the segmented control fits on one line on
    /// every iPhone width.
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
                onAnalyzeEssay:    { onJumpToTab(.study) }, // essays are desktop-only
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
            // Featured "Continue" card — only when no slice is active
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

    private func sectionHeader(label: String, count: Int, icon: String? = nil, tint: Color = WSColor.foregroundMuted) -> some View {
        HStack(spacing: 8) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(tint)
            }
            Text(label.uppercased())
                .font(.system(size: 10, weight: .black, design: .rounded))
                .tracking(0.8)
                .foregroundStyle(tint == WSColor.foregroundMuted ? WSColor.foregroundMuted : tint)
            Rectangle()
                .fill(WSColor.hairline)
                .frame(height: 1)
            Text("\(count)")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundStyle(WSColor.foregroundMuted)
                .padding(.horizontal, 7)
                .padding(.vertical, 2)
                .background(Capsule().fill(WSColor.surface))
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
