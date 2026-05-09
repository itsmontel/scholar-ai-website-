//
//  WSCard.swift
//  WriteScholar
//
//  A reusable elevated card surface with optional brand-tinted border
//  and configurable corner radius. Used heavily on the onboarding pages
//  for the floating preview tiles.
//

import SwiftUI

struct WSCardModifier: ViewModifier {
    var cornerRadius: CGFloat = 22
    var horizontalPadding: CGFloat = 18
    var verticalPadding: CGFloat = 16
    var showBorder: Bool = true
    var elevation: Elevation = .medium

    enum Elevation {
        case low
        case medium
        case high

        var shadowRadius: CGFloat {
            switch self {
            case .low:    return 6
            case .medium: return 14
            case .high:   return 28
            }
        }
        var shadowY: CGFloat {
            switch self {
            case .low:    return 2
            case .medium: return 6
            case .high:   return 14
            }
        }
        var shadowOpacity: CGFloat {
            switch self {
            case .low:    return 0.06
            case .medium: return 0.10
            case .high:   return 0.16
            }
        }
    }

    func body(content: Content) -> some View {
        content
            .padding(.horizontal, horizontalPadding)
            .padding(.vertical, verticalPadding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                            .stroke(showBorder ? WSColor.hairline : .clear, lineWidth: 1)
                    )
                    .shadow(
                        color: WSColor.duoPurple.opacity(elevation.shadowOpacity),
                        radius: elevation.shadowRadius,
                        y: elevation.shadowY
                    )
            )
    }
}

extension View {
    /// Wrap any view in the standard WriteScholar card surface.
    func wsCard(
        cornerRadius: CGFloat = 22,
        horizontalPadding: CGFloat = 18,
        verticalPadding: CGFloat = 16,
        showBorder: Bool = true,
        elevation: WSCardModifier.Elevation = .medium
    ) -> some View {
        modifier(WSCardModifier(
            cornerRadius: cornerRadius,
            horizontalPadding: horizontalPadding,
            verticalPadding: verticalPadding,
            showBorder: showBorder,
            elevation: elevation
        ))
    }
}
