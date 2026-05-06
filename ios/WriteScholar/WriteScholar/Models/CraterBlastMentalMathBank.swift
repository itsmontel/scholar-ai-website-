//
//  CraterBlastMentalMathBank.swift
//  WriteScholar
//
//  Direct port of src/data/craterBlastMentalMathBank.ts. Procedurally
//  generates ~250 mental-math questions: multiplication tables 1×1
//  through 12×12, division (inverse of the multiplication grid), a curated
//  addition set, and a sweep of subtraction. Identical algorithm to the
//  desktop build() function so output sizes track 1:1.
//

import Foundation

enum CraterBlastMentalMathBank {

    static let all: [CraterBlastQuestion] = build()

    static func shuffledPool(limit: Int? = nil) -> [CraterBlastQuestion] {
        let pool = all.shuffled()
        if let n = limit { return Array(pool.prefix(n)) }
        return pool
    }

    // MARK: - Builder (mirrors the JS `build()` exactly)

    private static func build() -> [CraterBlastQuestion] {
        var out: [(String, [String])] = []
        var keys = Set<String>()

        // Multiplication grid: 1..12 × 1..12
        for a in 1...12 {
            for x in 1...12 {
                let key = "m\(a)x\(x)"
                if keys.contains(key) { continue }
                keys.insert(key)
                let r = a * x
                out.append(("\(a) × \(x) = ?", [String(r)] + wrongs(r)))
            }
        }

        // Curated extra multiplications (matches desktop list)
        let extras: [(Int, Int)] = [
            (32,3),(15,8),(24,4),(18,5),(14,7),(25,4),(16,6),(20,6),(30,4),(22,5),
            (17,6),(13,8),(21,6),(26,3),(28,3),(27,4),(36,3),(40,3),(10,12),(9,14),
            (8,15),(7,16),(6,18),(5,20),(4,24),(3,32)
        ]
        for (a, x) in extras {
            let key = "m\(a)x\(x)"
            if keys.contains(key) { continue }
            keys.insert(key)
            let r = a * x
            if r <= 144 {
                out.append(("\(a) × \(x) = ?", [String(r)] + wrongs(r)))
            }
        }

        // Division grid (inverse of mult grid up to 144)
        for a in 2...12 {
            for q in 1...12 {
                let d = a * q
                if d > 144 { continue }
                let key = "d\(d)/\(a)"
                if keys.contains(key) { continue }
                keys.insert(key)
                out.append(("\(d) ÷ \(a) = ?", [String(q)] + wrongs(q)))
            }
        }

        // Curated addition set
        let addList: [(Int, Int)] = [
            (1,2),(3,4),(5,6),(7,8),(9,10),(11,12),(13,14),(15,16),(17,18),(19,20),
            (21,22),(23,24),(25,26),(27,28),(29,30),(31,32),(33,34),(35,36),(37,38),(39,40),
            (41,42),(43,44),(45,46),(47,48),(49,50),(32,45),(28,67),(54,38),(91,23),(15,89),
            (72,44),(36,58),(63,27),(48,52),(19,76),(84,31),(57,43),(29,81),(66,34),(92,18),
            (41,59),(73,37),(25,85),(68,42),(51,49),(10,34),(22,56),(44,78),(67,33),(88,12),
            (99,11),(77,23),(55,45),(33,67),(11,89),(12,24),(18,36),(20,40),(14,28),(16,32),
            (8,16),(6,12),(4,8),(10,20),(22,44),(26,52),(30,60),(34,68),(38,76),(42,84),
            (46,92),(50,50),(60,40),(70,30),(80,20),(90,10),(100,44),(56,88),(72,72),(96,48),(64,80)
        ]
        for (a, x) in addList {
            let key = "a\(a)+\(x)"
            if keys.contains(key) { continue }
            keys.insert(key)
            let r = a + x
            out.append(("\(a) + \(x) = ?", [String(r)] + wrongs(r)))
        }

        // Subtraction sweep (cap at 110 entries to match JS limit)
        var subCount = 0
        outerSubLoop: for a in stride(from: 30, through: 144, by: 4) {
            for x in stride(from: 5, to: a, by: 6) {
                let key = "s\(a)-\(x)"
                if keys.contains(key) { continue }
                keys.insert(key)
                let r = a - x
                out.append(("\(a) − \(x) = ?", [String(r)] + wrongs(r)))
                subCount += 1
                if subCount >= 110 { break outerSubLoop }
            }
        }

        return out.map { Self.q(prompt: $0.0, answers: $0.1) }
    }

    // MARK: - Wrong-answer generator (matches desktop heuristic)

    private static func wrongs(_ correct: Int) -> [String] {
        var s = Set<Int>()
        let absC = abs(correct)
        let o = max(1, absC < 10 ? 1 : absC / 10)
        var i = 0
        while i < 20 && s.count < 3 {
            let baseDelta = (i % 3 == 0) ? 1 : (i % 3 == 1 ? -1 : 2)
            let d = baseDelta * (o + (i % 2) + 1)
            let c = correct + d
            if c != correct, c >= 0, c <= 999 { s.insert(c) }
            i += 1
        }
        var fallback = 1
        while s.count < 3 && fallback < 20 {
            let sign = (fallback % 2 == 1) ? 1 : -1
            let c = correct + sign * fallback
            if c != correct, c >= 0, c <= 999 { s.insert(c) }
            fallback += 1
        }
        return Array(s).prefix(3).map(String.init)
    }

    // MARK: - Builder helper

    private static func q(prompt: String, answers: [String]) -> CraterBlastQuestion {
        let json: [String: Any] = [
            "id": UUID().uuidString,
            "prompt": prompt,
            "answers": answers,
            "correctIndex": 0
        ]
        let data = try! JSONSerialization.data(withJSONObject: json)
        return try! JSONDecoder().decode(CraterBlastQuestion.self, from: data)
    }
}
