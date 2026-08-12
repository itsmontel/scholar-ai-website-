//
//  WSChunkyComponents.swift
//  WriteScholar
//
//  Shared chunky 3D primitives that mirror the desktop's
//  `border-2 border-b-4 active:border-b-2 active:translate-y-0.5` Tailwind
//  pattern. Extracted from QuizView, FocusUnlockChallenge, FlashcardsView,
//  LessonView, AuthFlowView, GetStartedHero — six places that all rolled
//  their own ZStack { lip; topFace } ceremony.
//
//  Components:
//    • WSChunkyOption    — option row used in quizzes / lessons / focus
//                          unlock. Drives state through `WSChunkyOptionState`.
//    • WSChunkyPill      — capsule-shaped pill with a 3D lip; perfect for
//                          chips, presets and small CTAs.
//    • WSChunkyRibbon    — the 6pt colored stripe pinned to the top of a
//                          modal / sheet (paywall, success, daily goal hit).
//    • WSChunkyStat      — three-up stat tile (number + label + icon).
//    • WSChunkyIcon      — circular icon badge with darker lip beneath,
//                          used in the website's "icon circle" pattern.
//
//  All of these are drawn with the same recipe so they look like a family:
//    1. A dark "lip" rectangle pinned a few pixels lower
//    2. A solid-color "top face" with white inner stroke at .opacity(0.18)
//    3. On press, the top face slides DOWN by `lip` and the shadow softens
//

import SwiftUI

// MARK: - WSChunkyOption (quiz / lesson / focus answer rows)

/// Visual state of a `WSChunkyOption`. Drives the palette + decoration:
///
///     idle       — white card, gray hairline border
///     selected   — sky-blue fill (matches desktop's "answer picked")
///     correct    — green fill, big checkmark medallion
///     wrong      — red fill, big X medallion
///     disabled   — washed out (greyed) when locked / already revealed
enum WSChunkyOptionState: Equatable {
    case idle
    case selected
    case correct
    case wrong
    case disabled
}

private struct WSChunkyOptionPalette {
    let topColor: Color
    let baseColor: Color
    let foreground: Color
    let strokeColor: Color
    let badgeIcon: String?
    let badgeFill: Color
    let badgeStroke: Color
    let badgeForeground: Color
}

private extension WSChunkyOptionState {
    /// `selectedTint` colors the `.selected` state — brand purple by
    /// default (the mockup's picked-answer treatment: solid fill, white
    /// text, trailing check).
    func palette(selectedTint: Color, selectedTintDark: Color) -> WSChunkyOptionPalette {
        switch self {
        case .idle:
            return WSChunkyOptionPalette(
                topColor:    WSColor.backgroundElevated,
                baseColor:   WSColor.duoBorder,
                foreground:  WSColor.duoText,
                strokeColor: WSColor.duoBorder,
                badgeIcon:   nil,
                badgeFill:   .clear,
                badgeStroke: WSColor.duoBorder,
                badgeForeground: WSColor.duoText
            )
        case .selected:
            return WSChunkyOptionPalette(
                topColor:    selectedTint,
                baseColor:   selectedTintDark,
                foreground:  Color.white,
                strokeColor: selectedTintDark,
                badgeIcon:   "checkmark",
                badgeFill:   Color.white,
                badgeStroke: selectedTintDark,
                badgeForeground: selectedTint
            )
        case .correct:
            return WSChunkyOptionPalette(
                topColor:    WSColor.duoGreen,
                baseColor:   WSColor.duoGreenDark,
                foreground:  Color.white,
                strokeColor: WSColor.duoGreenDark,
                badgeIcon:   "checkmark",
                badgeFill:   Color.white,
                badgeStroke: WSColor.duoGreenDark,
                badgeForeground: WSColor.duoGreen
            )
        case .wrong:
            return WSChunkyOptionPalette(
                topColor:    WSColor.duoRed,
                baseColor:   WSColor.duoRedDark,
                foreground:  Color.white,
                strokeColor: WSColor.duoRedDark,
                badgeIcon:   "xmark",
                badgeFill:   Color.white,
                badgeStroke: WSColor.duoRedDark,
                badgeForeground: WSColor.duoRed
            )
        case .disabled:
            return WSChunkyOptionPalette(
                topColor:    WSColor.surface,
                baseColor:   WSColor.duoBorder,
                foreground:  WSColor.duoText.opacity(0.45),
                strokeColor: WSColor.duoBorder,
                badgeIcon:   nil,
                badgeFill:   .clear,
                badgeStroke: WSColor.duoBorder,
                badgeForeground: WSColor.duoText
            )
        }
    }
}

