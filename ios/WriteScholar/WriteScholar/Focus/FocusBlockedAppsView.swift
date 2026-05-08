//
//  FocusBlockedAppsView.swift
//  WriteScholar
//
//  Sheet for picking which apps + categories Focus mode should shield.
//  Wraps Apple's FamilyActivityPicker, which renders Apple's privacy-
//  preserving system UI (we never see the bundle IDs).
//
//  When the user is unauthorized, shows a clean "Allow Screen Time"
//  prompt that walks them through approval.
//
//  The selection round-trips through FocusManager so changes persist
//  to the App Group and the shield is updated immediately.
//

import SwiftUI
import FamilyControls

struct FocusBlockedAppsView: View {
    @ObservedObject var manager: FocusManager
    @Environment(\.dismiss) private var dismiss

    @State private var draft: FamilyActivitySelection
    @State private var pickerVisible: Bool = false
    @State private var requestingAuth = false

    init(manager: FocusManager) {
        self.manager = manager
        // Local copy so the user can cancel without persisting changes
        _draft = State(initialValue: manager.blockedSelection)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                WSGradient.heroBackdrop.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        intro

                        if !manager.isAuthorized {
                            authPrompt
                        }

                        selectionSummary
                            .opacity(manager.isAuthorized ? 1.0 : 0.55)
                            .allowsHitTesting(manager.isAuthorized)

                        suggestionList
                    }
                    .padding(.horizontal, 18)
                    .padding(.vertical, 14)
                    .padding(.bottom, 90) // leave room for the save bar
                }

                // Sticky save bar
                VStack {
                    Spacer()
                    saveBar
                }
                .ignoresSafeArea(.keyboard, edges: .bottom)
            }
            .navigationTitle("Apps to focus on")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
            .familyActivityPicker(isPresented: $pickerVisible, selection: $draft)
        }
    }

    // MARK: - Intro

    private var intro: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("BLOCK LIST")
                .wsEyebrow()
                .foregroundStyle(WSColor.brandPrimary)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Capsule().fill(WSColor.brandSoft))

            Text("Pick the apps that pull you in.")
                .wsHeadline(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foreground)

            Text("They'll be shielded by Focus mode. To open one, you'll need to pass a quick \(manager.settings.challengeType.rawValue.lowercased()) challenge.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.foregroundMuted)
        }
    }

    // MARK: - Authorization prompt

    private var authPrompt: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "shield.lefthalf.filled")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(WSColor.revise)
                Text("Allow Screen Time first")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
            }
            Text("WriteScholar uses Apple's Family Controls to shield apps you choose — without seeing what they are. Tap below and approve when iOS asks.")
                .wsBody(.small)
                .foregroundStyle(WSColor.foregroundMuted)

            Button {
                requestingAuth = true
                Task {
                    await manager.requestAuthorization()
                    requestingAuth = false
                }
            } label: {
                HStack {
                    if requestingAuth {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: "lock.shield.fill")
                    }
                    Text(requestingAuth ? "Requesting…" : "Allow Screen Time")
                }
            }
            .buttonStyle(WSPrimaryButtonStyle())
            .disabled(requestingAuth)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(WSColor.revise.opacity(0.08))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(WSColor.revise.opacity(0.30), lineWidth: 1)
                )
        )
    }

    // MARK: - Selection summary

    private var selectionSummary: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Currently blocking")
                    .wsBody(.medium, weight: .bold)
                    .foregroundStyle(WSColor.foreground)
                Spacer()
                Text(summaryCountText)
                    .wsBody(.caption, weight: .bold)
                    .foregroundStyle(WSColor.brandPrimary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(WSColor.brandSoft))
            }

            // The picker is the canonical source — show three rows summarizing it
            VStack(spacing: 10) {
                summaryRow(icon: "app.badge.fill",
                           label: "Apps",
                           count: draft.applicationTokens.count,
                           tint: WSColor.brandPrimary)
                summaryRow(icon: "square.grid.2x2.fill",
                           label: "Categories",
                           count: draft.categoryTokens.count,
                           tint: Color(hex: 0xD946EF))
                summaryRow(icon: "globe",
                           label: "Web domains",
                           count: draft.webDomainTokens.count,
                           tint: Color(hex: 0x10B981))
            }

            Button {
                Haptics.medium()
                pickerVisible = true
            } label: {
                Label(draft.applicationTokens.isEmpty && draft.categoryTokens.isEmpty
                      ? "Pick apps to block"
                      : "Edit selection",
                      systemImage: "plus.circle.fill")
            }
            .buttonStyle(WSPrimaryButtonStyle())

            if !draft.applicationTokens.isEmpty || !draft.categoryTokens.isEmpty {
                Button(role: .destructive) {
                    Haptics.warning()
                    draft = FamilyActivitySelection()
                } label: {
                    Label("Clear all", systemImage: "trash")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.concern)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(
                            Capsule().fill(WSColor.concern.opacity(0.12))
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .wsCard(elevation: .medium)
    }

    private var summaryCountText: String {
        let total = draft.applicationTokens.count
            + draft.categoryTokens.count
            + draft.webDomainTokens.count
        if total == 0 { return "Nothing yet" }
        return "\(total) item\(total == 1 ? "" : "s")"
    }

    private func summaryRow(icon: String, label: String, count: Int, tint: Color) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(tint.opacity(0.16)).frame(width: 36, height: 36)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 14, weight: .bold))
            }
            Text(label)
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foreground)
            Spacer()
            Text("\(count)")
                .wsBody(.medium, weight: .bold)
                .foregroundStyle(count > 0 ? tint : WSColor.foregroundMuted)
        }
    }

    // MARK: - Suggestion list

    private var suggestionList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Common distractions")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foregroundMuted)

            // These are visual suggestions only — the picker is the
            // actual source of truth. They mirror the preset list used
            // by the website's FocusModeSettingsSection.
            let presets = [
                ("TikTok",     "play.rectangle.fill",     Color(hex: 0xEC4899)),
                ("Instagram",  "camera.fill",             Color(hex: 0xD946EF)),
                ("YouTube",    "play.tv.fill",            Color(hex: 0xEF4444)),
                ("X / Twitter", "bird.fill",              Color(hex: 0x0EA5E9)),
                ("Reddit",     "bubble.left.and.bubble.right.fill", Color(hex: 0xF97316)),
                ("Snapchat",   "ghost.fill",              Color(hex: 0xF59E0B)),
                ("Discord",    "headphones",              Color(hex: 0x6366F1)),
                ("Netflix",    "film.fill",               Color(hex: 0xDC2626))
            ]

            let cols = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
            LazyVGrid(columns: cols, spacing: 8) {
                ForEach(presets, id: \.0) { item in
                    presetChip(name: item.0, icon: item.1, tint: item.2)
                }
            }

            Text("Tap “Pick apps to block” above and search for these by name in Apple's picker.")
                .wsBody(.caption)
                .foregroundStyle(WSColor.foregroundMuted)
                .padding(.top, 2)
        }
        .padding(14)
        .wsCard(elevation: .low)
    }

    private func presetChip(name: String, icon: String, tint: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).foregroundStyle(tint)
            Text(name).wsBody(.small, weight: .semibold).foregroundStyle(WSColor.foreground)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.surface)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(tint.opacity(0.30), lineWidth: 1)
                )
        )
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
                manager.updateBlockedSelection(draft)
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
}

#Preview {
    FocusBlockedAppsView(manager: .shared)
}
