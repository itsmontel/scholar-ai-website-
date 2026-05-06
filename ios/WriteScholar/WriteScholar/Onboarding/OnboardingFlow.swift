//
//  OnboardingFlow.swift
//  WriteScholar
//
//  Coordinator for the 7-page onboarding. Each page renders a shared
//  layout (eyebrow + headline + supporting copy + per-page hero) on top
//  of a unique gradient backdrop that morphs between pages.
//

import SwiftUI

struct OnboardingFlow: View {
    @Binding var onboardingComplete: Bool
    @State private var pageIndex: Int = 0

    private let pages = OnboardingPage.all

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Background — cross-fades between page-specific gradients
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
            // Logo dot — quick brand anchor
            Image(systemName: "graduationcap.fill")
                .foregroundStyle(WSGradient.brand)
                .font(.system(size: 22, weight: .bold))
            Text("WriteScholar")
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foreground)
            Spacer()
            if pageIndex < pages.count - 1 {
                Button {
                    Haptics.light()
                    finishOnboarding()
                } label: {
                    HStack(spacing: 5) {
                        Text("Skip")
                            .wsBody(.caption, weight: .bold)
                        Image(systemName: "arrow.forward")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(WSColor.brandPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(
                        Capsule()
                            .fill(WSColor.brandSoft)
                            .overlay(Capsule().stroke(WSColor.brandPrimary.opacity(0.30), lineWidth: 1))
                    )
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Bottom bar (page indicator + CTA)

    private var bottomBar: some View {
        VStack(spacing: 14) {
            pageIndicator
            primaryCTA

            // Welcome-page only: tertiary "I've used this — skip to app".
            // Gives existing/return users a clean escape hatch without
            // making everyone scan the top-right Skip chip.
            if pageIndex == 0 {
                Button {
                    Haptics.light()
                    finishOnboarding()
                } label: {
                    HStack(spacing: 6) {
                        Text("I've used this — skip onboarding")
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
        HStack(spacing: 6) {
            ForEach(pages.indices, id: \.self) { idx in
                Capsule()
                    .fill(idx == pageIndex ? WSColor.brandPrimary : WSColor.foregroundMuted.opacity(0.25))
                    .frame(width: idx == pageIndex ? 28 : 8, height: 8)
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
        .buttonStyle(WSPrimaryButtonStyle())
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
            finishOnboarding()
        }
    }

    private func finishOnboarding() {
        withAnimation(.easeInOut(duration: 0.35)) {
            onboardingComplete = true
        }
    }

    /// 1.0 when this index is the active page, 0 otherwise. Used by hero
    /// views to decide when to start their entrance animations.
    private func progress(at idx: Int) -> CGFloat {
        idx == pageIndex ? 1.0 : 0.0
    }

    private func opacityForBackdrop(at idx: Int) -> Double {
        idx == pageIndex ? 1.0 : 0.0
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

            // Copy block — eyebrow + headline + supporting
            VStack(spacing: 14) {
                Text(page.eyebrow)
                    .wsEyebrow()
                    .foregroundStyle(WSColor.brandPrimary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        Capsule().fill(WSColor.brandSoft)
                    )

                styledHeadline
                    .multilineTextAlignment(.center)

                Text(page.supporting)
                    .wsBody(.medium)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 12)
                    .lineSpacing(2)
            }
            .padding(.bottom, 12)
        }
    }

    /// Renders the headline with the highlighted slice in a brand gradient.
    /// Concatenated `Text` lets each segment carry its own foregroundStyle
    /// while font + tracking apply to the whole composed Text.
    private var styledHeadline: some View {
        let parts = splitHeadline(page.headline, highlight: page.highlight)
        return (
            Text(parts.before)
                .foregroundStyle(WSColor.foreground)
            + Text(parts.highlight)
                .foregroundStyle(WSGradient.brand)
            + Text(parts.after)
                .foregroundStyle(WSColor.foreground)
        )
        .font(WSFont.serif(32, weight: .semibold))
        .tracking(-0.5)
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
    OnboardingFlow(onboardingComplete: .constant(false))
}
