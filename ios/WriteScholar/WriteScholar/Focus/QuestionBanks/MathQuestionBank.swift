//
//  MathQuestionBank.swift
//  WriteScholar
//
//  Procedurally generated arithmetic question bank. ~300 questions
//  spread across:
//    • Multiplication tables 2×2 to 12×12 (121 questions)
//    • Addition  (40)
//    • Subtraction (40)
//    • Squares 2² – 16² (15)
//    • Cubes 2³ – 10³ (9)
//    • Square roots of perfect squares (15)
//    • Percentages of round numbers (24)
//    • Order of operations PEMDAS (12)
//    • Fractions to decimals (10)
//
//  Math is delightfully timeless — none of these answers will drift
//  no matter how old the build is.
//

import Foundation

enum MathQuestionBank {

    static let questions: [QuizQuestion] = generate()

    /// Flashcards for math are generated from the quiz set so users can
    /// drill the same fact in either mode. Front = question, back =
    /// "answer + explanation".
    static let derivedFlashcards: [Flashcard] = questions.prefix(60).map { q in
        Flashcard(
            front: q.question,
            back: "\(q.correctAnswer)\n\n\(q.explanation ?? "")"
        )
    }

    // MARK: - Generators

    private static func generate() -> [QuizQuestion] {
        var qs: [QuizQuestion] = []
        var id = 100_000

        qs.append(contentsOf: multiplication(idStart: &id))
        qs.append(contentsOf: addition(idStart: &id))
        qs.append(contentsOf: subtraction(idStart: &id))
        qs.append(contentsOf: squares(idStart: &id))
        qs.append(contentsOf: cubes(idStart: &id))
        qs.append(contentsOf: squareRoots(idStart: &id))
        qs.append(contentsOf: percentages(idStart: &id))
        qs.append(contentsOf: orderOfOps(idStart: &id))
        qs.append(contentsOf: fractionsToDecimals(idStart: &id))
        return qs
    }

    private static func multiplication(idStart id: inout Int) -> [QuizQuestion] {
        var out: [QuizQuestion] = []
        for a in 2...12 {
            for b in 2...12 {
                let answer = a * b
                let opts = optionsFor(answer: answer, magnitude: max(answer / 4, 4))
                out.append(QuizQuestion(
                    id: id,
                    type: .multipleChoice,
                    question: "What is \(a) × \(b)?",
                    options: opts,
                    correctAnswer: String(answer),
                    explanation: "\(a) × \(b) = \(answer)."
                ))
                id += 1
            }
        }
        return out
    }

    private static func addition(idStart id: inout Int) -> [QuizQuestion] {
        let pairs: [(Int, Int)] = [
            (47, 38), (124, 56), (89, 17), (203, 99), (15, 26),
            (312, 188), (450, 350), (76, 24), (88, 12), (137, 263),
            (505, 95), (44, 56), (101, 99), (250, 750), (33, 67),
            (118, 282), (4_000, 1_999), (235, 165), (812, 188), (66, 34),
            (29, 71), (148, 252), (501, 499), (75, 125), (640, 360),
            (915, 85), (220, 580), (305, 695), (1_750, 250), (95, 605),
            (1_111, 111), (2_500, 500), (789, 211), (333, 667), (210, 90),
            (1_001, 99), (450, 50), (875, 125), (199, 801), (444, 56)
        ]
        var out: [QuizQuestion] = []
        for (a, b) in pairs {
            let answer = a + b
            let opts = optionsFor(answer: answer, magnitude: max(answer / 8, 4))
            out.append(QuizQuestion(
                id: id,
                type: .multipleChoice,
                question: "Solve: \(a) + \(b)",
                options: opts,
                correctAnswer: String(answer),
                explanation: "\(a) + \(b) = \(answer)."
            ))
            id += 1
        }
        return out
    }

