//
//  WSWinScreen.swift
//  WriteScholar
//
//  The "round complete" celebration: purple field with a slowly spinning
//  sunburst, confetti, the celebrating mascot hopping, a slammed-in lime
//  headline and four tilted stat stickers that pop in one by one. Used by
//  the quiz score screen (and anything else that finishes a round).
//

import SwiftUI

struct WSWinStat: Identifiable {
    let id = UUID()
    var label: String
    var value: String
    var fill: Color
}

struct WSWinScreen<Actions: View>: View {
    var headline: String
    var subline: String
    var stats: [WSWinStat]
    @ViewBuilder var actions: () -> Actions

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var slammed = false
    @State private var confetti = 0

    private let tilts: [Double] = [-3, 2.5, 2, -2]

    var body: some View {
        ZStack {
            WSColor.purple.ignoresSafeArea()
            WSSunburst(rays: 18)
                .fill(Color(hex: 0x8C70EE))
                .frame(width: 760, height: 760)
                .wsSpin(period: 22)
                .offset(y: -240)
                .allowsHitTesting(false)
                .accessibilityHidden(true)

            ScrollView {
                VStack(spacing: 0) {
                    WSAnimatedImage(name: "mascot-celebrating", ext: "webp")
                        .frame(width: 180, height: 180)
                        .wsMascotBob(amount: 14, rock: 4, duration: 0.45)
                        .accessibilityHidden(true)

                    Text(headline)
                        .font(WSFont.headline(64, weight: .black))
                        .tracking(-2.6)
                        .lineSpacing(-14)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(WSColor.lime)
                        .scaleEffect(slammed || reduceMotion ? 1 : 2.2)
                        .opacity(slammed || reduceMotion ? 1 : 0)
                        .rotationEffect(.degrees(slammed || reduceMotion ? 0 : -8))
                        .padding(.top, 4)

                    Text(subline)
                        .font(WSFont.sans(16, weight: .bold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.top, 12)
                        .padding(.horizontal, 10)

                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 14) {
                        ForEach(Array(stats.enumerated()), id: \.element.id) { i, stat in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(stat.label)
                                    .font(WSFont.sans(11, weight: .black))
                                    .tracking(1.3)
                                    .textCase(.uppercase)
                                Text(stat.value)
                                    .font(WSFont.headline(32, weight: .black))
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.6)
                                    .contentTransition(.numericText())
                            }
                            .foregroundStyle(WSColor.inkText)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 12)
                            .wsSticker(fill: stat.fill, radius: 20, depth: 5)
                            .rotationEffect(.degrees(tilts[i % tilts.count]))
                            .wsPop(delay: 0.5 + Double(i) * 0.12)
                        }
                    }
                    .padding(.top, 22)

                    VStack(spacing: 12) {
                        actions()
                    }
                    .padding(.top, 28)
                }
                .padding(.horizontal, 22)
                .padding(.top, 30)
                .padding(.bottom, 30)
            }

            WSConfettiView(trigger: $confetti)
                .allowsHitTesting(false)
        }
        .onAppear {
            guard !slammed else { return }
            withAnimation(.spring(response: 0.45, dampingFraction: 0.55).delay(0.25)) { slammed = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                confetti += 1
                Haptics.success()
            }
        }
    }
}
