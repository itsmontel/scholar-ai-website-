//
//  FocusSettingsSheet.swift
//  WriteScholar
//
//  User-facing knobs for Focus mode:
//    • Challenge type   — Quiz or Flashcards
//    • Difficulty       — Standard (4/5) or Hard (5/5, faster timer)
//    • Unlock duration  — 5 / 15 / 30 / 60 minutes
//    • Streak rule      — Counts a "focused day" on unlock or pure-block
//
//  All changes go through FocusManager.updateSettings() so they
//  persist to the App Group and survive relaunches.
//

import SwiftUI

struct FocusSettingsSheet: View {
    @ObservedObject var manager: FocusManager
    @Environment(\.dismiss) private var dismiss

    @State private var draft: FocusSettings

    init(manager: FocusManager) {
        self.manager = manager
        _draft = State(initialValue: manager.settings)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                WSGradient.heroBackdrop.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        challengeTypeSection
                        topicBanksSection
                        difficultySection
                        unlockDurationSection
                        streakRuleSection
                        resetSection
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 16)
                    .padding(.bottom, 90)
                }

                VStack {
                    Spacer()
                    saveBar
                }
                .ignoresSafeArea(.keyboard, edges: .bottom)
            }
            .navigationTitle("Focus settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
        }
    }

    // MARK: - Challenge type

    private var challengeTypeSection: some View {
        sectionCard(title: "Challenge type",
                    subtitle: "How you'll prove you're ready to switch contexts.") {
            HStack(spacing: 10) {
                ForEach(FocusChallengeType.allCases) { type in
                    challengeTypeChip(type)
                }
            }
        }
    }

    private func challengeTypeChip(_ type: FocusChallengeType) -> some View {
        let active = draft.challengeType == type
        return Button {
            Haptics.selection()
            withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                draft.challengeType = type
            }
        } label: {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(active ? type.tint : type.tint.opacity(0.16))
                        .frame(width: 44, height: 44)
                    Image(systemName: type.icon)
                        .foregroundStyle(active ? .white : type.tint)
                        .font(.system(size: 18, weight: .bold))
                }
                Text(type.rawValue)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text(type.blurb)
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .frame(minHeight: 38)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .padding(.horizontal, 8)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(active ? type.tint.opacity(0.10) : WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(active ? type.tint : WSColor.hairline, lineWidth: active ? 1.5 : 1)
                    )
                    .shadow(color: active ? type.tint.opacity(0.30) : .clear, radius: 8, y: 3)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Topic banks

    private var topicBanksSection: some View {
        sectionCard(title: "Topic banks",
                    subtitle: "Used when you don't have a study pack saved. Pick the categories the unlock challenge can pull from. All facts are timeless — nothing that drifts year-to-year.") {
            VStack(spacing: 10) {
                let cols = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
                LazyVGrid(columns: cols, spacing: 8) {
                    ForEach(FocusTopic.allCases) { topic in
                        topicChip(topic)
                    }
                }

                if draft.selectedTopics.isEmpty {
                    HStack(spacing: 8) {
                        Image(systemName: "info.circle.fill")
                            .foregroundStyle(WSColor.revise)
                        Text("Pick at least one topic — otherwise we'll fall back to a small mixed sample bank.")
                            .wsBody(.caption)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(WSColor.revise.opacity(0.10))
                    )
                } else {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(WSColor.strong)
                        Text("\(totalSelectedQuestions) questions across \(draft.selectedTopics.count) topic\(draft.selectedTopics.count == 1 ? "" : "s")")
                            .wsBody(.caption, weight: .semibold)
                            .foregroundStyle(WSColor.foreground)
                        Spacer()
                    }
                }
            }
        }
    }

    private var totalSelectedQuestions: Int {
        draft.selectedTopics.reduce(0) { $0 + FocusQuestionRegistry.count(for: $1) }
    }

    private func topicChip(_ topic: FocusTopic) -> some View {
        let active = draft.selectedTopics.contains(topic)
        return Button {
            Haptics.selection()
            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                if active {
                    draft.selectedTopics.remove(topic)
                } else {
                    draft.selectedTopics.insert(topic)
                }
            }
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(active ? topic.tint : topic.tint.opacity(0.16))
                            .frame(width: 32, height: 32)
                        Image(systemName: topic.icon)
                            .foregroundStyle(active ? .white : topic.tint)
                            .font(.system(size: 14, weight: .bold))
                    }
                    Spacer()
                    Image(systemName: active ? "checkmark.circle.fill" : "plus.circle")
                        .foregroundStyle(active ? topic.tint : WSColor.foregroundMuted)
                        .font(.system(size: 16, weight: .bold))
                }
                Text(topic.label)
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text("\(FocusQuestionRegistry.count(for: topic)) questions")
                    .wsBody(.caption, weight: .semibold)
                    .foregroundStyle(active ? topic.tint : WSColor.foregroundMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(active ? topic.tint.opacity(0.10) : WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(active ? topic.tint.opacity(0.55) : WSColor.hairline, lineWidth: active ? 1.5 : 1)
                    )
                    .shadow(color: active ? topic.tint.opacity(0.25) : .clear, radius: 6, y: 3)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Difficulty

    private var difficultySection: some View {
        sectionCard(title: "Difficulty",
                    subtitle: "Standard is 4 of 5 to pass. Hard demands a clean sweep with a tighter timer.") {
            VStack(spacing: 10) {
                ForEach(FocusDifficulty.allCases) { d in
                    difficultyRow(d)
                }
            }
        }
    }

    private func difficultyRow(_ d: FocusDifficulty) -> some View {
        let active = draft.difficulty == d
        let tint: Color = (d == .hard) ? WSColor.concern : WSColor.brandPrimary
        return Button {
            Haptics.selection()
            draft.difficulty = d
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(tint.opacity(0.16)).frame(width: 36, height: 36)
                    Image(systemName: d == .hard ? "bolt.fill" : "checkmark.shield.fill")
                        .foregroundStyle(tint).font(.system(size: 14, weight: .bold))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(d.label)
                        .wsBody(.medium, weight: .bold)
                        .foregroundStyle(WSColor.foreground)
                    Text(d.subtitle)
                        .wsBody(.caption)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                Spacer()
                Image(systemName: active ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(active ? tint : WSColor.foregroundMuted)
                    .font(.system(size: 22))
            }
            .padding(12)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(active ? tint.opacity(0.08) : WSColor.backgroundElevated)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(active ? tint.opacity(0.50) : WSColor.hairline, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Unlock duration

    private var unlockDurationSection: some View {
        sectionCard(title: "Unlock window",
                    subtitle: draft.unlockDuration.caption) {
            HStack(spacing: 8) {
                ForEach(FocusUnlockDuration.allCases) { d in
                    let active = draft.unlockDuration == d
                    Button {
                        Haptics.selection()
                        draft.unlockDuration = d
                    } label: {
                        Text(d.label)
                            .wsBody(.small, weight: .bold)
                            .foregroundStyle(active ? .white : WSColor.foreground)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                Capsule()
                                    .fill(active ? AnyShapeStyle(WSColor.brandPrimary) : AnyShapeStyle(WSColor.surface))
                                    .overlay(Capsule().stroke(active ? .clear : WSColor.hairline, lineWidth: 1))
                                    .shadow(color: active ? WSColor.brandPrimary.opacity(0.5) : .clear, radius: 8, y: 3)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    // MARK: - Streak rule

    private var streakRuleSection: some View {
        sectionCard(title: "Counts toward streak",
                    subtitle: "When does today count as a 'focused day' on your streak?") {
            VStack(spacing: 10) {
                streakRow(label: "On any successful unlock challenge",
                          subtitle: "Solve one challenge → today counts.",
                          isOn: draft.streakOnUnlock)
                    .onTapGesture {
                        Haptics.selection()
                        draft.streakOnUnlock = true
                    }
                streakRow(label: "Only on a pure-focus day",
                          subtitle: "No unlocks at all → today counts.",
                          isOn: !draft.streakOnUnlock)
                    .onTapGesture {
                        Haptics.selection()
                        draft.streakOnUnlock = false
                    }
            }
        }
    }

    private func streakRow(label: String, subtitle: String, isOn: Bool) -> some View {
        HStack(spacing: 12) {
            Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(isOn ? WSColor.brandPrimary : WSColor.foregroundMuted)
                .font(.system(size: 22))
            VStack(alignment: .leading, spacing: 2) {
                Text(label).wsBody(.medium, weight: .semibold).foregroundStyle(WSColor.foreground)
                Text(subtitle).wsBody(.caption).foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(isOn ? WSColor.brandSoft : WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(isOn ? WSColor.brandPrimary.opacity(0.45) : WSColor.hairline, lineWidth: 1)
                )
        )
    }

    // MARK: - Reset

    private var resetSection: some View {
        Button(role: .destructive) {
            Haptics.warning()
            draft = .default
        } label: {
            Label("Reset to defaults", systemImage: "arrow.counterclockwise")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foregroundMuted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Capsule().fill(WSColor.surface))
        }
        .buttonStyle(.plain)
    }

    // MARK: - Save bar

    private var saveBar: some View {
        HStack(spacing: 10) {
            Button {
                dismiss()
            } label: {
                Text("Cancel")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().fill(WSColor.surface))
            }
            .buttonStyle(.plain)

            Button {
                manager.updateSettings(draft)
                Haptics.success()
                dismiss()
            } label: {
                Label("Save", systemImage: "checkmark.circle.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(WSPrimaryButtonStyle())
        }
        .padding(14)
        .background(
            Rectangle()
                .fill(.ultraThinMaterial)
                .overlay(Rectangle().fill(WSColor.background.opacity(0.4)))
                .ignoresSafeArea(edges: .bottom)
        )
    }

    // MARK: - Section card helper

    private func sectionCard<Content: View>(
        title: String,
        subtitle: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Text(subtitle)
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            content()
        }
        .padding(14)
        .wsCard(elevation: .low)
    }
}

#Preview {
    FocusSettingsSheet(manager: .shared)
}
