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
        .tint(WSColor.duoGreen)
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
            WSColor.backgroundElevated.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                VStack(spacing: 18) {
                    ZStack {
                        Circle()
                            .fill(tint.opacity(0.12))
                            .frame(width: 120, height: 120)
                        Image(systemName: systemIcon)
                            .font(.system(size: 52, weight: .heavy))
                            .foregroundStyle(tint)
                    }

                    VStack(spacing: 8) {
                        Text(title)
                            .wsHeadline(.medium, weight: .black)
                            .foregroundStyle(WSColor.duoText)

                        Text(chapterLabel)
                            .wsEyebrow()
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 5)
                            .background(Capsule().fill(tint))
                    }

                    Text(subtitle)
                        .wsBody(.medium, weight: .semibold)
                        .foregroundStyle(WSColor.duoText.opacity(0.6))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                .frame(maxWidth: .infinity)
                .wsChunkyCard(accent: tint)

                Spacer()
            }
            .padding(.horizontal, 24)
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
