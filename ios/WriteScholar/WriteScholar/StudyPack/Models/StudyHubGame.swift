//
//  StudyHubGame.swift
//  WriteScholar
//
//  The game payloads a study surface can launch full-screen. Shared by
//  StudyTabContainer (fullScreenCover switch) and StudyPackHomeView's
//  Games tab.
//

import Foundation

enum StudyHubGame: Identifiable {
    case craterBlast(CraterBlast)
    case wordTower(WordTower)
    case wordBlitz(WordBlitz)

    var id: String {
        switch self {
        case .craterBlast: return "crater"
        case .wordTower:   return "tower"
        case .wordBlitz:   return "blitz"
        }
    }
}
