//
//  WSGradients.swift
//  WriteScholar
//
//  Reusable brand gradients. Computed on access so colors track the
//  current color scheme automatically (Color values are dynamic).
//

import SwiftUI

enum WSGradient {
    /// Violet → fuchsia → indigo brand sweep. Used on headline accents,
    /// CTA buttons, and the launch hero.
    static var brand: LinearGradient {
        LinearGradient(
            colors: [
                Color(hex: 0x7C3AED),   // violet-600
                Color(hex: 0xD946EF),   // fuchsia-500
                Color(hex: 0x6366F1)    // indigo-500
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    /// Subtle background wash for the hero section / onboarding pages.
    static var heroBackdrop: LinearGradient {
        LinearGradient(
            colors: [
                WSColor.background,
                WSColor.background.opacity(0.95),
                WSColor.brandSoft.opacity(0.55)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
    }

    /// Per-page wash for onboarding (each page rotates through these so
    /// the background subtly shifts as the user swipes).
    static func onboardingBackdrop(for index: Int) -> LinearGradient {
        let palettes: [[Color]] = [
            [Color(hex: 0xFAF5FF), Color(hex: 0xFFE4F2)],   // violet → pink
            [Color(hex: 0xF0F9FF), Color(hex: 0xEEF2FF)],   // sky → indigo
            [Color(hex: 0xFFF7ED), Color(hex: 0xFEF3C7)],   // amber wash
            [Color(hex: 0xECFDF5), Color(hex: 0xCFFAFE)],   // emerald → cyan
            [Color(hex: 0xFFE4E6), Color(hex: 0xFEF3C7)],   // rose → amber
            [Color(hex: 0xEDE9FE), Color(hex: 0xE0E7FF)],   // violet → indigo
            [Color(hex: 0x7C3AED), Color(hex: 0xD946EF)]    // brand finale
        ]
        let palette = palettes[index % palettes.count]
        return LinearGradient(
            colors: palette,
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}
