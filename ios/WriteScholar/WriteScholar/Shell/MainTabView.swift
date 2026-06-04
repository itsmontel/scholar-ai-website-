//
//  MainTabView.swift
//  WriteScholar
//
//  Prototype shell — a custom bottom bar:
//
//      Home  |  My Stuff  |  ⊕  |  Review  |  Profile
//
//  The center ⊕ opens the "What would you like to work on?" tool picker.
//  Study Packs, Arcade and Focus are launched as presented routes from Home
//  or the picker, rather than living as their own permanent tabs.
//

import SwiftUI

/// A feature the shell can launch from Home or the ⊕ tool picker.
enum AppRoute: Identifiable, Hashable {
    case studyPacks, arcade, focus, smartEditor, essayAnalyzer, library
    var id: String { String(describing: self) }
}

struct MainTabView: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    @EnvironmentObject var session: AuthSession

    @State private var selectedTab: Tab = .home
    @State private var showToolPicker = false
    @State private var route: AppRoute?

    enum Tab: Hashable { case home, myStuff, review, profile }

    var body: some View {
        content
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(WSColor.background.ignoresSafeArea())
            .safeAreaInset(edge: .bottom, spacing: 0) {
                WSTabBar(selected: $selectedTab, onPlus: { showToolPicker = true })
            }
            .sheet(isPresented: $showToolPicker) {
                ToolPickerSheet(onSelect: { picked in
                    showToolPicker = false
                    // Let the picker dismiss before presenting the destination.
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { go(picked) }
                })
                .presentationDragIndicator(.visible)
            }
            .sheet(item: $route) { r in
                routeDestination(r).environmentObject(session)
            }
    }

    @ViewBuilder private var content: some View {
        switch selectedTab {
        case .home:
            HomeTabView(onboardingComplete: $onboardingComplete,
                        onRoute: { go($0) },
                        onOpenToolPicker: { showToolPicker = true })
        case .myStuff:
            LibraryTabView(onJumpToTab: { dest in
                switch dest {
                case .study: go(.studyPacks)
                case .games: go(.arcade)
                case .focus: go(.focus)
                }
            })
        case .review:
            DailyReviewView(onStartReview: { go(.studyPacks) })
        case .profile:
            ProfileView(user: user, onboardingComplete: $onboardingComplete, onSignOut: onSignOut)
        }
    }

    /// `.library` switches tab; everything else is presented as a route sheet.
    private func go(_ r: AppRoute) {
        if r == .library {
            withAnimation(.wsBounceTight) { selectedTab = .myStuff }
        } else {
            route = r
        }
    }

    @ViewBuilder private func routeDestination(_ r: AppRoute) -> some View {
        switch r {
        case .studyPacks: StudyTabContainer()
        case .arcade:     GamesTabView()
        case .focus:      FocusTabView()
        case .smartEditor:
            NavigationStack { SmartEditorView() }
        case .essayAnalyzer:
            AnalyzeTabContainer()
        case .library:
            EmptyView()   // handled by the tab switch in go(_:)
        }
    }
}

// MARK: - Custom bottom bar with center ⊕

private struct WSTabBar: View {
    @Binding var selected: MainTabView.Tab
    var onPlus: () -> Void

    var body: some View {
        HStack(alignment: .bottom, spacing: 0) {
            tabButton(.home,    icon: "house.fill",  label: "Home")
            tabButton(.myStuff, icon: "folder.fill", label: "My Stuff")
            plusButton
            tabButton(.review,  icon: "checklist",   label: "Review")
            tabButton(.profile, icon: "person.fill", label: "Profile")
        }
        .padding(.horizontal, 6)
        .padding(.top, 10)
        .frame(maxWidth: .infinity)
        .background(
            WSColor.backgroundElevated
                .shadow(color: Color.black.opacity(0.06), radius: 12, y: -3)
                .ignoresSafeArea(edges: .bottom)
        )
    }

    private func tabButton(_ tab: MainTabView.Tab, icon: String, label: String) -> some View {
        let active = selected == tab
        return Button {
            Haptics.selection()
            withAnimation(.wsBounceTight) { selected = tab }
        } label: {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 21, weight: .semibold))
                Text(label)
                    .font(WSFont.sans(10, weight: .bold))
            }
            .foregroundStyle(active ? WSColor.duoPurple : WSColor.foregroundMuted.opacity(0.6))
            .frame(maxWidth: .infinity)
            .padding(.bottom, 4)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var plusButton: some View {
        Button {
            Haptics.medium()
            onPlus()
        } label: {
            ZStack {
                Circle()
                    .fill(WSColor.duoPurple)
                    .frame(width: 56, height: 56)
                    .shadow(color: WSColor.duoPurple.opacity(0.45), radius: 12, y: 5)
                Image(systemName: "plus")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(.white)
            }
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity)
        .offset(y: -16)
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
