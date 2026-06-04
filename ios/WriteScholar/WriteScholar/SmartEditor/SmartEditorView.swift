//
//  SmartEditorView.swift
//  WriteScholar
//
//  Prototype screen #6 — a writing surface with an AI action toolbar
//  (Improve · Grammar · Simplify · Shorten · Expand). Each action sends the
//  text to the backend and offers the rewrite back as a Replace/Keep choice.
//
//  The toolbar posts to POST /api/analysis/editor (backend route added in
//  analysis.js → aiAnalysisService.rewriteForEditor). Network failures show
//  a graceful alert and leave the text untouched.
//

import SwiftUI

enum AIAction: String, CaseIterable, Identifiable {
    case improve  = "Improve"
    case grammar  = "Grammar"
    case simplify = "Simplify"
    case shorten  = "Shorten"
    case expand   = "Expand"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .improve:  return "wand.and.stars"
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

    var mode: String { rawValue.lowercased() }
}

struct EditorSuggestion: Identifiable {
    let id = UUID()
    let action: AIAction
    let suggested: String
}

struct SmartEditorView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var title: String = ""
    @State private var bodyText: String = ""
    @State private var running: AIAction? = nil
    @State private var suggestion: EditorSuggestion? = nil
    @State private var errorMessage: String? = nil
    @FocusState private var bodyFocused: Bool

    private var wordCount: Int {
        bodyText.split { $0 == " " || $0 == "\n" || $0 == "\t" }.count
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
                Text("\(wordCount) word\(wordCount == 1 ? "" : "s")")
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
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") { dismiss() }
                    .foregroundStyle(WSColor.duoPurple)
            }
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
                    Button {
                        Haptics.medium()
                        run(action)
                    } label: {
                        VStack(spacing: 5) {
                            Image(systemName: action.icon).font(.system(size: 17, weight: .bold))
                            Text(action.rawValue).font(WSFont.sans(11, weight: .bold))
                        }
                        .foregroundStyle(action.tint)
                        .frame(width: 66)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(action.tint.opacity(0.12))
                        )
                        .opacity(isEmpty ? 0.4 : 1)
                    }
                    .buttonStyle(.plain)
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
                ProgressView().controlSize(.large).tint(WSColor.duoPurple)
                Text("\(running?.rawValue ?? "Working")…")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
            }
            .padding(28)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(WSColor.backgroundElevated)
                    .shadow(color: Color.black.opacity(0.12), radius: 16, y: 6)
            )
        }
    }

    private func suggestionSheet(_ s: EditorSuggestion) -> some View {
        NavigationStack {
            ScrollView {
                Text(s.suggested)
                    .wsBody(.large)
                    .foregroundStyle(WSColor.foreground)
                    .frame(maxWidth: .infinity, alignment: .leading)
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
                    suggestion = EditorSuggestion(action: action, suggested: result)
                }
            } catch {
                await MainActor.run {
                    running = nil
                    errorMessage = (error as? APIError)?.errorDescription ?? error.localizedDescription
                }
            }
        }
    }
}

// MARK: - Service

final class SmartEditorService {
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