/// Chunky option row used by quizzes, lessons and focus challenges.
///
///   WSChunkyOption(label: "Plate tectonics", state: .idle, action: { ... })
///
/// The trailing closure fires on tap when the row isn't `.disabled`. Trailing
/// content slot (`accessory`) lets callers show a "letter prefix" like
/// `A` / `B` / `C` if they want, mirroring the desktop quiz layout.
struct WSChunkyOption<Accessory: View>: View {
    var label: String
    var state: WSChunkyOptionState
    /// Retained for API compatibility — the soft restyle no longer draws a
    /// 3D lip; press feedback is a gentle scale + shadow soften instead.
    var lip: CGFloat = 5
    var cornerRadius: CGFloat = 18
    var verticalPadding: CGFloat = 16
    var horizontalPadding: CGFloat = 18
    /// Tint for the `.selected` state — brand purple per the mockup.
    var selectedTint: Color = WSColor.duoPurple
    var selectedTintDark: Color = WSColor.duoPurpleDark
    var action: () -> Void
    @ViewBuilder var accessory: () -> Accessory

    @State private var pressed: Bool = false

    var body: some View {
        let palette = state.palette(selectedTint: selectedTint, selectedTintDark: selectedTintDark)
        let isLocked = state == .disabled || state == .correct || state == .wrong
        let isFilled = state == .selected || state == .correct || state == .wrong

        Button {
            guard !isLocked else { return }
            Haptics.light()
            action()
        } label: {
            HStack(spacing: 14) {
                accessory()
                Text(label)
                    .font(WSFont.sans(15, weight: .heavy))
                    .foregroundStyle(palette.foreground)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                if let icon = palette.badgeIcon {
                    ZStack {
                        Circle()
                            .fill(palette.badgeFill)
                            .frame(width: 28, height: 28)
                            .overlay(Circle().stroke(palette.badgeStroke.opacity(0.35), lineWidth: 1.5))
                        Image(systemName: icon)
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(palette.badgeForeground)
                    }
                    .transition(.scale.combined(with: .opacity))
                }
            }
            .padding(.vertical, verticalPadding)
            .padding(.horizontal, horizontalPadding)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(palette.topColor)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .stroke(isFilled ? Color.white.opacity(0.15) : palette.strokeColor, lineWidth: 1.5)
                    )
            )
            .compositingGroup()
            .shadow(color: isFilled ? palette.baseColor.opacity(pressed ? 0.15 : 0.35) : Color.black.opacity(pressed ? 0.02 : 0.06),
                    radius: pressed ? 4 : 12, y: pressed ? 2 : 6)
            .scaleEffect(pressed && !isLocked ? 0.98 : 1)
            .animation(.spring(response: 0.18, dampingFraction: 0.62), value: pressed)
            .animation(.spring(response: 0.30, dampingFraction: 0.70), value: state)
        }
        .buttonStyle(WSChunkyOptionPressStyle(isPressed: $pressed))
        .disabled(isLocked)
    }
}

extension WSChunkyOption where Accessory == EmptyView {
    init(label: String,
         state: WSChunkyOptionState,
         lip: CGFloat = 5,
         cornerRadius: CGFloat = 18,
         verticalPadding: CGFloat = 16,
         horizontalPadding: CGFloat = 18,
         selectedTint: Color = WSColor.duoPurple,
         selectedTintDark: Color = WSColor.duoPurpleDark,
         action: @escaping () -> Void) {
        self.label = label
        self.state = state
        self.lip = lip
        self.cornerRadius = cornerRadius
        self.verticalPadding = verticalPadding
        self.horizontalPadding = horizontalPadding
        self.selectedTint = selectedTint
        self.selectedTintDark = selectedTintDark
        self.action = action
        self.accessory = { EmptyView() }
    }
}

/// Letter prefix accessory ("A.", "B.", etc.) — pass to `accessory:` slot.
/// Defaults adapt to dark mode; pass explicit colors on filled rows
/// (e.g. white-on-translucent when the option is selected).
struct WSChunkyOptionLetter: View {
    let letter: String
    var fillColor: Color = WSColor.surface
    var foreground: Color = WSColor.duoText
    var strokeColor: Color = WSColor.duoBorder

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(fillColor)
                .overlay(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .stroke(strokeColor, lineWidth: 1)
                )
                .frame(width: 26, height: 26)
            Text(letter.uppercased())
                .font(WSFont.sans(11, weight: .black))
                .tracking(0.4)
                .foregroundStyle(foreground)
        }
    }
}

