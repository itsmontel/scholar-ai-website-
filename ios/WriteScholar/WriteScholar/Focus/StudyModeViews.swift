//
//  StudyModeViews.swift
//  WriteScholar
//
//  Study Mode UI on the Focus tab:
//    • StudyModeCard      — on/off, which apps ask, how long an app opens for
//    • StudyGatePreview   — a tappable copy of the question screen iOS shows
//    • StudyModePacksSheet — which study packs the questions come from
//
//  Wording rule for this feature: apps "ask a question", they are never
//  "blocked" or "shielded". Nothing is taken away; you answer and go.
//

import SwiftUI
import FamilyControls
import ManagedSettings

// MARK: - Main card

struct StudyModeCard: View {
    @Environment(\.colorScheme) private var colorScheme
    @ObservedObject var manager: FocusManager
    var onChooseApps: () -> Void
    var onChooseAllowed: () -> Void

    private var config: StudyModeConfig { manager.studyConfig }
    private var tint: Color { config.isOn ? WSColor.purple : WSColor.foregroundMuted }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            header
            if !manager.isAuthorized {
                permissionRow
            }
            scopePicker
            appsRow
            unlockLengthRow
        }
        .wsChunkyCard(cornerRadius: 26, verticalPadding: 18)
        .animation(.wsBouncePop, value: config.isOn)
        .animation(.wsBouncePop, value: config.scope)
    }

    // MARK: Header

    private var header: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: config.isOn ? "bolt.fill" : "bolt")
                .font(.system(size: 22, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 52, height: 52)
                .background(
                    ZStack {
                        RoundedRectangle(cornerRadius: 16, style: .continuous).fill(config.isOn ? WSColor.orange : WSColor.lilacDeep)
                        RoundedRectangle(cornerRadius: 16, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                    }
                )

            VStack(alignment: .leading, spacing: 4) {
                Text("Study Mode")
                    .font(WSFont.headline(22, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                Text(subtitle)
                    .wsBody(.small)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 4)

            Toggle("Study Mode", isOn: Binding(
                get: { config.isOn },
                set: { on in
                    Haptics.medium()
                    if on && !manager.isAuthorized {
                        Task {
                            await manager.requestAuthorization()
                            if manager.isAuthorized { manager.setStudyMode(on: true) }
                        }
                    } else {
                        manager.setStudyMode(on: on)
                    }
                }
            ))
            .labelsHidden()
            .toggleStyle(WSStickerToggleStyle())
        }
    }

    private var subtitle: String {
        if !config.isOn {
            return "Answer one question from your study packs before an app opens."
        }
        if config.scope == .chosenApps && !manager.hasBlockedApps {
            return "Choose which apps should ask you a question."
        }
        return "Apps ask one question first. Get it right and the app opens for \(config.unlockMinutes) min."
    }

    // MARK: Permission

    private var permissionRow: some View {
        HStack(spacing: 12) {
            Image(systemName: "hourglass")
                .font(.system(size: 18, weight: .black))
                .foregroundStyle(WSColor.inkText)
            Text("Allow Screen Time so iOS can show your question when an app opens.")
                .wsBody(.small, weight: .semibold)
                .foregroundStyle(WSColor.inkMuted)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 4)
            Button("Allow") {
                Haptics.medium()
                Task { await manager.requestAuthorization() }
            }
            .buttonStyle(WSDuoPillButtonStyle(palette: .warn))
        }
        .padding(12)
        .wsSticker(fill: Color(hex: 0xFFF1B8), radius: 18, depth: 3)
    }

    // MARK: Scope

    private var scopePicker: some View {
        HStack(spacing: 10) {
            scopeTile(.allApps, title: "All apps", caption: "Every app asks", icon: "square.grid.2x2.fill")
            scopeTile(.chosenApps, title: "Apps I choose", caption: "Only the ones you pick", icon: "hand.tap.fill")
        }
    }

    private func scopeTile(_ scope: StudyModeScope, title: String, caption: String, icon: String) -> some View {
        let active = config.scope == scope
        return Button {
            Haptics.selection()
            manager.setStudyScope(scope)
        } label: {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(active ? WSColor.inkText : WSColor.duoText.opacity(0.45))
                    Spacer()
                    Image(systemName: active ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(active ? WSColor.inkText : WSColor.duoBorder)
                }
                Text(title)
                    .font(WSFont.headline(16, weight: .black))
                    .foregroundStyle(active ? WSColor.inkText : WSColor.duoText)
                Text(caption)
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .environment(\.colorScheme, active ? .light : colorScheme)
            .wsSticker(fill: active ? WSColor.lime : WSColor.backgroundElevated, radius: 18, depth: active ? 4 : 2)
            .offset(y: active ? 0 : 2)
        }
        .buttonStyle(WSStickerPressStyle())
        .animation(.wsBounceTight, value: active)
    }

    // MARK: Apps

    @ViewBuilder
    private var appsRow: some View {
        switch config.scope {
        case .allApps:
            appsButton(
                title: "Always allowed",
                detail: manager.allowedAppsCount == 0
                    ? "Add apps that never ask, like Messages or Maps."
                    : "\(manager.allowedAppsCount) never ask. Phone and Settings never do.",
                tokens: manager.allowedSelection.applicationTokens,
                action: onChooseAllowed
            )
        case .chosenApps:
            appsButton(
                title: "Apps that ask",
                detail: manager.hasBlockedApps
                    ? "\(manager.blockedItemsCount) chosen. Tap to change."
                    : "None yet. Tap to choose.",
                tokens: manager.blockedSelection.applicationTokens,
                action: onChooseApps
            )
        }
    }

    private func appsButton(title: String, detail: String, tokens: Set<ApplicationToken>, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.medium()
            action()
        } label: {
            HStack(spacing: 12) {
                if tokens.isEmpty {
                    ZStack {
                        Circle().fill(WSColor.duoPurpleLight).frame(width: 36, height: 36)
                        Image(systemName: "plus")
                            .font(.system(size: 15, weight: .heavy))
                            .foregroundStyle(WSColor.purpleInk)
                    }
                } else {
                    // Apple renders the real icons; we never see which apps they are.
                    HStack(spacing: -8) {
                        ForEach(Array(tokens.prefix(4)), id: \.self) { token in
                            Label(token)
                                .labelStyle(.iconOnly)
                                .frame(width: 32, height: 32)
                                .background(Circle().fill(WSColor.backgroundElevated))
                                .clipShape(Circle())
                                .overlay(Circle().strokeBorder(WSColor.ink, lineWidth: 2))
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(WSFont.headline(16, weight: .black))
                        .foregroundStyle(WSColor.foreground)
                    Text(detail)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            .padding(12)
            .wsSticker(fill: WSColor.lilacDeep, radius: 18, depth: 3)
        }
        .buttonStyle(WSStickerPressStyle())
        .disabled(!manager.isAuthorized)
        .opacity(manager.isAuthorized ? 1 : 0.5)
    }

    // MARK: Unlock length

    private var unlockLengthRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            WSKicker(text: "A right answer opens the app for")
            HStack(spacing: 8) {
                ForEach(StudyModeConfig.unlockChoices, id: \.self) { minutes in
                    let active = config.unlockMinutes == minutes
                    Button {
                        Haptics.selection()
                        manager.setStudyUnlockMinutes(minutes)
                    } label: {
                        Text("\(minutes) min")
                            .font(WSFont.headline(15, weight: .black))
                            .foregroundStyle(active ? WSColor.inkText : WSColor.foreground)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                ZStack {
                                    Capsule().fill(WSColor.ink).offset(y: active ? 3 : 2)
                                    Capsule().fill(active ? WSColor.lime : WSColor.backgroundElevated)
                                    Capsule().strokeBorder(WSColor.ink, lineWidth: 2)
                                }
                            )
                            .padding(.bottom, 3)
                    }
                    .buttonStyle(WSStickerPressStyle())
                }
            }
        }
    }
}

