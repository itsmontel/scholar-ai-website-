//
//  WordTowerBank.swift
//  WriteScholar
//
//  Direct port of the desktop banks:
//    - src/data/wordTowerWordBank.ts        (20 fixed Play-for-Fun questions)
//    - src/data/wordTowerMentalMathBank.ts  (procedural mental math)
//
//  Each entry produces a `WordTowerQuestion` ready to feed into the
//  native iOS WordTowerView. Item ordering is randomized at game start
//  inside the view, just like desktop.
//

import Foundation

enum WordTowerBank {

    // MARK: - 20 fixed Play-for-Fun questions (port of WORD_TOWER_WORD_BANK)

    static let playForFun: [WordTowerQuestion] = [
        Self.q("Which of these are mammals?", [
            ("Whale", true), ("Salmon", false), ("Bat", true),
            ("Lizard", false), ("Dolphin", true), ("Eagle", false)
        ]),
        Self.q("Which of these are planets in our solar system?", [
            ("Mars", true), ("Pluto", false), ("Venus", true),
            ("Europa", false), ("Saturn", true), ("Sirius", false)
        ]),
        Self.q("Which of these are primary colors?", [
            ("Red", true), ("Green", false), ("Blue", true),
            ("Orange", false), ("Yellow", true), ("Purple", false)
        ]),
        Self.q("Which are countries in Europe?", [
            ("France", true), ("Egypt", false), ("Spain", true),
            ("Brazil", false), ("Italy", true), ("Japan", false)
        ]),
        Self.q("Which of these are NOT mammals?", [
            ("Shark", true), ("Tiger", false), ("Eagle", true),
            ("Horse", false), ("Frog", true), ("Wolf", false)
        ]),
        Self.q("Which are noble gases?", [
            ("Helium", true), ("Oxygen", false), ("Neon", true),
            ("Carbon", false), ("Argon", true), ("Iron", false)
        ]),
        Self.q("Which are Shakespeare plays?", [
            ("Hamlet", true), ("Faust", false), ("Macbeth", true),
            ("Oedipus", false), ("Othello", true), ("Iliad", false)
        ]),
        Self.q("Which are programming languages?", [
            ("Python", true), ("Linux", false), ("Ruby", true),
            ("Apache", false), ("Rust", true), ("Docker", false)
        ]),
        Self.q("Which of these are oceans?", [
            ("Pacific", true), ("Caspian", false), ("Atlantic", true),
            ("Mediterranean", false), ("Indian", true), ("Baltic", false)
        ]),
        Self.q("Which are reptiles?", [
            ("Snake", true), ("Salamander", false), ("Turtle", true),
            ("Newt", false), ("Crocodile", true), ("Toad", false)
        ]),
        Self.q("Which are even numbers?", [
            ("12", true), ("7", false), ("30", true),
            ("15", false), ("48", true), ("21", false)
        ]),
        Self.q("Which are prime numbers?", [
            ("7", true), ("9", false), ("13", true),
            ("21", false), ("17", true), ("25", false)
        ]),
        Self.q("Which are continents?", [
            ("Asia", true), ("Greenland", false), ("Africa", true),
            ("Arabia", false), ("Europe", true), ("Siberia", false)
        ]),
        Self.q("Which are precious metals?", [
            ("Gold", true), ("Iron", false), ("Silver", true),
            ("Copper", false), ("Platinum", true), ("Tin", false)
        ]),
        Self.q("Which are types of triangle?", [
            ("Scalene", true), ("Hexagonal", false), ("Isosceles", true),
            ("Trapezoid", false), ("Equilateral", true), ("Rhombic", false)
        ]),
        Self.q("Which are Greek gods?", [
            ("Zeus", true), ("Thor", false), ("Apollo", true),
            ("Odin", false), ("Athena", true), ("Loki", false)
        ]),
        Self.q("Which are NOT fruits?", [
            ("Carrot", true), ("Apple", false), ("Broccoli", true),
            ("Mango", false), ("Spinach", true), ("Banana", false)
        ]),
        Self.q("Which are dinosaurs?", [
            ("T-Rex", true), ("Mammoth", false), ("Velociraptor", true),
            ("Sabertooth", false), ("Stegosaurus", true), ("Dodo", false)
        ]),
        Self.q("Which are US states?", [
            ("Texas", true), ("Toronto", false), ("Oregon", true),
            ("Quebec", false), ("Nevada", true), ("Ontario", false)
        ]),
        Self.q("Which of these are vowels?", [
            ("A", true), ("B", false), ("E", true),
            ("K", false), ("U", true), ("T", false)
        ])
    ]

