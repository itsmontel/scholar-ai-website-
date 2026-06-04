//
//  StudyPack.swift
//  WriteScholar
//
//  Mirrors the JSON returned by POST /api/analysis/generate-study-pack.
//  Free users may receive `nil` for the gated tools (quiz, crossword,
//  craterBlast, wordTower) — the UI checks each field before rendering.
//

import Foundation

// MARK: - Top-level pack

struct StudyPack: Codable, Equatable {
    let lesson: Lesson?
    let flashcards: Flashcards?
    let quiz: Quiz?
    let crossword: Crossword?
    let craterBlast: CraterBlast?
    let wordTower: WordTower?
    /// Defaulted so existing `StudyPack(...)` call sites (previews/mocks) keep
    /// compiling; Codable still decodes the backend's `wordBlitz` when present.
    var wordBlitz: WordBlitz? = nil
    let originalNotes: String?

    /// Title used to label the pack in the library.
    var displayTitle: String {
        quiz?.title
            ?? flashcards?.title
            ?? lesson?.title
            ?? "Study pack"
    }

    static func == (lhs: StudyPack, rhs: StudyPack) -> Bool {
        lhs.displayTitle == rhs.displayTitle
            && (lhs.lesson?.slides.count ?? 0) == (rhs.lesson?.slides.count ?? 0)
            && (lhs.flashcards?.cards.count ?? 0) == (rhs.flashcards?.cards.count ?? 0)
            && (lhs.quiz?.questions.count ?? 0) == (rhs.quiz?.questions.count ?? 0)
    }
}

// MARK: - Lesson

struct Lesson: Codable {
    let title: String?
    let slides: [LessonSlide]
}

struct LessonSlide: Codable, Identifiable {
    let id: Int?
    let type: SlideType?
    let title: String
    let content: String
    let emoji: String?
    let bulletPoints: [String]?
    let highlightedTerm: String?

    /// Stable identity for `ForEach` even when backend omits `id`.
    var stableId: String { "\(id ?? -1)-\(title)" }

    enum SlideType: String, Codable {
        case intro, concept, example, keypoint, funfact, summary
    }
}

// MARK: - Flashcards

struct Flashcards: Codable {
    let title: String?
    let cards: [Flashcard]
}

struct Flashcard: Codable, Identifiable {
    let id: String   // synthesized below
    let front: String
    let back: String

    enum CodingKeys: String, CodingKey {
        case front, back
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        front = try c.decode(String.self, forKey: .front)
        back  = try c.decode(String.self, forKey: .back)
        id = UUID().uuidString
    }

    init(id: String = UUID().uuidString, front: String, back: String) {
        self.id = id
        self.front = front
        self.back  = back
    }
}

// MARK: - Quiz

struct Quiz: Codable {
    let title: String?
    let questions: [QuizQuestion]
}

struct QuizQuestion: Codable, Identifiable {
    let id: Int?
    let type: QuestionType?
    let question: String
    let options: [String]?
    let correctAnswer: String
    let explanation: String?

    var stableId: String { "\(id ?? -1)-\(question.prefix(40))" }

    enum QuestionType: String, Codable {
        case multipleChoice = "multiple_choice"
        case trueFalse = "true_false"
        case fillBlank = "fill_blank"
    }
}

// MARK: - Crossword (basic shape; full game lives in Chapter 5 web view)

struct Crossword: Codable {
    let title: String?
    let words: [CrosswordWord]?
}

struct CrosswordWord: Codable {
    let word: String
    let clue: String
    let direction: String?       // "across" / "down"
    let row: Int?
    let column: Int?
}

// MARK: - Crater Blast (fast-paced quiz arcade)

struct CraterBlast: Codable {
    let title: String?
    let questions: [CraterBlastQuestion]
}

struct CraterBlastQuestion: Codable, Identifiable {
    let id: String
    let prompt: String
    let answers: [String]
    /// Backend always emits the correct answer at index 0 so the client
    /// can shuffle for display. We keep the original correct text on
    /// hand so we can score regardless of post-shuffle position.
    let correctIndex: Int

    enum CodingKeys: String, CodingKey {
        case id, prompt, answers, correctIndex
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id           = (try? c.decode(String.self, forKey: .id)) ?? UUID().uuidString
        prompt       = try c.decode(String.self, forKey: .prompt)
        answers      = (try? c.decode([String].self, forKey: .answers)) ?? []
        correctIndex = (try? c.decode(Int.self, forKey: .correctIndex)) ?? 0
    }

    /// The text of the correct answer (resilient to bad indices).
    var correctText: String {
        guard answers.indices.contains(correctIndex) else { return answers.first ?? "" }
        return answers[correctIndex]
    }
}

// MARK: - Word Tower (stack the correct items)

struct WordTower: Codable {
    let title: String?
    let questions: [WordTowerQuestion]
}

struct WordTowerQuestion: Codable, Identifiable {
    let id: String
    let prompt: String
    let items: [WordTowerItem]

    enum CodingKeys: String, CodingKey {
        case id, prompt, items
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id     = (try? c.decode(String.self, forKey: .id)) ?? UUID().uuidString
        prompt = try c.decode(String.self, forKey: .prompt)
        items  = (try? c.decode([WordTowerItem].self, forKey: .items)) ?? []
    }
}

struct WordTowerItem: Codable, Identifiable, Equatable {
    let id: String
    let text: String
    let isCorrect: Bool

    enum CodingKeys: String, CodingKey {
        case text, isCorrect
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        text      = try c.decode(String.self, forKey: .text)
        isCorrect = try c.decode(Bool.self,   forKey: .isCorrect)
        id = UUID().uuidString
    }

    init(id: String = UUID().uuidString, text: String, isCorrect: Bool) {
        self.id = id
        self.text = text
        self.isCorrect = isCorrect
    }
}

// MARK: - Word Blitz (60-second fill-in-the-blank speedrun)

struct WordBlitz: Codable {
    let title: String?
    let questions: [WordBlitzQuestion]
}

struct WordBlitzQuestion: Codable, Identifiable {
    let id: String
    /// Sentence containing the literal "{{blank}}" token.
    let sentence: String
    let correctAnswer: String
    let distractors: [String]

    enum CodingKeys: String, CodingKey { case id, sentence, correctAnswer, distractors }

    init(id: String = UUID().uuidString, sentence: String, correctAnswer: String, distractors: [String]) {
        self.id = id
        self.sentence = sentence
        self.correctAnswer = correctAnswer
        self.distractors = distractors
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id            = (try? c.decode(String.self, forKey: .id)) ?? UUID().uuidString
        sentence      = try c.decode(String.self, forKey: .sentence)
        correctAnswer = try c.decode(String.self, forKey: .correctAnswer)
        distractors   = (try? c.decode([String].self, forKey: .distractors)) ?? []
    }

    /// Correct answer + distractors (shuffle for display in the view).
    var options: [String] { [correctAnswer] + distractors }
}
