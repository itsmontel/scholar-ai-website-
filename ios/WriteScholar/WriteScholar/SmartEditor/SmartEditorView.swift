//
//  SmartEditorView.swift
//  WriteScholar
//
//  Prototype screen #6 — a writing surface with an AI action toolbar
//  (AI Improve · Grammar · Simplify · Shorten · Expand). Each action sends
//  the text to the backend and offers the rewrite back as a Replace/Keep
//  choice with the changes highlighted (green = new wording), matching the
//  mockup's colored marks.
//
//  Drafts autosave to UserDefaults so dismissing the sheet never loses
//  writing; Replace is undoable via the ↩︎ button in the nav bar.
//
//  The toolbar posts to POST /api/analysis/editor (backend route added in
//  analysis.js → aiAnalysisService.rewriteForEditor). Network failures show
//  a graceful alert and leave the text untouched.
//

import SwiftUI

enum AIAction: String, CaseIterable, Identifiable {
    case improve  = "AI Improve"
    case grammar  = "Grammar"
    case simplify = "Simplify"
    case shorten  = "Shorten"
    case expand   = "Expand"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .improve:  return "sparkles"
        case .grammar:  return "checkmark.bubble.fill"
        case .simplify: return "wand.and.rays"
        case .shorten:  return "arrow.down.right.and.arrow.up.left"
        case .expand:   return "arrow.up.left.and.arrow.down.right"
        }
    }

    var tint: Color {
        switch self {
        case .improve:  return WSColor.duoPurple
        case .grammar:  return WSColor.duoBlue
        case .simplify: return WSColor.duoGreen
        case .shorten:  return WSColor.duoOrange
        case .expand:   return WSColor.duoRed
        }
    }

    /// Backend mode string — decoupled from the display name so the
    /// "AI Improve" label doesn't change the API contract.
    var mode: String {
        switch self {
        case .improve:  return "improve"
        case .grammar:  return "grammar"
        case .simplify: return "simplify"
        case .shorten:  return "shorten"
        case .expand:   return "expand"
        }
    }
}

struct EditorSuggestion: Identifiable {
    let id = UUID()
    let action: AIAction
    let original: String
    let suggested: String
}

struct SmartEditorView: View {
    @Environment(\.dismiss) private var dismiss

    // Draft autosave — dismissing the sheet never loses writing.
    @AppStorage("ws.smartEditor.draft.title") private var title: String = ""
    @AppStorage("ws.smartEditor.draft.body") private var bodyText: String = ""

    @State private var running: AIAction? = nil
    @State private var suggestion: EditorSuggestion? = nil
    @State private var errorMessage: String? = nil
    @State private var undoText: String? = nil
    @State private var showStartOver = false
    @FocusState private var bodyFocused: Bool

    private var wordCount: Int {
        bodyText.split { $0 == " " || $0 == "\n" || $0 == "\t" }.count
    }

