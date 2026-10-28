//
//  StudyModeDeckBuilder.swift
//  WriteScholar
//
//  Turns the user's study packs into the questions Study Mode asks
//  before an app opens. The question screen only has two buttons, so
//  every question becomes a prompt with the right answer and one wrong
//  one, taken from the same question's options or from a sibling card.
//
//  Answers that are too long for a button are skipped rather than cut
//  off, so a long-answer pack can produce fewer questions than it has.
//  If the packs give too few, the Focus topic banks fill in.
//
//  Option order and the wrong answer are derived from the question's ID,
//  not random, so rebuilding the deck while a question is on screen can
//  never change which button is the right one.
//

import Foundation

@MainActor
enum StudyModeDeckBuilder {

    struct Result {
        let questions: [StudyGateQuestion]
        /// Packs that contributed at least one question.
        let packCount: Int
        /// True when topic-bank questions were added to fill the deck.
        let usesTopicBanks: Bool
    }

    /// Longer button labels get cut off on Apple's question screen.
    static let maxOptionLength = 30
    static let maxPromptLength = 220
    /// Below this many pack questions, the topic banks fill in.
    static let minFromPacks = 8
    static let maxDeck = 400

    static func build(config: StudyModeConfig, topics: Set<FocusTopic>) -> Result {
        let items = LibraryStore.shared.items.filter { item in
            item.kind == .studyPack && (config.packIDs.isEmpty || config.packIDs.contains(item.id))
        }

        var questions: [StudyGateQuestion] = []
        var packCount = 0
        for item in items {
            guard let pack = StudyPackPersistence.shared.loadPack(for: item.id) else { continue }
            let fromPack = self.questions(from: pack, source: item.title, packID: item.id)
            if !fromPack.isEmpty {
                packCount += 1
                questions += fromPack
            }
        }

        var usesTopicBanks = false
        if questions.count < minFromPacks {
            usesTopicBanks = true
            let pool = topics.isEmpty ? Set(FocusTopic.allCases) : topics
            for topic in pool.sorted(by: { $0.rawValue < $1.rawValue }) {
                let bank = FocusQuestionRegistry.questions(for: topic)
                for (i, q) in bank.enumerated() {
                    if let g = gateQuestion(from: q, siblings: bank, source: topic.label, id: "topic-\(topic.rawValue)-\(i)") {
                        questions.append(g)
                    }
                }
            }
        }

        var seen = Set<String>()
        questions = questions.filter { seen.insert($0.prompt.lowercased()).inserted }
        return Result(
            questions: Array(questions.shuffled().prefix(maxDeck)),
            packCount: packCount,
            usesTopicBanks: usesTopicBanks
        )
    }

    // MARK: - Unlock-everything challenge

    /// Multiple-choice quiz questions from the chosen packs (all packs when
    /// none are chosen), for the 5-question challenge. Empty when packs
    /// don't have enough, so the caller can fall back to the sample bank.
    static func challengeQuiz(config: StudyModeConfig, count: Int = 5) -> [QuizQuestion] {
        let pool = packs(for: config)
            .flatMap { $0.quiz?.questions ?? [] }
            .filter { ($0.options?.count ?? 0) >= 2 && !$0.correctAnswer.isEmpty }
        return pool.count >= count ? Array(pool.shuffled().prefix(count)) : []
    }

    /// Flashcards from the chosen packs, for the challenge's card rounds.
    static func challengeFlashcards(config: StudyModeConfig, count: Int = 5) -> [Flashcard] {
        let pool = packs(for: config).flatMap { $0.flashcards?.cards ?? [] }
        return pool.count >= count ? Array(pool.shuffled().prefix(count)) : []
    }

    private static func packs(for config: StudyModeConfig) -> [StudyPack] {
        LibraryStore.shared.items
            .filter { $0.kind == .studyPack && (config.packIDs.isEmpty || config.packIDs.contains($0.id)) }
            .compactMap { StudyPackPersistence.shared.loadPack(for: $0.id) }
    }

