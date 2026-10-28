//
//  WSSticker.swift
//  WriteScholar
//
//  The "sticker arcade" depth idiom: a flat face, a 2.5pt ink outline and
//  a hard, zero-blur offset shadow in the same ink. No soft glows.
//
//    • .wsSticker(fill:radius:depth:)   — any surface (cards, tiles, chips)
//    • WSStickerButtonStyle             — presses down into its own shadow
//    • WSStripeBar                      — ink-outlined progress bar with
//                                         marching stripes
//    • WSStickerBadge                   — small outlined pill ("+40 XP")
//    • WSFlameIcon                      — the streak flame, flickering
//    • .wsPop(delay:)                   — springy entrance used on every page
//
//  Every perpetual animation here checks Reduce Motion.
//

import SwiftUI

enum WSSticker {
    static let stroke: CGFloat = 2.5
    static let depth: CGFloat = 4
}

// MARK: - Surface

struct WSStickerModifier: ViewModifier {
    var fill: Color
    var radius: CGFloat
    var depth: CGFloat
    var stroke: Color = WSColor.ink

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        return content
            .background(
                ZStack {
                    shape.fill(stroke).offset(y: depth)
                    shape.fill(fill)
                    shape.strokeBorder(stroke, lineWidth: WSSticker.stroke)
                }
            )
            .padding(.bottom, depth)
    }
}

extension View {
    /// Flat face + ink outline + hard offset shadow.
    func wsSticker(fill: Color = WSColor.backgroundElevated,
                   radius: CGFloat = 22,
                   depth: CGFloat = WSSticker.depth,
                   stroke: Color = WSColor.ink) -> some View {
        modifier(WSStickerModifier(fill: fill, radius: radius, depth: depth, stroke: stroke))
    }

    /// Capsule variant for chips and pills.
    func wsStickerCapsule(fill: Color, depth: CGFloat = 3) -> some View {
        self
            .background(
                ZStack {
                    Capsule().fill(WSColor.ink).offset(y: depth)
                    Capsule().fill(fill)
                    Capsule().strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                }
            )
            .padding(.bottom, depth)
    }

    /// Circle variant for icon medallions.
    func wsStickerCircle(fill: Color, depth: CGFloat = 0) -> some View {
        self
            .background(
                ZStack {
                    if depth > 0 { Circle().fill(WSColor.ink).offset(y: depth) }
                    Circle().fill(fill)
                    Circle().strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                }
            )
    }
}

// MARK: - Button

/// Sticker button: the face slides down into its shadow while pressed.
struct WSStickerButtonStyle: ButtonStyle {
    var fill: Color = WSColor.purple
    var foreground: Color = .white
    var radius: CGFloat = 18
    var depth: CGFloat = 5
    var fullWidth: Bool = true
    var height: CGFloat? = 58
    var font: Font = WSFont.headline(18, weight: .black)

    func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        return configuration.label
            .font(font)
            .foregroundStyle(foreground)
            .padding(.horizontal, fullWidth ? 16 : 22)
            .frame(maxWidth: fullWidth ? .infinity : nil)
            .frame(height: height)
            .padding(.vertical, height == nil ? 12 : 0)
            .background(
                ZStack {
                    shape.fill(fill)
                    shape.strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                }
            )
            .offset(y: pressed ? depth - 1 : 0)
            .background(shape.fill(WSColor.ink).offset(y: depth))
            .padding(.bottom, depth)
            .animation(.spring(response: 0.14, dampingFraction: 0.7), value: pressed)
            .onChange(of: pressed) { _, isPressed in
                if isPressed { Haptics.light() }
            }
    }
}

/// Plain card-sized press: tilt + sink, for tiles whose label already
/// carries `.wsSticker`.
struct WSStickerPressStyle: ButtonStyle {
    var tilt: Double = -1.2
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .rotationEffect(.degrees(configuration.isPressed ? tilt : 0))
            .offset(y: configuration.isPressed ? 2 : 0)
            .animation(.spring(response: 0.18, dampingFraction: 0.6), value: configuration.isPressed)
            .onChange(of: configuration.isPressed) { _, p in
                if p { Haptics.light() }
            }
    }
}

// MARK: - Progress bar

/// Ink-outlined progress bar with marching stripes on the fill.
struct WSStripeBar: View {
    var fraction: Double
    var fill: Color = WSColor.purple
    var track: Color = WSColor.lilacDeep
    var height: CGFloat = 12
    var stripes: Bool = true

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown: Double = 0

