//
//  WSColors.swift
//  WriteScholar
//
//  Brand color tokens, sourced from Assets.xcassets so each color has a
//  light + dark variant that matches the web app's Tailwind palette.
//
//  Usage:
//    .foregroundStyle(WSColor.foreground)
//    .background(WSColor.background)
//

import SwiftUI

enum WSColor {
    // MARK: Brand
    /// Primary brand violet (violet-600 light / violet-400 dark).
    static let brandPrimary = Color("Brand")
    /// Soft violet wash for chips, badges, hover states.
    static let brandSoft = Color("BrandSoft")
    /// Accent fuchsia for highlights / "studying" pillar.
    static let brandAccent = Color("BrandAccent")

    // MARK: Surfaces
    /// Page background (stone-50 light / stone-950 dark).
    static let background = Color("Background")
    /// Elevated card surface (white light / stone-900 dark).
    static let backgroundElevated = Color("BackgroundElevated")
    /// Sunken surface for inset rows / preview panes.
    static let surface = Color("Surface")

    // MARK: Text
    /// Primary text color (stone-900 light / stone-50 dark).
    static let foreground = Color("Foreground")
    /// Secondary / muted text (stone-600 light / stone-400 dark).
    static let foregroundMuted = Color("ForegroundMuted")

    // MARK: Lines
    /// 1pt divider hairline.
    static let hairline = Color("Hairline")

    // MARK: Essay annotation tones
    /// Strong / positive annotation (emerald).
    static let strong = Color("Strong")
    /// Yellow / "revise" annotation (amber).
    static let revise = Color("Revise")
    /// Red / "concern" annotation (rose).
    static let concern = Color("Concern")
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