    // MARK: - Per pack

    static func questions(from pack: StudyPack, source: String, packID: String) -> [StudyGateQuestion] {
        var out: [StudyGateQuestion] = []
        let quiz = pack.quiz?.questions ?? []
        for (i, q) in quiz.enumerated() {
            if let g = gateQuestion(from: q, siblings: quiz, source: source, id: "\(packID)-q\(i)") {
                out.append(g)
            }
        }
        let cards = pack.flashcards?.cards ?? []
        for (i, card) in cards.enumerated() {
            if let g = gateQuestion(from: card, siblings: cards, source: source, id: "\(packID)-f\(i)") {
                out.append(g)
            }
        }
        return out
    }

    // MARK: - Quiz questions

    static func gateQuestion(from q: QuizQuestion, siblings: [QuizQuestion], source: String, id: String) -> StudyGateQuestion? {
        let prompt = clean(q.question)
        let correct = clean(q.correctAnswer)
        guard !prompt.isEmpty, prompt.count <= maxPromptLength, fits(correct) else { return nil }

        let type = q.type ?? ((q.options?.isEmpty == false) ? .multipleChoice : .fillBlank)
        let wrongs: [String]
        switch type {
        case .trueFalse:
            let answer = correct.lowercased()
            guard answer == "true" || answer == "false" else { return nil }
            // True/False keeps its natural order; there is nothing to guess from it.
            return StudyGateQuestion(id: id, prompt: prompt, options: ["True", "False"],
                                     correctIndex: answer == "true" ? 0 : 1, source: source)
        case .multipleChoice:
            wrongs = (q.options ?? []).map(clean)
        case .fillBlank:
            wrongs = siblings.map { clean($0.correctAnswer) }
        }
        return pair(id: id, prompt: prompt, correct: correct, candidates: wrongs, source: source)
    }

    // MARK: - Flashcards

    static func gateQuestion(from card: Flashcard, siblings: [Flashcard], source: String, id: String) -> StudyGateQuestion? {
        let front = clean(card.front)
        let back = clean(card.back)
        guard !front.isEmpty, !back.isEmpty else { return nil }

        if fits(back), front.count <= maxPromptLength {
            // Question on the front, short answer on the back.
            return pair(id: id, prompt: front, correct: back,
                        candidates: siblings.map { clean($0.back) }, source: source)
        }
        if fits(front), back.count <= maxPromptLength {
            // Term on the front, definition on the back: ask for the term.
            return pair(id: id, prompt: "Which term matches this?\n\(back)", correct: front,
                        candidates: siblings.map { clean($0.front) }, source: source)
        }
        return nil
    }

    // MARK: - Helpers

    private static func pair(id: String, prompt: String, correct: String, candidates: [String], source: String) -> StudyGateQuestion? {
        let wrongs = candidates.filter { fits($0) && $0.lowercased() != correct.lowercased() }
        guard !wrongs.isEmpty else { return nil }
        let h = stableHash(id)
        let wrong = wrongs[Int(h % UInt64(wrongs.count))]
        let correctFirst = (h >> 8) & 1 == 0
        return StudyGateQuestion(
            id: id,
            prompt: prompt,
            options: correctFirst ? [correct, wrong] : [wrong, correct],
            correctIndex: correctFirst ? 0 : 1,
            source: source
        )
    }

    private static func fits(_ answer: String) -> Bool {
        !answer.isEmpty && answer.count <= maxOptionLength
    }

    private static func clean(_ text: String) -> String {
        text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// djb2. Swift's `hashValue` is reseeded every launch, which would
    /// shuffle the answer buttons between rebuilds.
    private static func stableHash(_ s: String) -> UInt64 {
        var h: UInt64 = 5381
        for byte in s.utf8 { h = (h &<< 5) &+ h &+ UInt64(byte) }
        return h
    }
}
