//
//  StudyPackInputView.swift
//  WriteScholar
//
//  Entry screen for the Study tab. User pastes notes, picks a tone of
//  voice (TODO Chapter 4 — for now lesson defaults), and taps Generate.
//  Hits the existing /api/analysis/generate-study-pack endpoint.
//

import SwiftUI

struct StudyPackInputView: View {
    @ObservedObject var coordinator: StudyPackCoordinator

    @State private var text: String = ""
    @FocusState private var editorFocused: Bool

    private var wordCount: Int {
        text.split { $0.isWhitespace || $0.isNewline }
            .filter { !$0.isEmpty }
            .count
    }

    private var canSubmit: Bool { wordCount >= 50 && !coordinator.isGenerating }

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            // Soft brand orbs in the corners — matches web hero
            Circle()
                .fill(WSColor.brandPrimary.opacity(0.14))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: -180, y: -260)
                .ignoresSafeArea()
            Circle()
                .fill(Color(hex: 0xD946EF).opacity(0.12))
                .frame(width: 320, height: 320)
                .blur(radius: 70)
                .offset(x: 200, y: 320)
                .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    headerBlock
                    inputCard
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
                Text("STUDY PACK")
                    .wsEyebrow()
                    .foregroundStyle(WSColor.brandPrimary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        Capsule().fill(WSColor.brandSoft)
                    )
                Spacer()
                WSAnimatedImage(name: "mascot-study", ext: "webp")
                    .frame(width: 56, height: 56)
                    .shadow(color: Color(hex: 0x7C3AED, opacity: 0.25), radius: 8, y: 4)
            }

            Text("Turn your notes into a study pack")
                .wsHeadline(.large, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text("Paste a section of notes, a chapter, or a study guide. We'll build a lesson, flashcards, a quiz, and a crossword in seconds.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Input card

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Faux browser top-strip — matches the web's tool card chrome
            HStack(spacing: 6) {
                Circle().fill(Color(hex: 0xEF4444)).frame(width: 8, height: 8)
                Circle().fill(Color(hex: 0xF59E0B)).frame(width: 8, height: 8)
                Circle().fill(Color(hex: 0x10B981)).frame(width: 8, height: 8)
                Spacer()
                Text("writescholar.com · study pack")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(WSColor.surface)
            .overlay(alignment: .bottom) {
                Rectangle().fill(WSColor.hairline).frame(height: 1)
            }

            // Editor
            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text("Paste your notes here…\n\nWorks great with chapter excerpts, lecture slides, or your own study guide. 50 words minimum.")
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
                    .frame(minHeight: 220, maxHeight: 320)
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foreground)
            }

            // Footer with word count + paste / clear
            HStack(spacing: 10) {
                Text("\(wordCount) words")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(wordCount >= 50 ? WSColor.strong : WSColor.foregroundMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        Capsule().fill(wordCount >= 50 ? WSColor.strong.opacity(0.14) : WSColor.surface)
                    )

                Text("Min 50 · Max 5,000 (free)")
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
                Task {
                    await coordinator.generate(text: text)
                }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "sparkles")
                    Text("Generate study pack")
                }
            }
            .buttonStyle(WSPrimaryButtonStyle())
            .disabled(!canSubmit)
            .opacity(canSubmit ? 1 : 0.55)

            // Footnote feature row
            HStack(spacing: 14) {
                featureItem(icon: "book.pages.fill",         label: "Lesson",     color: Color(hex: 0x6366F1))
                featureItem(icon: "square.stack.3d.up.fill", label: "Flashcards", color: Color(hex: 0x7C3AED))
                featureItem(icon: "checkmark.bubble.fill",   label: "Quiz",       color: Color(hex: 0xD946EF))
                featureItem(icon: "grid",                    label: "Crossword",  color: Color(hex: 0xF59E0B))
            }
            .padding(.top, 4)

            Text("Free plan: 2 study packs/month · 5,000 word max")
                .wsBody(.caption)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 4)
        }
    }

    private func featureItem(icon: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(color)
            Text(label)
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.foreground)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(color.opacity(0.10))
        )
    }
}

#Preview {
    StudyPackInputView(coordinator: StudyPackCoordinator())
}
