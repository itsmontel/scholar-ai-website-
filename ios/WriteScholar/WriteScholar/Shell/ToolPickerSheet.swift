//
//  ToolPickerSheet.swift
//  WriteScholar
//
//  The "What would you like to work on?" sheet presented by the center ⊕
//  in the tab bar. Mirrors prototype screen #2: a stack of tool rows + the
//  mascot-at-laptop with floating doodles. Selecting a row hands an
//  AppRoute back to the shell (and, for the study tools, stamps a
//  StudyLaunchIntent so the pack screen can jump straight to flashcards
//  or the quiz once a pack is open).
//

import SwiftUI

/// What the user actually asked for when they entered the study-pack flow.
/// The tool picker stamps it; StudyPackHomeView consumes it once to
/// auto-open the matching study surface.
enum StudyLaunchIntent {
    case flashcards
    case quiz
    case create

    /// One-shot hand-off. Only ever read/written on the main thread from
    /// SwiftUI closures; `nonisolated(unsafe)` keeps strict concurrency
    /// happy without forcing MainActor isolation on every access site.
    nonisolated(unsafe) static var pending: StudyLaunchIntent? = nil
}

struct ToolPickerSheet: View {
    var onSelect: (AppRoute) -> Void
    @Environment(\.dismiss) private var dismiss

    private struct Tool: Identifiable {
        var id: String { title }
        let icon: String
        let tint: Color
        let title: String
        let subtitle: String
        let route: AppRoute
        var intent: StudyLaunchIntent? = nil
    }

    private let tools: [Tool] = [
        .init(icon: "pencil.and.scribble",           tint: WSColor.duoPurple, title: "Smart Editor",   subtitle: "Write & improve essays",     route: .smartEditor),
        .init(icon: "doc.text.magnifyingglass",      tint: WSColor.duoBlue,   title: "Essay Analyzer", subtitle: "Get AI feedback",            route: .essayAnalyzer),
        .init(icon: "rectangle.on.rectangle.angled", tint: WSColor.duoGreen,  title: "Flashcards",     subtitle: "Study notes & concepts",     route: .studyPacks, intent: .flashcards),
        .init(icon: "questionmark.circle.fill",      tint: WSColor.duoBlue,   title: "Quiz",           subtitle: "Test your knowledge",        route: .studyPacks, intent: .quiz),
        .init(icon: "folder.fill",                   tint: WSColor.duoPurple, title: "Study Pack",     subtitle: "Organize your notes",        route: .studyPacks, intent: .create),
        .init(icon: "gamecontroller.fill",           tint: WSColor.duoPink,   title: "Arcade Mode",    subtitle: "Learn by playing",           route: .arcade),
        .init(icon: "shield.lefthalf.filled",        tint: WSColor.duoOrange, title: "Focus Mode",     subtitle: "Block apps until you study", route: .focus),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(alignment: .top) {
                    Text("What would you like\nto work on?")
                        .wsHeadline(.large, weight: .black)
                        .foregroundStyle(WSColor.foreground)
                    Spacer()
                    Button {
                        Haptics.light()
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 13, weight: .black))
                            .foregroundStyle(WSColor.foregroundMuted)
                            .frame(width: 32, height: 32)
                            .background(
                                Circle()
                                    .fill(WSColor.backgroundElevated)
                                    .shadow(color: Color.black.opacity(0.06), radius: 5, y: 2)
                            )
                    }
                    .buttonStyle(WSBouncyButtonStyle())
                    .accessibilityLabel("Close")
                }
                .padding(.top, 8)
                .wsStaggerEntry(0)

                VStack(spacing: 12) {
                    ForEach(Array(tools.enumerated()), id: \.element.id) { (i, tool) in
                        Button {
                            Haptics.light()
                            StudyLaunchIntent.pending = tool.intent
                            onSelect(tool.route)
                        } label: {
                            WSListRowCard(icon: tool.icon,
                                          iconTint: tool.tint,
                                          title: tool.title,
                                          subtitle: tool.subtitle)
                        }
                        .buttonStyle(WSBouncyButtonStyle())
                        .wsStaggerEntry(i + 1)
                    }
                }

                mascotWithDoodles
                    .frame(maxWidth: .infinity)
                    .padding(.top, 6)
                    .wsStaggerEntry(tools.count + 1)
            }
            .padding(20)
        }
        .background(WSColor.background.ignoresSafeArea())
    }

    /// Mascot at the laptop with floating doodle icons around it — the
    /// mockup's bottom illustration.
    private var mascotWithDoodles: some View {
        ZStack {
            WSMascotHero(asset: "mascot-laptop", size: 128, haloTint: WSColor.duoPurple)

            doodle("sparkle",        tint: WSColor.duoYellowDark, size: 14, x: -86, y: -44, delay: 0.0)
            doodle("book.fill",      tint: WSColor.duoBlue,       size: 16, x:  88, y: -34, delay: 0.6)
            doodle("lightbulb.fill", tint: WSColor.duoOrange,     size: 15, x: -78, y:  36, delay: 1.2)
            doodle("star.fill",      tint: WSColor.duoPink,       size: 13, x:  82, y:  44, delay: 0.3)
            doodle("plus",           tint: WSColor.duoPurple,     size: 13, x:   4, y: -70, delay: 0.9)
        }
        .frame(height: 170)
    }

    private func doodle(_ symbol: String, tint: Color, size: CGFloat,
                        x: CGFloat, y: CGFloat, delay: Double) -> some View {
        Image(systemName: symbol)
            .font(.system(size: size, weight: .bold))
            .foregroundStyle(tint.opacity(0.75))
            .offset(x: x, y: y)
            .wsBobbing(amount: 5, duration: 2.8 + delay)
    }
}

#Preview {
    Color.white.sheet(isPresented: .constant(true)) {
        ToolPickerSheet(onSelect: { _ in })
    }
}
