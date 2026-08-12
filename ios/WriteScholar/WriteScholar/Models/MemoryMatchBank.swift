//
//  MemoryMatchBank.swift
//  WriteScholar
//
//  Built-in term↔definition pairs for Memory Match's "Play for Fun" mode
//  (used when the user hasn't picked a study pack). Timeless general
//  knowledge so it never goes stale.
//

import Foundation

enum MemoryMatchBank {
    static let general: [MemoryPair] = [
        MemoryPair(term: "Mitochondria", definition: "Powerhouse of the cell"),
        MemoryPair(term: "Photosynthesis", definition: "Sunlight → glucose in plants"),
        MemoryPair(term: "Osmosis", definition: "Water crossing a membrane"),
        MemoryPair(term: "Gravity", definition: "Force pulling masses together"),
        MemoryPair(term: "Democracy", definition: "Rule by the people"),
        MemoryPair(term: "Photon", definition: "A particle of light"),
        MemoryPair(term: "Ecosystem", definition: "Community of living things + environment"),
        MemoryPair(term: "Hypotenuse", definition: "Longest side of a right triangle"),
        MemoryPair(term: "Metaphor", definition: "Comparison without 'like' or 'as'"),
        MemoryPair(term: "Atom", definition: "Smallest unit of an element"),
        MemoryPair(term: "Velocity", definition: "Speed with a direction"),
        MemoryPair(term: "Inflation", definition: "Rising prices over time"),
    ]
}
