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
            WSColor.background.ignoresSafeArea()

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
                Text("GRADE MY ESSAY")
                    .font(WSFont.sans(11, weight: .black))
                    .tracking(1.3)
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(RoundedRectangle(cornerRadius: 9).fill(WSColor.pink))
                    .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(WSColor.ink, lineWidth: 2))
                Spacer()
                WSAnimatedImage(name: "mascot-paper", ext: "webp")
                    .frame(width: 64, height: 64)
                    .wsMascotBob(amount: 5, rock: 3, duration: 1.3)
            }

            Text("Know your grade before your professor does.")
                .font(WSFont.headline(32, weight: .black))
                .tracking(-1)
                .foregroundStyle(WSColor.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)

            Text("Paste your essay or draft. We grade structure, clarity, argument and citations, section by section.")
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Input card

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Faux browser top-strip
            HStack(spacing: 6) {
                ForEach([WSColor.pink, WSColor.sun, WSColor.lime], id: \.self) { c in
                    Circle().fill(c).overlay(Circle().strokeBorder(WSColor.ink, lineWidth: 1.5)).frame(width: 11, height: 11)
                }
                Spacer()
                Text("your-essay.docx")
                    .font(WSFont.sans(12, weight: .heavy))
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(WSColor.lilacDeep)
            .overlay(alignment: .bottom) {
                Rectangle().fill(WSColor.ink).frame(height: 2)
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
                    .foregroundStyle(WSColor.foreground)
            }

            HStack(spacing: 10) {
                Text("\(wordCount) words")
                    .font(WSFont.headline(13, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(wordCount >= 200 ? WSColor.lime : WSColor.backgroundElevated))
                    .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))

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
                        .foregroundStyle(WSColor.purpleInk)
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
            .background(WSColor.lilacDeep)
            .overlay(alignment: .top) {
                Rectangle().fill(WSColor.ink).frame(height: 2)
            }
        }
        .background(WSColor.backgroundElevated)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
        .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(editorFocused ? WSColor.purple : WSColor.ink).offset(y: 5))
        .padding(.bottom, 5)
    }

    // MARK: - Grading style picker

    private var gradingStyleRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Grading style")
                .font(WSFont.headline(17, weight: .black))
                .foregroundStyle(WSColor.foreground)

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
                            .font(WSFont.headline(14, weight: .black))
                            .foregroundStyle(active ? WSColor.inkText : WSColor.foreground)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                ZStack {
                                    Capsule().fill(WSColor.ink).offset(y: active ? 3 : 2)
                                    Capsule().fill(active ? WSColor.lime : WSColor.backgroundElevated)
                                    Capsule().strokeBorder(WSColor.ink, lineWidth: 2)
                                }
                            )
                            .padding(.bottom, 3)
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
                    .foregroundStyle(WSColor.inkText)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .wsSticker(fill: WSColor.pinkSoft, radius: 14, depth: 2)
            }

            Button {
                editorFocused = false
                Task { await coordinator.analyze(text: text) }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "sparkles")
                    Text("Grade it")
                }
            }
            .buttonStyle(WSStickerButtonStyle(fill: WSColor.purple, foreground: .white, radius: 20, height: 62,
                                              font: WSFont.headline(20, weight: .black)))
            .disabled(!canSubmit)
            .opacity(canSubmit ? 1 : 0.55)

            HStack(spacing: 14) {
                feedbackChip(label: "Strong", color: WSColor.lime)
                feedbackChip(label: "Revise", color: WSColor.orange)
                feedbackChip(label: "Concern", color: WSColor.pink)
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
                .overlay(Circle().strokeBorder(WSColor.ink, lineWidth: 1.5))
                .frame(width: 12, height: 12)
            Text(label)
                .wsBody(.caption, weight: .heavy)
                .foregroundStyle(WSColor.foreground)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Capsule().fill(WSColor.backgroundElevated))
        .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
    }
}

#Preview {
    AnalyzeInputView(coordinator: AnalyzeCoordinator())
}
