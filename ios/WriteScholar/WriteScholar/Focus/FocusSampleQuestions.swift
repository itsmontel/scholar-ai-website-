//
//  FocusSampleQuestions.swift
//  WriteScholar
//
//  Fallback question + flashcard banks used by FocusUnlockChallenge when
//  the user hasn't generated a study pack yet (or has revoked access to
//  their packs). Once the user generates packs, the challenge prefers
//  the most recent pack's questions instead.
//
//  These are intentionally mixed-subject general-knowledge items so they
//  feel like the kind of "wake-your-brain" prompts the Chrome extension
//  shows on the unlock-quiz page.
//

import Foundation

enum FocusSampleQuestions {

    // MARK: - Quiz

    static let quiz: [QuizQuestion] = [
        QuizQuestion(
            id: 1,
            type: .multipleChoice,
            question: "Which planet has the most moons in our solar system?",
            options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
            correctAnswer: "Saturn",
            explanation: "Saturn has 146 confirmed moons — more than any other planet."
        ),
        QuizQuestion(
            id: 2,
            type: .multipleChoice,
            question: "Who wrote the play 'A Midsummer Night's Dream'?",
            options: ["Christopher Marlowe", "William Shakespeare", "Ben Jonson", "John Webster"],
            correctAnswer: "William Shakespeare",
            explanation: "Shakespeare wrote it in the mid-1590s."
        ),
        QuizQuestion(
            id: 3,
            type: .multipleChoice,
            question: "What is the powerhouse of the cell?",
            options: ["Ribosome", "Nucleus", "Mitochondrion", "Golgi apparatus"],
            correctAnswer: "Mitochondrion",
            explanation: "Mitochondria generate ATP, the cell's main energy currency."
        ),
        QuizQuestion(
            id: 4,
            type: .multipleChoice,
            question: "Solve: 12 × 12 − 44",
            options: ["96", "100", "104", "108"],
            correctAnswer: "100",
            explanation: "144 − 44 = 100."
        ),
        QuizQuestion(
            id: 5,
            type: .multipleChoice,
            question: "What is the chemical symbol for potassium?",
            options: ["P", "Po", "Pt", "K"],
            correctAnswer: "K",
            explanation: "From the Latin 'kalium'."
        ),
        QuizQuestion(
            id: 6,
            type: .multipleChoice,
            question: "Which country is the Great Pyramid of Giza in?",
            options: ["Sudan", "Egypt", "Iraq", "Mexico"],
            correctAnswer: "Egypt",
            explanation: "It's just outside Cairo, on the Giza plateau."
        ),
        QuizQuestion(
            id: 7,
            type: .multipleChoice,
            question: "What is 25% of 240?",
            options: ["48", "60", "72", "90"],
            correctAnswer: "60",
            explanation: "240 ÷ 4 = 60."
        ),
        QuizQuestion(
            id: 8,
            type: .multipleChoice,
            question: "Which gas do plants absorb from the atmosphere for photosynthesis?",
            options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
            correctAnswer: "Carbon dioxide",
            explanation: "CO₂ is converted to glucose using sunlight."
        ),
        QuizQuestion(
            id: 9,
            type: .multipleChoice,
            question: "Who painted the ceiling of the Sistine Chapel?",
            options: ["Leonardo da Vinci", "Raphael", "Michelangelo", "Donatello"],
            correctAnswer: "Michelangelo",
            explanation: "Painted between 1508 and 1512."
        ),
        QuizQuestion(
            id: 10,
            type: .multipleChoice,
            question: "What is the capital of Australia?",
            options: ["Sydney", "Melbourne", "Canberra", "Perth"],
            correctAnswer: "Canberra",
            explanation: "Canberra was selected as a compromise between Sydney and Melbourne."
        ),
        QuizQuestion(
            id: 11,
            type: .multipleChoice,
            question: "In which century did the French Revolution begin?",
            options: ["17th", "18th", "19th", "20th"],
            correctAnswer: "18th",
            explanation: "It started in 1789."
        ),
        QuizQuestion(
            id: 12,
            type: .multipleChoice,
            question: "Solve: √196",
            options: ["12", "13", "14", "16"],
            correctAnswer: "14",
            explanation: "14 × 14 = 196."
        )
    ]

    // MARK: - Flashcards

    static let flashcards: [Flashcard] = [
        Flashcard(front: "Mitosis",          back: "Cell division producing two identical daughter cells."),
        Flashcard(front: "Iambic pentameter", back: "A line of verse with five iambs (10 syllables, alternating stress)."),
        Flashcard(front: "Pythagoras' theorem", back: "a² + b² = c² in a right-angled triangle."),
        Flashcard(front: "Treaty of Versailles", back: "1919 peace treaty that ended WWI between Germany and the Allies."),
        Flashcard(front: "Avogadro's number",  back: "≈ 6.022 × 10²³ — particles in one mole."),
        Flashcard(front: "Onomatopoeia",       back: "A word that imitates the sound it represents (e.g. 'buzz')."),
        Flashcard(front: "Standard deviation", back: "A measure of how spread out values are around the mean."),
        Flashcard(front: "Photosynthesis",     back: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂."),
        Flashcard(front: "Hyperbole",          back: "Deliberate exaggeration for emphasis."),
        Flashcard(front: "Newton's 2nd law",   back: "F = m × a (force equals mass times acceleration).")
    ]

    // MARK: - Helpers

    /// Returns five quiz questions at random with options shuffled.
    static func randomQuizSet() -> [QuizQuestion] {
        Array(quiz.shuffled().prefix(5))
    }

    /// Returns five flashcards at random.
    static func randomFlashcardSet() -> [Flashcard] {
        Array(flashcards.shuffled().prefix(5))
    }
}
