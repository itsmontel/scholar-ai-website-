//
//  WSTypography.swift
//  WriteScholar
//
//  Typography system. Headlines use a serif (EB Garamond if bundled in
//  Resources/, else Apple's New York). Body uses Nunito if bundled, else
//  SF Pro Rounded. Falls back gracefully so the app builds without the
//  font files in place.
//

import SwiftUI

// MARK: - Sizes

enum WSHeadlineSize {
    case huge    // 40pt — onboarding hero
    case large   // 32pt — section H2
    case medium  // 24pt — card H3
    case small   // 18pt — labels

    var size: CGFloat {
        switch self {
        case .huge: return 40
        case .large: return 32
        case .medium: return 24
        case .small: return 18
        }
    }

    var lineSpacing: CGFloat {
        switch self {
        case .huge: return -2
        case .large: return -1
        default: return 0
        }
    }
}

enum WSBodySize {
    case large   // 18pt
    case medium  // 16pt
    case small   // 14pt
    case caption // 12pt — uppercase eyebrow

    var size: CGFloat {
        switch self {
        case .large: return 18
        case .medium: return 16
        case .small: return 14
        case .caption: return 12
        }
    }
}

// MARK: - Font lookups (with graceful fallback)

enum WSFont {
    /// Returns the bundled EB Garamond at the given size+weight, or falls
    /// back to system serif if the font isn't installed yet.
    static func serif(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        let psName: String
        switch weight {
        case .bold, .heavy, .black: psName = "EBGaramond-Bold"
        default:                    psName = "EBGaramond-Regular"
        }
        if isFontAvailable(psName) {
            return .custom(psName, size: size)
        }
        return .system(size: size, weight: weight, design: .serif)
    }

    /// Returns the bundled Nunito at the given size+weight, or falls
    /// back to SF Pro Rounded.
    static func sans(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let psName: String
        switch weight {
        case .bold, .heavy, .black:        psName = "Nunito-Bold"
        case .semibold, .medium:           psName = "Nunito-SemiBold"
        default:                           psName = "Nunito-Regular"
        }
        if isFontAvailable(psName) {
            return .custom(psName, size: size)
        }
        return .system(size: size, weight: weight, design: .rounded)
    }

    private static func isFontAvailable(_ name: String) -> Bool {
        UIFont(name: name, size: 12) != nil
    }
}

// MARK: - View helpers

extension View {
    /// Brand serif headline with built-in tracking + line-spacing tweaks.
    func wsHeadline(_ size: WSHeadlineSize, weight: Font.Weight = .semibold) -> some View {
        self
            .font(WSFont.serif(size.size, weight: weight))
            .tracking(-0.5)
            .lineSpacing(size.lineSpacing)
    }

    /// Brand body / sans copy.
    func wsBody(_ size: WSBodySize, weight: Font.Weight = .regular) -> some View {
        self.font(WSFont.sans(size.size, weight: weight))
    }

    /// Uppercase tracked eyebrow text — used above headlines.
    func wsEyebrow() -> some View {
        self
            .font(WSFont.sans(11, weight: .bold))
            .tracking(2)
            .textCase(.uppercase)
    }
}
