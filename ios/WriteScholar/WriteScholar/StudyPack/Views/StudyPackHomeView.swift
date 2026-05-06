//
//  StudyPackHomeView.swift
//  WriteScholar
//
//  Tabbed shell shown after a study pack is generated. Mirrors the
//  web's tab strip: Original Notes | Lesson | Flashcards | Quiz |
//  Crossword | Crater Blast | Word Tower. Native renders for
//  Lesson/Flashcards/Quiz; placeholders for the games (Chapter 5).
//

import SwiftUI

struct StudyPackHomeView: View {
    let pack: StudyPack
    @ObservedObject var coordinator: StudyPackCoordinator

    @State private var selectedTab: PackTab = .lesson

    enum PackTab: String, CaseIterable, Identifiable {
        case notes      = "Notes"
        case lesson     = "Lesson"
        case flashcards = "Flashcards"
        case quiz       = "Quiz"
        case crossword  = "Crossword"
        case crater     = "Crater Blast"
        case wordTower  = "Word Tower"

        var id: Self { self }

        var icon: String {
            switch self {
            case .notes:      return "doc.text"
            case .lesson:     return "book.pages.fill"
            case .flashcards: return "square.stack.3d.up.fill"
            case .quiz:       return "checkmark.bubble.fill"
            case .crossword:  return "grid"
            case .crater:     return "burst.fill"
            case .wordTower:  return "building.2.fill"
            }
        }

        var tint: Color {
            switch self {
            case .notes:      return WSColor.foregroundMuted
            case .lesson:     return Color(hex: 0x6366F1)
            case .flashcards: return Color(hex: 0x7C3AED)
            case .quiz:       return Color(hex: 0xD946EF)
            case .crossword:  return Color(hex: 0xF59E0B)
            case .crater:     return Color(hex: 0xEF4444)
            case .wordTower:  return Color(hex: 0x10B981)
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            packHeader
                .padding(.horizontal, 16)
                .padding(.bottom, 10)

            tabStrip
                .padding(.bottom, 4)

            Divider()

            tabContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(WSColor.background.ignoresSafeArea())
    }

    // MARK: - Header

    private var packHeader: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Text(pack.displayTitle)
                    .wsHeadline(.medium, weight: .semibold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(2)
                Spacer()
                Button {
                    coordinator.reset()
                } label: {
                    Label("New", systemImage: "plus")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.brandPrimary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(
                            Capsule().fill(WSColor.brandSoft)
                        )
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 10) {
                if let lesson = pack.lesson {
                    countChip(icon: "book.pages.fill",         label: "\(lesson.slides.count) slides", color: PackTab.lesson.tint)
                }
                if let flash = pack.flashcards {
                    countChip(icon: "square.stack.3d.up.fill", label: "\(flash.cards.count) cards",    color: PackTab.flashcards.tint)
                }
                if let quiz = pack.quiz {
                    countChip(icon: "checkmark.bubble.fill",   label: "\(quiz.questions.count) q's",   color: PackTab.quiz.tint)
                }
            }
        }
        .padding(.top, 6)
    }

