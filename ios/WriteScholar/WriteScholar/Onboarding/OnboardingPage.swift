//
//  OnboardingPage.swift
//  WriteScholar
//
//  Model + content for each onboarding page. The OnboardingFlow renders
//  these in a shared layout (eyebrow + headline + supporting copy + hero
//  illustration), so each page only needs to define its strings + hero view.
//
//  Each page carries a `badgeColor` (Duolingo tint for the eyebrow pill)
//  and a `highlightColor` (solid color for the headline highlight slice).
//

import SwiftUI

/// MainActor-bound because the `hero` closure builds SwiftUI views,
/// which Swift 6 strict concurrency treats as MainActor-isolated.
@MainActor
struct OnboardingPage: Identifiable {
    let id: Int
    let eyebrow: String
    let headline: String
    /// The portion of the headline that gets the bold color treatment.
    /// Must appear verbatim inside `headline`. Pass `nil` to skip.
    let highlight: String?
    let supporting: String
    /// Per-page Duolingo color for the eyebrow badge pill.
    let badgeColor: Color
    /// Solid Duolingo color for the highlighted headline slice.
    let highlightColor: Color
    /// Builder for the per-page hero illustration. Receives the visible
    /// page progress in [0, 1] so it can drive entrance animations.
    let hero: (CGFloat) -> AnyView

    static let all: [OnboardingPage] = [
        // 0 -- Welcome (green)
        OnboardingPage(
            id: 0,
            eyebrow: "Welcome to WriteScholar",
            headline: "Better essays.\nSmarter studying.",
            highlight: "Smarter studying.",
            supporting: "Your AI study buddy that turns notes into flashcards, quizzes, and games -- and grades your essays like a professor would.",
            badgeColor: WSColor.duoGreen,
            highlightColor: WSColor.duoGreen,
            hero: { progress in AnyView(WelcomeHero(progress: progress)) }
        ),
        // 1 -- Essays (purple)
        OnboardingPage(
            id: 1,
            eyebrow: "Better essays",
            headline: "Professor-style feedback in 60 seconds.",
            highlight: "60 seconds.",
            supporting: "Paste an essay or upload a PDF. We score structure, clarity, citations, and argument -- section by section.",
            badgeColor: WSColor.duoPurple,
            highlightColor: WSColor.duoPurple,
            hero: { progress in AnyView(EssayAnalyzerHero(progress: progress)) }
        ),
        // 2 -- Study tools (blue)
        OnboardingPage(
            id: 2,
            eyebrow: "Smarter studying",
            headline: "Notes in. Six study tools out.",
            highlight: "Six study tools",
            supporting: "Lessons, flashcards, quizzes, crosswords, Crater Blast, and Word Tower -- all generated from notes you paste in.",
            badgeColor: WSColor.duoBlue,
            highlightColor: WSColor.duoBlue,
            hero: { progress in AnyView(StudyToolsHero(progress: progress)) }
        ),
        // 3 -- Flashcards (green)
        OnboardingPage(
            id: 3,
            eyebrow: "Flashcards that don't suck",
            headline: "Swipe, flip, master.",
            highlight: "master.",
            supporting: "Smooth iOS-native cards, smart spaced repetition, and a streak that actually keeps you coming back.",
            badgeColor: WSColor.duoGreen,
            highlightColor: WSColor.duoGreen,
            hero: { progress in AnyView(FlashcardsHero(progress: progress)) }
        ),
        // 4 -- Games (orange)
        OnboardingPage(
            id: 4,
            eyebrow: "Games make it stick",
            headline: "Beat the boss. Build the tower.",
            highlight: "Build the tower.",
            supporting: "Crater Blast turns your subject into a quiz arcade. Word Tower turns vocabulary into a daily streak.",
            badgeColor: WSColor.duoOrange,
            highlightColor: WSColor.duoOrange,
            hero: { progress in AnyView(GamesHero(progress: progress)) }
        ),
        // 5 -- Library (blue)
        OnboardingPage(
            id: 5,
            eyebrow: "All in one place",
            headline: "Your library. Always with you.",
            highlight: "Always with you.",
            supporting: "Every essay analysis and study pack you make is saved automatically -- pick up where you left off, on any device.",
            badgeColor: WSColor.duoBlue,
            highlightColor: WSColor.duoBlue,
            hero: { progress in AnyView(LibraryHero(progress: progress)) }
        ),
        // 6 -- Get started (green)
        OnboardingPage(
            id: 6,
            eyebrow: "Ready when you are",
            headline: "Start your 7-day free trial.",
            highlight: "free trial.",
            supporting: "No payment today. Cancel anytime. Built for college students worldwide.",
            badgeColor: WSColor.duoGreen,
            highlightColor: WSColor.duoGreen,
            hero: { progress in AnyView(GetStartedHero(progress: progress)) }
        )
    ]
}