// MARK: - Question screen preview

/// A working copy of the screen iOS shows when a Study Mode app opens.
/// Tapping an answer shows what would happen; nothing is recorded.
struct StudyGatePreview: View {
    let question: StudyGateQuestion?
    let deckCount: Int
    let packCount: Int
    let usesTopicBanks: Bool
    let packsLabel: String
    var onChoosePacks: () -> Void

    @State private var picked: Int? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("WHAT YOU'LL SEE")
                    .font(WSFont.sans(11, weight: .black))
                    .tracking(1.3)
                    .foregroundStyle(WSColor.inkText)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(RoundedRectangle(cornerRadius: 9).fill(WSColor.pink))
                    .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(WSColor.ink, lineWidth: 2))
                Spacer()
                Text(picked == nil ? "Tap an answer to try it" : "")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(WSColor.duoText.opacity(0.45))
            }

            screen
            sourceRow
        }
        .wsChunkyCard(cornerRadius: 26)
        .onChange(of: question?.id) { _, _ in picked = nil }
    }

    // MARK: The mock screen

    private var screen: some View {
        VStack(spacing: 12) {
            // Same pose as the icon on the real screen (StudyGateConfiguration/gate-mascot).
            WSAnimatedImage(name: "mascot-dance", ext: "webp")
                .frame(width: 80, height: 80)
                .wsMascotBob(amount: 4, rock: 2, duration: 1.4)

            Text("Answer to open TikTok")
                .font(WSFont.headline(22, weight: .black))
                .foregroundStyle(WSColor.inkText)

            if let picked, let question {
                feedback(picked: picked, question: question)
            }

            Text(question?.prompt ?? "What is the powerhouse of the cell?")
                .wsBody(.large, weight: .bold)
                .multilineTextAlignment(.center)
                .foregroundStyle(Color(hex: 0x3F3858))
                .fixedSize(horizontal: false, vertical: true)

            Text("From \(question?.source ?? "Biology 101")")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.inkMuted)

            VStack(spacing: 6) {
                answerButton(index: 0, primary: true)
                answerButton(index: 1, primary: false)
            }
            .padding(.top, 4)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 20)
        .frame(maxWidth: .infinity)
        // Mirrors the real iOS shield: light face, no sticker chrome inside.
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(Color(hex: 0xF6F4FE))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
        )
    }

    private func options() -> [String] {
        question?.options ?? ["Mitochondria", "Ribosome"]
    }

    private func answerButton(index: Int, primary: Bool) -> some View {
        let label = options()[index]
        let correctIndex = question?.correctIndex ?? 0
        let showResult = picked == index
        let right = index == correctIndex

        return Button {
            guard picked == nil else {
                picked = nil
                return
            }
            if right { Haptics.success() } else { Haptics.error() }
            withAnimation(.wsBouncePop) { picked = index }
        } label: {
            HStack(spacing: 8) {
                if showResult {
                    Image(systemName: right ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.system(size: 15, weight: .heavy))
                }
                Text(label)
                    .font(WSFont.sans(15, weight: .bold))
                    .lineLimit(1)
            }
            .foregroundStyle(showResult ? WSColor.inkText : (primary ? .white : WSColor.purpleInk))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(
                Capsule().fill(fill(primary: primary, showResult: showResult, right: right))
            )
            // The secondary answer has a clear fill, which SwiftUI would not
            // hit-test; without this only the letters themselves respond.
            .contentShape(Capsule())
        }
        .buttonStyle(WSStickerPressStyle(tilt: 0))
    }

    private func fill(primary: Bool, showResult: Bool, right: Bool) -> Color {
        if showResult { return right ? WSColor.lime : WSColor.pink }
        return primary ? WSColor.purple : .clear
    }

    @ViewBuilder
    private func feedback(picked: Int, question: StudyGateQuestion) -> some View {
        let right = picked == question.correctIndex
        Text(right
             ? "Right! TikTok opens for your unlock time."
             : "Not quite, it was \u{201C}\(question.correctAnswer)\u{201D}. Next question.")
            .wsBody(.small, weight: .bold)
            .multilineTextAlignment(.center)
            .foregroundStyle(WSColor.inkText)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(RoundedRectangle(cornerRadius: 12).fill(right ? WSColor.lime : WSColor.pinkSoft))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(WSColor.ink, lineWidth: 2))
            .transition(.scale.combined(with: .opacity))
    }

    // MARK: Where questions come from

    private var sourceRow: some View {
        Button {
            Haptics.medium()
            onChoosePacks()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "rectangle.stack.fill")
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 38, height: 38)
                    .wsStickerCircle(fill: WSColor.sky)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Questions from \(packsLabel)")
                        .font(WSFont.headline(16, weight: .black))
                        .foregroundStyle(WSColor.foreground)
                    Text(sourceDetail)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(WSColor.foregroundMuted)
            }
        }
        .buttonStyle(WSStickerPressStyle())
    }

    private var sourceDetail: String {
        if packCount == 0 {
            return "No study packs yet, so you'll get general questions. Make a pack to be quizzed on your own notes."
        }
        let packs = "\(packCount) pack\(packCount == 1 ? "" : "s")"
        if usesTopicBanks {
            return "\(deckCount) questions. \(packs) plus general questions until you have more."
        }
        return "\(deckCount) questions from \(packs)."
    }
}

