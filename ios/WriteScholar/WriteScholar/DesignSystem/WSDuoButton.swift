//
//  WSDuoButton.swift
//  WriteScholar
//
//  The "Duolingo-style" 3D button family matching the web app's
//  border-2 border-b-4 active:border-b-2 active:translate-y-0.5 pattern.
//
//  Every button has two visible layers:
//    +-----------------------+  <- Top face (the solid fill)
//    +=======================+  <- Darker base lip
//
//  When pressed, the top face slides DOWN by the lip height.
//  Combined with a quick spring + soft haptic = unmistakable Duolingo feel.
//
//  Variants use the ACTUAL Duolingo hex colors:
//    * Primary   — #A560E8 purple (brand)
//    * Green     — #58CC02 green (CTAs, success)
//    * Orange    — #FF9600 (upgrades, streaks)
//    * Red       — #FF4B4B (danger)
//    * Blue      — #1CB0F6 (info, links)
//    * Secondary — white surface with brand text
//

import SwiftUI

// MARK: - Shared palette

struct WSDuoPalette {
    let topColor: Color
    let baseColor: Color
    let foreground: Color
    let glow: Color

    // Duolingo solid palettes — NO gradients, just solid fills
    static let primary = WSDuoPalette(
        topColor:   WSColor.duoPurple,
        baseColor:  WSColor.duoPurpleDark,
        foreground: .white,
        glow:       WSColor.duoPurple
    )

    static let secondary = WSDuoPalette(
        topColor:   WSColor.backgroundElevated,
        baseColor:  WSColor.duoBorder,
        foreground: WSColor.foreground,
        glow:       WSColor.duoPurple.opacity(0.12)
    )

    static let success = WSDuoPalette(
        topColor:   WSColor.lime,
        baseColor:  WSColor.duoGreenDark,
        foreground: WSColor.inkText,
        glow:       WSColor.duoGreen
    )

    static let warn = WSDuoPalette(
        topColor:   WSColor.orange,
        baseColor:  WSColor.duoOrangeDark,
        foreground: WSColor.inkText,
        glow:       WSColor.duoOrange
    )

    static let danger = WSDuoPalette(
        topColor:   WSColor.pink,
        baseColor:  WSColor.duoRedDark,
        foreground: WSColor.inkText,
        glow:       WSColor.duoRed
    )

    static let info = WSDuoPalette(
        topColor:   WSColor.sky,
        baseColor:  WSColor.duoBlueDark,
        foreground: WSColor.inkText,
        glow:       WSColor.duoBlue
    )

    static let pink = WSDuoPalette(
        topColor:   WSColor.pink,
        baseColor:  WSColor.duoPinkDark,
        foreground: WSColor.inkText,
        glow:       WSColor.duoPink
    )

    // Keep legacy gradient-based name for backward compat
    var topGradient: [Color] { [topColor] }
}

// MARK: - The base style

struct WSDuoButtonStyle: ButtonStyle {
    var palette: WSDuoPalette
    var fullWidth: Bool = true
    var lip: CGFloat = 5
    var cornerRadius: CGFloat = 16
    var verticalPadding: CGFloat = 16

    func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed
        let depth = max(3, lip)
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)

        // Sticker button: ink outline + hard shadow; the face sinks into
        // its shadow while pressed. `glow` is retained but unused.
        return configuration.label
            .font(WSFont.headline(17, weight: .black))
            .foregroundStyle(palette.foreground)
            .padding(.vertical, verticalPadding)
            .padding(.horizontal, fullWidth ? 12 : 22)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .background(
                ZStack {
                    shape.fill(palette.topColor)
                    shape.strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                }
            )
            .offset(y: pressed ? depth - 1 : 0)
            .background(shape.fill(WSColor.ink).offset(y: depth))
            .padding(.bottom, depth)
            .animation(.spring(response: 0.14, dampingFraction: 0.7), value: pressed)
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

struct WSDuoPillButtonStyle: ButtonStyle {
    var palette: WSDuoPalette = .primary
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(
            palette: palette,
            fullWidth: false,
            lip: 3,
            cornerRadius: 999,
            verticalPadding: 10
        )
        .makeBody(configuration: configuration)
    }
}

// MARK: - Spring presets

extension Animation {
    /// Quick + punchy — for press feedback.
    static let wsBounceTight = Animation.spring(response: 0.20, dampingFraction: 0.65)
    /// Medium pop — for tab swaps, sheet presents.
    static let wsBouncePop = Animation.spring(response: 0.38, dampingFraction: 0.68)
    /// Long, juicy — for hero element entrances.
    static let wsBounceJuicy = Animation.spring(response: 0.50, dampingFraction: 0.60)
    /// "Wobble" — exaggerated overshoot for celebrations.
    static let wsWobble = Animation.spring(response: 0.42, dampingFraction: 0.44)
}

// MARK: - Legacy aliases

struct WSPrimaryButtonStyle: ButtonStyle {
    var fullWidth: Bool = true
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(palette: .success, fullWidth: fullWidth)
            .makeBody(configuration: configuration)
    }
}

struct WSSecondaryButtonStyle: ButtonStyle {
    var fullWidth: Bool = false
    func makeBody(configuration: Configuration) -> some View {
        WSDuoButtonStyle(palette: .secondary, fullWidth: fullWidth)
            .makeBody(configuration: configuration)
    }
}

struct WSTertiaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(WSFont.sans(14, weight: .heavy))
            .foregroundStyle(WSColor.purpleInk)
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .opacity(configuration.isPressed ? 0.6 : 1.0)
    }
}

// MARK: - Haptics helper

@MainActor
enum Haptics {
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }
    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }
    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
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
    .background(WSColor.duoSurface)
}
