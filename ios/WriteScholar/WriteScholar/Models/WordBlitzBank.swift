//
//  WordBlitzBank.swift
//  WriteScholar
//
//  Port of the desktop Word Blitz banks (vocabulary + trivia + mental math)
//  from src/data/wordBlitz*Bank.ts. Each entry is a cloze sentence with a
//  "{{blank}}" token, the correct word, and three plausible distractors.
//

import Foundation

enum WordBlitzBank {

    // MARK: - Play for Fun (vocabulary + trivia mix)

    static let playForFun: [WordBlitzQuestion] = [
        q("Someone who studies the stars is called an {{blank}}.", "astronomer", ["astrologer", "geographer", "biologist"]),
        q("A person who fixes teeth is called a {{blank}}.", "dentist", ["dermatologist", "optometrist", "podiatrist"]),
        q("An animal that eats only plants is called a {{blank}}.", "herbivore", ["carnivore", "omnivore", "insectivore"]),
        q("An animal that eats only meat is called a {{blank}}.", "carnivore", ["herbivore", "omnivore", "scavenger"]),
        q("A word that means the opposite of another is an {{blank}}.", "antonym", ["synonym", "homonym", "acronym"]),
        q("A word that means the same as another is a {{blank}}.", "synonym", ["antonym", "homonym", "pseudonym"]),
        q("A book of synonyms is called a {{blank}}.", "thesaurus", ["dictionary", "encyclopedia", "lexicon"]),
        q("Fear of heights is called {{blank}}.", "acrophobia", ["claustrophobia", "agoraphobia", "hydrophobia"]),
        q("Fear of spiders is called {{blank}}.", "arachnophobia", ["acrophobia", "claustrophobia", "ophidiophobia"]),
        q("A creature that is active at night is {{blank}}.", "nocturnal", ["diurnal", "celestial", "terrestrial"]),
        q("The capital of France is {{blank}}.", "Paris", ["Lyon", "Marseille", "Nice"]),
        q("The capital of Japan is {{blank}}.", "Tokyo", ["Osaka", "Kyoto", "Nagoya"]),
        q("The capital of Australia is {{blank}}.", "Canberra", ["Sydney", "Melbourne", "Perth"]),
        q("The capital of Canada is {{blank}}.", "Ottawa", ["Toronto", "Montreal", "Vancouver"]),
        q("The capital of Egypt is {{blank}}.", "Cairo", ["Alexandria", "Luxor", "Giza"]),
        q("The largest planet in our solar system is {{blank}}.", "Jupiter", ["Saturn", "Neptune", "Uranus"]),
        q("The chemical symbol for gold is {{blank}}.", "Au", ["Ag", "Gd", "Go"]),
        q("The powerhouse of the cell is the {{blank}}.", "mitochondria", ["nucleus", "ribosome", "cytoplasm"]),
        q("Water is made of hydrogen and {{blank}}.", "oxygen", ["nitrogen", "carbon", "helium"]),
        q("The author of Romeo and Juliet is {{blank}}.", "Shakespeare", ["Dickens", "Chaucer", "Hemingway"]),
        q("A shape with three sides is a {{blank}}.", "triangle", ["square", "pentagon", "hexagon"]),
        q("The fastest land animal is the {{blank}}.", "cheetah", ["lion", "leopard", "gazelle"]),
        q("Plants make food using sunlight in a process called {{blank}}.", "photosynthesis", ["respiration", "digestion", "fermentation"]),
        q("The study of living things is called {{blank}}.", "biology", ["geology", "chemistry", "ecology"]),
        q("The closest star to Earth is the {{blank}}.", "Sun", ["Moon", "Sirius", "Polaris"]),
    ]

    // MARK: - Mental Math (procedural)

    static func mentalMath() -> [WordBlitzQuestion] {
        var qs: [WordBlitzQuestion] = []
        for _ in 0..<30 {
            let a = Int.random(in: 2...12)
            let b = Int.random(in: 2...12)
            let text: String
            let answer: Int
            switch Int.random(in: 0...2) {
            case 0: text = "\(a) + \(b)"; answer = a + b
            case 1: text = "\(a) × \(b)"; answer = a * b
            default: text = "\(a + b) − \(b)"; answer = a
            }
            var distractors = Set<Int>()
            while distractors.count < 3 {
                let delta = Int.random(in: -6...6)
                let cand = answer + (delta == 0 ? 1 : delta)
                if cand != answer && cand >= 0 { distractors.insert(cand) }
            }
            qs.append(WordBlitzQuestion(
                sentence: "\(text) = {{blank}}",
                correctAnswer: "\(answer)",
                distractors: distractors.map { "\($0)" }
            ))
        }
        return qs
    }

    private static func q(_ sentence: String, _ correct: String, _ distractors: [String]) -> WordBlitzQuestion {
        WordBlitzQuestion(sentence: sentence, correctAnswer: correct, distractors: distractors)
    }
}
