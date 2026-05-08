//
//  WriteScholarApp.swift
//  WriteScholar
//
//  App entry point. Routes to onboarding on first launch, otherwise to the
//  main app shell (placeholder until Chapter 2 wires real auth + tabs).
//

import SwiftUI

@main
struct WriteScholarApp: App {
    /// Persisted across launches via @AppStorage.
    /// Flips to `true` the moment the user finishes (or skips) onboarding.
    @AppStorage("ws_onboarding_complete") private var onboardingComplete: Bool = false

    /// Light/dark mode preference. `nil` = follow system, otherwise force.
    @AppStorage("ws_color_scheme_override") private var colorSchemeOverride: String = ""

    var body: some Scene {
        WindowGroup {
            ContentView(onboardingComplete: $onboardingComplete)
                .preferredColorScheme(parseScheme(colorSchemeOverride))
                .tint(WSColor.brandPrimary)
                .task {
                    // Ask for notification permission on first launch.
                    // After the prompt has fired once, this is a no-op
                    // and the user manages permissions in iOS Settings.
                    await NotificationService.shared.requestAuthorizationIfNeeded()
                    NotificationService.shared.refreshAll()

                    // Daily check-in: count today's first open as a
                    // small XP nudge so the goal ring isn't blank.
                    if DailyGoalStore.shared.todayXP == 0 {
                        DailyGoalStore.shared.record(.dailyOpen)
                    }
                }
        }
    }

    private func parseScheme(_ raw: String) -> ColorScheme? {
        switch raw {
        case "light": return .light
        case "dark":  return .dark
        default:      return nil // follow system
        }
    }
}
