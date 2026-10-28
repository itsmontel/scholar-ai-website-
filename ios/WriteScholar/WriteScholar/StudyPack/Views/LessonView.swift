//
//  LessonView.swift
//  WriteScholar
//
//  Paginated slide reader. Mirrors the web's LessonViewer aesthetic:
//  type-tinted card with eyebrow icon, big title, body text, optional
//  bullet points, and a brand progress bar at the top.
//

import SwiftUI

struct LessonView: View {
    let lesson: Lesson

    @State private var slideIndex = 0

    private var slides: [LessonSlide] { lesson.slides }
    private var current: LessonSlide? {
        guard !slides.isEmpty, slideIndex < slides.count else { return nil }
        return slides[slideIndex]
    }

    var body: some View {
        VStack(spacing: 16) {
            progressHeader

            if slides.isEmpty {
                EmptyStateView(
                    icon: "book.pages",
                    title: "No lesson",
                    message: "This study pack didn't include a lesson. Try regenerating with longer notes."
                )
            } else {
                TabView(selection: $slideIndex) {
                    ForEach(Array(slides.enumerated()), id: \.element.stableId) { idx, slide in
                        slideCard(slide)
                            .padding(.horizontal, 12)
                            .tag(idx)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut(duration: 0.3), value: slideIndex)

                navBar
                    .padding(.horizontal, 16)
            }
        }
        .padding(.vertical, 12)
        .onChange(of: slideIndex) { _, _ in
            Haptics.selection()
            // Durable pack progress (drives the list rows' % + Home rings).
            StudyPackProgressStore.shared.recordSlidesSeen(slideIndex + 1)
        }
        .onAppear {
            StudyPackProgressStore.shared.recordSlidesSeen(1)
        }
    }

    // MARK: - Header / green Duolingo progress bar

    private var progressHeader: some View {
        VStack(spacing: 10) {
            HStack {
                Text(lesson.title ?? "Lesson")
                    .font(WSFont.headline(18, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Spacer()
                Text("\(slideIndex + 1)/\(max(slides.count, 1))")
                    .font(WSFont.headline(15, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .monospacedDigit()
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .wsStickerCapsule(fill: WSColor.lime, depth: 2)
            }
            .padding(.horizontal, 20)

            WSStripeBar(fraction: progressFraction, fill: WSColor.purple, height: 14)
                .padding(.horizontal, 20)
        }
    }

    private var progressFraction: Double {
        guard !slides.isEmpty else { return 0 }
        return Double(slideIndex + 1) / Double(slides.count)
    }

    // MARK: - Slide card (chunky Duo card per slide type)

    @ViewBuilder
    private func slideCard(_ slide: LessonSlide) -> some View {
        let pal = palette(for: slide.type)
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 8) {
                    Text(slide.emoji ?? icon(for: slide.type))
                        .font(.system(size: 20))
                    Text((slide.type?.rawValue ?? "key").uppercased())
                        .font(WSFont.sans(11, weight: .black))
                        .tracking(1.3)
                        .foregroundStyle(WSColor.inkText)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 4)
                        .background(RoundedRectangle(cornerRadius: 9).fill(pal.accent))
                        .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(WSColor.ink, lineWidth: 2))
                }

                Text(slide.title)
                    .font(WSFont.headline(28, weight: .black))
                    .tracking(-0.8)
                    .foregroundStyle(WSColor.foreground)

                Text(slide.content)
                    .font(WSFont.sans(16, weight: .medium))
                    .foregroundStyle(WSColor.foreground)
                    .lineSpacing(4)

                if let bullets = slide.bulletPoints, !bullets.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(Array(bullets.enumerated()), id: \.offset) { _, bullet in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundStyle(WSColor.inkText)
                                    .frame(width: 22, height: 22)
                                    .wsStickerCircle(fill: pal.accent)
                                Text(bullet)
                                    .font(WSFont.sans(15, weight: .semibold))
                                    .foregroundStyle(WSColor.foreground)
                            }
                        }
                    }
                }