/// Press tracking style — needed because `WSChunkyOption` mixes its own
/// state (locked correct/wrong) with the press state.
private struct WSChunkyOptionPressStyle: ButtonStyle {
    @Binding var isPressed: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .onChange(of: configuration.isPressed) { _, p in
                isPressed = p
            }
    }
}

// MARK: - WSChunkyPill (capsule + lip)

/// Small capsule pill with a 3D lip. Used for filter chips, preset choices
/// (focus duration, daily goal target, paywall plan toggle) — anywhere the
/// website uses `rounded-full border-2 border-b-4 …`.
struct WSChunkyPill: View {
    var label: String
    var icon: String? = nil
    var isSelected: Bool
    var tint: Color = WSColor.brandPrimary
    /// Retained for API compatibility — the soft restyle draws no 3D lip.
    var lip: CGFloat = 4
    var verticalPadding: CGFloat = 9
    var horizontalPadding: CGFloat = 16
    var action: () -> Void

    @State private var pressed = false

    var body: some View {
        Button {
            Haptics.light()
            action()
        } label: {
            HStack(spacing: 6) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 11, weight: .black))
                }
                Text(label)
                    .font(WSFont.sans(13, weight: .black))
                    .tracking(0.3)
                    .lineLimit(1)
            }
            .foregroundStyle(isSelected ? Color.white : WSColor.foregroundMuted)
            .padding(.vertical, verticalPadding)
            .padding(.horizontal, horizontalPadding)
            .background(
                Capsule()
                    .fill(isSelected ? tint : WSColor.backgroundElevated)
                    .overlay(
                        Capsule()
                            .stroke(isSelected ? Color.clear : WSColor.hairline, lineWidth: 1)
                    )
            )
            .compositingGroup()
            .shadow(color: isSelected ? tint.opacity(pressed ? 0.15 : 0.35) : Color.black.opacity(pressed ? 0.02 : 0.05),
                    radius: pressed ? 3 : 8, y: pressed ? 1 : 4)
            .scaleEffect(pressed ? 0.96 : 1)
            .animation(.spring(response: 0.18, dampingFraction: 0.62), value: pressed)
            .animation(.spring(response: 0.26, dampingFraction: 0.72), value: isSelected)
        }
        .buttonStyle(WSChunkyPillPressStyle(isPressed: $pressed))
    }
}

private struct WSChunkyPillPressStyle: ButtonStyle {
    @Binding var isPressed: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .onChange(of: configuration.isPressed) { _, p in
                isPressed = p
            }
    }
}

// MARK: - WSChunkyRibbon (top 6pt color stripe used on modals)

/// The 6-px colored stripe pinned to the top of a modal — matches
/// `<div className="h-1.5 bg-[#58CC02] rounded-t-2xl shrink-0" />` from
/// the desktop `SoftPaywall.tsx`. Apply at the very top of a sheet's
/// content stack:
///
///   VStack(spacing: 0) {
///     WSChunkyRibbon(color: WSColor.duoGreen)
///     // … rest of the sheet …
///   }
struct WSChunkyRibbon: View {
    var color: Color = WSColor.duoGreen
    var height: CGFloat = 6
    var cornerRadius: CGFloat = 22

    var body: some View {
        UnevenRoundedRectangle(
            topLeadingRadius: cornerRadius,
            bottomLeadingRadius: 0,
            bottomTrailingRadius: 0,
            topTrailingRadius: cornerRadius,
            style: .continuous
        )
        .fill(color)
        .frame(height: height)
    }
}

// MARK: - WSChunkyIcon (circular icon badge with lip)

/// Circular icon badge — matches the website's "icon circle" pattern from
/// `FeatureHub.tsx` (a 48×48 circle with `border-2 border-b-4 text-white`).
/// Drop into a hero card, settings row, or feature tile.
struct WSChunkyIcon: View {
    var systemName: String
    var tint: Color
    var size: CGFloat = 52
    var lip: CGFloat = 4

