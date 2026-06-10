//
//  StudyPackInputView.swift
//  WriteScholar
//
//  Single-screen study pack creator. One place, one flow:
//    1. Pick Topic or Paste notes (segmented)
//    2. Type / paste
//    3. Generate
//  Upload · Photo · YouTube live under a collapsed "More ways" row.
//

import SwiftUI
import PhotosUI
import UIKit
import UniformTypeIdentifiers

struct StudyPackInputView: View {
    @ObservedObject var coordinator: StudyPackCoordinator
    var onOpenPack: (StudyPack) -> Void = { _ in }

    enum InputMode: String, CaseIterable, Identifiable {
        case topic, notes, document, photo, youtube
        var id: String { rawValue }

        var label: String {
            switch self {
            case .topic:    return "Type a topic"
            case .notes:    return "Paste notes"
            case .document: return "Upload file"
            case .photo:    return "Photo of notes"
            case .youtube:  return "YouTube link"
            }
        }
        var icon: String {
            switch self {
            case .topic:    return "sparkles"
            case .notes:    return "doc.plaintext"
            case .document: return "doc.fill"
            case .photo:    return "camera.fill"
            case .youtube:  return "play.rectangle.fill"
            }
        }
        var tint: Color {
            switch self {
            case .topic:    return WSColor.duoPurple
            case .notes:    return WSColor.duoGreen
            case .document: return WSColor.duoBlue
            case .photo:    return WSColor.duoOrange
            case .youtube:  return WSColor.duoRed
            }
        }
        var isPrimary: Bool { self == .topic || self == .notes }
    }

    @State private var mode: InputMode = .topic
    @State private var moreExpanded = false

    @State private var topicText = ""
    @State private var notesText = ""
    @State private var youtubeURL = ""

    @State private var documentData: Data?
    @State private var documentName: String?
    @State private var documentMime: String?

    @State private var photoData: Data?
    @State private var photoPreview: UIImage?
    @State private var photoItem: PhotosPickerItem?

    @State private var showFileImporter = false
    @State private var preparingSource = false

    @FocusState private var fieldFocused: Bool

    @ObservedObject private var library = LibraryStore.shared

    private var notesWordCount: Int {
        notesText.split { $0.isWhitespace || $0.isNewline }.filter { !$0.isEmpty }.count
    }

