//
//  StudyPackHomeView.swift
//  WriteScholar
//
//  Four clear tabs after generation: Lesson · Cards · Quiz · Games.
//  Notes live behind a single header button — not a seventh tab.
//

import SwiftUI

struct StudyPackHomeView: View {
    let pack: StudyPack
    @ObservedObject var coordinator: StudyPackCoordinator
    var onPlayGame: (StudyHubGame) -> Void = { _ in }

    @State private var tab: PackTab = .lesson
    @State private var showNotes = false

    enum PackTab: String, CaseIterable, Identifiable {
        case lesson, flashcards, quiz, games
        var id: Self { self }

        var label: String {
            switch self {
            case .lesson:     return "Lesson"
            case .flashcards: return "Cards"
            case .quiz:       return "Quiz"
            case .games:      return "Games"
            }
        }
        var icon: String {
            switch self {
            case .lesson:     return "book.pages.fill"
            case .flashcards: return "rectangle.on.rectangle.angled.fill"
            case .quiz:       return "checkmark.bubble.fill"
            case .games:      return "gamecontroller.fill"
            }
        }
        var tint: Color {
            switch self {
            case .lesson:     return WSColor.duoGreen
            case .flashcards: return WSColor.duoBlue
            case .quiz:       return WSColor.duoPurple
            case .games:      return WSColor.duoOrange
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            compactHeader

            tabContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            bottomTabBar
        }
        .background(WSColor.background.ignoresSafeArea())
        .onAppear {
            // Tool-picker intent: "Flashcards" / "Quiz" jump straight to
            // that surface once a pack is open (one-shot hand-off).
            if let intent = StudyLaunchIntent.pending {
                StudyLaunchIntent.pending = nil
                switch intent {
                case .flashcards: tab = .flashcards
                case .quiz:       tab = .quiz
                case .create:     break
                }
            }
            // Never strand the user on a locked/empty tab — open the first one with content.
            if !isAvailable(tab) {
                tab = PackTab.allCases.first(where: isAvailable) ?? .lesson
            }
        }
        .sheet(isPresented: $showNotes) {
            NavigationStack {
                ScrollView {
                    Text(pack.originalNotes ?? "No notes saved with this pack.")
                        .font(WSFont.sans(15))
                        .foregroundStyle(WSColor.duoText)
                        .lineSpacing(5)
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .navigationTitle("Source notes")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { showNotes = false }
                    }
                }
            }
            .presentationDetents([.medium, .large])
        }
    }

    // MARK: - Header

