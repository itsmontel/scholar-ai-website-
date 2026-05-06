//
//  MainTabView.swift
//  WriteScholar
//
//  Bottom tab bar shell. Order matches the user-requested layout:
//
//      Home  |  Study  |  Library  |  Analyze  |  Games
//
//  Settings is no longer a tab — it now lives behind the profile avatar
//  in the top-right of the Home tab and is presented as a sheet.
//

import SwiftUI

struct MainTabView: View {
    let user: WSUser
    @Binding var onboardingComplete: Bool
    var onSignOut: () -> Void

    @State private var selectedTab: Tab = .home

    enum Tab: Hashable {
        case home, study, library, analyze, games
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeTabView(
                onboardingComplete: $onboardingComplete,
                selectedTab: $selectedTab
            )
            .tabItem { Label("Home", systemImage: "house.fill") }
            .tag(Tab.home)

            StudyPackTabContainer()
                .tabItem { Label("Study", systemImage: "graduationcap.fill") }
                .tag(Tab.study)

            ComingSoonTab(
                title: "Library",
                subtitle: "Every essay analysis and study pack you create — all in one place.",
                systemIcon: "books.vertical.fill",
                tint: Color(hex: 0x6366F1),
                chapterLabel: "Chapter 6"
            )
            .tabItem { Label("Library", systemImage: "books.vertical.fill") }
            .tag(Tab.library)

            AnalyzeTabContainer()
                .tabItem { Label("Analyze", systemImage: "doc.text.magnifyingglass") }
                .tag(Tab.analyze)

            GamesTabView()
                .tabItem { Label("Games", systemImage: "gamecontroller.fill") }
                .tag(Tab.games)
        }
        .tint(WSColor.brandPrimary)
    }
}

// MARK: - Placeholder tab body (Library still uses this for now)

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