    var body: some View {
        ZStack(alignment: .top) {
            Circle()
                .fill(tint.opacity(0.55).mix(with: Color.black, by: 0.15))
                .frame(width: size, height: size)
                .padding(.top, lip)

            Circle()
                .fill(tint)
                .frame(width: size, height: size)
                .overlay(Circle().stroke(.white.opacity(0.18), lineWidth: 1.5))
                .overlay(
                    Image(systemName: systemName)
                        .font(.system(size: size * 0.42, weight: .black))
                        .foregroundStyle(.white)
                )
        }
        .compositingGroup()
        .shadow(color: tint.opacity(0.30), radius: 6, y: 3)
    }
}

// MARK: - WSChunkyStat (3-up stat tile)

/// Used on the Home dashboard's stat trio + Focus tab's blocked-apps stats.
/// Matches the desktop dashboard's stat cards.
struct WSChunkyStat: View {
    var icon: String
    var value: String
    var label: String
    var tint: Color

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(tint.opacity(0.18))
                    .frame(width: 38, height: 38)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .black))
                    .foregroundStyle(tint)
            }
            Text(value)
                .font(WSFont.sans(20, weight: .black))
                .foregroundStyle(WSColor.foreground)
            Text(label)
                .font(WSFont.sans(11, weight: .heavy))
                .tracking(0.6)
                .textCase(.uppercase)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity)
        .wsChunkyCard(cornerRadius: 18, accent: tint, fillColor: WSColor.backgroundElevated)
    }
}

// MARK: - Color mix helper

extension Color {
    /// Mix two colors. Approximates SwiftUI's iOS 18 `.mix(with:by:)` so we
    /// stay on iOS 17. Linear sRGB blend.
    func mix(with other: Color, by amount: Double) -> Color {
        let a = max(0.0, min(1.0, amount))
        let lhs = self.cgColor?.components ?? [0, 0, 0, 1]
        let rhs = other.cgColor?.components ?? [0, 0, 0, 1]
        let blend: (CGFloat, CGFloat) -> Double = { l, r in
            Double(l) * (1 - a) + Double(r) * a
        }
        return Color(
            .sRGB,
            red: blend(lhs.indices.contains(0) ? lhs[0] : 0, rhs.indices.contains(0) ? rhs[0] : 0),
            green: blend(lhs.indices.contains(1) ? lhs[1] : 0, rhs.indices.contains(1) ? rhs[1] : 0),
            blue: blend(lhs.indices.contains(2) ? lhs[2] : 0, rhs.indices.contains(2) ? rhs[2] : 0),
            opacity: blend(lhs.indices.contains(3) ? lhs[3] : 1, rhs.indices.contains(3) ? rhs[3] : 1)
        )
    }
}

// MARK: - Preview

#Preview("Chunky components") {
    ScrollView {
        VStack(spacing: 22) {
            WSChunkyRibbon(color: WSColor.duoGreen)

            VStack(spacing: 10) {
                WSChunkyOption(label: "What is the capital of France?",
                               state: .idle) {}
                WSChunkyOption(label: "Paris (selected)",
                               state: .selected) {}
                WSChunkyOption(label: "Paris (correct)",
                               state: .correct) {}
                WSChunkyOption(label: "Berlin (wrong)",
                               state: .wrong) {}
                WSChunkyOption(label: "Locked",
                               state: .disabled) {}
            }

            HStack(spacing: 8) {
                WSChunkyPill(label: "All", isSelected: true) {}
                WSChunkyPill(label: "Studies", icon: "graduationcap.fill", isSelected: false, tint: WSColor.duoBlue) {}
                WSChunkyPill(label: "Games", isSelected: false, tint: WSColor.duoOrange) {}
            }

            HStack(spacing: 12) {
                WSChunkyIcon(systemName: "graduationcap.fill", tint: WSColor.duoPurple)
                WSChunkyIcon(systemName: "flame.fill", tint: WSColor.duoOrange)
                WSChunkyIcon(systemName: "checkmark.bubble.fill", tint: WSColor.duoGreen)
            }

            HStack(spacing: 12) {
                WSChunkyStat(icon: "flame.fill", value: "12", label: "Day streak", tint: WSColor.duoOrange)
                WSChunkyStat(icon: "graduationcap.fill", value: "8", label: "Packs", tint: WSColor.duoPurple)
                WSChunkyStat(icon: "trophy.fill", value: "23", label: "Badges", tint: WSColor.duoGreen)
            }
        }
        .padding()
    }
    .background(WSColor.duoSurface)
}