    private static func subtraction(idStart id: inout Int) -> [QuizQuestion] {
        let pairs: [(Int, Int)] = [
            (200, 47), (1_000, 333), (450, 175), (88, 19), (501, 99),
            (640, 285), (1_000, 1), (777, 222), (123, 45), (900, 350),
            (1_500, 750), (333, 111), (525, 475), (88, 17), (700, 199),
            (1_001, 999), (812, 412), (250, 175), (4_321, 1_234), (606, 6),
            (1_000_000, 999_001), (815, 16), (444, 44), (888, 188), (520, 95),
            (76, 39), (305, 168), (450, 73), (612, 213), (1_111, 333),
            (250, 17), (730, 245), (910, 510), (1_240, 1_039), (88_000, 1_000),
            (505, 5), (640, 95), (256, 17), (333_333, 33_333), (10_000, 9_001)
        ]
        var out: [QuizQuestion] = []
        for (a, b) in pairs {
            let answer = a - b
            let opts = optionsFor(answer: answer, magnitude: max(answer / 8, 4))
            out.append(QuizQuestion(
                id: id,
                type: .multipleChoice,
                question: "Solve: \(a) − \(b)",
                options: opts,
                correctAnswer: String(answer),
                explanation: "\(a) − \(b) = \(answer)."
            ))
            id += 1
        }
        return out
    }

    private static func squares(idStart id: inout Int) -> [QuizQuestion] {
        var out: [QuizQuestion] = []
        for n in 2...16 {
            let answer = n * n
            let opts = optionsFor(answer: answer, magnitude: max(answer / 4, 5))
            out.append(QuizQuestion(
                id: id,
                type: .multipleChoice,
                question: "What is \(n)²?",
                options: opts,
                correctAnswer: String(answer),
                explanation: "\(n) × \(n) = \(answer)."
            ))
            id += 1
        }
        return out
    }

    private static func cubes(idStart id: inout Int) -> [QuizQuestion] {
        var out: [QuizQuestion] = []
        for n in 2...10 {
            let answer = n * n * n
            let opts = optionsFor(answer: answer, magnitude: max(answer / 4, 6))
            out.append(QuizQuestion(
                id: id,
                type: .multipleChoice,
                question: "What is \(n)³?",
                options: opts,
                correctAnswer: String(answer),
                explanation: "\(n) × \(n) × \(n) = \(answer)."
            ))
            id += 1
        }
        return out
    }

