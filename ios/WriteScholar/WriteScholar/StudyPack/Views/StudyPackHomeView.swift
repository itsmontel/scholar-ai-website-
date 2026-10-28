//
//  StudyPackHomeView.swift
//  WriteScholar
//
//  Sticker pack page. Lands on an overview (tilted cover, progress ring,
//  "Speedrun" CTA, mode list); the mode pills switch to Lesson · Cards ·
//  Quiz · Games. Notes live behind a header button.
//

import SwiftUI

struct StudyPackHomeView: View {
    let pack: StudyPack
    @ObservedObject var coordinator: StudyPackCoordinator
    var onPlayGame: (StudyHubGame) -> Void = { _ in }

    @State private var tab: PackTab = .overview
    @State private var showNotes = false
    @ObservedObject private var progressStore = StudyPackProgressStore.shared

    enum PackTab: String, CaseIterable, Identifiable {
        case overview, lesson, flashcards, quiz, games
        var id: Self { self }

        var label: String {
            switch self {
            case .overview:   return "Pack"
            case .lesson:     return "Lesson"
            case .flashcards: return "Cards"
            case .quiz:       return "Quiz"
            case .games:      return "Games"
            }
        }
        var icon: String {
            switch self {
            case .overview:   return "square.stack.3d.up.fill"
            case .lesson:     return "book.pages.fill"
            case .flashcards: return "rectangle.on.rectangle.angled.fill"
            case .quiz:       return "checkmark.bubble.fill"
            case .games:      return "gamecontroller.fill"
            }
        }
        var tint: Color {
            switch self {
            case .overview:   return WSColor.purple
            case .lesson:     return WSColor.lime
            case .flashcards: return WSColor.sky
            case .quiz:       return WSColor.pink
            case .games:      return WSColor.orange
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            compactHeader
            modePills

            tabContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(WSColor.background.ignoresSafeArea())
        .onAppear {
            // Tool-picker intent: "Flashcards" / "Quiz" jump straight to
            // that surface once a pack is open (one-shot hand-off).
            if let intent = StudyLaunchIntent.pending {
                StudyLaunchIntent.pending = nil
                switch intent {
                case .flashcards: if isAvailable(.flashcards) { tab = .flashcards }
                case .quiz:       if isAvailable(.quiz) { tab = .quiz }
                case .create:     break
                }
            }
        }
        .sheet(isPresented: $showNotes) {
            NavigationStack {
                ScrollView {
                    Text(pack.originalNotes ?? "No notes saved with this pack.")
                        .font(WSFont.sans(15))
                        .foregroundStyle(WSColor.foreground)
                        .lineSpacing(5)
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .background(WSColor.background)
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
        HStack(alignment: .center, spacing: 10) {
            Button {
                Haptics.light()
                if tab == .overview { coordinator.reset() }
                else { withAnimation(.wsBounceTight) { tab = .overview } }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .frame(width: 42, height: 42)
                    .wsStickerCircle(fill: WSColor.backgroundElevated, depth: 3)
                    .padding(.bottom, 3)
            }
            .buttonStyle(WSStickerPressStyle())
            .accessibilityLabel(tab == .overview ? "Back to your packs" : "Back to pack overview")

            Spacer(minLength: 4)
            if tab == .overview {
                WSKicker(text: "Study pack")
            } else {
                Text(pack.displayTitle)
                    .font(WSFont.headline(16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
            }
            Spacer(minLength: 4)

            Menu {
                if pack.originalNotes != nil {
                    Button { showNotes = true } label: { Label("Source notes", systemImage: "doc.text") }
                }
                Button { coordinator.reset() } label: { Label("New pack", systemImage: "plus") }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .frame(width: 42, height: 42)
                    .wsStickerCircle(fill: WSColor.backgroundElevated, depth: 3)
                    .padding(.bottom, 3)
            }
            .accessibilityLabel("More options")
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }

    // MARK: - Mode pills

    private var modePills: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(PackTab.allCases) { t in
                    let active = tab == t
                    let locked = !isAvailable(t)
                    Button {
                        guard !locked else { return }
                        Haptics.selection()
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) { tab = t }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: locked ? "lock.fill" : t.icon)
                                .font(.system(size: 12, weight: .black))
                            Text(t.label)
                                .font(WSFont.headline(14, weight: .black))
                        }
                        .foregroundStyle(active ? WSColor.inkText : WSColor.foreground)
                        .padding(.horizontal, 13)
                        .padding(.vertical, 8)
                        .background(
                            ZStack {
                                Capsule().fill(WSColor.ink).offset(y: active ? 3 : 2)
                                Capsule().fill(active ? t.tint : WSColor.backgroundElevated)
                                Capsule().strokeBorder(WSColor.ink, lineWidth: 2)
                            }
                        )
                        .padding(.bottom, 3)
                    }
                    .buttonStyle(WSStickerPressStyle())
                    .opacity(locked ? 0.45 : 1)
                    .accessibilityLabel(locked ? "\(t.label), locked" : t.label)
                    .accessibilityAddTraits(active ? [.isSelected] : [])
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 6)
        }
    }

    private func isAvailable(_ t: PackTab) -> Bool {
        switch t {
        case .overview:   return true
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
        case .overview:
            overview

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

    // MARK: - Overview

    private var progress: StudyPackProgressStore.PackProgress? {
        progressStore.currentItemID.flatMap { progressStore.byItem[$0] }
    }

    private var overview: some View {
        let frac = progress?.fraction ?? 0
        return ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                coverCard
                    .rotationEffect(.degrees(-1.5))
                    .padding(.top, 4)
                    .wsPop()

                HStack(spacing: 16) {
                    PackRing(fraction: frac)
                        .frame(width: 92, height: 92)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(readinessTitle(frac))
                            .font(WSFont.headline(20, weight: .black))
                            .foregroundStyle(WSColor.foreground)
                        Text(readinessLine(frac))
                            .font(WSFont.sans(13.5, weight: .semibold))
                            .foregroundStyle(WSColor.foregroundMuted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .wsSticker(radius: 24)
                .wsPop(delay: 0.1)

                if isAvailable(.quiz) || isAvailable(.flashcards) {
                    Button {
                        Haptics.medium()
                        withAnimation(.wsBounceTight) { tab = isAvailable(.quiz) ? .quiz : .flashcards }
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "bolt.fill")
                            Text(frac > 0 ? "Speedrun the shaky ones" : "Start the speedrun")
                        }
                    }
                    .buttonStyle(WSStickerButtonStyle(fill: WSColor.lime, foreground: WSColor.inkText, radius: 20, height: 62,
                                                      font: WSFont.headline(20, weight: .black)))
                    .wsPop(delay: 0.16)
                }

                Text("Pick a mode")
                    .font(WSFont.headline(22, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .padding(.top, 4)

                VStack(spacing: 10) {
                    if let lesson = pack.lesson {
                        modeRow(.lesson, title: "Lesson", sub: "\(lesson.slides.count) slides · read", delay: 0.2)
                    }
                    if let f = pack.flashcards {
                        let known = min(progress?.cardsReviewed ?? 0, f.cards.count)
                        modeRow(.flashcards, title: "Flashcards", sub: known > 0 ? "\(known) of \(f.cards.count) reviewed" : "\(f.cards.count) cards", delay: 0.25)
                    }
                    if let q = pack.quiz {
                        let best = progress?.quizBestCorrect ?? 0
                        modeRow(.quiz, title: "Quiz", sub: best > 0 ? "\(q.questions.count) questions · best \(best)/\(q.questions.count)" : "\(q.questions.count) questions", delay: 0.3)
                    }
                    if hasAnyGame {
                        Button {
                            Haptics.medium()
                            withAnimation(.wsBounceTight) { tab = .games }
                        } label: {
                            HStack(spacing: 14) {
                                WSAnimatedImage(name: "mascot-juggling", ext: "webp")
                                    .frame(width: 50, height: 50)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Play it in the Arcade")
                                        .font(WSFont.headline(18, weight: .black))
                                        .foregroundStyle(WSColor.lime)
                                    Text("Games built from these notes")
                                        .font(WSFont.sans(13, weight: .semibold))
                                        .foregroundStyle(Color(hex: 0xD9D2F2))
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 14, weight: .black))
                                    .foregroundStyle(WSColor.lime)
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .background(
                                ZStack {
                                    RoundedRectangle(cornerRadius: 20, style: .continuous).fill(WSColor.purple).offset(y: 4)
                                    RoundedRectangle(cornerRadius: 20, style: .continuous).fill(WSColor.inkText)
                                }
                            )
                            .padding(.bottom, 4)
                        }
                        .buttonStyle(WSStickerPressStyle())
                        .wsPop(delay: 0.35)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 6)
            .padding(.bottom, 28)
        }
    }

    private var coverCard: some View {
        let subject = WSPackSubject.guess(from: pack.displayTitle)
        return VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topLeading) {
                Group {
                    if let img = subject.image {
                        Image(uiImage: img).resizable().scaledToFill()
                    } else {
                        subject.fill.overlay(
                            Image(systemName: subject.symbol)
                                .font(.system(size: 60, weight: .black))
                                .foregroundStyle(WSColor.inkText)
                        )
                    }
                }
                .frame(height: 168)
                .frame(maxWidth: .infinity)
                .clipped()
                .overlay(alignment: .bottom) { Rectangle().fill(WSColor.ink).frame(height: WSSticker.stroke) }

                Text(subject == .general ? "STUDY PACK" : subject.rawValue.uppercased())
                    .font(WSFont.sans(12, weight: .black))
                    .tracking(0.8)
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 10).fill(WSColor.pink)
                            RoundedRectangle(cornerRadius: 10).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                        }
                    )
                    .wsWiggle()
                    .padding(12)
            }
            VStack(alignment: .leading, spacing: 10) {
                Text(pack.displayTitle)
                    .font(WSFont.headline(28, weight: .black))
                    .tracking(-0.8)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(3)
                HStack(spacing: 8) {
                    if let n = pack.flashcards?.cards.count, n > 0 { countChip("\(n) cards") }
                    if let n = pack.quiz?.questions.count, n > 0 { countChip("\(n) questions") }
                    if pack.crossword != nil { countChip("1 crossword") }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 16)
        }
        .background(WSColor.backgroundElevated)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
        .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(WSColor.ink).offset(y: 6))
        .padding(.bottom, 6)
    }

