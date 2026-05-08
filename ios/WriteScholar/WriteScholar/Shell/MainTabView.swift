//
//  MainTabView.swift
//  WriteScholar
//
//  Bottom tab bar shell. Order:
//
//      Home  |  Study  |  Library  |  Games  |  Focus
//
//  Essay Analysis is desktop-only (citations + paper analysis live on
//  writescholar.com), so the mobile shell drops the Analyze tab entirely
//  and gives that slot to Games. Games are also linked from the Study
//  hub for discoverability, but they get their own dedicated tab now.
//
//  Settings still lives behind the profile avatar in the top-right of
//  the Home tab.
//

import SwiftUI

struct MainTabView: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    @State private var selectedTab: Tab = .home

    enum Tab: Hashable {
        case home, study, library, games, focus
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeTabView(
                onboardingComplete: $onboardingComplete,
                selectedTab: $selectedTab
            )
            .tabItem { Label("Home", systemImage: "house.fill") }
            .tag(Tab.home)

            StudyTabContainer(onOpenFocus: { selectedTab = .focus })
                .tabItem { Label("Study", systemImage: "graduationcap.fill") }
                .tag(Tab.study)

            LibraryTabView(onJumpToTab: { dest in
                switch dest {
                case .study:   selectedTab = .study
                case .games:   selectedTab = .games
                case .focus:   selectedTab = .focus
                }
            })
            .tabItem { Label("Library", systemImage: "books.vertical.fill") }
            .tag(Tab.library)

            GamesTabView()
                .tabItem { Label("Games", systemImage: "gamecontroller.fill") }
                .tag(Tab.games)

            FocusTabView()
                .tabItem { Label("Focus", systemImage: "shield.lefthalf.filled") }
                .tag(Tab.focus)
        }
        .tint(WSColor.brandPrimary)
    }
}

// MARK: - Placeholder tab body (kept for any future "coming soon" tabs)

struct ComingSoonTab: View {
    let title: String
    let subtitle: String
    let systemIcon: String
    let tint: Color
    let chapterLabel: String

    var body: some View {
        ZStack {
            WSGradient.heroBackdrop.ignoresSafeArea()

            VStack(spacing: 18) {
                ZStack {
                    Circle()
                        .fill(tint.opacity(0.15))
                        .frame(width: 130, height: 130)
                    Image(systemName: systemIcon)
                        .font(.system(size: 56, weight: .semibold))
                        .foregroundStyle(tint)
                }

                VStack(spacing: 6) {
                    Text(title)
                        .wsHeadline(.medium, weight: .semibold)
                        .foregroundStyle(WSColor.foreground)

                    Text(chapterLabel)
                        .wsEyebrow()
                        .foregroundStyle(tint)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(tint.opacity(0.15)))
                }

                Text(subtitle)
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            .padding(.top, 60)
        }
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
