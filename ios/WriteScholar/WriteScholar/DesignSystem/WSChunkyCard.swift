//
//  WSChunkyCard.swift
//  WriteScholar
//
//  The "Duolingo-style" card surface — every card has a visible bottom
//  lip in a darker tint so the card looks like it's physically resting on
//  the surface. Pair with `.wsBouncyPress()` to make the whole thing
//  squish down a hair on tap.
//
//  Three knobs:
//    • `lipColor` — the dark base under the card. Defaults to a 12%-black
//                   wash so any card looks correct on light/dark surface.
//    • `accent`   — optional brand color tint applied to the lip + glow.
//    • `lipHeight` — how thick the visible base is. 5–7pt feels chunky
//                    without crossing into cartoon territory.
//
//  Usage:
//
//      VStack { … }
//          .wsChunkyCard(accent: WSColor.brandPrimary)
//
//      Button { … } label: { card }
//          .buttonStyle(WSBouncyButtonStyle())
//

import SwiftUI

// MARK: - The card modifier

struct WSChunkyCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 22
    var horizontalPadding: CGFloat = 16
    var verticalPadding: CGFloat = 16
    var lipHeight: CGFloat = 6
    var accent: Color? = nil
    var fillColor: Color = WSColor.backgroundElevated

    func body(content: Content) -> some View {
        let lipColor = (accent ?? WSColor.duoBorder).opacity(accent != nil ? 0.35 : 1.0)
        let glow     = (accent ?? WSColor.duoPurple).opacity(0.08)

        return ZStack(alignment: .top) {
            // Dark bottom lip — fixed in place. Slightly inset so it
            // hugs the card and doesn't peek out the sides.
            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .fill(lipColor)
                .padding(.top, lipHeight)
                .padding(.horizontal, 1)

            // Top face — the actual content.
            content
                .padding(.horizontal, horizontalPadding)
                .padding(.vertical, verticalPadding)
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .fill(fillColor)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
        }
        .compositingGroup()
        .shadow(color: glow, radius: 14, y: 6)
    }
}

extension View {
    /// Wrap a view in a chunky 3D card with a darker bottom lip.
    func wsChunkyCard(
        cornerRadius: CGFloat = 22,
        horizontalPadding: CGFloat = 16,
        verticalPadding: CGFloat = 16,
        lipHeight: CGFloat = 6,
        accent: Color? = nil,
        fillColor: Color = WSColor.backgroundElevated
    ) -> some View {
        modifier(WSChunkyCardModifier(
            cornerRadius: cornerRadius,
            horizontalPadding: horizontalPadding,
            verticalPadding: verticalPadding,
            lipHeight: lipHeight,
            accent: accent,
            fillColor: fillColor
        ))
    }
}

// MARK: - Bouncy press style

/// Apply to any `Button` whose label is itself a card / chip / image.
/// Squishes down with a subtle haptic — feels like a physical button.
struct WSBouncyButtonStyle: ButtonStyle {
    var pressScale: CGFloat = 0.96
    var hapticOnPress: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? pressScale : 1.0)
            .animation(.wsBounceTight, value: configuration.isPressed)
            .onChange(of: configuration.isPressed) { _, isPressed in
                if hapticOnPress && isPressed { Haptics.light() }
            }
    }
}

// MARK: - Standalone "press to wobble" modifier

/// A reusable wobble effect — offsets briefly back-and-forth. Trigger by
/// changing `trigger` to a new value (e.g. an Int counter you bump up).
struct WSWobbleModifier: ViewModifier {
    var trigger: Int
    @State private var offset: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .offset(x: offset)
            .onChange(of: trigger) { _, _ in
                withAnimation(.spring(response: 0.10, dampingFraction: 0.30)) { offset = -8 }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.10) {
                    withAnimation(.spring(response: 0.10, dampingFraction: 0.30)) { offset = 8 }
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.20) {
                    withAnimation(.spring(response: 0.20, dampingFraction: 0.50)) { offset = 0 }
                }
            }
    }
}

extension View {
    /// Bind to an Int counter; bump the counter and the view wobbles once.
    func wsWobble(trigger: Int) -> some View {
        modifier(WSWobbleModifier(trigger: trigger))
    }
}

// MARK: - Bobbing modifier

/// Gentle perpetual up-down bob, used for mascots / hero illustrations to
/// add life without distracting.
struct WSBobModifier: ViewModifier {
    var amount: CGFloat = 4
    var duration: Double = 2.4
    @State private var up: Bool = false

    func body(content: Content) -> some View {
        content
            .offset(y: up ? -amount : amount)
            .onAppear {
                withAnimation(.easeInOut(duration: duration).repeatForever(autoreverses: true)) {
                    up = true
                }
            }
    }
}

extension View {
    /// Loop a gentle bob up + down. Good for mascots, hero icons.
    func wsBobbing(amount: CGFloat = 4, duration: Double = 2.4) -> some View {
        modifier(WSBobModifier(amount: amount, duration: duration))
    }
}

// MARK: - Preview

#Preview("Chunky cards") {
    ScrollView {
        VStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Chunky card · default")
                    .wsHeadline(.small, weight: .bold)
                Text("Has a violet-tinted base lip beneath it.")
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .wsChunkyCard()

            VStack(alignment: .leading, spacing: 8) {
                Text("Success accent")
                    .wsHeadline(.small, weight: .bold)
                Text("Lip + shadow inherits the accent color.")
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .wsChunkyCard(accent: Color(hex: 0x10B981))

            Button {
            } label: {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Bouncy press card")
                        .wsHeadline(.small, weight: .bold)
                    Text("Whole card squishes down on tap.")
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .wsChunkyCard(accent: Color(hex: 0xF59E0B))
            }
            .buttonStyle(WSBouncyButtonStyle())
        }
        .padding()
    }
    .background(WSGradient.heroBackdrop)
}