    // MARK: - Procedurally generated mental math (port of WORD_TOWER_MENTAL_MATH_BANK)

    /// Builds a fresh mental-math bank — 8 even/odd, 6 prime, 7 multiples,
    /// 5 perfect squares (matches desktop counts).
    static func mentalMath() -> [WordTowerQuestion] {
        var out: [WordTowerQuestion] = []
        out += buildEvenOdd()
        out += buildPrimes()
        out += buildMultiples()
        out += buildSquares()
        return out
    }

    // MARK: - Combined "Play" pool

    /// Random shuffle of all questions used by the iOS Games tab demo
    /// so users hit every category over a long session.
    static func combinedPool() -> [WordTowerQuestion] {
        (playForFun + mentalMath()).shuffled()
    }

    // MARK: - Helpers

    private static func q(_ prompt: String, _ items: [(String, Bool)]) -> WordTowerQuestion {
        let json: [String: Any] = [
            "id": UUID().uuidString,
            "prompt": prompt,
            "items": items.map { ["text": $0.0, "isCorrect": $0.1] }
        ]
        let data = try! JSONSerialization.data(withJSONObject: json)
        return try! JSONDecoder().decode(WordTowerQuestion.self, from: data)
    }

    // MARK: - Mental math generators (mirror desktop's pickN + builders)

    private static func pickN<T>(_ arr: [T], _ n: Int) -> [T] {
        Array(arr.shuffled().prefix(n))
    }

    private static func buildEvenOdd() -> [WordTowerQuestion] {
        var out: [WordTowerQuestion] = []
        for _ in 0..<8 {
            var evens = Set<Int>()
            var odds = Set<Int>()
            while evens.count < 3 { evens.insert(2 + Int.random(in: 0..<60) * 2) }
            while odds.count  < 3 { odds.insert(1 + Int.random(in: 0..<60) * 2) }
            let items = evens.map { (String($0), true) } + odds.map { (String($0), false) }
            out.append(q("Which are even numbers?", items))
        }
        return out
    }

    private static func buildPrimes() -> [WordTowerQuestion] {
        let primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
        let composites = [4, 6, 8, 9, 10, 14, 15, 16, 21, 25, 27, 33, 35, 39, 49]
        var out: [WordTowerQuestion] = []
        for _ in 0..<6 {
            let items = pickN(primes, 3).map { (String($0), true) }
                      + pickN(composites, 3).map { (String($0), false) }
            out.append(q("Which are prime numbers?", items))
        }
        return out
    }

    private static func buildMultiples() -> [WordTowerQuestion] {
        var out: [WordTowerQuestion] = []
        for b in [3, 4, 5, 6, 7, 8, 9] {
            let multiples = (1...12).map { b * $0 }
            let non = (2...100).filter { $0 % b != 0 }
            let items = pickN(multiples, 3).map { (String($0), true) }
                      + pickN(non, 3).map       { (String($0), false) }
            out.append(q("Which are multiples of \(b)?", items))
        }
        return out
    }

    private static func buildSquares() -> [WordTowerQuestion] {
        let squares = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]
        let non = [2, 3, 5, 8, 10, 12, 15, 17, 22, 30, 50, 60, 70, 90, 110, 130]
        var out: [WordTowerQuestion] = []
        for _ in 0..<5 {
            let items = pickN(squares, 3).map { (String($0), true) }
                      + pickN(non, 3).map     { (String($0), false) }
            out.append(q("Which are perfect squares?", items))
        }
        return out
    }
}