    private func countChip(_ text: String) -> some View {
        Text(text)
            .font(WSFont.sans(12.5, weight: .heavy))
            .foregroundStyle(WSColor.foreground)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(WSColor.lilacDeep))
            .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
    }

    private func readinessTitle(_ f: Double) -> String {
        switch f {
        case 0:         return "Fresh pack"
        case ..<0.4:    return "Warming up"
        case ..<0.8:    return "Almost exam-ready"
        case ..<1:      return "So close"
        default:        return "Exam-ready"
        }
    }

    private func readinessLine(_ f: Double) -> String {
        switch f {
        case 0:      return "Run the lesson or a quick quiz to start the meter."
        case ..<0.8: return "Keep going. Every card and quiz fills the ring."
        case ..<1:   return "One more quiz round and this pack is done."
        default:     return "You cleared everything. Scholar is impressed."
        }
    }

    private func modeRow(_ t: PackTab, title: String, sub: String, delay: Double) -> some View {
        Button {
            Haptics.medium()
            withAnimation(.wsBounceTight) { tab = t }
        } label: {
            HStack(spacing: 14) {
                Image(systemName: t.icon)
                    .font(.system(size: 20, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 50, height: 50)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 15, style: .continuous).fill(t.tint)
                            RoundedRectangle(cornerRadius: 15, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                        }
                    )
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(WSFont.headline(18, weight: .black))
                        .foregroundStyle(WSColor.foreground)
                    Text(sub)
                        .font(WSFont.sans(13, weight: .semibold))
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "arrow.right")
                    .font(.system(size: 13, weight: .black))
                    .foregroundStyle(.white)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(WSColor.inkText))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .wsSticker(radius: 20)
        }
        .buttonStyle(WSStickerPressStyle())
        .wsPop(delay: delay)
    }

    // MARK: - Games

    private var gamesHub: some View {
        ScrollView {
            VStack(spacing: 12) {
                if let cb = pack.craterBlast, !cb.questions.isEmpty {
                    gameLaunchRow(title: "Crater Blast", subtitle: "Shoot the right answer", game: .craterBlast, fill: WSColor.sky) {
                        onPlayGame(.craterBlast(cb))
                    }
                }
                if let wt = pack.wordTower, !wt.questions.isEmpty {
                    gameLaunchRow(title: "Word Tower", subtitle: "Stack correct answers", game: .wordTower, fill: WSColor.lime) {
                        onPlayGame(.wordTower(wt))
                    }
                }
                if let wb = pack.wordBlitz, !wb.questions.isEmpty {
                    gameLaunchRow(title: "Word Blitz", subtitle: "60-second speedrun", game: .wordBlitz, fill: WSColor.orange) {
                        onPlayGame(.wordBlitz(wb))
                    }
                }
                if pack.crossword != nil {
                    Button {
                        Haptics.medium()
                        if let url = URL(string: "https://writescholar.com/study-pack") {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        WSListRowCard(icon: "square.grid.3x3.fill", iconTint: WSColor.pink, title: "Crossword", subtitle: "Best on web")
                    }
                    .buttonStyle(WSStickerPressStyle())
                }
                if !hasAnyGame {
                    Text("No games in this pack yet.")
                        .font(WSFont.sans(14, weight: .semibold))
                        .foregroundStyle(WSColor.foregroundMuted)
                        .padding(.top, 40)
                }
            }
            .padding(20)
        }
    }

    private func gameLaunchRow(title: String, subtitle: String, game: ArcadeGame, fill: Color, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            HStack(spacing: 14) {
                ArcadePreview(game: game)
                    .frame(width: 96, height: 70)
                    .background(WSColor.arcadeNight)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Color.black, lineWidth: 2))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(WSFont.headline(19, weight: .black))
                    Text(subtitle)
                        .font(WSFont.sans(13, weight: .bold))
                }
                .foregroundStyle(WSColor.inkText)
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "play.fill")
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 42, height: 42)
                    .wsStickerCircle(fill: .white)
            }
            .padding(12)
            .wsSticker(fill: fill, radius: 22, depth: 5)
        }
        .buttonStyle(WSStickerPressStyle())
    }

    private func lockedUpgrade(_ name: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "lock.fill")
                .font(.system(size: 26, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 64, height: 64)
                .wsStickerCircle(fill: WSColor.sun, depth: 4)
            Text("\(name) unlocks on Pro")
                .font(WSFont.headline(18, weight: .black))
                .foregroundStyle(WSColor.foreground)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Ring

/// Thick progress ring that fills on appear, percentage in the middle.
private struct PackRing: View {
    var fraction: Double
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown: Double = 0

    var body: some View {
        ZStack {
            Circle().stroke(WSColor.lilacDeep, lineWidth: 12)
            Circle()
                .trim(from: 0, to: max(0.001, shown))
                .stroke(WSColor.purple, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("\(Int((fraction * 100).rounded()))%")
                .font(WSFont.headline(24, weight: .black))
                .foregroundStyle(WSColor.foreground)
        }
        .padding(6)
        .onAppear {
            if reduceMotion { shown = fraction }
            else { withAnimation(.easeOut(duration: 1.1).delay(0.2)) { shown = fraction } }
        }
        .onChange(of: fraction) { _, f in withAnimation(.spring) { shown = f } }
        .accessibilityElement()
        .accessibilityLabel("Pack progress \(Int(fraction * 100)) percent")
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