// MARK: - Pack picker

struct StudyModePacksSheet: View {
    @ObservedObject var manager: FocusManager
    @ObservedObject private var library = LibraryStore.shared
    @Environment(\.dismiss) private var dismiss

    @State private var picked: Set<String>

    init(manager: FocusManager) {
        self.manager = manager
        _picked = State(initialValue: Set(manager.studyConfig.packIDs))
    }

    private var packs: [LibraryItem] {
        library.items.filter { $0.kind == .studyPack }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.background.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Pick the packs you're studying for right now. Questions only come from these.")
                            .wsBody(.medium)
                            .foregroundStyle(WSColor.foregroundMuted)
                            .padding(.bottom, 4)

                        if packs.isEmpty {
                            emptyState
                        } else {
                            row(title: "All my packs", subtitle: "\(packs.count) pack\(packs.count == 1 ? "" : "s")",
                                icon: "square.stack.3d.up.fill", selected: picked.isEmpty) {
                                picked = []
                            }
                            ForEach(packs) { item in
                                row(title: item.title, subtitle: item.subtitle,
                                    icon: "rectangle.stack.fill", selected: picked.contains(item.id)) {
                                    if picked.contains(item.id) {
                                        picked.remove(item.id)
                                    } else {
                                        picked.insert(item.id)
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 14)
                }
            }
            .navigationTitle("Questions from")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        Haptics.success()
                        // Drop packs deleted since they were picked.
                        let live = Set(packs.map(\.id))
                        manager.setStudyPacks(Array(picked.intersection(live)))
                        dismiss()
                    }
                    .font(WSFont.sans(16, weight: .bold))
                    .foregroundStyle(WSColor.purpleInk)
                }
            }
        }
    }

    private func row(title: String, subtitle: String?, icon: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button {
            Haptics.selection()
            action()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 38, height: 38)
                    .wsStickerCircle(fill: selected ? Color.white : WSColor.sky)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(WSFont.headline(16, weight: .black))
                        .foregroundStyle(selected ? WSColor.inkText : WSColor.foreground)
                        .lineLimit(2)
                    if let subtitle, !subtitle.isEmpty {
                        Text(subtitle)
                            .wsBody(.caption)
                            .foregroundStyle(WSColor.foregroundMuted)
                            .lineLimit(1)
                    }
                }
                Spacer(minLength: 4)
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(selected ? WSColor.inkText : WSColor.foregroundMuted.opacity(0.5))
            }
            .padding(14)
            .wsSticker(fill: selected ? WSColor.lime : WSColor.backgroundElevated, radius: 18, depth: selected ? 4 : 2)
        }
        .buttonStyle(WSStickerPressStyle())
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            WSAnimatedImage(name: "mascot-thinking", ext: "webp")
                .frame(width: 90, height: 90)
            Text("No study packs yet")
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.duoText)
            Text("Make one from your notes in the Study tab and Study Mode will quiz you on it. Until then you'll get general questions.")
                .wsBody(.small)
                .multilineTextAlignment(.center)
                .foregroundStyle(WSColor.foregroundMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .wsChunkyCard()
    }
}