    private var compactHeader: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(pack.displayTitle)
                    .font(WSFont.sans(17, weight: .black))
                    .foregroundStyle(WSColor.duoText)
                    .lineLimit(2)
            }
            Spacer(minLength: 8)

            if pack.originalNotes != nil {
                Button {
                    showNotes = true
                    Haptics.light()
                } label: {
                    Image(systemName: "doc.text")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(WSColor.foregroundMuted)
                        .padding(10)
                        .background(Circle().fill(WSColor.duoSurface))
                }
                .buttonStyle(.plain)
            }

            Button {
                Haptics.medium()
                coordinator.reset()
            } label: {
                Text("New")
                    .font(WSFont.sans(13, weight: .black))
                    .foregroundStyle(WSColor.duoGreen)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(
                        Capsule()
                            .stroke(WSColor.duoGreen, lineWidth: 2)
                    )
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .background(WSColor.backgroundElevated)
        .overlay(alignment: .bottom) {
            Rectangle().fill(WSColor.duoBorder).frame(height: 1)
        }
    }

    // MARK: - Bottom tab bar

    private var bottomTabBar: some View {
        HStack(spacing: 0) {
            ForEach(PackTab.allCases) { t in
                let active = tab == t
                let locked = !isAvailable(t)
                Button {
                    guard !locked else { return }
                    Haptics.selection()
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) { tab = t }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: locked ? "lock.fill" : t.icon)
                            .font(.system(size: 20, weight: .heavy))
                        Text(t.label)
                            .font(WSFont.sans(11, weight: .black))
                    }
                    .foregroundStyle(active ? t.tint : WSColor.foregroundMuted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .overlay(alignment: .top) {
                        if active {
                            Capsule()
                                .fill(t.tint)
                                .frame(width: 28, height: 3)
                                .offset(y: -1)
                        }
                    }
                }
                .buttonStyle(.plain)
                .opacity(locked ? 0.4 : 1)
            }
        }
        .padding(.top, 4)
        .padding(.bottom, 6)
        .background(WSColor.backgroundElevated)
        .overlay(alignment: .top) {
            Rectangle().fill(WSColor.duoBorder).frame(height: 1)
        }
    }

    private func isAvailable(_ t: PackTab) -> Bool {
        switch t {
        case .lesson:     return pack.lesson != nil
        case .flashcards: return pack.flashcards != nil
        case .quiz:       return pack.quiz != nil
        case .games:      return hasAnyGame
        }
    }

    private var hasAnyGame: Bool {
        (pack.craterBlast.map { !$0.questions.isEmpty } ?? false)
            || (pack.wordTower.map { !$0.questions.isEmpty } ?? false)
            || (pack.wordBlitz.map { !$0.questions.isEmpty } ?? false)
            || pack.crossword != nil
    }

    // MARK: - Content

    @ViewBuilder
    private var tabContent: some View {
        switch tab {
        case .lesson:
            if let lesson = pack.lesson { LessonView(lesson: lesson) }
            else { lockedUpgrade("Lesson") }

        case .flashcards:
            if let f = pack.flashcards { FlashcardsView(flashcards: f) }
            else { lockedUpgrade("Flashcards") }

        case .quiz:
            if let q = pack.quiz { QuizView(quiz: q) }
            else { lockedUpgrade("Quiz") }

        case .games:
            gamesHub
        }
    }

    private var gamesHub: some View {
        ScrollView {
            VStack(spacing: 12) {
                if let cb = pack.craterBlast, !cb.questions.isEmpty {
                    gameLaunchRow(title: "Crater Blast", subtitle: "Fast reflex quiz", icon: "burst.fill", tint: WSColor.duoOrange) {
                        onPlayGame(.craterBlast(cb))
                    }
                }
                if let wt = pack.wordTower, !wt.questions.isEmpty {
                    gameLaunchRow(title: "Word Tower", subtitle: "Stack correct answers", icon: "building.2.fill", tint: WSColor.duoPurple) {
                        onPlayGame(.wordTower(wt))
                    }
                }
                if let wb = pack.wordBlitz, !wb.questions.isEmpty {
                    gameLaunchRow(title: "Word Blitz", subtitle: "60-second speedrun", icon: "bolt.fill", tint: WSColor.duoPink) {
                        onPlayGame(.wordBlitz(wb))
                    }
                }
                if pack.crossword != nil {
                    gameLaunchRow(title: "Crossword", subtitle: "Best on web", icon: "grid", tint: WSColor.duoRed) {
                        if let url = URL(string: "https://writescholar.com/study-pack") {
                            UIApplication.shared.open(url)
                        }
                    }
                }
                if !hasAnyGame {
                    Text("No games in this pack yet.")
                        .font(WSFont.sans(14, weight: .semibold))
                        .foregroundStyle(WSColor.foregroundMuted)
                        .padding(.top, 40)
                }
            }
            .padding(18)
        }
    }

    private func gameLaunchRow(title: String, subtitle: String, icon: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            HStack(spacing: 14) {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(tint.opacity(0.14))
                    .frame(width: 48, height: 48)
                    .overlay(
                        Image(systemName: icon)
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundStyle(tint)
                    )
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(WSFont.sans(16, weight: .black))
                        .foregroundStyle(WSColor.duoText)
                    Text(subtitle)
                        .font(WSFont.sans(12, weight: .semibold))
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
                Image(systemName: "play.circle.fill")
                    .font(.system(size: 28))
                    .foregroundStyle(tint)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .shadow(color: tint.opacity(0.12), radius: 8, y: 4)
            )
        }
        .buttonStyle(WSBouncyButtonStyle())
    }

    private func lockedUpgrade(_ name: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "lock.fill")
                .font(.system(size: 40, weight: .heavy))
                .foregroundStyle(WSColor.duoBorder)
            Text("\(name) unlocks on Pro")
                .font(WSFont.sans(15, weight: .bold))
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    StudyPackHomeView(
        pack: StudyPack(
            lesson: Lesson(title: "Cell Biology", slides: []),
            flashcards: Flashcards(title: "Cell Biology", cards: [Flashcard(front: "Q?", back: "A.")]),
            quiz: Quiz(title: "Cell Biology", questions: []),
            crossword: nil,
            craterBlast: nil,
            wordTower: nil,
            originalNotes: "Cells are the basic unit of life…"
        ),
        coordinator: StudyPackCoordinator()
    )
}