    private func countChip(icon: String, label: String, color: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).foregroundStyle(color)
            Text(label).wsBody(.caption, weight: .bold).foregroundStyle(WSColor.foreground)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Capsule().fill(color.opacity(0.12)))
    }

    // MARK: - Tab strip (horizontally scrollable, web-style)

    private var tabStrip: some View {
        ScrollViewReader { reader in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(PackTab.allCases) { tab in
                        tabPill(for: tab)
                            .id(tab)
                            .onTapGesture {
                                Haptics.selection()
                                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                                    selectedTab = tab
                                }
                                withAnimation(.easeInOut(duration: 0.3)) {
                                    reader.scrollTo(tab, anchor: .center)
                                }
                            }
                    }
                }
                .padding(.horizontal, 16)
            }
        }
    }

    @ViewBuilder
    private func tabPill(for tab: PackTab) -> some View {
        let active = (selectedTab == tab)
        let isAvailable = tabIsAvailable(tab)

        HStack(spacing: 6) {
            Image(systemName: tab.icon)
                .font(.system(size: 13, weight: .bold))
            Text(tab.rawValue)
                .wsBody(.small, weight: .bold)
            if !isAvailable && tab != .notes {
                Image(systemName: "lock.fill")
                    .font(.system(size: 9, weight: .bold))
                    .opacity(0.6)
            }
        }
        .foregroundStyle(active ? .white : tab.tint)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(active ? AnyShapeStyle(tab.tint) : AnyShapeStyle(tab.tint.opacity(0.12)))
                .overlay(
                    Capsule().stroke(tab.tint.opacity(active ? 0 : 0.30), lineWidth: 1)
                )
                .shadow(color: active ? tab.tint.opacity(0.3) : .clear, radius: active ? 8 : 0, y: 3)
        )
    }

    private func tabIsAvailable(_ tab: PackTab) -> Bool {
        switch tab {
        case .notes:      return pack.originalNotes != nil
        case .lesson:     return pack.lesson != nil
        case .flashcards: return pack.flashcards != nil
        case .quiz:       return pack.quiz != nil
        case .crossword:  return pack.crossword != nil
        case .crater:     return pack.craterBlast != nil
        case .wordTower:  return pack.wordTower != nil
        }
    }

    // MARK: - Tab content

    @ViewBuilder
    private var tabContent: some View {
        switch selectedTab {
        case .notes:
            originalNotesPane

        case .lesson:
            if let lesson = pack.lesson { LessonView(lesson: lesson) }
            else { lockedPane(tab: .lesson) }

        case .flashcards:
            if let flash = pack.flashcards { FlashcardsView(flashcards: flash) }
            else { lockedPane(tab: .flashcards) }

        case .quiz:
            if let quiz = pack.quiz { QuizView(quiz: quiz) }
            else { lockedPane(tab: .quiz) }

        case .crossword, .crater, .wordTower:
            chapter5Placeholder(tab: selectedTab)
        }
    }

    private var originalNotesPane: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    Image(systemName: "doc.text")
                        .foregroundStyle(WSColor.foregroundMuted)
                    Text("Original notes")
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                }
                Text(pack.originalNotes ?? "No notes available.")
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foreground.opacity(0.92))
                    .lineSpacing(4)
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func lockedPane(tab: PackTab) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "lock.fill")
                .font(.system(size: 36, weight: .semibold))
                .foregroundStyle(WSColor.foregroundMuted)
            Text("\(tab.rawValue) is a Pro feature")
                .wsHeadline(.small, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
            Text("Upgrade in Settings to unlock the full study pack.")
                .wsBody(.small)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func chapter5Placeholder(tab: PackTab) -> some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(tab.tint.opacity(0.15))
                    .frame(width: 130, height: 130)
                Image(systemName: tab.icon)
                    .font(.system(size: 48, weight: .semibold))
                    .foregroundStyle(tab.tint)
            }

            Text(tab.rawValue)
                .wsHeadline(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foreground)

            Text("Native game ships in Chapter 5.\nFor now, play it on writescholar.com.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Button {
                if let url = URL(string: "https://writescholar.com/study-pack") {
                    UIApplication.shared.open(url)
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "safari")
                    Text("Open on web")
                }
            }
            .buttonStyle(WSSecondaryButtonStyle(fullWidth: false))
            .padding(.top, 6)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

#Preview {
    StudyPackHomeView(
        pack: StudyPack(
            lesson: Lesson(title: "Cell Biology", slides: []),
            flashcards: Flashcards(title: "Cell Biology", cards: [
                Flashcard(front: "Q?", back: "A.")
            ]),
            quiz: Quiz(title: "Cell Biology", questions: []),
            crossword: nil,
            craterBlast: nil,
            wordTower: nil,
            originalNotes: "Cells are the basic structural unit of life…"
        ),
        coordinator: StudyPackCoordinator()
    )
}
