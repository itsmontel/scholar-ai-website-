//
//  FocusBlockedAppsView.swift
//  WriteScholar
//
//  Sheet for picking which apps + categories Focus mode should shield —
//  Duolingo-style design.
//
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
        _draft = State(initialValue: manager.blockedSelection)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                WSColor.background.ignoresSafeArea()

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
                    .padding(.bottom, 90)
                }

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
                        .foregroundStyle(WSColor.duoText.opacity(0.55))
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
                .foregroundStyle(WSColor.duoPurple)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(Capsule().fill(WSColor.duoPurpleLight))

            Text("Pick the apps that pull you in.")
                .wsHeadline(.medium, weight: .black)
                .foregroundStyle(WSColor.duoText)

            Text("They'll be shielded by Focus mode. To open one, you'll need to pass a quick \(manager.settings.challengeType.rawValue.lowercased()) challenge.")
                .wsBody(.medium)
                .foregroundStyle(WSColor.duoText.opacity(0.65))
        }
    }

    // MARK: - Authorization prompt

    private var authPrompt: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "shield.lefthalf.filled")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(WSColor.duoOrange)
                Text("Allow Screen Time first")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText)
            }
            Text("WriteScholar uses Apple's Family Controls to shield apps you choose — without seeing what they are. Tap below and approve when iOS asks.")
                .wsBody(.small)
                .foregroundStyle(WSColor.duoText.opacity(0.55))

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
                    Text(requestingAuth ? "Requesting..." : "Allow Screen Time")
                }
            }
            .buttonStyle(WSDuoWarnButtonStyle())
            .disabled(requestingAuth)
        }
        .wsChunkyCard(accent: WSColor.duoOrange)
    }

    // MARK: - Selection summary

    private var selectionSummary: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Currently blocking")
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                Spacer()
                Text(summaryCountText)
                    .font(WSFont.sans(11, weight: .bold))
                    .foregroundStyle(WSColor.duoPurple)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(WSColor.duoPurpleLight))
            }

            VStack(spacing: 10) {
                summaryRow(icon: "app.badge.fill",
                           label: "Apps",
                           count: draft.applicationTokens.count,
                           tint: WSColor.duoPurple)
                summaryRow(icon: "square.grid.2x2.fill",
                           label: "Categories",
                           count: draft.categoryTokens.count,
                           tint: WSColor.duoBlue)
                summaryRow(icon: "globe",
                           label: "Web domains",
                           count: draft.webDomainTokens.count,
                           tint: WSColor.duoGreen)
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
            .buttonStyle(WSDuoPrimaryButtonStyle())

            if !draft.applicationTokens.isEmpty || !draft.categoryTokens.isEmpty {
                Button(role: .destructive) {
                    Haptics.warning()
                    draft = FamilyActivitySelection()
                } label: {
                    Label("Clear all", systemImage: "trash")
                }
                .buttonStyle(WSDuoDangerButtonStyle())
            }
        }
        .wsChunkyCard(accent: WSColor.duoPurple)
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
                Circle().fill(tint.opacity(0.15)).frame(width: 36, height: 36)
                Image(systemName: icon).foregroundStyle(tint).font(.system(size: 14, weight: .bold))
            }
            Text(label)
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.duoText)
            Spacer()
            Text("\(count)")
                .font(WSFont.headline(17))
                .foregroundStyle(count > 0 ? tint : WSColor.duoBorder)
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(WSColor.duoBorder, lineWidth: 2)
                )
        )
    }

    // MARK: - Suggestion list

    private var suggestionList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Common distractions")
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.duoText)

            let presets = [
                ("TikTok",     "play.rectangle.fill",     WSColor.duoRed),
                ("Instagram",  "camera.fill",             WSColor.duoPurple),
                ("YouTube",    "play.tv.fill",            WSColor.duoRed),
                ("X / Twitter", "bird.fill",              WSColor.duoBlue),
                ("Reddit",     "bubble.left.and.bubble.right.fill", WSColor.duoOrange),
                ("Snapchat",   "ghost.fill",              WSColor.duoOrange),
                ("Discord",    "headphones",              WSColor.duoPurple),
                ("Netflix",    "film.fill",               WSColor.duoRed)
            ]

            let cols = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
            LazyVGrid(columns: cols, spacing: 8) {
                ForEach(presets, id: \.0) { item in
                    presetChip(name: item.0, icon: item.1, tint: item.2)
                }
            }

            Text("Tap \"Pick apps to block\" above and search for these by name in Apple's picker.")
                .wsBody(.caption)
                .foregroundStyle(WSColor.duoText.opacity(0.55))
                .padding(.top, 2)
        }
        .wsChunkyCard(accent: WSColor.duoBlue)
    }

    private func presetChip(name: String, icon: String, tint: Color) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).foregroundStyle(tint)
            Text(name).wsBody(.small, weight: .semibold).foregroundStyle(WSColor.duoText)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(tint.opacity(0.35), lineWidth: 2)
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
            }
            .buttonStyle(WSDuoSecondaryButtonStyle(fullWidth: true))

            Button {
                manager.updateBlockedSelection(draft)
                Haptics.success()
                dismiss()
            } label: {
                Label("Save", systemImage: "checkmark.circle.fill")
            }
            .buttonStyle(WSDuoSuccessButtonStyle())
        }
        .padding(14)
        .background(
            Rectangle()
                .fill(.ultraThinMaterial)
                .overlay(Rectangle().fill(WSColor.duoSurface.opacity(0.6)))
                .ignoresSafeArea(edges: .bottom)
        )
    }
}

#Preview {
    FocusBlockedAppsView(manager: .shared)
}
