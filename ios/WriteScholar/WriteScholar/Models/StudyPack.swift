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

// MARK: - Crater Blast & Word Tower (full games ship in Chapter 5)

struct CraterBlast: Decodable {
    let title: String?
    let questions: [JSONNullable]?  // Opaque for now
}

struct WordTower: Decodable {
    let title: String?
    let questions: [JSONNullable]?
}

/// JSON value passthrough so the WebView can hand the raw blob to the
/// existing web game without us having to re-model it on Swift.
struct JSONNullable: Decodable {}
