//
//  FocusQuestionRegistry.swift
//  WriteScholar
//
//  Central index for the topic-based question banks used by
//  FocusUnlockChallenge when the user has no saved study packs (or has
//  switched away from "use my packs").
//
//  Each topic bank is its own file under Focus/QuestionBanks/. They all
//  expose `static let questions: [QuizQuestion]` and (where it makes
//  sense) `static let flashcards: [Flashcard]`. This registry stitches
//  them together based on the user's selected topics.
//

import Foundation

enum FocusQuestionRegistry {

    // MARK: - Quiz pool

    /// Returns up to `count` quiz questions drawn from the union of the
    /// user's selected topics. If `topics` is empty, falls back to the
    /// general-trivia bank so the challenge always has something to
    /// throw at the user.
    static func quiz(for topics: Set<FocusTopic>, count: Int = 5) -> [QuizQuestion] {
        let pool = aggregateQuestions(for: topics)
        guard !pool.isEmpty else { return FocusSampleQuestions.randomQuizSet() }
        return Array(pool.shuffled().prefix(count))
    }

    /// Up to `count` flashcards from the union of selected topics. Only
    /// some topics ship flashcards (vocabulary, science definitions);
    /// others fall through to the curated fallback bank.
    static func flashcards(for topics: Set<FocusTopic>, count: Int = 5) -> [Flashcard] {
        let pool = aggregateFlashcards(for: topics)
        guard !pool.isEmpty else { return FocusSampleQuestions.randomFlashcardSet() }
        return Array(pool.shuffled().prefix(count))
    }

    // MARK: - Per-topic accessors (also handy for previews / debug)

    static func questions(for topic: FocusTopic) -> [QuizQuestion] {
        switch topic {
        case .math:       return MathQuestionBank.questions
        case .science:    return ScienceQuestionBank.questions
        case .history:    return HistoryQuestionBank.questions
        case .geography:  return GeographyQuestionBank.questions
        case .vocabulary: return VocabularyQuestionBank.questions
        case .music:      return MusicQuestionBank.questions
        case .sports:     return SportsQuestionBank.questions
        case .trivia:     return GeneralTriviaQuestionBank.questions
        }
    }

    static func flashcards(for topic: FocusTopic) -> [Flashcard] {
        switch topic {
        case .vocabulary: return VocabularyQuestionBank.flashcards
        case .science:    return ScienceQuestionBank.flashcards
        case .history:    return HistoryQuestionBank.flashcards
        case .geography:  return GeographyQuestionBank.flashcards
        case .music:      return MusicQuestionBank.flashcards
        // Math, sports, trivia don't ship flashcards — they fall back to
        // a derivation from the quiz bank when needed.
        case .math:       return MathQuestionBank.derivedFlashcards
        case .sports:     return SportsQuestionBank.flashcards
        case .trivia:     return GeneralTriviaQuestionBank.flashcards
        }
    }

    /// Total counts surfaced in the settings sheet ("Math · 312 questions").
    static func count(for topic: FocusTopic) -> Int {
        questions(for: topic).count
    }

    // MARK: - Private aggregation

    private static func aggregateQuestions(for topics: Set<FocusTopic>) -> [QuizQuestion] {
        var pool: [QuizQuestion] = []
        for topic in topics {
            pool.append(contentsOf: questions(for: topic))
        }
        return pool
    }

    private static func aggregateFlashcards(for topics: Set<FocusTopic>) -> [Flashcard] {
        var pool: [Flashcard] = []
        for topic in topics {
            pool.append(contentsOf: flashcards(for: topic))
        }
        return pool
    }
}
