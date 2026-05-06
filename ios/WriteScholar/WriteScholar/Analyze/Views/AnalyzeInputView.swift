//
//  AnalyzeInputView.swift
//  WriteScholar
//
//  Entry point for the Analyze tab. Paste an essay (200+ words), pick a
//  grading style, hit Analyze. Hits POST /api/analysis/analyze with
//  analysisType=comprehensive. Document upload (PDF/DOCX) lands in a
//  later pass — paste-only for now keeps the surface focused.
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
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Soft brand orbs
            Circle()
                .fill(WSColor.brandPrimary.opacity(0.14))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -180, y: -260)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0x10B981).opacity(0.10))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: 200, y: 320)
                .ignoresSafeArea()

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
                    .foregroundStyle(WSColor.brandPrimary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(WSColor.brandSoft))
                Spacer()
                WSAnimatedImage(name: "mascot-paper", ext: "webp")
                    .frame(width: 56, height: 56)
                    .shadow(color: WSColor.brandPrimary.opacity(0.25), radius: 8, y: 4)
            }

            Text("Professor-style feedback in 60 seconds")
                .wsHeadline(.large, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text("Paste your essay or draft. We grade structure, clarity, argument, and citations — section by section.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Input card

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Faux browser top-strip — same chrome as the web's tool cards
            HStack(spacing: 6) {
                Circle().fill(Color(hex: 0xEF4444)).frame(width: 8, height: 8)
                Circle().fill(Color(hex: 0xF59E0B)).frame(width: 8, height: 8)
                Circle().fill(Color(hex: 0x10B981)).frame(width: 8, height: 8)
                Spacer()
                Text("writescholar.com · analyze")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(WSColor.surface)
            .overlay(alignment: .bottom) {
                Rectangle().fill(WSColor.hairline).frame(height: 1)
            }

            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text("Paste your essay here…\n\nIntroduction, body paragraphs, conclusion. 200 words minimum so we can give you real feedback.")
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
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(wordCount >= 200 ? WSColor.strong : WSColor.foregroundMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        Capsule().fill(wordCount >= 200 ? WSColor.strong.opacity(0.14) : WSColor.surface)
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
                        .foregroundStyle(WSColor.brandPrimary)
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
            .background(WSColor.surface)
            .overlay(alignment: .top) {
                Rectangle().fill(WSColor.hairline).frame(height: 1)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(WSColor.hairline, lineWidth: 1)
                )
                .shadow(color: WSColor.brandPrimary.opacity(0.18), radius: 22, y: 10)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    // MARK: - Grading style picker

    private var gradingStyleRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Grading style")
                .wsBody(.small, weight: .bold)
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
                            .wsBody(.caption, weight: .bold)
                            .foregroundStyle(active ? .white : WSColor.foreground)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(active ? AnyShapeStyle(WSGradient.brand) : AnyShapeStyle(WSColor.backgroundElevated))
                                    .overlay(
                                        Capsule().stroke(active ? .clear : WSColor.hairline, lineWidth: 1)
                                    )
                                    .shadow(color: active ? WSColor.brandPrimary.opacity(0.3) : .clear, radius: 8, y: 3)
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
                    .foregroundStyle(WSColor.concern)
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
            .buttonStyle(WSPrimaryButtonStyle())
            .disabled(!canSubmit)
            .opacity(canSubmit ? 1 : 0.55)

            HStack(spacing: 14) {
                feedbackChip(label: "Strong", color: WSColor.strong)
                feedbackChip(label: "Revise", color: WSColor.revise)
                feedbackChip(label: "Concern", color: WSColor.concern)
            }
            .padding(.top, 4)

            Text("Free plan: 2 analyses/month · Encrypted in transit · Cancel anytime")
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
                .foregroundStyle(WSColor.foreground)
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