// MARK: - Sticker toggle

/// Chunky outlined switch: lime track + white knob when on.
struct WSStickerToggleStyle: ToggleStyle {
    var accessibilityName: String = "Study Mode"
    func makeBody(configuration: Configuration) -> some View {
        Button {
            configuration.isOn.toggle()
        } label: {
            ZStack(alignment: configuration.isOn ? .trailing : .leading) {
                Capsule()
                    .fill(configuration.isOn ? WSColor.lime : WSColor.lilacDeep)
                    .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
                    .frame(width: 62, height: 36)
                Circle()
                    .fill(Color.white)
                    .overlay(Circle().strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
                    .frame(width: 28, height: 28)
                    .overlay(
                        Image(systemName: configuration.isOn ? "bolt.fill" : "moon.zzz.fill")
                            .font(.system(size: 11, weight: .black))
                            .foregroundStyle(WSColor.inkText)
                    )
                    .padding(.horizontal, 4)
            }
            .background(Capsule().fill(WSColor.ink).offset(y: 3))
            .padding(.bottom, 3)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isOn)
        }
        .buttonStyle(.plain)
        .accessibilityElement()
        .accessibilityLabel(accessibilityName)
        .accessibilityValue(configuration.isOn ? "On" : "Off")
        .accessibilityAddTraits(.isButton)
    }
}