                if let term = slide.highlightedTerm, !term.isEmpty {
                    HStack(spacing: 8) {
                        Text("KEY TERM")
                            .font(WSFont.sans(11, weight: .black))
                            .tracking(1.3)
                        Text(term)
                            .font(WSFont.headline(17, weight: .black))
                    }
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .wsSticker(fill: pal.accent, radius: 14, depth: 3)
                    .rotationEffect(.degrees(-1.5))
                }

                Spacer(minLength: 0)
            }
            .padding(20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(WSColor.backgroundElevated)
        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(pal.accent).offset(x: 5, y: 7))
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke).offset(x: 5, y: 7))
        .padding(.trailing, 5)
        .padding(.bottom, 8)
    }

    // MARK: - Nav bar (chunky Duo buttons)

    private var navBar: some View {
        HStack(spacing: 12) {
            Button {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    slideIndex = max(0, slideIndex - 1)
                }
            } label: {
                Label("Previous", systemImage: "chevron.left")
            }
            .buttonStyle(WSStickerButtonStyle(fill: WSColor.backgroundElevated, foreground: WSColor.foreground, radius: 18, depth: 4,
                                              fullWidth: false, height: 52, font: WSFont.headline(16, weight: .black)))
            .disabled(slideIndex == 0)
            .opacity(slideIndex == 0 ? 0.4 : 1)

            Spacer()

            Button {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    slideIndex = min(slides.count - 1, slideIndex + 1)
                }
            } label: {
                HStack(spacing: 6) {
                    Text(slideIndex == slides.count - 1 ? "Done" : "Next")
                    Image(systemName: "chevron.right")
                }
            }
            .buttonStyle(WSStickerButtonStyle(fill: WSColor.lime, foreground: WSColor.inkText, radius: 18, depth: 4,
                                              fullWidth: false, height: 52, font: WSFont.headline(16, weight: .black)))
        }
    }

    // MARK: - Type palette (Duolingo colors)

    private struct Palette {
        let accent: Color
        let light: Color
    }

    private func palette(for type: LessonSlide.SlideType?) -> Palette {
        switch type {
        case .intro:    return Palette(accent: WSColor.pink,   light: WSColor.pinkSoft)
        case .concept:  return Palette(accent: WSColor.sky,    light: WSColor.lilacDeep)
        case .example:  return Palette(accent: WSColor.orange, light: WSColor.lilacDeep)
        case .keypoint: return Palette(accent: WSColor.lime,   light: WSColor.lilacDeep)
        case .funfact:  return Palette(accent: WSColor.sun,    light: WSColor.lilacDeep)
        case .summary:  return Palette(accent: WSColor.lime,   light: WSColor.lilacDeep)
        case .none:     return Palette(accent: WSColor.sky,    light: WSColor.lilacDeep)
        }
    }

    private func icon(for type: LessonSlide.SlideType?) -> String {
        switch type {
        case .intro:    return "📖"
        case .concept:  return "💡"
        case .example:  return "🔍"
        case .keypoint: return "⭐"
        case .funfact:  return "🎯"
        case .summary:  return "✅"
        case .none:     return "📝"
        }
    }
}

// MARK: - Empty state (shared across study tools)

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 38, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 96, height: 96)
                .wsStickerCircle(fill: WSColor.sun, depth: 4)
            Text(title)
                .font(WSFont.headline(22, weight: .black))
                .foregroundStyle(WSColor.foreground)
            Text(message)
                .font(WSFont.sans(13))
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

#Preview {
    LessonView(lesson: Lesson(
        title: "Photosynthesis",
        slides: [
            LessonSlide(
                id: 1, type: .intro, title: "What is photosynthesis?",
                content: "Photosynthesis is how plants and some bacteria turn light energy into chemical energy stored in glucose.",
                emoji: "🌿", bulletPoints: nil, highlightedTerm: "Glucose"
            ),
            LessonSlide(
                id: 2, type: .keypoint, title: "Two stages",
                content: "It happens in two phases: the light reactions in the thylakoid membrane, then the Calvin cycle in the stroma.",
                emoji: nil,
                bulletPoints: ["Light reactions split water and produce ATP + NADPH", "Calvin cycle uses CO2 to build glucose"],
                highlightedTerm: nil
            )
        ]
    ))
}
