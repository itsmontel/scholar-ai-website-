//
//  LibraryEmptyState.swift
//  WriteScholar
//
//  The friendly Duolingo-style screen the user lands on when:
//    * their library has no entries at all (first run, post-clear)
//    * or their current filter / search query returned zero results
//
//  Two surfaces:
//    * LibraryEmptyState        -- the full hero, mascot + 3 CTAs
//    * LibraryFilteredEmptyState -- slim "no matches" tile
//

import SwiftUI

// MARK: - Full empty state

struct LibraryEmptyState: View {
    var onCreateStudyPack: () -> Void
    var onAnalyzeEssay:    () -> Void = {}
    var onUploadDoc:       () -> Void

    var body: some View {
        VStack(spacing: 18) {
            heroMascot

            VStack(spacing: 8) {
                Text("Your library is empty")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                    .multilineTextAlignment(.center)

                Text("Everything you build in WriteScholar — study packs, uploaded notes, and essays from the web app — all lands here automatically.")
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.duoText.opacity(0.65))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }

            VStack(spacing: 10) {
                ctaCard(
                    icon: "graduationcap.fill",
                    title: "Generate a study pack",
                    subtitle: "Paste notes -> quiz, flashcards, lesson, games.",
                    tint: WSColor.duoPurple
                ) { onCreateStudyPack() }

                ctaCard(
                    icon: "doc.text.fill",
                    title: "Upload a document",
                    subtitle: "PDFs, slides, photos of your notes.",
                    tint: WSColor.duoOrange
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
            Circle()
                .fill(WSColor.duoPurpleLight)
                .frame(width: 160, height: 160)

            WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                .frame(width: 110, height: 110)
                .wsBobbing(amount: 4, duration: 2.6)
        }
        .padding(.top, 12)
    }

    // MARK: - CTA card

    private func ctaCard(icon: String, title: String, subtitle: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: {
            Haptics.medium()
            action()
        }) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(tint)
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.duoText)
                    Text(subtitle)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.duoText.opacity(0.55))
                }
                Spacer()
                Image(systemName: "arrow.right.circle.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(tint)
            }
        }
        .buttonStyle(WSBouncyButtonStyle())
        .wsChunkyCard(cornerRadius: 18, horizontalPadding: 14, verticalPadding: 14, lipHeight: 5, accent: tint)
    }

    // MARK: - Footer

    private var footerHint: some View {
        HStack(spacing: 8) {
            Image(systemName: "globe")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(WSColor.duoGreen)
            Text("Items synced from writescholar.com will show up here too.")
                .wsBody(.caption)
                .foregroundStyle(WSColor.duoText.opacity(0.55))
                .multilineTextAlignment(.leading)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.duoGreenLight)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(WSColor.duoGreen.opacity(0.30), lineWidth: 2)
                )
        )
        .padding(.top, 6)
        .padding(.horizontal, 6)
    }
}

// MARK: - Filtered empty state

struct LibraryFilteredEmptyState: View {
    let filter: LibraryFilter
    let query: String
    var onClear: () -> Void

    private var filterColor: Color {
        switch filter {
        case .all:        return WSColor.duoPurple
        case .studyPacks: return WSColor.duoBlue
        case .essays:     return WSColor.duoOrange
        case .documents:  return WSColor.duoGreen
        }
    }

    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(filterColor.opacity(0.12))
                    .frame(width: 80, height: 80)
                Image(systemName: filter == .all ? "magnifyingglass" : filter.icon)
                    .font(.system(size: 32, weight: .heavy))
                    .foregroundStyle(filterColor)
            }

            VStack(spacing: 4) {
                Text(headline)
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                Text(subhead)
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.duoText.opacity(0.55))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
            }

            Button {
                Haptics.light()
                onClear()
            } label: {
                Label("Clear filter", systemImage: "xmark.circle.fill")
            }
            .buttonStyle(WSDuoPillButtonStyle(palette: WSDuoPalette(
                topColor: filterColor,
                baseColor: filterColor.opacity(0.7),
                foreground: .white,
                glow: filterColor
            )))
        }
        .frame(maxWidth: .infinity)
        .wsChunkyCard(verticalPadding: 36, accent: filterColor)
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
    .background(WSColor.duoSurface)
}

#Preview("Filtered empty") {
    LibraryFilteredEmptyState(
        filter: .essays,
        query: "shakespeare",
        onClear: {}
    )
    .padding()
    .background(WSColor.duoSurface)
}
