//
//  OnboardingFlow.swift
//  WriteScholar
//
//  Coordinator for the 7-page onboarding. Each page renders a shared
//  layout (eyebrow + headline + supporting copy + per-page hero) on top
//  of a unique Duolingo-colored backdrop that morphs between pages.
//

import SwiftUI

struct OnboardingFlow: View {
    @Binding var onboardingComplete: Bool
    @ObservedObject var session: AuthSession
    @State private var pageIndex: Int = 0

    private let pages = OnboardingPage.all

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Background -- cross-fades between page-specific gradients
                ZStack {
                    ForEach(pages.indices, id: \.self) { idx in
                        WSGradient.onboardingBackdrop(for: idx)
                            .opacity(opacityForBackdrop(at: idx))
                    }
                }
                .ignoresSafeArea()

                // Content
                VStack(spacing: 0) {
                    topBar
                        .padding(.top, geo.safeAreaInsets.top + 4)
                        .padding(.horizontal, 20)

                    // Page swiper
                    TabView(selection: $pageIndex) {
                        ForEach(pages.indices, id: \.self) { idx in
                            OnboardingPageView(
                                page: pages[idx],
                                progress: progress(at: idx)
                            )
                            .tag(idx)
                            .padding(.horizontal, 20)
                        }
                    }
                    .tabViewStyle(.page(indexDisplayMode: .never))
                    .animation(.easeInOut(duration: 0.35), value: pageIndex)

                    bottomBar
                        .padding(.horizontal, 20)
                        .padding(.bottom, max(geo.safeAreaInsets.bottom, 14))
                }
            }
        }
        .onChange(of: pageIndex) { _, _ in
            Haptics.selection()
        }
    }

    // MARK: - Top bar (Skip)

    private var topBar: some View {
        HStack {
            // Logo dot -- quick brand anchor
            Image(systemName: "graduationcap.fill")
                .foregroundStyle(WSColor.duoGreen)
                .font(.system(size: 22, weight: .bold))
            Text("WriteScholar")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.duoText)
            Spacer()
            if showsSkipControl {
                Button {
                    Haptics.light()
                    skipOnboardingToHome()
                } label: {
                    HStack(spacing: 5) {
                        Text(skipControlTitle)
                        Image(systemName: "arrow.forward")
                            .font(.system(size: 11, weight: .bold))
                    }
                }
                .buttonStyle(WSDuoPillButtonStyle(palette: .secondary))
                .accessibilityLabel("Skip onboarding and open the app")
            }
        }
    }

    // MARK: - Bottom bar (page indicator + CTA)

    private var bottomBar: some View {
        VStack(spacing: 14) {
            pageIndicator
            primaryCTA

            // Get-started page: chunky trust badge row beneath the trial CTA.
            if pageIndex == pages.count - 1 {
                WSTrustBadgeRow(badges: [
                    WSTrustBadge(icon: "checkmark.seal.fill", label: "Cancel anytime",  tint: WSColor.duoGreen),
                    WSTrustBadge(icon: "creditcard.fill",     label: "No charge today", tint: WSColor.duoBlue),
                    WSTrustBadge(icon: "iphone",              label: "Sync everywhere", tint: WSColor.duoPurple)
                ])
                .padding(.top, 2)
            }

            // Welcome-page only: tertiary escape straight into the tab shell (guest).
            if pageIndex == 0 {
                Button {
                    Haptics.light()
                    skipOnboardingToHome()
                } label: {
                    HStack(spacing: 6) {
                        Text("I've used this -- open the app")
                        Image(systemName: "arrow.forward")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .wsBody(.caption, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
                }
                .buttonStyle(.plain)
                .padding(.top, 2)
            }
        }
    }

    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(pages.indices, id: \.self) { idx in
                Circle()
                    .fill(idx == pageIndex ? accentColorForPage(idx) : WSColor.duoBorder)
                    .frame(width: idx == pageIndex ? 14 : 10, height: idx == pageIndex ? 14 : 10)
                    .overlay(
                        Circle()
                            .stroke(idx == pageIndex ? accentColorForPage(idx).opacity(0.4) : Color.clear, lineWidth: 2)
                            .frame(width: idx == pageIndex ? 20 : 10, height: idx == pageIndex ? 20 : 10)
                    )
                    .animation(.spring(response: 0.4, dampingFraction: 0.7), value: pageIndex)
            }
        }
    }

    private var primaryCTA: some View {
        Button {
            advance()
        } label: {
            HStack(spacing: 10) {
                Text(ctaLabel)
                if pageIndex < pages.count - 1 {
                    Image(systemName: "arrow.right")
                }
            }
        }
        .buttonStyle(WSDuoPrimaryButtonStyle())
        .wsShineSweep()
    }

    private var ctaLabel: String {
        if pageIndex == pages.count - 1 { return "Let's go" }
        if pageIndex == 0               { return "Get started" }
        return "Next"
    }

    // MARK: - Helpers

    private func advance() {
        if pageIndex < pages.count - 1 {
            withAnimation(.spring(response: 0.45, dampingFraction: 0.8)) {
                pageIndex += 1
            }
            Haptics.medium()
        } else {
            Haptics.success()
            finishOnboardingToAuth()
        }
    }

    /// Normal funnel: show sign-in / sign-up after the final onboarding step.
    private func finishOnboardingToAuth() {
        withAnimation(.easeInOut(duration: 0.35)) {
            onboardingComplete = true
        }
    }

    /// Skip carousel: jump into the main tabs without signing in (local guest -- no JWT).
    private func skipOnboardingToHome() {
        session.continueWithoutSigningIn()
        withAnimation(.easeInOut(duration: 0.35)) {
            onboardingComplete = true
        }
    }

    /// Hide skip only on the final onboarding step when there is a distinct last page.
    private var showsSkipControl: Bool {
        if pages.count <= 1 { return true }
        return pageIndex < pages.count - 1
    }

    private var skipControlTitle: String {
        pageIndex == 0 ? "Skip to app" : "Skip"
    }

    /// 1.0 when this index is the active page, 0 otherwise. Used by hero
    /// views to decide when to start their entrance animations.
    private func progress(at idx: Int) -> CGFloat {
        idx == pageIndex ? 1.0 : 0.0
    }

    private func opacityForBackdrop(at idx: Int) -> Double {
        idx == pageIndex ? 1.0 : 0.0
    }

    /// Per-page Duolingo accent color for the page indicator dots.
    private func accentColorForPage(_ idx: Int) -> Color {
        let colors: [Color] = [
            WSColor.duoGreen,   // 0: Welcome
            WSColor.duoPurple,  // 1: Essays
            WSColor.duoBlue,    // 2: Study tools
            WSColor.duoGreen,   // 3: Flashcards
            WSColor.duoOrange,  // 4: Games
            WSColor.duoBlue,    // 5: Library
            WSColor.duoGreen    // 6: Get started
        ]
        return colors[idx % colors.count]
    }
}

