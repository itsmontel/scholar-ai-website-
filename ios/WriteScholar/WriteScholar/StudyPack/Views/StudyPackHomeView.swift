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
        ZStack {
            // Subtle brand backdrop matching the rest of the app
            WSGradient.heroBackdrop.ignoresSafeArea()
            Circle()
                .fill(selectedTab.tint.opacity(0.10))
                .frame(width: 320, height: 320)
                .blur(radius: 80)
                .offset(x: -180, y: -260)
                .ignoresSafeArea()

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
                        .font(.system(size: 10, weight: .black, design: .rounded))
                        .tracking(0.7)
                        .foregroundStyle(WSColor.brandPrimary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(WSColor.brandSoft))

                    Text(pack.displayTitle)
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundStyle(WSColor.foreground)
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

            // Inventory chip row — quick glance at what the pack contains
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
            Text(label).font(.system(size: 11, weight: .black, design: .rounded)).foregroundStyle(WSColor.foreground)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            Capsule()
                .fill(color.opacity(0.13))
                .overlay(Capsule().stroke(color.opacity(0.30), lineWidth: 0.5))
        )
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

        ZStack(alignment: .top) {
            // 3D base lip — only when active to keep the row visually calm
            if active {
                Capsule()
                    .fill(tab.tint.opacity(0.55))
                    .padding(.top, 3)
                    .blendMode(.multiply)
            }

            HStack(spacing: 6) {
                Image(systemName: tab.icon)
                    .font(.system(size: 12, weight: .heavy))
                Text(tab.rawValue)
                    .font(.system(size: 12, weight: .black, design: .rounded))
                if !isAvailable && tab != .notes {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 9, weight: .heavy))
                        .opacity(0.7)
                }
            }
            .foregroundStyle(active ? .white : tab.tint)
            .padding(.horizontal, 13)
            .padding(.vertical, 9)
            .background(
                Capsule()
                    .fill(
                        active
                            ? AnyShapeStyle(LinearGradient(colors: [tab.tint, tab.tint.opacity(0.78)],
                                                           startPoint: .topLeading, endPoint: .bottomTrailing))
                            : AnyShapeStyle(WSColor.backgroundElevated)
                    )
                    .overlay(
                        Capsule().stroke(active ? .white.opacity(0.25) : tab.tint.opacity(0.30), lineWidth: 1)
                    )
                    .shadow(color: active ? tab.tint.opacity(0.40) : .clear, radius: active ? 8 : 0, y: 3)
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
        VStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(WSColor.surface)
                    .frame(width: 130, height: 130)
                Image(systemName: "lock.fill")
                    .font(.system(size: 48, weight: .heavy))
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            VStack(spacing: 4) {
                Text("\(tab.rawValue) is a Pro feature")
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)
                Text("Upgrade in Settings to unlock the full study pack.")
                    .wsBody(.small)
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
                    .fill(
                        RadialGradient(colors: [tab.tint.opacity(0.30), .clear],
                                       center: .center, startRadius: 6, endRadius: 100)
                    )
                    .frame(width: 200, height: 200)
                    .blur(radius: 8)
                Circle()
                    .fill(LinearGradient(colors: [tab.tint, tab.tint.opacity(0.78)],
                                         startPoint: .topLeading, endPoint: .bottomTrailing))
                    .frame(width: 130, height: 130)
                    .overlay(Circle().stroke(.white.opacity(0.30), lineWidth: 2))
                    .shadow(color: tab.tint.opacity(0.45), radius: 14, y: 6)
                Image(systemName: tab.icon)
                    .font(.system(size: 48, weight: .heavy))
                    .foregroundStyle(.white)
            }

            VStack(spacing: 4) {
                Text("Crossword")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                    .foregroundStyle(WSColor.foreground)

                Text("Crossword grids are best on a wider canvas — pop it open on writescholar.com to play.")
                    .wsBody(.medium)
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
