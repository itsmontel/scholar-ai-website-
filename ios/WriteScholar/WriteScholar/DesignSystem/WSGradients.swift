//
//  WSGradients.swift
//  WriteScholar
//
//  Duolingo-style background washes. Flat/near-flat to match the solid
//  color system — no more violet→fuchsia gradient sweeps.
//

import SwiftUI

enum WSGradient {
    /// Brand accent — purple to purple-dark, used sparingly.
    static var brand: LinearGradient {
        LinearGradient(
            colors: [WSColor.duoPurple, WSColor.duoPurpleDark],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    /// Subtle background wash for hero sections — near-white with a purple tint.
    static var heroBackdrop: LinearGradient {
        LinearGradient(
            colors: [
                WSColor.background,
                WSColor.background,
                WSColor.duoPurpleLight.opacity(0.3)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    /// Per-page wash for onboarding. Each page gets a Duolingo-colored tint.
    static func onboardingBackdrop(for index: Int) -> LinearGradient {
        let palettes: [[Color]] = [
            // 0: Green welcome
            [Color.white, WSColor.duoGreenLight],
            // 1: Purple essays
            [Color.white, WSColor.duoPurpleLight],
            // 2: Blue study tools
            [Color.white, WSColor.duoBlueLight],
            // 3: Green flashcards
            [Color.white, WSColor.duoGreenLight],
            // 4: Orange games
            [Color.white, WSColor.duoOrangeLight],
            // 5: Blue library
            [Color.white, WSColor.duoBlueLight],
            // 6: Green CTA finale
            [WSColor.duoGreenLight, WSColor.duoGreen.opacity(0.15)]
        ]
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
            colors: [WSColor.duoGreen, WSColor.duoGreenDark],
            startPoint: .top,
            endPoint: .bottom
        )
    }
}
