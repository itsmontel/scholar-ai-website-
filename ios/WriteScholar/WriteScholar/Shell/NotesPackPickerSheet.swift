//
//  NotesPackPickerSheet.swift
//  WriteScholar
//
//  Bottom sheet shown from the Games tab when the user picks "My Notes"
//  mode. Lists every saved Library study pack that has the right kind
//  of question pool attached (Crater Blast or Word Tower) and launches
//  the chosen game with those questions on tap.
//
//  Source of truth: `LibraryStore.shared.items` (filtered to .studyPack)
//  cross-referenced with `StudyPackPersistence.shared.loadPack(for:)`.
//  Items without a matching question pool are shown in a separate
//  "Not ready" bucket with a brief Pro-feature explainer.
//

import SwiftUI

struct NotesPackPickerSheet: View {
    enum Game: String, Identifiable {
        case craterBlast
        case wordTower
        var id: String { rawValue }
    }

    let game: Game
    let onPick: (StudyPack) -> Void

    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var library = LibraryStore.shared

    var body: some View {
        NavigationStack {
            ZStack {
                WSGradient.heroBackdrop.ignoresSafeArea()

                if eligibleEntries.isEmpty && ineligibleEntries.isEmpty {
                    emptyState
                } else {
                    listBody
                }
            }
            .navigationTitle(navTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.brandPrimary)
                }
            }
        }
    }

    // MARK: - Body

    private var listBody: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text("Pick one of your study packs to play with your own questions.")
                    .wsBody(.small, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.bottom, 4)

                ForEach(eligibleEntries) { row in
                    Button {
                        Haptics.medium()
                        onPick(row.pack)
                        dismiss()
                    } label: {
                        eligibleRow(row)
                    }
                    .buttonStyle(.plain)
                }

                if !ineligibleEntries.isEmpty {
                    Divider().padding(.vertical, 14)
                    Text("Packs without \(gameLabel) questions")
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .textCase(.uppercase)
                        .padding(.bottom, 6)
                    ForEach(ineligibleEntries) { item in
                        ineligibleRow(item)
                    }
                    Text("\(gameLabel) is a Pro feature — packs you generated on the free plan won't include it.")
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .padding(.top, 6)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
    }

    private func eligibleRow(_ row: PlayableRow) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(accent.opacity(0.16))
                    .frame(width: 44, height: 44)
                Image(systemName: gameIcon)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(accent)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(row.item.title)
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(2)
                Text("\(row.questionCount) \(gameLabel) questions")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            Image(systemName: "play.fill")
                .foregroundStyle(accent)
                .font(.system(size: 16, weight: .bold))
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(accent.opacity(0.30), lineWidth: 1)
                )
                .shadow(color: accent.opacity(0.18), radius: 10, y: 4)
        )
    }

    private func ineligibleRow(_ item: LibraryItem) -> some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(WSColor.surface)
                    .frame(width: 36, height: 36)
                Image(systemName: "lock.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Text(item.title)
                .wsBody(.small, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
                .lineLimit(1)
            Spacer()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.backgroundElevated.opacity(0.5))
        )
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            ZStack {
                Circle()
                    .fill(accent.opacity(0.12))
                    .frame(width: 110, height: 110)
                Image(systemName: gameIcon)
                    .font(.system(size: 44, weight: .semibold))
                    .foregroundStyle(accent)
            }
            Text("No packs ready for \(gameLabel)")
                .wsHeadline(.small, weight: .bold)
                .foregroundStyle(WSColor.foreground)
            Text("Generate a study pack from the Study tab — \(gameLabel) questions get attached automatically and packs you've made will show up here.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 30)
            Spacer()
        }
    }

    // MARK: - Derived

    /// Internal join of LibraryItem + decoded StudyPack for rows that
    /// have the right question pool attached.
    private struct PlayableRow: Identifiable {
        let item: LibraryItem
        let pack: StudyPack
        let questionCount: Int
        var id: String { item.id }
    }

    /// Iterate every study-pack LibraryItem, decode its persisted pack,
    /// and keep the ones whose target question pool is non-empty.
    private var eligibleEntries: [PlayableRow] {
        library.items
            .filter { $0.kind == .studyPack }
            .compactMap { item in
                guard let pack = StudyPackPersistence.shared.loadPack(for: item.id) else { return nil }
                let count: Int = {
                    switch game {
                    case .craterBlast: return pack.craterBlast?.questions.count ?? 0
                    case .wordTower:   return pack.wordTower?.questions.count ?? 0
                    }
                }()
                guard count > 0 else { return nil }
                return PlayableRow(item: item, pack: pack, questionCount: count)
            }
    }

    /// Study-pack items that are saved but don't have the target game
    /// pool attached — typically free-plan packs.
    private var ineligibleEntries: [LibraryItem] {
        library.items
            .filter { $0.kind == .studyPack }
            .filter { item in
                guard let pack = StudyPackPersistence.shared.loadPack(for: item.id) else { return true }
                switch game {
                case .craterBlast: return (pack.craterBlast?.questions.count ?? 0) == 0
                case .wordTower:   return (pack.wordTower?.questions.count ?? 0) == 0
                }
            }
    }

    private var gameLabel: String {
        switch game {
        case .craterBlast: return "Crater Blast"
        case .wordTower:   return "Word Tower"
        }
    }

    private var gameIcon: String {
        switch game {
        case .craterBlast: return "burst.fill"
        case .wordTower:   return "building.2.fill"
        }
    }

    private var accent: Color {
        switch game {
        case .craterBlast: return Color(hex: 0xEF4444)
        case .wordTower:   return Color(hex: 0x10B981)
        }
    }

    private var navTitle: String {
        switch game {
        case .craterBlast: return "Pick a pack — Crater Blast"
        case .wordTower:   return "Pick a pack — Word Tower"
        }
    }
}

#Preview {
    NotesPackPickerSheet(game: .craterBlast) { _ in }
}
