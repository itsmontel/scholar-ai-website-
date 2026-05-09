//
//  WSSpeechBubble.swift
//  WriteScholar
//
//  Mascot speech bubble matching the desktop's `<div class="rounded-2xl
//  border-2 border-b-4 border-[#46A302] bg-[#E5F8D0]">` from
//  SoftPaywall.tsx:395 — used whenever a mascot says something to the
//  user. Includes a small pointer/arrow on one side aimed at the mascot.
//

import SwiftUI

/// Small chunky speech bubble that points at a mascot.
///
///     WSSpeechBubble(text: "Awesome work!", tail: .leading,
///                    fillColor: WSColor.duoGreenLight,
///                    strokeColor: WSColor.duoGreen)
struct WSSpeechBubble: View {
    var text: String
    var tail: Tail = .leading
    var fillColor: Color = WSColor.duoGreenLight
    var strokeColor: Color = WSColor.duoGreen
    var foreground: Color = WSColor.duoText
    var maxWidth: CGFloat = 240

    enum Tail { case leading, trailing, none }

    var body: some View {
        HStack(spacing: 0) {
            if tail == .leading { tailShape }

            Text(text)
                .font(WSFont.sans(13, weight: .heavy))
                .foregroundStyle(foreground)
                .lineLimit(3)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .frame(maxWidth: maxWidth, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(fillColor)
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(strokeColor, lineWidth: 2)
                        )
                )
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(strokeColor.opacity(0.4))
                        .offset(y: 3)
                )

            if tail == .trailing { tailShape.rotationEffect(.degrees(180)) }
        }
    }

    private var tailShape: some View {
        Triangle()
            .fill(fillColor)
            .frame(width: 10, height: 14)
            .overlay(
                Triangle()
                    .stroke(strokeColor, lineWidth: 2)
            )
    }
}

private struct Triangle: Shape {
    func path(in rect: CGRect) -> Path {
        Path { p in
            p.move(to: CGPoint(x: rect.maxX, y: 0))
            p.addLine(to: CGPoint(x: 0, y: rect.midY))
            p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            p.closeSubpath()
        }
    }
}

// MARK: - Trust badge row

/// Trust strip pill row pinned beneath a CTA — matches the desktop's
/// `<div className="bg-white/90 shadow-sm rounded-full">…</div>` pattern.
/// Each pill has a small icon-circle prefix.
struct WSTrustBadge: Identifiable {
    let id = UUID()
    let icon: String
    let label: String
    let tint: Color
}

struct WSTrustBadgeRow: View {
    var badges: [WSTrustBadge]
    var compact: Bool = false

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(badges) { badge in
                    HStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .fill(badge.tint.opacity(0.18))
                                .frame(width: compact ? 18 : 22, height: compact ? 18 : 22)
                            Image(systemName: badge.icon)
                                .font(.system(size: compact ? 9 : 11, weight: .black))
                                .foregroundStyle(badge.tint)
                        }
                        Text(badge.label)
                            .font(WSFont.sans(compact ? 11 : 12, weight: .black))
                            .tracking(0.2)
                            .foregroundStyle(WSColor.foreground)
                    }
                    .padding(.horizontal, compact ? 10 : 12)
                    .padding(.vertical, compact ? 6 : 8)
                    .background(
                        Capsule()
                            .fill(WSColor.backgroundElevated)
                            .overlay(Capsule().stroke(WSColor.duoBorder, lineWidth: 1))
                    )
                    .shadow(color: Color.black.opacity(0.04), radius: 2, y: 1)
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
        }
    }
}

// MARK: - Preview

#Preview("Speech bubble + trust row") {
    VStack(spacing: 30) {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "graduationcap.fill")
                .font(.system(size: 32))
                .foregroundStyle(WSColor.duoGreen)
                .padding(20)
                .background(Circle().fill(WSColor.duoGreenLight))

            WSSpeechBubble(
                text: "You're crushing it! Keep that streak alive 🔥",
                tail: .leading
            )
        }

        WSTrustBadgeRow(badges: [
            WSTrustBadge(icon: "checkmark.seal.fill", label: "Cancel anytime",  tint: WSColor.duoGreen),
            WSTrustBadge(icon: "lock.fill",          label: "Secure checkout", tint: WSColor.duoBlue),
            WSTrustBadge(icon: "star.fill",          label: "4.8 rating",      tint: WSColor.duoOrange)
        ])
    }
    .padding()
    .background(WSColor.duoSurface)
}