// MARK: - Single page view (shared layout)

struct OnboardingPageView: View {
    let page: OnboardingPage
    let progress: CGFloat

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 0)

            // Hero illustration takes the top 55% of the available area
            page.hero(progress)
                .frame(maxWidth: .infinity)
                .layoutPriority(1)

            Spacer(minLength: 24)

            // Copy block -- eyebrow + headline + supporting (each row staggers in)
            VStack(spacing: 14) {
                // Duolingo-style eyebrow pill with per-page color
                Text(page.eyebrow)
                    .wsEyebrow()
                    .foregroundStyle(page.badgeColor)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(
                        Capsule()
                            .fill(page.badgeColor.opacity(0.12))
                            .overlay(
                                Capsule()
                                    .stroke(page.badgeColor.opacity(0.25), lineWidth: 1.5)
                            )
                    )
                    .wsStaggerEntry(0)

                styledHeadline
                    .multilineTextAlignment(.center)
                    .wsStaggerEntry(1)

                Text(page.supporting)
                    .wsBody(.medium, weight: .semibold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 12)
                    .lineSpacing(2)
                    .wsStaggerEntry(2)
            }
            .padding(.bottom, 12)
            .id(page.id)
        }
    }

    /// Renders the headline with the highlighted slice in a solid Duolingo color.
    /// Uses Nunito Black via wsHeadline -- no serif, no gradient text.
    private var styledHeadline: some View {
        let parts = splitHeadline(page.headline, highlight: page.highlight)
        return (
            Text(parts.before)
                .foregroundStyle(WSColor.duoText)
            + Text(parts.highlight)
                .foregroundStyle(page.highlightColor)
            + Text(parts.after)
                .foregroundStyle(WSColor.duoText)
        )
        .wsHeadline(.huge, weight: .black)
    }

    private func splitHeadline(_ headline: String, highlight: String?) -> (before: String, highlight: String, after: String) {
        guard let h = highlight, !h.isEmpty,
              let range = headline.range(of: h) else {
            return (headline, "", "")
        }
        return (
            before: String(headline[..<range.lowerBound]),
            highlight: String(headline[range]),
            after: String(headline[range.upperBound...])
        )
    }
}

#Preview {
    OnboardingFlow(onboardingComplete: .constant(false), session: AuthSession())
}
