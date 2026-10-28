//
//  WSGradients.swift
//  WriteScholar
//
//  Background fills. The sticker redesign uses flat faces only, so every
//  token here resolves to a single color (kept as LinearGradient so the
//  call sites compile unchanged).
//

import SwiftUI

enum WSGradient {
    /// Brand accent — purple to purple-dark, used sparingly.
    static var brand: LinearGradient {
        LinearGradient(
            colors: [WSColor.purple, WSColor.purple],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    /// Subtle background wash for hero sections — near-white with a purple tint.
    static var heroBackdrop: LinearGradient {
        LinearGradient(
            colors: [WSColor.background, WSColor.background],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    /// Onboarding page fill (flat lilac on every page).
    static func onboardingBackdrop(for index: Int) -> LinearGradient {
        let palettes: [[Color]] = [[WSColor.lilac, WSColor.lilac]]
        let palette = palettes[index % palettes.count]
        return LinearGradient(
            colors: palette,
            startPoint: .top,
            endPoint: .bottom
        )
    }

    /// Green CTA gradient for primary buttons in special contexts.
    static var greenCTA: LinearGradient {
        LinearGradient(
            colors: [WSColor.lime, WSColor.lime],
            startPoint: .top,
            endPoint: .bottom
        )
    }
}