    private static func squareRoots(idStart id: inout Int) -> [QuizQuestion] {
        let perfectSquares = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 400]
        var out: [QuizQuestion] = []
        for sq in perfectSquares {
            let root = Int(Double(sq).squareRoot().rounded())
            let opts = optionsFor(answer: root, magnitude: 4)
            out.append(QuizQuestion(
                id: id,
                type: .multipleChoice,
                question: "What is √\(sq)?",
                options: opts,
                correctAnswer: String(root),
                explanation: "\(root) × \(root) = \(sq)."
            ))
            id += 1
        }
        return out
    }

    private static func percentages(idStart id: inout Int) -> [QuizQuestion] {
        let prompts: [(percent: Int, of: Int)] = [
            (10, 200), (25, 240), (50, 88), (75, 200), (5, 400),
            (20, 150), (40, 250), (15, 200), (60, 150), (90, 100),
            (12, 100), (33, 300), (80, 50), (70, 200), (1, 1_000),
            (2, 500), (8, 250), (35, 200), (45, 400), (55, 200),
            (66, 300), (85, 200), (95, 200), (3, 1_000)
        ]
        var out: [QuizQuestion] = []
        for p in prompts {
            let answer = Int(Double(p.percent) / 100.0 * Double(p.of))
            let opts = optionsFor(answer: answer, magnitude: max(answer / 4, 4))
            out.append(QuizQuestion(
                id: id,
                type: .multipleChoice,
                question: "What is \(p.percent)% of \(p.of)?",
                options: opts,
                correctAnswer: String(answer),
                explanation: "\(p.percent)% of \(p.of) = \(answer)."
            ))
            id += 1
        }
        return out
    }

    private static func orderOfOps(idStart id: inout Int) -> [QuizQuestion] {
        struct Op { let prompt: String; let answer: Int; let why: String }
        let prompts: [Op] = [
            Op(prompt: "2 + 3 × 4",         answer: 14,  why: "Multiply first: 3 × 4 = 12, then 2 + 12."),
            Op(prompt: "(2 + 3) × 4",       answer: 20,  why: "Brackets first: 5 × 4."),
            Op(prompt: "10 − 2 × 3",        answer: 4,   why: "2 × 3 = 6, then 10 − 6."),
            Op(prompt: "20 ÷ 4 + 1",        answer: 6,   why: "20 ÷ 4 = 5, then + 1."),
            Op(prompt: "20 ÷ (4 + 1)",      answer: 4,   why: "Brackets first: 4 + 1 = 5, then 20 ÷ 5."),
            Op(prompt: "3² + 4²",           answer: 25,  why: "9 + 16 = 25."),
            Op(prompt: "100 − 2 × 5²",      answer: 50,  why: "5² = 25, then × 2 = 50, then 100 − 50."),
            Op(prompt: "8 + 12 ÷ 4",        answer: 11,  why: "12 ÷ 4 = 3, then 8 + 3."),
            Op(prompt: "(6 + 4) ÷ 2",       answer: 5,   why: "Brackets: 10, then ÷ 2."),
            Op(prompt: "5 × (6 − 2)",       answer: 20,  why: "Brackets: 4, then × 5."),
            Op(prompt: "2³ × 3",            answer: 24,  why: "2³ = 8, then × 3."),
            Op(prompt: "(3 + 5)² ÷ 4",      answer: 16,  why: "Brackets: 8, then 8² = 64, then ÷ 4.")
        ]
        var out: [QuizQuestion] = []
        for p in prompts {
            let opts = optionsFor(answer: p.answer, magnitude: max(p.answer / 3, 3))
            out.append(QuizQuestion(
                id: id,
                type: .multipleChoice,
                question: "Solve: \(p.prompt)",
                options: opts,
                correctAnswer: String(p.answer),
                explanation: p.why
            ))
            id += 1
        }
        return out
    }

    private static func fractionsToDecimals(idStart id: inout Int) -> [QuizQuestion] {
        struct F { let prompt: String; let answer: String; let why: String }
        let items: [F] = [
            F(prompt: "What is 1/2 as a decimal?",  answer: "0.5",   why: "1 ÷ 2 = 0.5"),
            F(prompt: "What is 1/4 as a decimal?",  answer: "0.25",  why: "1 ÷ 4 = 0.25"),
            F(prompt: "What is 3/4 as a decimal?",  answer: "0.75",  why: "3 ÷ 4 = 0.75"),
            F(prompt: "What is 1/5 as a decimal?",  answer: "0.2",   why: "1 ÷ 5 = 0.2"),
            F(prompt: "What is 1/8 as a decimal?",  answer: "0.125", why: "1 ÷ 8 = 0.125"),
            F(prompt: "What is 1/10 as a decimal?", answer: "0.1",   why: "1 ÷ 10 = 0.1"),
            F(prompt: "What is 3/5 as a decimal?",  answer: "0.6",   why: "3 ÷ 5 = 0.6"),
            F(prompt: "What is 2/5 as a decimal?",  answer: "0.4",   why: "2 ÷ 5 = 0.4"),
            F(prompt: "What is 7/10 as a decimal?", answer: "0.7",   why: "7 ÷ 10 = 0.7"),
            F(prompt: "What is 5/8 as a decimal?",  answer: "0.625", why: "5 ÷ 8 = 0.625")
        ]
        let distractors = ["0.1", "0.2", "0.25", "0.3", "0.4", "0.5", "0.6", "0.625", "0.7", "0.75", "0.8", "0.85", "0.9", "0.95", "0.125", "0.15"]
        var out: [QuizQuestion] = []
        for f in items {
            var opts = Set<String>()
            opts.insert(f.answer)
            while opts.count < 4 {
                if let pick = distractors.randomElement(), pick != f.answer { opts.insert(pick) }
            }
            out.append(QuizQuestion(
                id: id,
                type: .multipleChoice,
                question: f.prompt,
                options: Array(opts).shuffled(),
                correctAnswer: f.answer,
                explanation: f.why
            ))
            id += 1
        }
        return out
    }

    // MARK: - Distractor generator

    /// Build 4 multiple-choice options containing the correct answer and
    /// three near-misses. Distractors are picked from a deterministic
    /// neighborhood so the same question always shows the same options
    /// (good for fairness) but the order is shuffled at presentation
    /// time inside FocusUnlockChallenge.
    private static func optionsFor(answer: Int, magnitude: Int) -> [String] {
        var set = Set<Int>()
        set.insert(answer)
        let m = max(magnitude, 2)
        let candidates = [answer - m, answer + m, answer - 1, answer + 1, answer - 2 * m, answer + 2 * m, answer - 3, answer + 3]
        for c in candidates {
            if c >= 0 && c != answer {
                set.insert(c)
                if set.count >= 4 { break }
            }
        }
        // Pad if we somehow ended up short
        var n = answer + 5
        while set.count < 4 {
            n += 3
            if n != answer { set.insert(n) }
        }
        return set.map { String($0) }
    }
}
