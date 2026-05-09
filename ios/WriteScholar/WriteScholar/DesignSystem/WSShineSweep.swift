//
//  WSShineSweep.swift
//  WriteScholar
//
//  Shine sweep modifier matching the desktop's `dashboard-upgrade-shine`
//  keyframe — a 45%-width white gradient stripe that slides from -130% →
//  220% every 3.4s, used on premium CTAs to draw the eye.
//
//  Apply with `.wsShineSweep()` to any view (typically a button or card):
//
//      Button("Upgrade to Pro") { … }
//          .buttonStyle(WSDuoSuccessButtonStyle())
//          .wsShineSweep()
//
//  Honors `accessibilityReduceMotion` automatically — reduced motion users
//  see a stationary highlight instead.
//

import SwiftUI

struct WSShineSweepModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var duration: Double = 3.4
    var stripeFraction: Double = 0.45
    var intensity: Double = 0.55

    @State private var phase: CGFloat = -1.4

    func body(content: Content) -> some View {
        content
            .overlay(
                GeometryReader { geo in
                    let stripeW = geo.size.width * stripeFraction
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0),
                            Color.white.opacity(intensity),
                            Color.white.opacity(0)
                        ],
                        startPoint: .leading, endPoint: .trailing
                    )
                    .frame(width: stripeW, height: geo.size.height * 1.4)
                    .rotationEffect(.degrees(20))
                    .offset(x: geo.size.width * phase)
                    .blendMode(.plusLighter)
                    .allowsHitTesting(false)
                }
                .clipped()
            )
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(
                    Animation.easeInOut(duration: duration).repeatForever(autoreverses: false)
                ) {
                    phase = 1.4
                }
            }
    }
}

extension View {
    /// Apply a slow white shine sweep across the view — for premium CTAs,
    /// upgrade banners, achievement unlocks. Honors reduce-motion.
    func wsShineSweep(
        duration: Double = 3.4,
        stripeFraction: Double = 0.45,
        intensity: Double = 0.55
    ) -> some View {
        modifier(WSShineSweepModifier(
            duration: duration,
            stripeFraction: stripeFraction,
            intensity: intensity
        ))
    }
}

// MARK: - Aurora drift (large surface gradient drift)

/// Slow `background-size: 220% / animation 14s linear infinite` aurora
/// drift used on the dashboard premium panel. Apply as a background:
///
///     SomeContainer
///         .background(WSAuroraDrift(colors: [.purple, .pink]))
///
/// Two layers crossfade slightly out-of-phase so the gradient seems to
/// "breathe". Reduces motion gracefully.
struct WSAuroraDrift: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var colors: [Color]
    var duration: Double = 14
    var cornerRadius: CGFloat = 24

    @State private var t: CGFloat = 0

    var body: some View {
        ZStack {
            LinearGradient(colors: colors,
                           startPoint: UnitPoint(x: t, y: 0),
                           endPoint: UnitPoint(x: 1 + t, y: 1))
            LinearGradient(colors: colors.reversed(),
                           startPoint: UnitPoint(x: 1 - t, y: 1),
                           endPoint: UnitPoint(x: -t, y: 0))
                .blendMode(.softLight)
                .opacity(0.55)
        }
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.linear(duration: duration).repeatForever(autoreverses: true)) {
                t = 0.5
            }
        }
    }
}

// MARK: - Pulsing ring glow (matches `dashboard-coach-panel-glow`)

/// Periodic outward glow ring around a view — useful for highlighting a
/// CTA or the active onboarding step. Pair with `.padding()` so the glow
/// has room to bloom outward.
struct WSPulsingRingModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var color: Color = WSColor.duoPurple
    var cornerRadius: CGFloat = 24

    @State private var pulsing = false

    func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(color.opacity(0.45), lineWidth: pulsing ? 4 : 0)
                    .scaleEffect(pulsing ? 1.04 : 1.0)
                    .blur(radius: pulsing ? 6 : 0)
            )
            .onAppear {
                guard !reduceMotion else { return }
                withAnimation(.easeInOut(duration: 1.7).repeatForever(autoreverses: true)) {
                    pulsing = true
                }
            }
    }
}

extension View {
    /// Pulse a soft colored glow ring around the view.
    func wsPulsingRing(color: Color = WSColor.duoPurple,
                       cornerRadius: CGFloat = 24) -> some View {
        modifier(WSPulsingRingModifier(color: color, cornerRadius: cornerRadius))
    }
}

// MARK: - Stagger fade-slide-in (for list reveal animations)

/// Mirrors the desktop's `fade-slide-in` keyframe (translateY(4) + opacity(0)
/// to (0)+(1) over 0.4s) with a per-row stagger delay. Apply to a list of
/// cards on appear. Pass an `index` and a `unit` (seconds per row).
struct WSStaggerEntryModifier: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var index: Int
    var unit: Double = 0.06

    @State private var animated = false

    func body(content: Content) -> some View {
        content
            .opacity(animated || reduceMotion ? 1 : 0)
            .offset(y: animated || reduceMotion ? 0 : 12)
            .onAppear {
                guard !reduceMotion else {
                    animated = true
                    return
                }
                let delay = Double(index) * unit
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                    withAnimation(.spring(response: 0.45, dampingFraction: 0.78)) {
                        animated = true
                    }
                }
            }
    }
}

extension View {
    /// Animate a list-row's entry with a staggered fade + slide.
    func wsStaggerEntry(_ index: Int, unit: Double = 0.06) -> some View {
        modifier(WSStaggerEntryModifier(index: index, unit: unit))
    }
}

// MARK: - Preview

#Preview("Shine + aurora + stagger") {
    VStack(spacing: 22) {
        Button("Upgrade to Pro") {}
            .buttonStyle(WSDuoSuccessButtonStyle())
            .wsShineSweep()

        ZStack {
            WSAuroraDrift(colors: [WSColor.duoPurple, WSColor.duoPurpleDark, WSColor.duoBlue])
            Text("PREMIUM")
                .font(WSFont.sans(28, weight: .black))
                .foregroundStyle(.white)
                .padding(40)
        }
        .frame(height: 140)

        VStack(spacing: 10) {
            ForEach(0..<5, id: \.self) { i in
                Text("Row \(i + 1)")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(WSColor.duoBlueLight)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .wsStaggerEntry(i)
            }
        }
    }
    .padding()
    .background(WSColor.duoSurface)
}
