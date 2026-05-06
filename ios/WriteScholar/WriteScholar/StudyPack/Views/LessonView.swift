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

    // MARK: - Header / progress

    private var progressHeader: some View {
        VStack(spacing: 8) {
            HStack {
                Text(lesson.title ?? "Lesson")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Spacer()
                Text("\(slideIndex + 1) / \(max(slides.count, 1))")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(WSColor.surface))
            }
            .padding(.horizontal, 16)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(WSColor.surface).frame(height: 6)
                    Capsule()
                        .fill(WSGradient.brand)
                        .frame(width: max(6, geo.size.width * progressFraction), height: 6)
                        .shadow(color: WSColor.brandPrimary.opacity(0.5), radius: 6, y: 2)
                }
            }
            .frame(height: 6)
            .padding(.horizontal, 16)
        }
    }

    private var progressFraction: CGFloat {
        guard !slides.isEmpty else { return 0 }
        return CGFloat(slideIndex + 1) / CGFloat(slides.count)
    }

    // MARK: - Slide card

    @ViewBuilder
    private func slideCard(_ slide: LessonSlide) -> some View {
        let palette = palette(for: slide.type)
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 8) {
                    Text(slide.emoji ?? icon(for: slide.type))
                        .font(.system(size: 20))
                    Text((slide.type?.rawValue ?? "key").uppercased())
                        .wsEyebrow()
                        .foregroundStyle(palette.accent)
                }

                Text(slide.title)
                    .wsHeadline(.medium, weight: .semibold)
                    .foregroundStyle(WSColor.foreground)

                Text(slide.content)
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foreground.opacity(0.92))
                    .lineSpacing(4)

                if let bullets = slide.bulletPoints, !bullets.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(Array(bullets.enumerated()), id: \.offset) { _, bullet in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(palette.accent)
                                    .font(.system(size: 16, weight: .bold))
                                Text(bullet)
                                    .wsBody(.medium)
                                    .foregroundStyle(WSColor.foreground)
                            }
                        }
                    }
                }

                if let term = slide.highlightedTerm, !term.isEmpty {
                    HStack(spacing: 8) {
                        Text("KEY TERM")
                            .wsEyebrow()
                            .foregroundStyle(palette.accent)
                        Text(term)
                            .wsBody(.medium, weight: .bold)
                            .foregroundStyle(WSColor.foreground)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(palette.tint.opacity(0.18))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(palette.accent.opacity(0.35), lineWidth: 1)
                            )
                    )
                }

                Spacer(minLength: 0)
            }
            .padding(20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(palette.tint.opacity(0.10))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(palette.accent.opacity(0.35), lineWidth: 1)
                )
                .shadow(color: palette.accent.opacity(0.18), radius: 18, y: 8)
        )
    }

    // MARK: - Nav bar

    private var navBar: some View {
        HStack(spacing: 12) {
            Button {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    slideIndex = max(0, slideIndex - 1)
                }
            } label: {
                Label("Previous", systemImage: "chevron.left")
                    .wsBody(.small, weight: .semibold)
            }
            .buttonStyle(WSSecondaryButtonStyle())
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
            .buttonStyle(WSPrimaryButtonStyle(fullWidth: false))
        }
    }

    // MARK: - Type palette

    private struct Palette {
        let accent: Color
        let tint: Color
    }

    private func palette(for type: LessonSlide.SlideType?) -> Palette {
        switch type {
        case .intro:    return Palette(accent: Color(hex: 0x7C3AED), tint: Color(hex: 0x7C3AED))
        case .concept:  return Palette(accent: Color(hex: 0x6366F1), tint: Color(hex: 0x6366F1))
        case .example:  return Palette(accent: Color(hex: 0xF59E0B), tint: Color(hex: 0xF59E0B))
        case .keypoint: return Palette(accent: Color(hex: 0x10B981), tint: Color(hex: 0x10B981))
        case .funfact:  return Palette(accent: Color(hex: 0xD946EF), tint: Color(hex: 0xD946EF))
        case .summary:  return Palette(accent: Color(hex: 0x7C3AED), tint: Color(hex: 0x7C3AED))
        case .none:     return Palette(accent: WSColor.brandPrimary, tint: WSColor.brandPrimary)
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
                .font(.system(size: 42, weight: .semibold))
                .foregroundStyle(WSColor.foregroundMuted)
            Text(title)
                .wsHeadline(.small, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
            Text(message)
                .wsBody(.small)
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
                bulletPoints: ["Light reactions split water and produce ATP + NADPH", "Calvin cycle uses CO₂ to build glucose"],
                highlightedTerm: nil
            )
        ]
    ))
}
