//
//  ToolPickerSheet.swift
//  WriteScholar
//
//  The "What would you like to work on?" sheet presented by the center ⊕
//  in the tab bar. Mirrors prototype screen #2: a stack of tool rows + the
//  mascot. Selecting a row hands an AppRoute back to the shell.
//

import SwiftUI

struct ToolPickerSheet: View {
    var onSelect: (AppRoute) -> Void
    @Environment(\.dismiss) private var dismiss

    private struct Tool: Identifiable {
        let id = UUID()
        let icon: String
        let tint: Color
        let title: String
        let subtitle: String
        let route: AppRoute
    }

    private let tools: [Tool] = [
        .init(icon: "pencil.and.scribble",        tint: WSColor.duoPurple, title: "Smart Editor",   subtitle: "Write & improve essays",  route: .smartEditor),
        .init(icon: "checkmark.seal.fill",         tint: WSColor.duoBlue,   title: "Essay Analyzer",  subtitle: "Get AI feedback & a grade", route: .essayAnalyzer),
        .init(icon: "rectangle.on.rectangle.angled", tint: WSColor.duoGreen, title: "Flashcards",     subtitle: "Study notes & concepts",  route: .studyPacks),
        .init(icon: "checklist",                   tint: WSColor.duoOrange, title: "Quiz",            subtitle: "Test your knowledge",     route: .studyPacks),
        .init(icon: "square.stack.3d.up.fill",     tint: WSColor.duoOrange, title: "Study Pack",      subtitle: "Turn notes into a pack",  route: .studyPacks),
        .init(icon: "gamecontroller.fill",         tint: WSColor.duoPink,   title: "Arcade Mode",     subtitle: "Learn by playing games",  route: .arcade),
        .init(icon: "shield.lefthalf.filled",      tint: WSColor.duoBlue,   title: "Focus Mode",      subtitle: "Block apps until you study", route: .focus),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("What would you like\nto work on?")
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                    .padding(.top, 8)

                VStack(spacing: 12) {
                    ForEach(tools) { tool in
                        Button {
                            Haptics.light()
                            onSelect(tool.route)
                        } label: {
                            WSListRowCard(icon: tool.icon,
                                          iconTint: tool.tint,
                                          title: tool.title,
                                          subtitle: tool.subtitle)
                        }
                        .buttonStyle(.plain)
                    }
                }

                WSMascotHero(asset: "mascot-laptop", size: 128, haloTint: WSColor.duoPurple)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 6)
            }
            .padding(20)
        }
        .background(WSColor.background.ignoresSafeArea())
    }
}

#Preview {
    Color.white.sheet(isPresented: .constant(true)) {
        ToolPickerSheet(onSelect: { _ in })
    }
}