    var body: some View {
        GeometryReader { geo in
            let w = max(0, min(1, shown)) * geo.size.width
            ZStack(alignment: .leading) {
                Capsule().fill(track)
                if w > 0 {
                    ZStack {
                        Rectangle().fill(fill)
                        if stripes {
                            TimelineView(.animation(paused: reduceMotion)) { ctx in
                                let t = ctx.date.timeIntervalSinceReferenceDate
                                WSStripes(phase: reduceMotion ? 0 : CGFloat(t.truncatingRemainder(dividingBy: 0.9) / 0.9))
                                    .fill(Color.black.opacity(0.16))
                            }
                        }
                    }
                    .frame(width: w)
                    .overlay(alignment: .trailing) {
                        Rectangle().fill(WSColor.ink).frame(width: 2)
                    }
                }
            }
            .clipShape(Capsule())
            .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
        }
        .frame(height: height)
        .onAppear {
            if reduceMotion { shown = fraction }
            else { withAnimation(.easeOut(duration: 0.9).delay(0.15)) { shown = fraction } }
        }
        .onChange(of: fraction) { _, f in
            withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) { shown = f }
        }
        .accessibilityElement()
        .accessibilityValue("\(Int(fraction * 100)) percent")
    }
}

/// Diagonal stripe band, shifted by `phase` (0…1 of one period).
struct WSStripes: Shape {
    var phase: CGFloat
    var period: CGFloat = 16
    var animatableData: CGFloat {
        get { phase }
        set { phase = newValue }
    }
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let shift = phase * period
        var x = -rect.height - period + shift
        while x < rect.width + rect.height {
            p.move(to: CGPoint(x: x, y: rect.maxY))
            p.addLine(to: CGPoint(x: x + period / 2, y: rect.maxY))
            p.addLine(to: CGPoint(x: x + period / 2 + rect.height, y: rect.minY))
            p.addLine(to: CGPoint(x: x + rect.height, y: rect.minY))
            p.closeSubpath()
            x += period
        }
        return p
    }
}

// MARK: - Badge / chip

/// Small outlined sticker label — "+40 XP", "Final in 42 days".
struct WSStickerBadge: View {
    var text: String
    var icon: String? = nil
    var fill: Color = WSColor.lime
    var foreground: Color = WSColor.inkText
    var size: CGFloat = 15
    var depth: CGFloat = 3
    var radius: CGFloat = 12

    var body: some View {
        HStack(spacing: 5) {
            if let icon {
                Image(systemName: icon).font(.system(size: size * 0.85, weight: .black))
            }
            Text(text).font(WSFont.headline(size, weight: .black))
        }
        .foregroundStyle(foreground)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .wsSticker(fill: fill, radius: radius, depth: depth)
    }
}

/// Uppercase tracked label in the sticker style.
struct WSKicker: View {
    var text: String
    var color: Color = WSColor.foregroundMuted
    var body: some View {
        Text(text)
            .font(WSFont.sans(11, weight: .black))
            .tracking(1.4)
            .textCase(.uppercase)
            .foregroundStyle(color)
    }
}

// MARK: - Flame

/// Streak flame: orange teardrop with ink outline, flickering.
struct WSFlameIcon: View {
    var size: CGFloat = 20
    var lit: Bool = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var flick = false

    var body: some View {
        Image(systemName: "flame.fill")
            .font(.system(size: size, weight: .black))
            .foregroundStyle(lit ? WSColor.orange : WSColor.foregroundMuted.opacity(0.4))
            .overlay(
                Image(systemName: "flame")
                    .font(.system(size: size, weight: .bold))
                    .foregroundStyle(WSColor.inkText)
            )
            .scaleEffect(flick ? 1.12 : 1, anchor: .bottom)
            .rotationEffect(.degrees(flick ? 4 : -4), anchor: .bottom)
            .onAppear {
                guard lit, !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true)) { flick = true }
            }
            .accessibilityHidden(true)
    }
}

// MARK: - Motion helpers

struct WSPopModifier: ViewModifier {
    var delay: Double
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(shown || reduceMotion ? 1 : 0.7)
            .offset(y: shown || reduceMotion ? 0 : 14)
            .opacity(shown || reduceMotion ? 1 : 0)
            .onAppear {
                guard !reduceMotion, !shown else { return }
                withAnimation(.spring(response: 0.5, dampingFraction: 0.62).delay(delay)) { shown = true }
            }
    }
}

/// Endless gentle bob with a little rock, for mascots.
struct WSMascotBobModifier: ViewModifier {
    var amount: CGFloat = 8
    var rock: Double = 3
    var duration: Double = 1.3
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var up = false

    func body(content: Content) -> some View {
        content
            .offset(y: up ? -amount : 0)
            .rotationEffect(.degrees(up ? rock : -rock))
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: duration).repeatForever(autoreverses: true)) { up = true }
            }
    }
}

/// Repeating pulse, for "tap me" affordances.
struct WSPulseModifier: ViewModifier {
    var scale: CGFloat = 1.12
    var duration: Double = 0.7
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var on = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(on ? scale : 1)
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: duration).repeatForever(autoreverses: true)) { on = true }
            }
    }
}

