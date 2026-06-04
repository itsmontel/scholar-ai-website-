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
            WSColor.background.ignoresSafeArea()

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
                    .font(WSFont.sans(10, weight: .black))
                    .tracking(2.2)
                    .textCase(.uppercase)
                    .foregroundStyle(WSColor.duoPurple)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(
                        Capsule().fill(WSColor.duoPurpleLight)
                    )
                Spacer()
                WSAnimatedImage(name: "mascot-study", ext: "webp")
                    .frame(width: 56, height: 56)
                    .shadow(color: WSColor.duoPurple.opacity(0.25), radius: 8, y: 4)
            }

            Text("Turn your notes into a study pack")
                .font(WSFont.headline(28, weight: .black))
                .foregroundStyle(WSColor.duoText)
                .frame(maxWidth: .infinity, alignment: .leading)

            Text("Paste a section of notes, a chapter, or a study guide. We'll build a lesson, flashcards, a quiz, and a crossword in seconds.")
                .font(WSFont.sans(15))
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Input card (chunky card wrapping the text area)

    private var inputCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Faux browser top-strip
            HStack(spacing: 6) {
                Circle().fill(WSColor.duoRed).frame(width: 8, height: 8)
                Circle().fill(WSColor.duoOrange).frame(width: 8, height: 8)
                Circle().fill(WSColor.duoGreen).frame(width: 8, height: 8)
                Spacer()
                Text("writescholar.com")
                    .font(WSFont.sans(11, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(WSColor.duoSurface)
            .overlay(alignment: .bottom) {
                Rectangle().fill(WSColor.duoBorder).frame(height: 1)
            }

            // Editor
            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text("Paste your notes here...\n\nWorks great with chapter excerpts, lecture slides, or your own study guide. 50 words minimum.")
                        .font(WSFont.sans(15))
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
                    .font(WSFont.sans(15))
                    .foregroundStyle(WSColor.duoText)
            }

            // Footer with word count + paste / clear
            HStack(spacing: 10) {
                Text("\(wordCount) words")
                    .font(WSFont.sans(11, weight: .bold))
                    .foregroundStyle(wordCount >= 50 ? WSColor.duoGreen : WSColor.foregroundMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        Capsule().fill(wordCount >= 50 ? WSColor.duoGreenLight : WSColor.duoSurface)
                            .overlay(Capsule().stroke(wordCount >= 50 ? WSColor.duoGreen.opacity(0.3) : .clear, lineWidth: 2))
                    )

                Text("Min 50 / Max 5,000 (free)")
                    .font(WSFont.sans(11))
                    .foregroundStyle(WSColor.foregroundMuted)

                Spacer()

                Button {
                    if let pasted = UIPasteboard.general.string {
                        text = pasted
                        Haptics.light()
                    }
                } label: {
                    Label("Paste", systemImage: "doc.on.clipboard")
                        .font(WSFont.sans(11, weight: .bold))
                        .foregroundStyle(WSColor.duoPurple)
                }
                .buttonStyle(.plain)

                if !text.isEmpty {
                    Button {
                        text = ""
                        Haptics.light()
                    } label: {
                        Label("Clear", systemImage: "xmark.circle.fill")
                            .font(WSFont.sans(11, weight: .bold))
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
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(WSColor.backgroundElevated)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(WSColor.duoBorder, lineWidth: 2)
        )
        .shadow(color: WSColor.duoPurple.opacity(0.10), radius: 12, y: 6)
    }

    // MARK: - Actions

    private var actionBlock: some View {
        VStack(spacing: 12) {
            if let err = coordinator.errorMessage {
                Text(err)
                    .font(WSFont.sans(13, weight: .bold))
                    .foregroundStyle(WSColor.duoRed)
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
            .buttonStyle(WSDuoSuccessButtonStyle())
            .disabled(!canSubmit)
            .opacity(canSubmit ? 1 : 0.55)

            // Feature row
            HStack(spacing: 14) {
                featureItem(icon: "book.pages.fill",         label: "Lesson",     color: WSColor.duoGreen)
                featureItem(icon: "square.stack.3d.up.fill", label: "Flashcards", color: WSColor.duoBlue)
                featureItem(icon: "checkmark.bubble.fill",   label: "Quiz",       color: WSColor.duoPurple)
                featureItem(icon: "grid",                    label: "Crossword",  color: WSColor.duoOrange)
            }
            .padding(.top, 4)

            Text("Free plan: 2 study packs/month / 5,000 word max")
                .font(WSFont.sans(11))
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
                .font(WSFont.sans(11, weight: .bold))
                .foregroundStyle(WSColor.duoText)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(color.opacity(0.10))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(color.opacity(0.25), lineWidth: 2)
                )
        )
    }
}

#Preview {
    StudyPackInputView(coordinator: StudyPackCoordinator())
}
