//
//  WSColors.swift
//  WriteScholar
//
//  Duolingo-style color tokens. Solid hex values matching the web app's
//  Tailwind palette. Each color has a "main", "dark" (for 3D lip borders),
//  and "light" (for tinted backgrounds) variant.
//
//  Usage:
//    .foregroundStyle(WSColor.duoGreen)
//    .background(WSColor.duoGreenLight)
//

import SwiftUI

enum WSColor {
    // MARK: - Duolingo solid palette

    /// Green — primary CTA, success, streaks
    static let duoGreen      = Color(hex: 0x58CC02)
    static let duoGreenDark  = Color(hex: 0x46A302)
    static let duoGreenLight = Color(hex: 0xEAFFD6)

    /// Blue — info, links, secondary actions
    static let duoBlue      = Color(hex: 0x1CB0F6)
    static let duoBlueDark  = Color(hex: 0x1899D6)
    static let duoBlueLight = Color(hex: 0xDDF4FF)

    /// Orange — warnings, upgrades, streaks
    static let duoOrange      = Color(hex: 0xFF9600)
    static let duoOrangeDark  = Color(hex: 0xD97F00)
    static let duoOrangeLight = Color(hex: 0xFFF4E0)

    /// Red — errors, danger, hearts
    static let duoRed      = Color(hex: 0xFF4B4B)
    static let duoRedDark  = Color(hex: 0xE04343)
    static let duoRedLight = Color(hex: 0xFFE8E8)

    /// Purple — brand primary, achievements, premium.
    /// Retuned to the prototype's bluer violet (was #A560E8 orchid).
    static let duoPurple      = Color(hex: 0x7C5CE6)
    static let duoPurpleDark  = Color(hex: 0x6246C9)
    static let duoPurpleLight = Color(hex: 0xEFEAFE)

    /// Pink — arcade / games accent (matches the website's arcade section)
    static let duoPink      = Color(hex: 0xEC4899)
    static let duoPinkDark  = Color(hex: 0xDB2777)
    static let duoPinkLight = Color(hex: 0xFCE7F3)

    // MARK: - Neutrals (Duolingo-style)

    /// Dark text — matches Duolingo's #3C3C3C
    static let duoText = Color(hex: 0x3C3C3C)
    /// Light border / dividers — matches Duolingo's #E5E5E5
    static let duoBorder = Color(hex: 0xE5E5E5)
    /// Lavender page wash — matches the prototype's tinted background (was #F7F7F7)
    static let duoSurface = Color(hex: 0xF6F4FE)

    // MARK: - Semantic aliases (used throughout the app)

    /// Primary brand color — purple
    static let brandPrimary = duoPurple
    /// Soft wash for chips, badges, hover states
    static let brandSoft = duoPurpleLight
    /// Accent for highlights
    static let brandAccent = duoBlue

    // MARK: - Surfaces (adapt to dark mode)

    /// Page background
    static var background: Color {
        Color("Background", bundle: nil)
    }
    /// Elevated card surface (white light / stone-900 dark)
    static var backgroundElevated: Color {
        Color("BackgroundElevated", bundle: nil)
    }
    /// Sunken surface for inset rows / preview panes
    static var surface: Color {
        Color("Surface", bundle: nil)
    }

    // MARK: - Text (adapt to dark mode)

    /// Primary text color
    static var foreground: Color {
        Color("Foreground", bundle: nil)
    }
    /// Secondary / muted text
    static var foregroundMuted: Color {
        Color("ForegroundMuted", bundle: nil)
    }

    // MARK: - Lines

    /// 1pt divider hairline
    static var hairline: Color {
        Color("Hairline", bundle: nil)
    }

    // MARK: - Essay annotation tones

    /// Strong / positive (emerald)
    static let strong = duoGreen
    /// Revise (amber/orange)
    static let revise = duoOrange
    /// Concern (red)
    static let concern = duoRed
}

// MARK: - Convenience hex initializer (for one-off colors not in catalog)

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        let r = Double((hex >> 16) & 0xff) / 255
        let g = Double((hex >>  8) & 0xff) / 255
        let b = Double( hex        & 0xff) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}
