//
//  LibraryEmptyState.swift
//  WriteScholar
//
//  The friendly screen the user lands on when:
//    • their library has no entries at all (first run, post-clear)
//    • or their current filter / search query returned zero results
//
//  Two surfaces:
//    • LibraryEmptyState        — the full hero, mascot + 3 CTAs
//    • LibraryFilteredEmptyState — slim "no matches" tile shown inside
//                                  the list when a filter or search
//                                  returns nothing but other items exist
//

import SwiftUI

// MARK: - Full empty state

struct LibraryEmptyState: View {
    /// Forwarded to MainTabView so the CTAs can switch tabs.
    var onCreateStudyPack: () -> Void
    /// Kept for backwards-compat with older call sites — essay analysis
    /// is desktop-only, so this is currently unused on mobile.
    var onAnalyzeEssay:    () -> Void = {}
    var onUploadDoc:       () -> Void

    var body: some View {
        VStack(spacing: 18) {
            heroMascot

            VStack(spacing: 8) {
                Text("Your library is empty")
                    .wsHeadline(.large, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .multilineTextAlignment(.center)

                Text("Everything you build in WriteScholar — study packs, uploaded notes, and essays from the web app — all lands here automatically.")
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }

            VStack(spacing: 10) {
                ctaCard(
                    kind: .studyPack,
                    title: "Generate a study pack",
                    subtitle: "Paste notes → quiz, flashcards, lesson, games."
                ) { onCreateStudyPack() }

                ctaCard(
                    kind: .document,
                    title: "Upload a document",
                    subtitle: "PDFs, slides, photos of your notes."
                ) { onUploadDoc() }
            }
            .padding(.top, 4)

            footerHint
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 28)
    }

    // MARK: - Hero mascot

    private var heroMascot: some View {
        ZStack {
            // Concentric brand orbs behind the mascot
            Circle()
                .fill(
                    RadialGradient(
                        colors: [WSColor.brandPrimary.opacity(0.30), .clear],
                        center: .center,
                        startRadius: 8,
                        endRadius: 130
                    )
                )
                .frame(width: 240, height: 240)
                .blur(radius: 12)

            Circle()
                .fill(WSColor.backgroundElevated)
                .frame(width: 130, height: 130)
                .overlay(
                    Circle().stroke(WSColor.brandPrimary.opacity(0.30), lineWidth: 2)
                )
                .shadow(color: WSColor.brandPrimary.opacity(0.20), radius: 18, y: 8)

            WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                .frame(width: 110, height: 110)
        }
        .padding(.top, 12)
    }

    // MARK: - CTA card

    private func ctaCard(kind: LibraryItemKind, title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: {
            Haptics.medium()
            action()
        }) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(
                            LinearGradient(colors: kind.heroGradient,
                                           startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 44, height: 44)
                        .shadow(color: kind.tint.opacity(0.30), radius: 6, y: 2)
                    Image(systemName: kind.icon)
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                    Text(subtitle)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
                Image(systemName: "arrow.right.circle.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(kind.tint)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(kind.tint.opacity(0.18), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Footer

    private var footerHint: some View {
        HStack(spacing: 8) {
            Image(systemName: "globe")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Color(hex: 0x10B981))
            Text("Items synced from writescholar.com will show up here too.")
                .wsBody(.caption)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.leading)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color(hex: 0x10B981).opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color(hex: 0x10B981).opacity(0.25), lineWidth: 1)
                )
        )
        .padding(.top, 6)
        .padding(.horizontal, 6)
    }
}

// MARK: - Filtered empty state

/// Smaller empty state shown when a filter or search query returns no
/// matches but the library itself has other items in it.
struct LibraryFilteredEmptyState: View {
    let filter: LibraryFilter
    let query: String
    var onClear: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(filter.tint.opacity(0.14))
                    .frame(width: 80, height: 80)
                Image(systemName: filter == .all ? "magnifyingglass" : filter.icon)
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(filter.tint)
            }

            VStack(spacing: 4) {
                Text(headline)
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text(subhead)
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }

            Button {
                Haptics.light()
                onClear()
            } label: {
                Label("Clear filter", systemImage: "xmark.circle.fill")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Capsule().fill(filter.tint))
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .padding(.horizontal, 18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
        )
    }

    private var headline: String {
        if !query.isEmpty {
            return "Nothing matches \"\(query)\""
        }
        switch filter {
        case .all:        return "No items yet"
        case .studyPacks: return "No study packs yet"
        case .essays:     return "No essays yet"
        case .documents:  return "No documents yet"
        }
    }

    private var subhead: String {
        if !query.isEmpty {
            return "Try a different search term, or clear the filter to see everything in your library."
        }
        return "Anything you create or upload of this type will appear here."
    }
}

// MARK: - Previews

#Preview("Empty state") {
    LibraryEmptyState(
        onCreateStudyPack: {},
        onAnalyzeEssay: {},
        onUploadDoc: {}
    )
    .background(WSGradient.heroBackdrop)
}

#Preview("Filtered empty") {
    LibraryFilteredEmptyState(
        filter: .essays,
        query: "shakespeare",
        onClear: {}
    )
    .padding()
    .background(WSColor.background)
}
