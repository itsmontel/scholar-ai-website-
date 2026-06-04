//
//  WSComponents.swift
//  WriteScholar
//
//  Shared building blocks for the prototype UI: the soft-shadow list row,
//  stat chips, segmented filter pills, section headers, progress rings and
//  the mascot hero. These are the pieces repeated across nearly every
//  screen in the redesign, so screens compose these rather than re-rolling
//  cards each time.
//

import SwiftUI

// MARK: - Chevron accessory

/// Small trailing chevron used on tappable list rows.
struct WSChevron: View {
    var body: some View {
        Image(systemName: "chevron.right")
            .font(.system(size: 14, weight: .bold))
            .foregroundStyle(WSColor.foregroundMuted.opacity(0.6))
    }
}

// MARK: - List row card (the universal row)

/// A soft-shadow row: tinted icon tile + title + subtitle + trailing slot.
/// Used in Continue studying, My Stuff, Study Packs, the tool picker, etc.
///
///     WSListRowCard(icon: "doc.text.fill", title: "Biology Notes",
///                   subtitle: "45 cards · 2h ago") { WSProgressRing(progress: 0.72) }
///
/// Omit the trailing closure to get a chevron automatically.
struct WSListRowCard<Trailing: View>: View {
    let icon: String
    var iconTint: Color = WSColor.duoPurple
    let title: String
    var subtitle: String? = nil
    @ViewBuilder var trailing: () -> Trailing

    init(icon: String,
         iconTint: Color = WSColor.duoPurple,
         title: String,
         subtitle: String? = nil,
         @ViewBuilder trailing: @escaping () -> Trailing) {
        self.icon = icon
        self.iconTint = iconTint
        self.title = title
        self.subtitle = subtitle
        self.trailing = trailing
    }

    var body: some View {
        HStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(iconTint.opacity(0.14))
                .frame(width: 48, height: 48)
                .overlay(
                    Image(systemName: icon)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(iconTint)
                )

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .wsBody(.large, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                if let subtitle {
                    Text(subtitle)
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .lineLimit(2)
                }
            }

            Spacer(minLength: 8)
            trailing()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 20)
    }
}

/// Convenience: a row with an automatic trailing chevron.
extension WSListRowCard where Trailing == WSChevron {
    init(icon: String,
         iconTint: Color = WSColor.duoPurple,
         title: String,
         subtitle: String? = nil) {
        self.init(icon: icon, iconTint: iconTint, title: title, subtitle: subtitle) {
            WSChevron()
        }
    }
}

// MARK: - Stat chip

/// Compact stat tile: icon + big value + label. Used in the Home stat row
/// (streak / study time / XP).
struct WSStatChip: View {
    let icon: String
    let value: String
    let label: String
    var tint: Color = WSColor.duoPurple

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(tint)
            Text(value)
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.foreground)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .wsBody(.small)
                .foregroundStyle(WSColor.foregroundMuted)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
        .wsChunkyCard(cornerRadius: 18, horizontalPadding: 10, verticalPadding: 14)
    }
}

// MARK: - Segmented filter pills

/// Horizontal scrollable pill filter. Selected pill = filled tint, others =
/// white with a hairline. Used in My Stuff / Study Packs.
struct WSSegmentedPills: View {
    let options: [String]
    @Binding var selection: String
    var tint: Color = WSColor.duoPurple

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(options, id: \.self) { opt in
                    let isSel = opt == selection
                    Text(opt)
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(isSel ? .white : WSColor.foregroundMuted)
                        .padding(.vertical, 8)
                        .padding(.horizontal, 16)
                        .background(
                            Capsule()
                                .fill(isSel ? tint : WSColor.backgroundElevated)
                                .overlay(
                                    Capsule().stroke(WSColor.hairline, lineWidth: isSel ? 0 : 1)
                                )
                        )
                        .contentShape(Capsule())
                        .onTapGesture {
                            Haptics.selection()
                            withAnimation(.wsBounceTight) { selection = opt }
                        }
                }
            }
            .padding(.horizontal, 2)
            .padding(.vertical, 2)
        }
    }
}

// MARK: - Section header

/// Bold section title with an optional trailing action ("View all").
struct WSSectionHeader: View {
    let title: String
    var actionTitle: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.foreground)
            Spacer()
            if let actionTitle, let action {
                Button(action: action) {
                    HStack(spacing: 2) {
                        Text(actionTitle).wsBody(.small, weight: .bold)
                        Image(systemName: "chevron.right").font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(WSColor.duoPurple)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Progress ring

/// Circular progress ring with an optional centered percentage. Used in the
/// Home "Continue studying" rows and the quiz-complete screen.
struct WSProgressRing: View {
    var progress: Double            // 0...1
    var tint: Color = WSColor.duoPurple
    var size: CGFloat = 54
    var lineWidth: CGFloat = 6
    var showsPercent: Bool = true
    var centerText: String? = nil   // overrides the percentage when set

    private var clamped: Double { min(1, max(0, progress)) }

    var body: some View {
        ZStack {
            Circle()
                .stroke(WSColor.duoBorder.opacity(0.5), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: clamped)
                .stroke(tint, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.5, dampingFraction: 0.8), value: clamped)
            if let centerText {
                Text(centerText)
                    .font(WSFont.sans(size * 0.24, weight: .bold))
                    .foregroundStyle(WSColor.foreground)
                    .multilineTextAlignment(.center)
            } else if showsPercent {
                Text("\(Int(clamped * 100))%")
                    .font(WSFont.sans(size * 0.26, weight: .bold))
                    .foregroundStyle(WSColor.foreground)
            }
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Mascot hero

/// The bear mascot on a soft circular halo. Used on the tool picker, Daily
/// Review, Arcade and empty states.
struct WSMascotHero: View {
    var asset: String = "mascot-study"   // mascot-dance | mascot-paper | mascot-study | mascot-laptop
    var size: CGFloat = 150
    var haloTint: Color = WSColor.duoPurple
    var bob: Bool = true

    var body: some View {
        ZStack {
            Circle()
                .fill(haloTint.opacity(0.12))
                .frame(width: size * 1.18, height: size * 1.18)
            Group {
                if bob {
                    WSAnimatedImage(name: asset, ext: "webp")
                        .frame(width: size, height: size)
                        .wsBobbing()
                } else {
                    WSAnimatedImage(name: asset, ext: "webp")
                        .frame(width: size, height: size)
                }
            }
        }
    }
}

// MARK: - Screen background helper

extension View {
    /// Apply the lavender page background that ignores safe areas.
    func wsScreenBackground() -> some View {
        self.background(WSColor.background.ignoresSafeArea())
    }
}

// MARK: - Preview

#Preview("WS components") {
    ScrollView {
        VStack(spacing: 16) {
            HStack(spacing: 10) {
                WSStatChip(icon: "flame.fill", value: "14", label: "day streak", tint: WSColor.duoOrange)
                WSStatChip(icon: "clock.fill", value: "2h 15m", label: "study time", tint: WSColor.duoBlue)
                WSStatChip(icon: "bolt.fill", value: "6,425", label: "XP earned", tint: WSColor.duoPurple)
            }
            WSSectionHeader(title: "Continue studying", actionTitle: "View all", action: {})
            WSListRowCard(icon: "book.fill", iconTint: WSColor.duoBlue,
                          title: "Biology Chapter 4 Notes", subtitle: "45 cards · 2h ago") {
                WSProgressRing(progress: 0.72)
            }
            WSListRowCard(icon: "doc.text.fill", title: "History Essay Draft", subtitle: "1,250 words")
        }
        .padding()
    }
    .wsScreenBackground()
}