    private var wordCountLabel: String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        let n = f.string(from: NSNumber(value: wordCount)) ?? "\(wordCount)"
        return "\(n) word\(wordCount == 1 ? "" : "s")"
    }

    private var isEmpty: Bool {
        bodyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 6) {
                TextField("Untitled essay", text: $title)
                    .font(WSFont.headline(24, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                Text(wordCountLabel)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 8)

            Divider()

            ZStack(alignment: .topLeading) {
                if bodyText.isEmpty {
                    Text("Start writing your essay…")
                        .wsBody(.large)
                        .foregroundStyle(WSColor.foregroundMuted.opacity(0.6))
                        .padding(.horizontal, 21)
                        .padding(.top, 20)
                        .allowsHitTesting(false)
                }
                TextEditor(text: $bodyText)
                    .font(WSFont.sans(17))
                    .foregroundStyle(WSColor.foreground)
                    .scrollContentBackground(.hidden)
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                    .focused($bodyFocused)
            }

            toolbar
        }
        .background(WSColor.background.ignoresSafeArea())
        .navigationTitle("Smart Editor")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                if undoText != nil {
                    Button {
                        Haptics.light()
                        if let prior = undoText {
                            bodyText = prior
                            undoText = nil
                        }
                    } label: {
                        Image(systemName: "arrow.uturn.backward")
                    }
                    .foregroundStyle(WSColor.duoPurple)
                    .accessibilityLabel("Undo replace")
                }
                Button {
                    Haptics.light()
                    showStartOver = true
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .foregroundStyle(WSColor.duoPurple)
                .disabled(isEmpty && title.isEmpty)
                .accessibilityLabel("Start over")

                Button("Done") { dismiss() }
                    .foregroundStyle(WSColor.duoPurple)
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") {
                    bodyFocused = false
                }
                .font(WSFont.sans(15, weight: .bold))
                .foregroundStyle(WSColor.duoPurple)
            }
        }
        .confirmationDialog("Start a new essay?", isPresented: $showStartOver, titleVisibility: .visible) {
            Button("Clear draft", role: .destructive) {
                Haptics.warning()
                title = ""
                bodyText = ""
                undoText = nil
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This clears the current draft. It can't be undone.")
        }
        .sheet(item: $suggestion) { s in suggestionSheet(s) }
        .overlay { if running != nil { processingOverlay } }
        .alert("Couldn't reach AI",
               isPresented: Binding(get: { errorMessage != nil },
                                    set: { if !$0 { errorMessage = nil } })) {
            Button("OK", role: .cancel) { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - AI toolbar

    private var toolbar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(AIAction.allCases) { action in
                    let isPrimary = action == .improve
                    Button {
                        Haptics.medium()
                        run(action)
                    } label: {
                        VStack(spacing: 5) {
                            Image(systemName: action.icon).font(.system(size: 17, weight: .bold))
                            Text(action.rawValue).font(WSFont.sans(11, weight: .bold))
                                .lineLimit(1)
                                .minimumScaleFactor(0.8)
                        }
                        .foregroundStyle(isPrimary ? .white : action.tint)
                        .frame(width: isPrimary ? 78 : 66)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(isPrimary ? AnyShapeStyle(action.tint) : AnyShapeStyle(action.tint.opacity(0.12)))
                                .shadow(color: isPrimary ? action.tint.opacity(0.35) : .clear, radius: 8, y: 4)
                        )
                        .opacity(isEmpty ? 0.4 : 1)
                    }
                    .buttonStyle(WSBouncyButtonStyle())
                    .disabled(isEmpty)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(
            WSColor.backgroundElevated
                .shadow(color: Color.black.opacity(0.05), radius: 8, y: -2)
                .ignoresSafeArea(edges: .bottom)
        )
    }

    private var processingOverlay: some View {
        ZStack {
            Color.black.opacity(0.15).ignoresSafeArea()
            VStack(spacing: 12) {
                WSAnimatedImage(name: "mascot-laptop", ext: "webp")
                    .frame(width: 84, height: 84)
                    .wsBobbing()
                Text("\(running?.rawValue ?? "Working")…")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text("Polishing your writing")
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(28)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .shadow(color: Color.black.opacity(0.12), radius: 16, y: 6)
            )
        }
    }

    // MARK: - Suggestion sheet (before/after with highlight marks)

    private func suggestionSheet(_ s: EditorSuggestion) -> some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        Image(systemName: s.action.icon)
                            .font(.system(size: 12, weight: .black))
                        Text("New wording is highlighted")
                            .font(WSFont.sans(12, weight: .black))
                    }
                    .foregroundStyle(s.action.tint)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(s.action.tint.opacity(0.12)))

                    Text(EditorDiff.highlightedSuggestion(original: s.original,
                                                          suggested: s.suggested,
                                                          tint: s.action.tint))
                        .font(WSFont.sans(17))
                        .foregroundStyle(WSColor.foreground)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(20)
            }
            .background(WSColor.background.ignoresSafeArea())
            .navigationTitle("\(s.action.rawValue) suggestion")
            .navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom) {
                HStack(spacing: 10) {
                    Button { suggestion = nil } label: {
                        Text("Keep original").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))
                    Button {
                        undoText = bodyText
                        bodyText = s.suggested
                        suggestion = nil
                        Haptics.success()
                    } label: {
                        Text("Replace").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
                }
                .padding(16)
                .background(WSColor.backgroundElevated.ignoresSafeArea(edges: .bottom))
            }
        }
    }

    // MARK: - Run an AI action

    private func run(_ action: AIAction) {
        guard !isEmpty else { return }
        let text = bodyText
        running = action
        Task {
            do {
                let result = try await SmartEditorService.shared.transform(text: text, action: action)
                await MainActor.run {
                    running = nil
                    Haptics.success()
                    suggestion = EditorSuggestion(action: action, original: text, suggested: result)
                }
            } catch {
                await MainActor.run {
                    running = nil
                    Haptics.error()
                    errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
                }
            }
        }
    }
}

// MARK: - Word-level diff highlighting

/// Marks the words in `suggested` that don't appear in `original` with a
/// tinted background — the mockup's inline highlight treatment. Uses a
/// word-frequency membership test (not a positional LCS) so it stays fast
/// on essay-length text.
enum EditorDiff {
    static func highlightedSuggestion(original: String, suggested: String, tint: Color) -> AttributedString {
        var result = AttributedString(suggested)
        // Cap the work for very long documents.
        guard suggested.count < 24_000 else { return result }

        var originalCounts: [String: Int] = [:]
        for word in original.split(whereSeparator: { $0.isWhitespace || $0.isNewline }) {
            let key = normalize(word)
            guard !key.isEmpty else { continue }
            originalCounts[key, default: 0] += 1
        }

        // Walk the suggested text word by word; highlight words that exceed
        // their count in the original (i.e. new or reworded content).
        var searchStart = result.startIndex
        for word in suggested.split(whereSeparator: { $0.isWhitespace || $0.isNewline }) {
            let key = normalize(word)
            guard !key.isEmpty else { continue }
            let isNew: Bool
            if let remaining = originalCounts[key], remaining > 0 {
                originalCounts[key] = remaining - 1
                isNew = false
            } else {
                isNew = true
            }
            if let range = result[searchStart...].range(of: String(word)) {
                if isNew {
                    result[range].backgroundColor = tint.opacity(0.22)
                }
                searchStart = range.upperBound
            }
        }
        return result
    }

    private static func normalize(_ word: Substring) -> String {
        word.lowercased().trimmingCharacters(in: .punctuationCharacters)
    }
}

// MARK: - Service

// Stateless (no stored properties) — safe to share across concurrency
// domains, so an explicit Sendable conformance satisfies Swift 6.
final class SmartEditorService: Sendable {
    static let shared = SmartEditorService()

    private struct Req: Encodable { let text: String; let mode: String }
    /// Tolerant of a few likely field names in the response envelope's data.
    private struct Resp: Decodable { let result: String?; let text: String?; let rewritten: String? }

    func transform(text: String, action: AIAction) async throws -> String {
        let resp: Resp = try await APIClient.shared.post(
            path: "analysis/editor",
            body: Req(text: text, mode: action.mode),
            requiresAuth: true
        )
        return resp.result ?? resp.text ?? resp.rewritten ?? text
    }
}

#Preview {
    NavigationStack { SmartEditorView() }
}