/// Occasional wiggle: sits still, then shakes, every ~3s.
struct WSWiggleModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    func body(content: Content) -> some View {
        if reduceMotion {
            content.rotationEffect(.degrees(4))
        } else {
            TimelineView(.animation) { ctx in
                let t = ctx.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: 3) / 3
                content.rotationEffect(.degrees(Self.angle(t)))
            }
        }
    }
    static func angle(_ t: Double) -> Double {
        switch t {
        case ..<0.86: return 4
        case ..<0.90: return 4 - (t - 0.86) / 0.04 * 10
        case ..<0.94: return -6 + (t - 0.90) / 0.04 * 14
        default:      return 8 - (t - 0.94) / 0.06 * 4
        }
    }
}

/// Slow continuous spin (sunbursts, starbursts).
struct WSSpinModifier: ViewModifier {
    var period: Double = 14
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    func body(content: Content) -> some View {
        if reduceMotion {
            content
        } else {
            TimelineView(.animation) { ctx in
                let t = ctx.date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: period) / period
                content.rotationEffect(.degrees(t * 360))
            }
        }
    }
}

extension View {
    func wsPop(delay: Double = 0) -> some View { modifier(WSPopModifier(delay: delay)) }
    func wsMascotBob(amount: CGFloat = 8, rock: Double = 3, duration: Double = 1.3) -> some View {
        modifier(WSMascotBobModifier(amount: amount, rock: rock, duration: duration))
    }
    func wsPulse(scale: CGFloat = 1.12, duration: Double = 0.7) -> some View {
        modifier(WSPulseModifier(scale: scale, duration: duration))
    }
    func wsWiggle() -> some View { modifier(WSWiggleModifier()) }
    func wsSpin(period: Double = 14) -> some View { modifier(WSSpinModifier(period: period)) }
}

// MARK: - Sunburst

/// Alternating rays behind a hero (win screen, grade badge).
struct WSSunburst: Shape {
    var rays: Int = 16
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let c = CGPoint(x: rect.midX, y: rect.midY)
        let r = max(rect.width, rect.height)
        let step = CGFloat.pi * 2 / CGFloat(rays * 2)
        for i in 0..<rays {
            let a0 = CGFloat(i * 2) * step
            let a1 = a0 + step
            p.move(to: c)
            p.addLine(to: CGPoint(x: c.x + r * cos(a0), y: c.y + r * sin(a0)))
            p.addLine(to: CGPoint(x: c.x + r * cos(a1), y: c.y + r * sin(a1)))
            p.closeSubpath()
        }
        return p
    }
}

/// Spiky starburst badge outline.
struct WSStarburst: Shape {
    var points: Int = 14
    var inset: CGFloat = 0.82
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let c = CGPoint(x: rect.midX, y: rect.midY)
        let outer = min(rect.width, rect.height) / 2
        let inner = outer * inset
        let n = points * 2
        for i in 0..<n {
            let a = CGFloat(i) / CGFloat(n) * .pi * 2 - .pi / 2
            let r = i % 2 == 0 ? outer : inner
            let pt = CGPoint(x: c.x + r * cos(a), y: c.y + r * sin(a))
            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
        }
        p.closeSubpath()
        return p
    }
}

// MARK: - Floating "+XP" burst

/// Rises and fades each time `trigger` changes. Overlay it on a card.
struct WSFloatingXP: View {
    var text: String
    var trigger: Int
    @State private var bursts: [Int] = []

    var body: some View {
        ZStack {
            ForEach(bursts, id: \.self) { id in
                WSFloatingXPBurst(text: text) {
                    bursts.removeAll { $0 == id }
                }
            }
        }
        .allowsHitTesting(false)
        .onChange(of: trigger) { _, t in bursts.append(t) }
    }
}

private struct WSFloatingXPBurst: View {
    var text: String
    var done: () -> Void
    @State private var up = false

    var body: some View {
        WSStickerBadge(text: text, fill: WSColor.lime, size: 16)
            .offset(y: up ? -70 : 0)
            .scaleEffect(up ? 1.1 : 0.6)
            .opacity(up ? 0 : 1)
            .onAppear {
                withAnimation(.easeOut(duration: 0.9)) { up = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.95) { done() }
            }
    }
}

// MARK: - Preview

#Preview("Sticker kit") {
    ScrollView {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                Text("Let's lock in.").wsHeadline(.huge)
                Spacer()
                HStack(spacing: 4) { WSFlameIcon(); Text("12").font(WSFont.headline(18)) }
                    .padding(.horizontal, 12).padding(.vertical, 7)
                    .wsStickerCapsule(fill: WSColor.lime)
            }
            VStack(alignment: .leading, spacing: 8) {
                WSKicker(text: "Daily quest")
                Text("Ace 2 quizzes").font(WSFont.headline(18))
                WSStripeBar(fraction: 0.5)
            }
            .padding(16)
            .wsSticker()
            WSStickerBadge(text: "+40 XP").wsWiggle()
            Button("Start round") {}.buttonStyle(WSStickerButtonStyle())
            Button("Lime") {}.buttonStyle(WSStickerButtonStyle(fill: WSColor.lime, foreground: WSColor.inkText))
        }
        .padding(20)
    }
    .background(WSColor.lilac)
}
