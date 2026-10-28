//
//  WSColors.swift
//  WriteScholar
//
//  Color tokens. The "sticker arcade" palette (ink, lilac, purple, lime,
//  pink, sky, orange) drives the redesign; the older duo* tokens stay as
//  aliases so untouched screens keep compiling.
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

    /// Pink — arcade / games accent
    static let duoPink      = Color(hex: 0xFF5FA8)
    static let duoPinkDark  = Color(hex: 0xE04790)
    static let duoPinkLight = Color(hex: 0xFFD3E6)

    /// Yellow — XP, stars, streak milestones, Quiz Run accent
    static let duoYellow      = Color(hex: 0xFFC800)
    static let duoYellowDark  = Color(hex: 0xE6B400)
    static let duoYellowLight = Color(hex: 0xFFF6D6)

    // MARK: - Sticker arcade palette

    /// Outline + hard shadow ink. Stays near-black in dark mode so the
    /// sticker edge still reads against the darker card faces.
    static let ink        = Color(lightHex: 0x17112B, darkHex: 0x07040F)
    /// Headline / body ink on light faces (always dark, for colored tiles).
    static let inkText    = Color(hex: 0x17112B)
    static let inkMuted   = Color(hex: 0x5D5577)
    static let lilac      = Color(lightHex: 0xF3EEFF, darkHex: 0x120C24)
    static let lilacDeep  = Color(lightHex: 0xEDE6FF, darkHex: 0x2A2148)
    static let purple     = Color(hex: 0x7C5CE6)
    static let purpleInk  = Color(hex: 0x4B2FB8)
    static let lime       = Color(hex: 0xC8F53B)
    static let pink       = Color(hex: 0xFF5FA8)
    static let pinkSoft   = Color(hex: 0xFFD3E6)
    static let sky        = Color(hex: 0x3DC5FF)
    static let orange     = Color(hex: 0xFF9B3D)
    static let sun        = Color(hex: 0xFFD23F)
    /// Arcade night background + neon card faces.
    static let arcadeNight = Color(hex: 0x120C24)
    static let arcadeCard  = Color(hex: 0x1E1638)
    static let arcadeLine  = Color(hex: 0x3A2F66)

    // MARK: - Neutrals (Duolingo-style)

    /// Dark text — #3C3C3C in light mode, warm near-white in dark mode.
    /// Adaptive so headings on card surfaces stay readable in dark mode.
    static let duoText = Color(lightHex: 0x17112B, darkHex: 0xF6F2FF)
    /// Light border / dividers.
    static let duoBorder = Color(lightHex: 0xD9D0F2, darkHex: 0x3A2F5E)
    /// Lilac page wash.
    static let duoSurface = Color(lightHex: 0xF3EEFF, darkHex: 0x120C24)

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

    // MARK: - Tinted surfaces (adapt to dark mode)

    /// Soft cream banner tint — the Daily Review "on a roll" card.
    static let bannerCream = Color(lightHex: 0xFFF8E7, darkHex: 0x2E2A1E)
    /// Pale lavender card face — big flashcard, arcade hero.
    static let surfacePurple = Color(lightHex: 0xEFEAFE, darkHex: 0x2A2440)

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

    /// Trait-adaptive color from a light/dark hex pair — for tokens that
    /// need dark-mode variants without an asset-catalog entry.
    init(lightHex: UInt32, darkHex: UInt32) {
        self.init(UIColor { trait in
            let hex = trait.userInterfaceStyle == .dark ? darkHex : lightHex
            return UIColor(
                red:   CGFloat((hex >> 16) & 0xff) / 255,
                green: CGFloat((hex >>  8) & 0xff) / 255,
                blue:  CGFloat( hex        & 0xff) / 255,
                alpha: 1
            )
        })
    }
}
