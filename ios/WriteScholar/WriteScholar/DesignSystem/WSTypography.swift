//
//  WSTypography.swift
//  WriteScholar
//
//  Typography. Headlines use Bricolage Grotesque, body copy uses DM Sans
//  (both bundled in Resources/). Falls back to SF Pro Rounded if a face
//  fails to register.
//

import SwiftUI

// MARK: - Sizes

enum WSHeadlineSize {
    case huge    // 34pt — onboarding hero
    case large   // 28pt — section H2
    case medium  // 22pt — card H3
    case small   // 17pt — labels

    var size: CGFloat {
        switch self {
        case .huge: return 34
        case .large: return 28
        case .medium: return 22
        case .small: return 17
        }
    }

    var lineSpacing: CGFloat {
        switch self {
        case .huge: return -1
        case .large: return -0.5
        default: return 0
        }
    }
}

enum WSBodySize {
    case large   // 17pt
    case medium  // 15pt
    case small   // 13pt
    case caption // 11pt — uppercase eyebrow

    var size: CGFloat {
        switch self {
        case .large: return 17
        case .medium: return 15
        case .small: return 13
        case .caption: return 11
        }
    }
}

// MARK: - Font lookups (with graceful fallback)

enum WSFont {
    /// Bricolage Grotesque at the given size+weight for headlines.
    static func headline(_ size: CGFloat, weight: Font.Weight = .black) -> Font {
        let psName: String
        switch weight {
        case .bold, .heavy, .black:   psName = "BricolageGrotesque-ExtraBold"
        case .semibold:               psName = "BricolageGrotesque-Bold"
        default:                      psName = "BricolageGrotesque-SemiBold"
        }
        if isFontAvailable(psName) {
            return .custom(psName, size: size)
        }
        // Fallback: SF Pro Rounded for the same chunky feel
        return .system(size: size, weight: weight, design: .rounded)
    }

    /// Kept for compatibility — now forwards to headline()
    static func serif(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        headline(size, weight: weight)
    }

    /// DM Sans at the given size+weight, or SF Pro Rounded as fallback.
    static func sans(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let psName: String
        switch weight {
        case .heavy, .black:               psName = "DMSans-ExtraBold"
        case .bold, .semibold:             psName = "DMSans-Bold"
        case .medium:                      psName = "DMSans-Medium"
        default:                           psName = "DMSans-Regular"
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
    /// Bold display headline — Bricolage Grotesque with tight tracking.
    func wsHeadline(_ size: WSHeadlineSize, weight: Font.Weight = .black) -> some View {
        self
            .font(WSFont.headline(size.size, weight: weight))
            .tracking(-size.size * 0.02)
            .lineSpacing(size.lineSpacing)
    }

    /// Brand body / sans copy — DM Sans.
    func wsBody(_ size: WSBodySize, weight: Font.Weight = .regular) -> some View {
        self.font(WSFont.sans(size.size, weight: weight))
    }

    /// Uppercase tracked eyebrow text.
    func wsEyebrow() -> some View {
        self
            .font(WSFont.sans(11, weight: .black))
            .tracking(1.5)
            .textCase(.uppercase)
    }
}
