//
//  AnalyzeInputView.swift
//  WriteScholar
//
//  Entry point for the Analyze tab. Paste an essay (200+ words), pick a
//  grading style, hit Analyze. Hits POST /api/analysis/analyze with
//  analysisType=comprehensive. Document upload (PDF/DOCX) lands in a
//  later pass -- paste-only for now keeps the surface focused.
//

import SwiftUI

struct AnalyzeInputView: View {
    @ObservedObject var coordinator: AnalyzeCoordinator

    @State private var text: String = ""
    @FocusState private var editorFocused: Bool

    private var wordCount: Int {
        text.split { $0.isWhitespace || $0.isNewline }
            .filter { !$0.isEmpty }
            .count
    }

    private var canSubmit: Bool { wordCount >= 200 && !coordinator.isGenerating }

    var body: some View {
        ZStack {
            WSColor.duoSurface.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    headerBlock
                    inputCard
                    gradingStyleRow
                    actionBlock
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 32)
            }
            .scrollDismissesKeyboard(.interactively)
        }
    }

    // MARK: - Header

    private var headerBlock: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Text("ANALYZE PAPER")
                    .wsEyebrow()
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(WSColor.duoPurple))
                Spacer()
                WSAnimatedImage(name: "mascot-paper", ext: "webp")
                    .frame(width: 56, height: 56)
                    .shadow(color: WSColor.duoPurple.opacity(0.25), radius: 8, y: 4)
            }

            Text("Professor-style feedback in 60 seconds")
                .wsHeadline(.large, weight: .black)
                .foregroundStyle(WSColor.duoText)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text("Paste your essay or draft. We grade structure, clarity, argument, and citations -- section by section.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Input card

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Faux browser top-strip
            HStack(spacing: 6) {
                Circle().fill(WSColor.duoRed).frame(width: 8, height: 8)
                Circle().fill(WSColor.duoOrange).frame(width: 8, height: 8)
                Circle().fill(WSColor.duoGreen).frame(width: 8, height: 8)
                Spacer()
                Text("writescholar.com . analyze")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(WSColor.duoSurface)
            .overlay(alignment: .bottom) {
                Rectangle().fill(WSColor.duoBorder).frame(height: 1)
            }

            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text("Paste your essay here...\n\nIntroduction, body paragraphs, conclusion. 200 words minimum so we can give you real feedback.")
                        .wsBody(.medium)
                        .foregroundStyle(WSColor.foregroundMuted.opacity(0.7))
                        .padding(.horizontal, 18)
                        .padding(.top, 16)
                        .allowsHitTesting(false)
                }
                TextEditor(text: $text)
                    .scrollContentBackground(.hidden)
                    .focused($editorFocused)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .frame(minHeight: 240, maxHeight: 360)
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.duoText)
            }

            HStack(spacing: 10) {
                Text("\(wordCount) words")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(wordCount >= 200 ? WSColor.duoGreen : WSColor.foregroundMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        Capsule().fill(wordCount >= 200 ? WSColor.duoGreenLight : WSColor.duoSurface)
                    )

                Text("Min 200")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)

                Spacer()

                Button {
                    if let pasted = UIPasteboard.general.string {
                        text = pasted
                        Haptics.light()
                    }
                } label: {
                    Label("Paste", systemImage: "doc.on.clipboard")
                        .wsBody(.caption, weight: .bold)
                        .foregroundStyle(WSColor.duoPurple)
                }
                .buttonStyle(.plain)

                if !text.isEmpty {
                    Button {
                        text = ""
                        Haptics.light()
                    } label: {
                        Label("Clear", systemImage: "xmark.circle.fill")
                            .wsBody(.caption, weight: .bold)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(WSColor.duoSurface)
            .overlay(alignment: .top) {
                Rectangle().fill(WSColor.duoBorder).frame(height: 1)
            }
        }
        .wsChunkyCard(
            cornerRadius: 22,
            horizontalPadding: 0,
            verticalPadding: 0,
            accent: WSColor.duoPurple
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    // MARK: - Grading style picker

    private var gradingStyleRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Grading style")
                .wsBody(.small, weight: .black)
                .foregroundStyle(WSColor.duoText)

            HStack(spacing: 8) {
                ForEach(AnalyzeAPI.GradingStyle.allCases) { style in
                    let active = (coordinator.gradingStyle == style)
                    Button {
                        Haptics.selection()
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            coordinator.gradingStyle = style
                        }
                    } label: {
                        Text(style.label)
                            .wsBody(.caption, weight: .bold)
                            .foregroundStyle(active ? .white : WSColor.duoText)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(active ? WSColor.duoPurple : WSColor.backgroundElevated)
                                    .overlay(
                                        Capsule().stroke(active ? .clear : WSColor.duoBorder, lineWidth: 2)
                                    )
                                    .shadow(color: active ? WSColor.duoPurple.opacity(0.3) : .clear, radius: 8, y: 3)
                            )
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
            }
        }
    }

    // MARK: - Actions

    private var actionBlock: some View {
        VStack(spacing: 12) {
            if let err = coordinator.errorMessage {
                Text(err)
                    .wsBody(.small, weight: .semibold)
                    .foregroundStyle(WSColor.duoRed)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 4)
            }

            Button {
                editorFocused = false
                Task { await coordinator.analyze(text: text) }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "sparkles")
                    Text("Analyze paper")
                }
            }
            .buttonStyle(WSDuoSuccessButtonStyle())
            .disabled(!canSubmit)
            .opacity(canSubmit ? 1 : 0.55)

            HStack(spacing: 14) {
                feedbackChip(label: "Strong", color: WSColor.duoGreen)
                feedbackChip(label: "Revise", color: WSColor.duoOrange)
                feedbackChip(label: "Concern", color: WSColor.duoRed)
            }
            .padding(.top, 4)

            Text("Free plan: 2 analyses/month . Encrypted in transit . Cancel anytime")
                .wsBody(.caption)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 4)
        }
    }

    private func feedbackChip(label: String, color: Color) -> some View {
        HStack(spacing: 6) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
                .shadow(color: color.opacity(0.6), radius: 4)
            Text(label)
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.duoText)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            Capsule().fill(color.opacity(0.10))
                .overlay(Capsule().stroke(color.opacity(0.3), lineWidth: 1))
        )
    }
}

#Preview {
    AnalyzeInputView(coordinator: AnalyzeCoordinator())
}
