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
                    message: "This study pack didn't include a lesson — try regenerating with longer notes."
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
        }
    }

    // MARK: - Header / green Duolingo progress bar

    private var progressHeader: some View {
        VStack(spacing: 10) {
            HStack {
                Text(lesson.title ?? "Lesson")
                    .font(WSFont.sans(15, weight: .bold))
                    .foregroundStyle(WSColor.duoText)
                    .lineLimit(1)
                Spacer()
                Text("\(slideIndex + 1) / \(max(slides.count, 1))")
                    .font(WSFont.sans(11, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(WSColor.backgroundElevated)
                        .overlay(Capsule().stroke(WSColor.duoBorder, lineWidth: 2)))
            }
            .padding(.horizontal, 16)

            WSProgressBar(fraction: progressFraction, tint: WSColor.duoGreen, height: 14)
                .padding(.horizontal, 16)
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
                        .font(WSFont.sans(10, weight: .black))
                        .tracking(2.2)
                        .textCase(.uppercase)
                        .foregroundStyle(pal.accent)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(pal.light))
                }

                Text(slide.title)
                    .font(WSFont.headline(22, weight: .black))
                    .foregroundStyle(WSColor.duoText)

                Text(slide.content)
                    .font(WSFont.sans(15))
                    .foregroundStyle(WSColor.duoText.opacity(0.92))
                    .lineSpacing(4)

                if let bullets = slide.bulletPoints, !bullets.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(Array(bullets.enumerated()), id: \.offset) { _, bullet in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(pal.accent)
                                    .font(.system(size: 16, weight: .bold))
                                Text(bullet)
                                    .font(WSFont.sans(15))
                                    .foregroundStyle(WSColor.duoText)
                            }
                        }
                    }
                }

                if let term = slide.highlightedTerm, !term.isEmpty {
                    HStack(spacing: 8) {
                        Text("KEY TERM")
                            .font(WSFont.sans(10, weight: .black))
                            .tracking(2.2)
                            .foregroundStyle(pal.accent)
                        Text(term)
                            .font(WSFont.sans(15, weight: .bold))
                            .foregroundStyle(WSColor.duoText)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(pal.light)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(pal.accent.opacity(0.35), lineWidth: 2)
                            )
                    )
                }

                Spacer(minLength: 0)
            }
            .padding(20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            ZStack(alignment: .top) {
                // 3D lip — uses the slide's accent color
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(pal.accent.opacity(0.30))
                    .padding(.top, 6)
                // Top face
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(WSColor.duoBorder, lineWidth: 2)
                    )
            }
        )
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
            .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: false))
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
            .buttonStyle(WSDuoSuccessButtonStyle(fullWidth: false))
        }
    }

    // MARK: - Type palette (Duolingo colors)

    private struct Palette {
        let accent: Color
        let light: Color
    }

    private func palette(for type: LessonSlide.SlideType?) -> Palette {
        switch type {
        case .intro:    return Palette(accent: WSColor.duoPurple,  light: WSColor.duoPurpleLight)
        case .concept:  return Palette(accent: WSColor.duoBlue,    light: WSColor.duoBlueLight)
        case .example:  return Palette(accent: WSColor.duoOrange,  light: WSColor.duoOrangeLight)
        case .keypoint: return Palette(accent: WSColor.duoGreen,   light: WSColor.duoGreenLight)
        case .funfact:  return Palette(accent: WSColor.duoPurple,  light: WSColor.duoPurpleLight)
        case .summary:  return Palette(accent: WSColor.duoGreen,   light: WSColor.duoGreenLight)
        case .none:     return Palette(accent: WSColor.duoBlue,    light: WSColor.duoBlueLight)
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
            ZStack {
                Circle()
                    .fill(WSColor.duoSurface)
                    .frame(width: 100, height: 100)
                    .overlay(Circle().stroke(WSColor.duoBorder, lineWidth: 2))
                Image(systemName: icon)
                    .font(.system(size: 42, weight: .semibold))
                    .foregroundStyle(WSColor.duoBorder)
            }
            Text(title)
                .font(WSFont.headline(17, weight: .black))
                .foregroundStyle(WSColor.duoText)
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
