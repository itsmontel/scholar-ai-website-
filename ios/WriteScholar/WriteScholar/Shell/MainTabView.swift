//
//  MainTabView.swift
//  WriteScholar
//
//  Sticker arcade shell — a custom bottom bar:
//
//      Home  |  Packs  |  Arcade  |  Essays  |  Focus
//
//  Each tab stays alive once visited so a half-played pack or a pasted
//  essay survives a tab switch. Library, Review, Profile and the Smart
//  Editor are presented as sheets from Home and the tool picker.
//

import SwiftUI

/// A feature the shell can launch from Home or the tool picker.
enum AppRoute: Identifiable, Hashable {
    case studyPacks, arcade, focus, smartEditor, essayAnalyzer, library
    case review, profile
    var id: String { String(describing: self) }
}

struct MainTabView: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    @EnvironmentObject var session: AuthSession

    @State private var selectedTab: Tab = .home
    @State private var visited: Set<Tab> = [.home]
    @State private var showToolPicker = false
    @State private var route: AppRoute?
    /// Route chosen from the tool picker, presented after the picker
    /// finishes dismissing (avoids the double-sheet race).
    @State private var pendingRoute: AppRoute?
    /// Bumped to rebuild the Packs tab when a tool-picker intent (create,
    /// flashcards, quiz) needs the container to re-read it.
    @State private var packsEpoch = 0

    enum Tab: Hashable, CaseIterable { case home, packs, arcade, essays, focus }

    var body: some View {
        ZStack {
            ForEach(Tab.allCases, id: \.self) { tab in
                if visited.contains(tab) {
                    tabContent(tab)
                        .opacity(selectedTab == tab ? 1 : 0)
                        .allowsHitTesting(selectedTab == tab)
                        .accessibilityHidden(selectedTab != tab)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background((selectedTab == .arcade ? WSColor.arcadeNight : WSColor.background).ignoresSafeArea())
        .safeAreaInset(edge: .bottom, spacing: 0) {
            WSTabBar(selected: $selectedTab, dark: selectedTab == .arcade) { tab in
                select(tab)
            }
        }
        // Keep the bar anchored below the keyboard instead of riding it up.
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .sheet(isPresented: $showToolPicker, onDismiss: {
            // Present the destination only after UIKit finished tearing
            // down the picker — a timed delay used to silently no-op.
            if let p = pendingRoute { pendingRoute = nil; go(p) }
        }) {
            ToolPickerSheet(onSelect: { picked in
                pendingRoute = picked
                showToolPicker = false
            })
            .presentationDragIndicator(.visible)
        }
        .sheet(item: $route) { r in
            routeDestination(r)
                .environmentObject(session)
                .presentationDragIndicator(.visible)
        }
    }

    @ViewBuilder private func tabContent(_ tab: Tab) -> some View {
        switch tab {
        case .home:
            HomeTabView(onboardingComplete: $onboardingComplete,
                        onRoute: { go($0) },
                        onOpenToolPicker: { showToolPicker = true })
        case .packs:
            StudyTabContainer(onOpenFocus: { select(.focus) })
                .id(packsEpoch)
        case .arcade:
            GamesTabView()
        case .essays:
            AnalyzeTabContainer()
        case .focus:
            FocusTabView()
        }
    }

    private func select(_ tab: Tab) {
        // Hidden tabs stay alive, so drop any focused field before leaving
        // one; otherwise its keyboard follows you to the next tab.
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        visited.insert(tab)
        withAnimation(.wsBounceTight) { selectedTab = tab }
    }

    /// Tab features switch tab; everything else is presented as a sheet.
    private func go(_ r: AppRoute) {
        switch r {
        case .studyPacks:
            if StudyLaunchIntent.pending != nil, visited.contains(.packs) { packsEpoch += 1 }
            select(.packs)
        case .arcade:        select(.arcade)
        case .focus:         select(.focus)
        case .essayAnalyzer: select(.essays)
        case .smartEditor, .library, .review, .profile:
            route = r
        }
    }

    @ViewBuilder private func routeDestination(_ r: AppRoute) -> some View {
        switch r {
        case .smartEditor:
            NavigationStack { SmartEditorView() }
        case .library:
            LibraryTabView(
                onJumpToTab: { dest in
                    route = nil
                    switch dest {
                    case .study:    select(.packs)
                    case .games:    select(.arcade)
                    case .focus:    select(.focus)
                    case .analyzer: select(.essays)
                    case .editor:
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { route = .smartEditor }
                    }
                },
                onOpenToolPicker: {
                    route = nil
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { showToolPicker = true }
                })
        case .review:
            DailyReviewView(onStartReview: {
                route = nil
                select(.packs)
            })
        case .profile:
            ProfileView(user: user, onboardingComplete: $onboardingComplete, onSignOut: onSignOut)
        case .studyPacks, .arcade, .focus, .essayAnalyzer:
            EmptyView()   // handled by the tab switch in go(_:)
        }
    }
}

// MARK: - Sticker bottom bar

private struct WSTabBar: View {
    @Binding var selected: MainTabView.Tab
    /// Arcade tab paints the bar in its night palette.
    var dark: Bool
    var onSelect: (MainTabView.Tab) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            tabButton(.home,   icon: "house",                label: "Home")
            tabButton(.packs,  icon: "square.stack.3d.up",   label: "Packs")
            tabButton(.arcade, icon: "gamecontroller",       label: "Arcade")
            tabButton(.essays, icon: "pencil.line",          label: "Essays", fills: false)
            tabButton(.focus,  icon: "bolt",                 label: "Focus")
        }
        .padding(.horizontal, 6)
        .padding(.top, 10)
        .padding(.bottom, 2)
        .frame(maxWidth: .infinity)
        .background(
            (dark ? Color(hex: 0x1E1640) : WSColor.backgroundElevated)
                .overlay(alignment: .top) {
                    Rectangle().fill(dark ? Color.black : WSColor.ink).frame(height: WSSticker.stroke)
                }
                .ignoresSafeArea(edges: .bottom)
        )
        .animation(.easeInOut(duration: 0.25), value: dark)
    }

    private func tabButton(_ tab: MainTabView.Tab, icon: String, label: String, fills: Bool = true) -> some View {
        let active = selected == tab
        let idle = dark ? Color(hex: 0xB9AEE0) : WSColor.foregroundMuted
        return Button {
            Haptics.selection()
            onSelect(tab)
        } label: {
            VStack(spacing: 3) {
                ZStack {
                    if active {
                        Capsule()
                            .fill(WSColor.lime)
                            .overlay(Capsule().strokeBorder(dark ? Color.black : WSColor.ink, lineWidth: 2))
                            .frame(width: 52, height: 30)
                            .transition(.scale(scale: 0.4).combined(with: .opacity))
                    }
                    Image(systemName: active && fills ? icon + ".fill" : icon)
                        .font(.system(size: active ? 17 : 19, weight: .bold))
                        .foregroundStyle(active ? WSColor.inkText : idle)
                        .symbolEffect(.bounce, value: active)
                }
                .frame(height: 30)
                Text(label)
                    .font(WSFont.sans(11, weight: active ? .heavy : .bold))
                    .foregroundStyle(active ? (dark ? WSColor.lime : WSColor.foreground) : idle)
            }
            .frame(maxWidth: .infinity)
            .padding(.bottom, 4)
            .contentShape(Rectangle())
            .animation(.wsBounceTight, value: active)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityAddTraits(active ? [.isSelected] : [])
    }
}

#Preview {
    MainTabView(
        user: WSUser(
            id: "1",
            email: "you@school.edu",
            username: "you",
            firstName: "Alex",
            lastName: nil,
            subscriptionPlan: "free",
            subscriptionStatus: "active",
            emailVerified: true,
            onboardingCompleted: true,
            welcomeTutorialCompleted: true
        ),
        onboardingComplete: .constant(true),
        onSignOut: {}
    )
    .environmentObject(AuthSession())
}
