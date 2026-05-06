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

struct StudyPack: Decodable, Equatable {
    let lesson: Lesson?
    let flashcards: Flashcards?
    let quiz: Quiz?
    let crossword: Crossword?
    let craterBlast: CraterBlast?
    let wordTower: WordTower?
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

struct Lesson: Decodable {
    let title: String?
    let slides: [LessonSlide]
}

struct LessonSlide: Decodable, Identifiable {
    let id: Int?
    let type: SlideType?
    let title: String
    let content: String
    let emoji: String?
    let bulletPoints: [String]?
    let highlightedTerm: String?

    /// Stable identity for `ForEach` even when backend omits `id`.
    var stableId: String { "\(id ?? -1)-\(title)" }

    enum SlideType: String, Decodable {
        case intro, concept, example, keypoint, funfact, summary
    }
}

// MARK: - Flashcards

struct Flashcards: Decodable {
    let title: String?
    let cards: [Flashcard]
}

struct Flashcard: Decodable, Identifiable {
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

struct Quiz: Decodable {
    let title: String?
    let questions: [QuizQuestion]
}

struct QuizQuestion: Decodable, Identifiable {
    let id: Int?
    let type: QuestionType?
    let question: String
    let options: [String]?
    let correctAnswer: String
    let explanation: String?

    var stableId: String { "\(id ?? -1)-\(question.prefix(40))" }

    enum QuestionType: String, Decodable {
        case multipleChoice = "multiple_choice"
        case trueFalse = "true_false"
        case fillBlank = "fill_blank"
    }
}

// MARK: - Crossword (basic shape; full game lives in Chapter 5 web view)

struct Crossword: Decodable {
    let title: String?
    let words: [CrosswordWord]?
}

struct CrosswordWord: Decodable {
    let word: String
    let clue: String
    let direction: String?       // "across" / "down"
    let row: Int?
    let column: Int?
}

// MARK: - Crater Blast (fast-paced quiz arcade)

struct CraterBlast: Decodable {
    let title: String?
    let questions: [CraterBlastQuestion]
}

struct CraterBlastQuestion: Decodable, Identifiable {
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

struct WordTower: Decodable {
    let title: String?
    let questions: [WordTowerQuestion]
}

struct WordTowerQuestion: Decodable, Identifiable {
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

struct WordTowerItem: Decodable, Identifiable, Equatable {
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
