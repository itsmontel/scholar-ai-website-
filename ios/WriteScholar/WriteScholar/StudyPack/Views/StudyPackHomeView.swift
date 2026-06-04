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
            case .notes:      return WSColor.duoBorder
            case .lesson:     return WSColor.duoGreen
            case .flashcards: return WSColor.duoBlue
            case .quiz:       return WSColor.duoPurple
            case .crossword:  return WSColor.duoRed
            case .crater:     return WSColor.duoOrange
            case .wordTower:  return WSColor.duoGreen
            }
        }
    }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            VStack(spacing: 0) {
                packHeader
                    .padding(.horizontal, 16)
                    .padding(.top, 6)
                    .padding(.bottom, 12)

                tabStrip
                    .padding(.bottom, 8)

                tabContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    // MARK: - Header

    private var packHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("STUDY PACK")
                        .font(WSFont.sans(10, weight: .black))
                        .tracking(2.2)
                        .textCase(.uppercase)
                        .foregroundStyle(WSColor.duoGreen)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(WSColor.duoGreenLight))

                    Text(pack.displayTitle)
                        .font(WSFont.headline(24, weight: .black))
                        .foregroundStyle(WSColor.duoText)
                        .lineLimit(2)
                }
                Spacer()
                Button {
                    Haptics.medium()
                    coordinator.reset()
                } label: {
                    HStack(spacing: 5) {
                        Image(systemName: "plus")
                        Text("New")
                    }
                }
                .buttonStyle(WSDuoPillButtonStyle(palette: .secondary))
            }

            // Inventory chip row
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    if let lesson = pack.lesson {
                        countChip(icon: "book.pages.fill",         label: "\(lesson.slides.count) slides", color: PackTab.lesson.tint)
                    }
                    if let flash = pack.flashcards {
                        countChip(icon: "rectangle.on.rectangle.angled.fill", label: "\(flash.cards.count) cards",    color: PackTab.flashcards.tint)
                    }
                    if let quiz = pack.quiz {
                        countChip(icon: "checkmark.bubble.fill",   label: "\(quiz.questions.count) questions", color: PackTab.quiz.tint)
                    }
                    if let cw = pack.crossword, let words = cw.words {
                        countChip(icon: "grid",                    label: "\(words.count)-word crossword", color: PackTab.crossword.tint)
                    }
                    if let cb = pack.craterBlast {
                        countChip(icon: "burst.fill",              label: "\(cb.questions.count) Crater q's", color: PackTab.crater.tint)
                    }
                    if let wt = pack.wordTower {
                        countChip(icon: "building.2.fill",         label: "\(wt.questions.count) Tower q's", color: PackTab.wordTower.tint)
                    }
                }
            }
        }
    }

    private func countChip(icon: String, label: String, color: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).foregroundStyle(color).font(.system(size: 11, weight: .heavy))
            Text(label).font(WSFont.sans(11, weight: .black)).foregroundStyle(WSColor.duoText)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            Capsule()
                .fill(color.opacity(0.13))
                .overlay(Capsule().stroke(color.opacity(0.30), lineWidth: 2))
        )
    }

    // MARK: - Tab strip (horizontally scrollable Duolingo-style pills)

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

        ZStack(alignment: .top) {
            // 3D base lip for the active pill
            if active {
                Capsule()
                    .fill(tab == .notes ? WSColor.duoBorder : tab.tint.opacity(0.55))
                    .padding(.top, 3)
            }

            HStack(spacing: 6) {
                Image(systemName: tab.icon)
                    .font(.system(size: 12, weight: .heavy))
                Text(tab.rawValue)
                    .font(WSFont.sans(12, weight: .black))
                if !isAvailable && tab != .notes {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 9, weight: .heavy))
                        .opacity(0.7)
                }
            }
            .foregroundStyle(active ? .white : (tab == .notes ? WSColor.duoText : tab.tint))
            .padding(.horizontal, 13)
            .padding(.vertical, 9)
            .background(
                Capsule()
                    .fill(active ? tab.tint : WSColor.backgroundElevated)
                    .overlay(
                        Capsule().stroke(active ? .clear : WSColor.duoBorder, lineWidth: 2)
                    )
                    .shadow(color: active ? tab.tint.opacity(0.35) : .clear, radius: active ? 6 : 0, y: 2)
            )
        }
        .compositingGroup()
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

        case .crater:
            if let cb = pack.craterBlast, !cb.questions.isEmpty {
                CraterBlastView(craterBlast: cb)
            } else {
                lockedPane(tab: .crater)
            }

        case .wordTower:
            if let wt = pack.wordTower, !wt.questions.isEmpty {
                WordTowerView(wordTower: wt)
            } else {
                lockedPane(tab: .wordTower)
            }

        case .crossword:
            crosswordWebPlaceholder()
        }
    }

    private var originalNotesPane: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    Image(systemName: "doc.text")
                        .foregroundStyle(WSColor.foregroundMuted)
                    Text("Original notes")
                        .font(WSFont.sans(15, weight: .bold))
                        .foregroundStyle(WSColor.duoText)
                }
                Text(pack.originalNotes ?? "No notes available.")
                    .font(WSFont.sans(15))
                    .foregroundStyle(WSColor.duoText.opacity(0.92))
                    .lineSpacing(4)
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .wsChunkyCard(accent: WSColor.duoBorder)
            .padding(.horizontal, 16)
            .padding(.top, 8)
        }
    }

    private func lockedPane(tab: PackTab) -> some View {
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(WSColor.duoSurface)
                    .frame(width: 130, height: 130)
                    .overlay(
                        Circle().stroke(WSColor.duoBorder, lineWidth: 3)
                    )
                Image(systemName: "lock.fill")
                    .font(.system(size: 48, weight: .heavy))
                    .foregroundStyle(WSColor.duoBorder)
            }
            VStack(spacing: 4) {
                Text("\(tab.rawValue) is a Pro feature")
                    .font(WSFont.headline(22, weight: .black))
                    .foregroundStyle(WSColor.duoText)
                Text("Upgrade in Settings to unlock the full study pack.")
                    .font(WSFont.sans(13))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            Button {
                if let url = URL(string: "https://writescholar.com/upgrade") {
                    UIApplication.shared.open(url)
                }
            } label: {
                Label("Upgrade to Pro", systemImage: "crown.fill")
            }
            .buttonStyle(WSDuoWarnButtonStyle(fullWidth: false))
            .wsShineSweep()
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    private func crosswordWebPlaceholder() -> some View {
        let tab = PackTab.crossword
        return VStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(WSColor.duoRedLight)
                    .frame(width: 130, height: 130)
                    .overlay(Circle().stroke(WSColor.duoRed, lineWidth: 3))
                    .shadow(color: WSColor.duoRed.opacity(0.35), radius: 14, y: 6)
                Image(systemName: tab.icon)
                    .font(.system(size: 48, weight: .heavy))
                    .foregroundStyle(WSColor.duoRed)
            }

            VStack(spacing: 4) {
                Text("Crossword")
                    .font(WSFont.headline(24, weight: .black))
                    .foregroundStyle(WSColor.duoText)

                Text("Crossword grids are best on a wider canvas — pop it open on writescholar.com to play.")
                    .font(WSFont.sans(15))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Button {
                if let url = URL(string: "https://writescholar.com/study-pack") {
                    UIApplication.shared.open(url)
                }
            } label: {
                Label("Open on web", systemImage: "safari")
            }
            .buttonStyle(WSDuoInfoButtonStyle(fullWidth: false))
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