    private var canSubmit: Bool {
        guard !coordinator.isGenerating, !preparingSource else { return false }
        switch mode {
        case .topic:    return topicText.trimmingCharacters(in: .whitespacesAndNewlines).count >= 2
        case .notes:    return notesWordCount >= 50
        case .document: return documentData != nil
        case .photo:    return photoData != nil
        case .youtube:  return !youtubeURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
    }

    /// Short hint shown under the Generate button when the user can't submit yet,
    /// so they always know the one thing they need to do next.
    private var submitHint: String? {
        if preparingSource { return nil }
        if canSubmit { return nil }
        switch mode {
        case .topic:    return "Type a topic to get started"
        case .notes:
            let remaining = max(0, 50 - notesWordCount)
            return "Paste \(remaining) more word\(remaining == 1 ? "" : "s") (50+ for best results)"
        case .document: return "Choose a PDF or Word file"
        case .photo:    return "Add a photo of your notes"
        case .youtube:  return "Paste a YouTube link"
        }
    }

    // MARK: - Body

    var body: some View {
        ZStack(alignment: .bottom) {
            WSColor.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    titleRow
                    recentPacksRow
                    primarySegment
                    inputArea
                    moreSourcesSection
                    Spacer(minLength: 100)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
            }
            .scrollDismissesKeyboard(.interactively)

            generateBar
        }
        .fileImporter(isPresented: $showFileImporter, allowedContentTypes: Self.allowedDocTypes, allowsMultipleSelection: false) { result in
            handleFileImport(result)
        }
        .onChange(of: photoItem) { _, newItem in
            guard let newItem else { return }
            loadPhoto(newItem)
        }
        .onAppear {
            // Drop the user straight into typing — no extra tap to start.
            if mode == .topic && topicText.isEmpty {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                    fieldFocused = true
                }
            }
        }
    }

    // MARK: - Title

    private var titleRow: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Study Pack")
                    .font(WSFont.headline(26, weight: .black))
                    .foregroundStyle(WSColor.duoText)
                Text("Lesson · flashcards · quiz · games")
                    .font(WSFont.sans(14, weight: .semibold))
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            WSAnimatedImage(name: "mascot-study", ext: "webp")
                .frame(width: 52, height: 52)
        }
    }

    // MARK: - Recent packs

    @ViewBuilder
    private var recentPacksRow: some View {
        let packs = library.items
            .filter { $0.kind == .studyPack }
            .sorted { ($0.lastOpenedAt ?? $0.createdAt) > ($1.lastOpenedAt ?? $1.createdAt) }
            .prefix(6)

        if !packs.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                Text("Continue")
                    .font(WSFont.sans(13, weight: .black))
                    .foregroundStyle(WSColor.foregroundMuted)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(Array(packs)) { item in
                            Button {
                                Haptics.medium()
                                if let pack = StudyPackPersistence.shared.loadPack(for: item.id) {
                                    onOpenPack(pack)
                                }
                            } label: {
                                Text(item.title)
                                    .font(WSFont.sans(13, weight: .bold))
                                    .foregroundStyle(WSColor.duoPurple)
                                    .lineLimit(1)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 10)
                                    .background(
                                        Capsule()
                                            .fill(WSColor.duoPurpleLight)
                                            .overlay(Capsule().stroke(WSColor.duoPurple.opacity(0.2), lineWidth: 1.5))
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Primary segment (Topic | Notes)

    private var primarySegment: some View {
        HStack(spacing: 0) {
            segmentButton(.topic)
            segmentButton(.notes)
        }
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(WSColor.duoSurface)
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(WSColor.duoBorder, lineWidth: 1.5))
        )
    }

    private func segmentButton(_ m: InputMode) -> some View {
        let on = mode == m
        return Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.82)) {
                mode = m
                moreExpanded = false
            }
            Haptics.selection()
        } label: {
            HStack(spacing: 6) {
                Image(systemName: m.icon)
                    .font(.system(size: 13, weight: .heavy))
                Text(m == .topic ? "Topic" : "Paste notes")
                    .font(WSFont.sans(14, weight: .black))
            }
            .foregroundStyle(on ? .white : WSColor.duoText)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 11, style: .continuous)
                    .fill(on ? m.tint : Color.clear)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Input area

    @ViewBuilder
    private var inputArea: some View {
        switch mode {
        case .topic:    topicInput
        case .notes:    notesInput
        case .document: documentInput
        case .photo:    photoInput
        case .youtube:  youtubeInput
        }
    }

    private var topicInput: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("What do you want to study?")
                .font(WSFont.sans(14, weight: .bold))
                .foregroundStyle(WSColor.duoText)

            TextField("e.g. The French Revolution", text: $topicText)
                .font(WSFont.sans(17, weight: .semibold))
                .padding(16)
                .background(inputFieldBackground(focused: fieldFocused, tint: WSColor.duoPurple))
                .focused($fieldFocused)
                .submitLabel(.go)
                .onSubmit { if canSubmit { submit() } }

            HStack(spacing: 8) {
                ForEach(Self.topicExamples, id: \.self) { ex in
                    Button {
                        topicText = ex
                        Haptics.light()
                    } label: {
                        Text(ex)
                            .font(WSFont.sans(12, weight: .bold))
                            .foregroundStyle(WSColor.duoPurple)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Capsule().fill(WSColor.duoPurpleLight))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var notesInput: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Your notes")
                    .font(WSFont.sans(14, weight: .bold))
                    .foregroundStyle(WSColor.duoText)
                Spacer()
                Text("\(notesWordCount) words")
                    .font(WSFont.sans(12, weight: .bold))
                    .foregroundStyle(notesWordCount >= 50 ? WSColor.duoGreen : WSColor.foregroundMuted)
                Button("Paste") {
                    if let p = UIPasteboard.general.string { notesText = p; Haptics.light() }
                }
                .font(WSFont.sans(12, weight: .bold))
                .foregroundStyle(WSColor.duoGreen)
            }

            ZStack(alignment: .topLeading) {
                if notesText.isEmpty {
                    Text("Paste a chapter, lecture notes, or study guide…")
                        .font(WSFont.sans(15))
                        .foregroundStyle(WSColor.foregroundMuted.opacity(0.7))
                        .padding(.horizontal, 12)
                        .padding(.top, 14)
                        .allowsHitTesting(false)
                }
                TextEditor(text: $notesText)
                    .scrollContentBackground(.hidden)
                    .focused($fieldFocused)
                    .frame(minHeight: 180)
                    .font(WSFont.sans(15))
                    .padding(8)
            }
            .background(inputFieldBackground(focused: fieldFocused, tint: WSColor.duoGreen))
        }
    }

    private var documentInput: some View {
        alternateInputShell(mode: .document) {
            if let name = documentName {
                fileReadyRow(name: name, tint: WSColor.duoBlue) {
                    documentData = nil; documentName = nil; documentMime = nil
                }
                Button("Pick another file") { showFileImporter = true }
                    .font(WSFont.sans(13, weight: .bold))
                    .foregroundStyle(WSColor.duoBlue)
            } else {
                Button { showFileImporter = true } label: {
                    pickRow(icon: "arrow.up.doc", label: "Choose PDF or Word file", tint: WSColor.duoBlue)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var photoInput: some View {
        alternateInputShell(mode: .photo) {
            if let preview = photoPreview {
                Image(uiImage: preview)
                    .resizable()
                    .scaledToFill()
                    .frame(height: 160)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                PhotosPicker(selection: $photoItem, matching: .images) {
                    Text("Choose different photo")
                        .font(WSFont.sans(13, weight: .bold))
                        .foregroundStyle(WSColor.duoOrange)
                }
            } else {
                PhotosPicker(selection: $photoItem, matching: .images) {
                    pickRow(icon: "camera.fill", label: preparingSource ? "Reading…" : "Choose a photo", tint: WSColor.duoOrange)
                }
            }
        }
    }

    private var youtubeInput: some View {
        alternateInputShell(mode: .youtube) {
            TextField("https://youtube.com/watch?v=…", text: $youtubeURL)
                .font(WSFont.sans(15, weight: .semibold))
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .keyboardType(.URL)
                .padding(16)
                .background(inputFieldBackground(focused: fieldFocused, tint: WSColor.duoRed))
                .focused($fieldFocused)
        }
    }

    private func alternateInputShell<Content: View>(mode: InputMode, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: mode.icon)
                    .foregroundStyle(mode.tint)
                Text(mode.label)
                    .font(WSFont.sans(14, weight: .black))
                    .foregroundStyle(WSColor.duoText)
                Spacer()
                Button("Switch") {
                    withAnimation { self.mode = .topic; moreExpanded = false }
                }
                .font(WSFont.sans(12, weight: .bold))
                .foregroundStyle(WSColor.foregroundMuted)
            }
            content()
        }
    }

    // MARK: - More sources

    private var moreSourcesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            if mode.isPrimary {
                Button {
                    withAnimation { moreExpanded.toggle() }
                } label: {
                    HStack {
                        Text(moreExpanded ? "Hide other sources" : "More ways to start")
                            .font(WSFont.sans(13, weight: .bold))
                            .foregroundStyle(WSColor.foregroundMuted)
                        Spacer()
                        Image(systemName: moreExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    .padding(.vertical, 4)
                }
                .buttonStyle(.plain)

                if moreExpanded {
                    ForEach(InputMode.allCases.filter { !$0.isPrimary }) { alt in
                        Button {
                            withAnimation { mode = alt }
                            Haptics.selection()
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: alt.icon)
                                    .font(.system(size: 16, weight: .heavy))
                                    .foregroundStyle(alt.tint)
                                    .frame(width: 28)
                                Text(alt.label)
                                    .font(WSFont.sans(15, weight: .bold))
                                    .foregroundStyle(WSColor.duoText)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(WSColor.foregroundMuted)
                            }
                            .padding(14)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(WSColor.backgroundElevated)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                                            .stroke(WSColor.duoBorder, lineWidth: 1.5)
                                    )
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    // MARK: - Pinned generate bar

    private var generateBar: some View {
        VStack(spacing: 0) {
            if let err = coordinator.errorMessage {
                Text(err)
                    .font(WSFont.sans(12, weight: .bold))
                    .foregroundStyle(WSColor.duoRed)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 8)
            }

            Button {
                fieldFocused = false
                submit()
            } label: {
                HStack(spacing: 8) {
                    if preparingSource {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: "sparkles")
                    }
                    Text(preparingSource ? "Preparing…" : "Generate pack")
                        .font(WSFont.sans(17, weight: .black))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(canSubmit ? WSColor.duoGreen : WSColor.duoBorder)
                )
            }
            .buttonStyle(WSBouncyButtonStyle())
            .disabled(!canSubmit)
            .padding(.horizontal, 20)
            .padding(.top, 12)

            if let hint = submitHint {
                Text(hint)
                    .font(WSFont.sans(12, weight: .semibold))
                    .foregroundStyle(WSColor.foregroundMuted)
                    .padding(.top, 6)
                    .padding(.bottom, 8)
                    .transition(.opacity)
            } else {
                Color.clear.frame(height: 8)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: submitHint)
        .background(WSColor.backgroundElevated.shadow(color: .black.opacity(0.06), radius: 12, y: -4))
    }

    // MARK: - Helpers

    private func inputFieldBackground(focused: Bool, tint: Color) -> some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(WSColor.duoSurface)
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(focused ? tint : WSColor.duoBorder, lineWidth: focused ? 2 : 1.5)
            )
    }

    private func pickRow(icon: String, label: String, tint: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(tint)
            Text(label)
                .font(WSFont.sans(15, weight: .bold))
                .foregroundStyle(WSColor.duoText)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6, 4]))
                .foregroundStyle(tint.opacity(0.4))
        )
    }

    private func fileReadyRow(name: String, tint: Color, onClear: @escaping () -> Void) -> some View {
        HStack {
            Image(systemName: "checkmark.circle.fill").foregroundStyle(tint)
            Text(name).font(WSFont.sans(14, weight: .bold)).lineLimit(1)
            Spacer()
            Button(action: onClear) {
                Image(systemName: "xmark.circle.fill").foregroundStyle(WSColor.foregroundMuted)
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(tint.opacity(0.08)))
    }

    private func submit() {
        switch mode {
        case .topic:    Task { await coordinator.generateFromTopic(topicText) }
        case .notes:    Task { await coordinator.generate(text: notesText) }
        case .document:
            guard let d = documentData, let n = documentName, let m = documentMime else { return }
            Task { await coordinator.generateFromDocument(data: d, fileName: n, mimeType: m) }
        case .photo:
            guard let d = photoData else { return }
            Task { await coordinator.generateFromImage(data: d, fileName: "notes.jpg", mimeType: "image/jpeg") }
        case .youtube:
            Task { await coordinator.generateFromYouTube(url: youtubeURL) }
        }
    }

    private static let allowedDocTypes: [UTType] = {
        var t: [UTType] = [.pdf, .plainText]
        if let docx = UTType("org.openxmlformats.wordprocessingml.document") { t.append(docx) }
        if let doc = UTType("com.microsoft.word.doc") { t.append(doc) }
        return t
    }()

    private static let topicExamples = [
        "Photosynthesis", "Psych 101", "French Revolution",
    ]

    private func handleFileImport(_ result: Result<[URL], Error>) {
        guard case .success(let urls) = result, let url = urls.first else { return }
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        do {
            documentData = try Data(contentsOf: url)
            documentName = url.lastPathComponent
            documentMime = Self.mimeType(for: url.pathExtension)
            coordinator.errorMessage = nil
            Haptics.light()
        } catch {
            coordinator.errorMessage = "Couldn't read that file."
        }
    }

    private static func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "pdf":  return "application/pdf"
        case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        case "doc":  return "application/msword"
        default:     return "text/plain"
        }
    }

    private func loadPhoto(_ item: PhotosPickerItem) {
        preparingSource = true
        coordinator.errorMessage = nil
        Task {
            defer { preparingSource = false }
            guard let raw = try? await item.loadTransferable(type: Data.self),
                  let img = UIImage(data: raw),
                  let jpeg = Self.downscale(img, maxDimension: 1600).jpegData(compressionQuality: 0.85) else {
                coordinator.errorMessage = "Couldn't load that photo."
                return
            }
            photoPreview = img
            photoData = jpeg
            Haptics.light()
        }
    }

    private static func downscale(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        let longest = max(size.width, size.height)
        guard longest > maxDimension else { return image }
        let scale = maxDimension / longest
        let newSize = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: newSize)) }
    }
}

#Preview {
    StudyPackInputView(coordinator: StudyPackCoordinator())
}
