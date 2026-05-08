//
//  WSDuoButton.swift
//  WriteScholar
//
//  The "Duolingo-style" 3D button family. Every button has two visible
//  layers stacked on top of each other:
//
//    ┌──────────────────────┐  ← Top face (the colored fill)
//    └──────────────────────┘
//      ████████████████████    ← Darker base (the "shadow lip")
//
//  When pressed, the top face slides DOWN by the lip height so the
//  visible base disappears — the button physically "presses" into the
//  surface. Combined with a quick spring + soft haptic, this is the
//  unmistakable tactile feel that makes Duolingo feel like a toy.
//
//  Variants:
//    • WSDuoPrimaryButtonStyle    — brand violet → fuchsia gradient
//    • WSDuoSecondaryButtonStyle  — surface fill, brand text
//    • WSDuoSuccessButtonStyle    — emerald (used for "Got it" / wins)
//    • WSDuoWarnButtonStyle       — amber (used for upgrades / streaks)
//    • WSDuoDangerButtonStyle     — rose (used for destructive actions)
//
//  All take a `fullWidth` flag so they can either stretch or hug.
//
//  Use it like any other button style:
//
//      Button("Continue") { … }
//          .buttonStyle(WSDuoPrimaryButtonStyle())
//

import SwiftUI

// MARK: - Shared palette

/// Two-color palette used by every Duo button: a top-face color (fill +
/// gradient) and a darker base color (the "lip" that disappears on press).
struct WSDuoPalette {
    let topGradient: [Color]
    let baseColor: Color
    let foreground: Color
    let glow: Color

    static let primary = WSDuoPalette(
        topGradient: [Color(hex: 0x8B5CF6), Color(hex: 0x7C3AED), Color(hex: 0xD946EF)],
        baseColor:   Color(hex: 0x5B21B6),
        foreground:  .white,
        glow:        Color(hex: 0x7C3AED)
    )

    static let secondary = WSDuoPalette(
        topGradient: [Color(hex: 0xFFFFFF), Color(hex: 0xF8FAFC)],
        baseColor:   Color(hex: 0xCBD5E1),
        foreground:  Color(hex: 0x7C3AED),
        glow:        Color(hex: 0x7C3AED).opacity(0.18)
    )

    static let success = WSDuoPalette(
        topGradient: [Color(hex: 0x34D399), Color(hex: 0x10B981)],
        baseColor:   Color(hex: 0x047857),
        foreground:  .white,
        glow:        Color(hex: 0x10B981)
    )

    static let warn = WSDuoPalette(
        topGradient: [Color(hex: 0xFBBF24), Color(hex: 0xF59E0B)],
        baseColor:   Color(hex: 0xB45309),
        foreground:  .white,
        glow:        Color(hex: 0xF59E0B)
    )

    static let danger = WSDuoPalette(
        topGradient: [Color(hex: 0xFB7185), Color(hex: 0xEF4444)],
        baseColor:   Color(hex: 0xB91C1C),
        foreground:  .white,
        glow:        Color(hex: 0xEF4444)
    )

    static let info = WSDuoPalette(
        topGradient: [Color(hex: 0x60A5FA), Color(hex: 0x6366F1)],
        baseColor:   Color(hex: 0x4338CA),
        foreground:  .white,
        glow:        Color(hex: 0x6366F1)
    )
}

// MARK: - The base style

/// All variants funnel through this. The lip height defines how much the
/// top face slides on press — 6pt feels punchy without looking comical.
struct WSDuoButtonStyle: ButtonStyle {
    var palette: WSDuoPalette
    var fullWidth: Bool = true
    var lip: CGFloat = 6
    var cornerRadius: CGFloat = 18
    /// Optional override for vertical padding (pill = 14, regular = 17).
    var verticalPadding: CGFloat = 17

    func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed

