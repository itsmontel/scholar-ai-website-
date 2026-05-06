//
//  WSButtonStyle.swift
//  WriteScholar
//
//  Three button variants matching the web app:
//    - WSPrimaryButtonStyle:   filled brand gradient, used for hero CTAs
//    - WSSecondaryButtonStyle: outlined brand color, used for "Skip" etc.
//    - WSTertiaryButtonStyle:  text-only with subtle underline on press
//
//  All include a press scale + haptic for tactile feedback.
//

import SwiftUI
import UIKit

// MARK: - Primary

struct WSPrimaryButtonStyle: ButtonStyle {
    var fullWidth: Bool = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .wsBody(.medium, weight: .bold)
            .foregroundStyle(.white)
            .padding(.vertical, 18)
            .padding(.horizontal, fullWidth ? 0 : 28)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(WSGradient.brand)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(Color.white.opacity(0.15), lineWidth: 1)
                    )
                    .shadow(
                        color: Color(hex: 0x7C3AED).opacity(configuration.isPressed ? 0.18 : 0.32),
                        radius: configuration.isPressed ? 8 : 18,
                        y: configuration.isPressed ? 3 : 8
                    )
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.spring(response: 0.28, dampingFraction: 0.7), value: configuration.isPressed)
            .onChange(of: configuration.isPressed) { _, pressed in
                if pressed { Haptics.light() }
            }
    }
}

// MARK: - Secondary

struct WSSecondaryButtonStyle: ButtonStyle {
    var fullWidth: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .wsBody(.medium, weight: .semibold)
            .foregroundStyle(WSColor.brandPrimary)
            .padding(.vertical, 16)
            .padding(.horizontal, fullWidth ? 0 : 24)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(WSColor.brandSoft.opacity(configuration.isPressed ? 1.0 : 0.6))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(WSColor.brandPrimary.opacity(0.25), lineWidth: 1)
                    )
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.spring(response: 0.28, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Tertiary

struct WSTertiaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .wsBody(.small, weight: .semibold)
            .foregroundStyle(WSColor.foregroundMuted)
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .opacity(configuration.isPressed ? 0.6 : 1.0)
    }
}

// MARK: - Haptics helper
//
// UIKit feedback generators are MainActor-isolated under Swift 6 strict
// concurrency, so the enum carries the same isolation.
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
    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