        return ZStack(alignment: .top) {
            // Base "lip" — fixed in place; the top face slides over it
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(palette.baseColor)
                .frame(maxWidth: fullWidth ? .infinity : nil)
                .padding(.top, lip)

            // Top face — the visible colored button
            configuration.label
                .wsBody(.medium, weight: .black)
                .foregroundStyle(palette.foreground)
                .padding(.vertical, verticalPadding)
                .padding(.horizontal, fullWidth ? 0 : 22)
                .frame(maxWidth: fullWidth ? .infinity : nil)
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(
                            LinearGradient(colors: palette.topGradient,
                                           startPoint: .top, endPoint: .bottom)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                                .stroke(Color.white.opacity(0.18), lineWidth: 1)
                        )
                )
                .offset(y: pressed ? lip : 0)
        }
        .compositingGroup()
        .shadow(color: palette.glow.opacity(pressed ? 0.10 : 0.32),
                radius: pressed ? 4 : 12,
                y: pressed ? 1 : 6)
        .animation(.spring(response: 0.18, dampingFraction: 0.62), value: pressed)
        .onChange(of: configuration.isPressed) { _, isPressed in
            if isPressed { Haptics.light() }
        }
    }
}

// MARK: - Variants

struct WSDuoPrimaryButtonStyle: ButtonStyle {
    var fullWidth: Bool = true
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(palette: .primary, fullWidth: fullWidth)
            .makeBody(configuration: configuration)
    }
}

struct WSDuoSecondaryButtonStyle: ButtonStyle {
    var fullWidth: Bool = false
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(palette: .secondary, fullWidth: fullWidth)
            .makeBody(configuration: configuration)
    }
}

struct WSDuoSuccessButtonStyle: ButtonStyle {
    var fullWidth: Bool = true
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(palette: .success, fullWidth: fullWidth)
            .makeBody(configuration: configuration)
    }
}

struct WSDuoWarnButtonStyle: ButtonStyle {
    var fullWidth: Bool = true
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(palette: .warn, fullWidth: fullWidth)
            .makeBody(configuration: configuration)
    }
}

struct WSDuoDangerButtonStyle: ButtonStyle {
    var fullWidth: Bool = true
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(palette: .danger, fullWidth: fullWidth)
            .makeBody(configuration: configuration)
    }
}

struct WSDuoInfoButtonStyle: ButtonStyle {
    var fullWidth: Bool = true
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(palette: .info, fullWidth: fullWidth)
            .makeBody(configuration: configuration)
    }
}

// MARK: - Pill (compact) variant

/// Smaller, hug-content version used in inline rows / chips.
struct WSDuoPillButtonStyle: ButtonStyle {
    var palette: WSDuoPalette = .primary
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(
            palette: palette,
            fullWidth: false,
            lip: 4,
            cornerRadius: 999,
            verticalPadding: 11
        )
        .makeBody(configuration: configuration)
    }
}

// MARK: - Spring presets

/// Reusable Duolingo-feel springs. Bouncier than typical iOS easing.
extension Animation {
    /// Quick + punchy — for press feedback.
    static let wsBounceTight = Animation.spring(response: 0.22, dampingFraction: 0.62)

    /// Medium pop — for tab swaps, sheet presents.
    static let wsBouncePop = Animation.spring(response: 0.40, dampingFraction: 0.66)

    /// Long, juicy — for hero element entrances.
    static let wsBounceJuicy = Animation.spring(response: 0.55, dampingFraction: 0.58)

    /// "Wobble" — exaggerated overshoot for celebrations.
    static let wsWobble = Animation.spring(response: 0.45, dampingFraction: 0.42)
}

// MARK: - Previews

#Preview("Duo button gallery") {
    ScrollView {
        VStack(spacing: 14) {
            Button("Continue learning") {}
                .buttonStyle(WSDuoPrimaryButtonStyle())

            Button("I'll do it later") {}
                .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))

            Button("Got it!") {}
                .buttonStyle(WSDuoSuccessButtonStyle())

            Button("Upgrade to Pro") {}
                .buttonStyle(WSDuoWarnButtonStyle())

            Button("Delete forever") {}
                .buttonStyle(WSDuoDangerButtonStyle())

            Button("Open on web") {}
                .buttonStyle(WSDuoInfoButtonStyle())

            HStack(spacing: 10) {
                Button("Pill") {}.buttonStyle(WSDuoPillButtonStyle())
                Button("Success") {}.buttonStyle(WSDuoPillButtonStyle(palette: .success))
                Button("Warn") {}.buttonStyle(WSDuoPillButtonStyle(palette: .warn))
            }
        }
        .padding()
    }
    .background(WSGradient.heroBackdrop)
}
