//
//  AnalyzeResultsView.swift
//  WriteScholar
//
//  Three-tab results screen:
//    Highlights -- essay rendered with inline annotation backgrounds +
//                 a list of annotation cards underneath.
//    Rubric    -- per-criterion bars (Pro). Free users see a lock pane.
//    Tips      -- top suggestions + Pro CTA for Specific Rewrites.
//
//  The score banner sits above the tab strip so the headline number is
//  always visible while you switch tabs.
//

import SwiftUI

struct AnalyzeResultsView: View {
    let content: String
    let result: AnalysisResult
    @ObservedObject var coordinator: AnalyzeCoordinator

    @State private var tab: ResultTab = .highlights
    @State private var celebrate = 0
    @State private var didCelebrate = false

    enum ResultTab: String, CaseIterable, Identifiable {
        case highlights = "Highlights"
        case rubric     = "Rubric"
        case tips       = "Tips"
        var id: Self { self }

        var icon: String {
            switch self {
            case .highlights: return "highlighter"
            case .rubric:     return "list.bullet.clipboard.fill"
            case .tips:       return "lightbulb.fill"
            }
        }
    }

    var body: some View {
        ZStack {
            WSColor.background.ignoresSafeArea()

            VStack(spacing: 0) {
                scoreBanner
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                tabStrip
                    .padding(.top, 12)

                Divider()

                content(for: tab)
            }

            WSConfettiView(trigger: $celebrate)
                .allowsHitTesting(false)
        }
        .onAppear {
            guard !didCelebrate else { return }
            didCelebrate = true
            if scoreFraction >= 0.7 { celebrate += 1 }
        }
    }

    // MARK: - Score banner

    private var scoreBanner: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .stroke(WSColor.duoSurface, lineWidth: 6)
                    .frame(width: 70, height: 70)
                Circle()
                    .trim(from: 0, to: scoreFraction)
                    .stroke(scoreFraction >= 0.7 ? WSColor.duoGreen : (scoreFraction >= 0.45 ? WSColor.duoOrange : WSColor.duoRed),
                            style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 70, height: 70)
                    .shadow(color: (scoreFraction >= 0.7 ? WSColor.duoGreen : WSColor.duoOrange).opacity(0.4), radius: 6, y: 1)
                Text(scoreLabel)
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.duoText)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(encouragement)
                    .wsHeadline(.small, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                Text(result.gradeEstimate ?? "Analysis ready")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
                if let clarity = result.clarityRating, !clarity.isEmpty {
                    HStack(spacing: 6) {
                        Image(systemName: "eye")
                            .foregroundStyle(WSColor.foregroundMuted)
                        Text("Clarity: \(clarity)")
                            .wsBody(.caption, weight: .semibold)
                            .foregroundStyle(WSColor.foregroundMuted)
                    }
                }
                if let lockedFeatures = result.lockedFeatures, !lockedFeatures.isEmpty {
                    HStack(spacing: 5) {
                        Image(systemName: "lock.fill")
                            .foregroundStyle(WSColor.duoOrange)
                            .font(.system(size: 10, weight: .bold))
                        Text("\(lockedFeatures.count) Pro features locked")
                            .wsBody(.caption, weight: .bold)
                            .foregroundStyle(WSColor.duoOrange)
                    }
                }
            }

            Spacer()

            Button {
                coordinator.reset()
            } label: {
                Label("New", systemImage: "plus")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.duoPurple)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(WSColor.duoPurpleLight))
            }
            .buttonStyle(.plain)
        }
        .padding(14)
        .wsChunkyCard(
            cornerRadius: 22,
            horizontalPadding: 0,
            verticalPadding: 0,
            accent: scoreFraction >= 0.7 ? WSColor.duoGreen : (scoreFraction >= 0.45 ? WSColor.duoOrange : WSColor.duoRed)
        )
    }

    private var scoreFraction: CGFloat {
        guard let s = result.overallScore else { return 0 }
        return min(1.0, max(0.0, CGFloat(s / 100.0)))
    }

    private var scoreLabel: String {
        if let s = result.overallScore {
            return "\(Int(round(s)))"
        }
        return "--"
    }

    private var encouragement: String {
        let f = scoreFraction
        if f >= 0.85 { return "Excellent work! 🎉" }
        if f >= 0.70 { return "Great work! 👏" }
        if f >= 0.50 { return "Good effort 💪" }
        return "Keep going 📈"
    }

    // MARK: - Tab strip

    private var tabStrip: some View {
        HStack(spacing: 8) {
            ForEach(ResultTab.allCases) { t in
                let active = (tab == t)
                Button {
                    Haptics.selection()
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        tab = t
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: t.icon)
                            .font(.system(size: 13, weight: .bold))
                        Text(t.rawValue)
                            .wsBody(.small, weight: .bold)
                    }
                    .foregroundStyle(active ? .white : WSColor.duoPurple)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(
                        Capsule()
                            .fill(active ? WSColor.duoPurple : WSColor.duoPurpleLight)
                            .shadow(color: active ? WSColor.duoPurple.opacity(0.3) : .clear, radius: 8, y: 3)
                    )
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 10)
    }

    // MARK: - Tab content

    @ViewBuilder
    private func content(for tab: ResultTab) -> some View {
        switch tab {
        case .highlights: HighlightsTab(content: content, annotations: result.sortedAnnotations)
        case .rubric:     RubricTab(rubric: result.gradeRubric)
        case .tips:       TipsTab(suggestions: result.topSuggestions ?? [], rewrites: result.specificRewrites)
        }
    }
}

// MARK: - Highlights tab

private struct HighlightsTab: View {
    let content: String
    let annotations: [Annotation]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                annotatedEssay
                    .padding(16)
                    .wsChunkyCard(accent: WSColor.duoPurple)

                if annotations.isEmpty {
                    Text("No annotations were returned.")
                        .wsBody(.small)
                        .foregroundStyle(WSColor.foregroundMuted)
                        .frame(maxWidth: .infinity, alignment: .center)
                } else {
                    legendRow

                    VStack(spacing: 10) {
                        ForEach(annotations) { ann in
                            AnnotationCard(annotation: ann)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
        }
    }

    private var legendRow: some View {
        HStack(spacing: 8) {
            Text("\(annotations.count) annotations")
                .wsBody(.caption, weight: .bold)
                .foregroundStyle(WSColor.duoText)
            Spacer()
            ForEach([Annotation.AnnotationType.strong, .improve, .concern], id: \.self) { type in
                let count = annotations.filter { $0.type == type }.count
                if count > 0 {
                    HStack(spacing: 5) {
                        Circle().fill(tint(for: type)).frame(width: 8, height: 8)
                        Text("\(count)")
                            .wsBody(.caption, weight: .bold)
                            .foregroundStyle(WSColor.duoText)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Capsule().fill(tint(for: type).opacity(0.15)))
                }
            }
        }
    }

    private func tint(for type: Annotation.AnnotationType) -> Color {
        switch type {
        case .strong:  return WSColor.duoGreen
        case .improve: return WSColor.duoOrange
        case .concern: return WSColor.duoRed
        }
    }

    /// Renders the essay with inline colored backgrounds for each annotation
    /// span. Concatenated `Text` segments keep this lightweight; tap detection
    /// happens via the AnnotationCard list below.
    private var annotatedEssay: some View {
        let segments = AnnotationLayout.segments(for: content, annotations: annotations)
        // Build a single Text by concatenating styled segments.
        var composed: Text = Text("")
        for seg in segments {
            var t = Text(seg.text)
            if let ann = seg.annotation {
                t = t.foregroundColor(WSColor.duoText)
                    .font(WSFont.sans(15, weight: .semibold))
                    .underline(true, color: ann.tint.opacity(0.85))
            } else {
                t = t.foregroundColor(WSColor.duoText)
                    .font(WSFont.sans(15))
            }
            composed = composed + t
        }
        return composed
            .lineSpacing(5)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Annotation card

private struct AnnotationCard: View {
    let annotation: Annotation

    @State private var expanded = false

    /// Annotation type -> Duolingo color
    private var cardTint: Color {
        switch annotation.type {
        case .strong:  return WSColor.duoGreen
        case .improve: return WSColor.duoOrange
        case .concern: return WSColor.duoRed
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: annotation.icon)
                    .foregroundStyle(cardTint)
                    .shadow(color: cardTint.opacity(0.5), radius: 4)
                Text(annotation.label.uppercased())
                    .wsEyebrow()
                    .foregroundStyle(cardTint)
                Spacer()
                Button {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                        expanded.toggle()
                    }
                } label: {
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                .buttonStyle(.plain)
            }

            Text("\"\(annotation.text)\"")
                .wsBody(.small)
                .foregroundStyle(WSColor.duoText)
                .lineLimit(expanded ? nil : 2)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(cardTint.opacity(0.10))
                        .overlay(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(cardTint.opacity(0.30), lineWidth: 1)
                        )
                )

            Text(annotation.comment)
                .wsBody(.small)
                .foregroundStyle(WSColor.duoText.opacity(0.92))
                .lineLimit(expanded ? nil : 3)

            if expanded, let suggestion = annotation.suggestion, !suggestion.isEmpty {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "wand.and.stars")
                        .foregroundStyle(cardTint)
                    Text(suggestion)
                        .wsBody(.small, weight: .semibold)
                        .foregroundStyle(WSColor.duoText)
                }
                .padding(10)
                .background(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(cardTint.opacity(0.10))
                )
                .transition(.opacity.combined(with: .scale(scale: 0.98)))
            }
        }
        .padding(14)
        .wsChunkyCard(
            cornerRadius: 16,
            horizontalPadding: 0,
            verticalPadding: 0,
            lipHeight: 4,
            accent: cardTint
        )
        .contentShape(Rectangle())
        .onTapGesture {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                expanded.toggle()
            }
            Haptics.selection()
        }
    }
}

// MARK: - Annotation layout helper

enum AnnotationLayout {
    struct Segment {
        let text: String
        let annotation: Annotation?
    }

    /// Splits `content` into segments at each annotation boundary so we
    /// can build a single concatenated `Text` view with per-span styling.
    /// Overlapping ranges are clipped; out-of-range indices are ignored.
    static func segments(for content: String, annotations: [Annotation]) -> [Segment] {
        let chars = Array(content)
        guard !chars.isEmpty else { return [Segment(text: content, annotation: nil)] }

        // Sort + deduplicate by clamped range
        let valid = annotations.compactMap { a -> (Int, Int, Annotation)? in
            let s = max(0, min(chars.count, a.startIndex))
            let e = max(s, min(chars.count, a.endIndex))
            guard e > s else { return nil }
            return (s, e, a)
        }.sorted { $0.0 < $1.0 }

        var out: [Segment] = []
        var cursor = 0
        for (s, e, ann) in valid {
            if s > cursor {
                let plain = String(chars[cursor..<s])
                out.append(Segment(text: plain, annotation: nil))
            }
            // Skip if overlapping with a previous one (cursor already past s)
            let start = max(s, cursor)
            if start < e {
                let highlighted = String(chars[start..<e])
                out.append(Segment(text: highlighted, annotation: ann))
                cursor = e
            }
        }
        if cursor < chars.count {
            out.append(Segment(text: String(chars[cursor...]), annotation: nil))
        }
        return out
    }
}

// MARK: - Rubric tab

private struct RubricTab: View {
    let rubric: [String: RubricCriterion]?

    var body: some View {
        if let r = rubric, !r.isEmpty {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(orderedKeys(r), id: \.self) { key in
                        if let criterion = r[key] {
                            criterionRow(name: prettyKey(key), criterion: criterion)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
            }
        } else {
            ProLockPane(
                title: "Rubric is a Pro feature",
                message: "Upgrade to see a per-criterion grade rubric -- structure, argument, citations, clarity, and academic style scored individually.",
                icon: "list.bullet.clipboard.fill"
            )
        }
    }

    private func orderedKeys(_ dict: [String: RubricCriterion]) -> [String] {
        // Common ordering -- fall back to alpha for unknown keys
        let preferred = ["structure", "argument", "evidence", "clarity", "citations", "style", "tone", "grammar"]
        let knownInOrder = preferred.filter { dict.keys.contains($0) }
        let extras = dict.keys.filter { !preferred.contains($0) }.sorted()
        return knownInOrder + extras
    }

    private func prettyKey(_ key: String) -> String {
        key
            .replacingOccurrences(of: "_", with: " ")
            .capitalized
    }

    private func criterionRow(name: String, criterion: RubricCriterion) -> some View {
        let frac = criterion.fraction
        let color: Color = {
            if frac >= 0.85 { return WSColor.duoGreen }
            if frac >= 0.65 { return WSColor.duoBlue }
            if frac >= 0.45 { return WSColor.duoOrange }
            return WSColor.duoRed
        }()

        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(name)
                    .wsBody(.medium, weight: .black)
                    .foregroundStyle(WSColor.duoText)
                Spacer()
                if let s = criterion.score, let m = criterion.maxScore {
                    Text("\(Int(s)) / \(Int(m))")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(color))
                }
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(WSColor.duoSurface).frame(height: 10)
                        .overlay(Capsule().stroke(WSColor.duoBorder, lineWidth: 1))
                    Capsule()
                        .fill(color)
                        .frame(width: max(10, geo.size.width * frac), height: 10)
                        .shadow(color: color.opacity(0.5), radius: 4, y: 1)
                }
            }
            .frame(height: 10)

            if let feedback = criterion.feedback, !feedback.isEmpty {
                Text(feedback)
                    .wsBody(.small)
                    .foregroundStyle(WSColor.duoText.opacity(0.9))
            }
        }
        .padding(14)
        .wsChunkyCard(
            cornerRadius: 16,
            horizontalPadding: 0,
            verticalPadding: 0,
            lipHeight: 4,
            accent: color
        )
    }
}

// MARK: - Tips tab

private struct TipsTab: View {
    let suggestions: [String]
    let rewrites: [SpecificRewrite]?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if suggestions.isEmpty {
                    EmptyStateView(
                        icon: "lightbulb",
                        title: "No tips returned",
                        message: "The analyzer didn't surface specific suggestions for this paper."
                    )
                    .frame(minHeight: 280)
                } else {
                    ForEach(Array(suggestions.enumerated()), id: \.offset) { idx, tip in
                        suggestionRow(idx: idx, tip: tip)
                    }
                }

                if let rw = rewrites, !rw.isEmpty {
                    rewriteBlock(rewrites: rw)
                } else {
                    proRewriteTeaser
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
        }
    }

    private func suggestionRow(idx: Int, tip: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(WSColor.duoPurple)
                    .frame(width: 28, height: 28)
                Text("\(idx + 1)")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(.white)
            }
            Text(tip)
                .wsBody(.medium)
                .foregroundStyle(WSColor.duoText)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .wsChunkyCard(
            cornerRadius: 16,
            horizontalPadding: 0,
            verticalPadding: 0,
            lipHeight: 4,
            accent: WSColor.duoPurple
        )
    }

    private func rewriteBlock(rewrites: [SpecificRewrite]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Suggested rewrites")
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.duoText)

            ForEach(rewrites) { rw in
                VStack(alignment: .leading, spacing: 8) {
                    if let original = rw.original {
                        Text(original)
                            .wsBody(.small)
                            .foregroundStyle(WSColor.duoText.opacity(0.85))
                            .strikethrough(true, color: WSColor.duoRed.opacity(0.7))
                            .padding(10)
                            .background(
                                RoundedRectangle(cornerRadius: 10).fill(WSColor.duoRedLight)
                            )
                    }
                    if let rewrite = rw.rewrite {
                        Text(rewrite)
                            .wsBody(.small, weight: .semibold)
                            .foregroundStyle(WSColor.duoText)
                            .padding(10)
                            .background(
                                RoundedRectangle(cornerRadius: 10).fill(WSColor.duoGreenLight)
                            )
                    }
                    if let reason = rw.reason {
                        HStack(spacing: 6) {
                            Image(systemName: "lightbulb.fill")
                                .foregroundStyle(WSColor.duoOrange)
                            Text(reason)
                                .wsBody(.caption, weight: .semibold)
                                .foregroundStyle(WSColor.foregroundMuted)
                        }
                    }
                }
                .padding(14)
                .wsChunkyCard(
                    cornerRadius: 16,
                    horizontalPadding: 0,
                    verticalPadding: 0,
                    lipHeight: 4,
                    accent: WSColor.duoGreen
                )
            }
        }
        .padding(.top, 6)
    }

    private var proRewriteTeaser: some View {
        HStack(spacing: 12) {
            Image(systemName: "wand.and.stars")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(WSColor.duoOrange)
            VStack(alignment: .leading, spacing: 2) {
                Text("Specific rewrites are Pro")
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.duoText)
                Text("See exactly which sentences to swap and why.")
                    .wsBody(.caption)
                    .foregroundStyle(WSColor.foregroundMuted)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(WSColor.foregroundMuted)
                .font(.system(size: 13, weight: .bold))
        }
        .padding(14)
        .wsChunkyCard(
            cornerRadius: 16,
            horizontalPadding: 0,
            verticalPadding: 0,
            lipHeight: 4,
            accent: WSColor.duoOrange
        )
    }
}

// MARK: - Pro lock pane (shared)

struct ProLockPane: View {
    let title: String
    let message: String
    let icon: String

    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(WSColor.duoOrangeLight)
                    .frame(width: 100, height: 100)
                Image(systemName: icon)
                    .font(.system(size: 36, weight: .semibold))
                    .foregroundStyle(WSColor.duoOrange)
            }
            Text(title)
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.duoText)
            Text(message)
                .wsBody(.small)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Upgrade to Pro") {
                // Chapter 6 -- RevenueCat paywall
            }
            .buttonStyle(WSDuoWarnButtonStyle(fullWidth: false))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

#Preview {
    AnalyzeResultsView(
        content: "The introduction states a clear thesis. However, transitions between paragraphs are abrupt. The conclusion is concise.",
        result: AnalysisResult(
            result: "Solid draft.",
            annotations: [
                Annotation(
                    id: "1", type: .strong, text: "clear thesis",
                    startIndex: 32, endIndex: 44,
                    comment: "Strong, focused thesis sets up the rest of the essay.",
                    suggestion: nil, isCoverageOnly: nil
                ),
                Annotation(
                    id: "2", type: .improve, text: "transitions between paragraphs are abrupt",
                    startIndex: 56, endIndex: 96,
                    comment: "Add transitional phrases to guide the reader.",
                    suggestion: "Try a connector like 'Building on this...' to link the next paragraph.",
                    isCoverageOnly: nil
                )
            ],
            overallScore: 82,
            gradeEstimate: "B+",
            clarityRating: "Mostly clear",
            topSuggestions: [
                "Add explicit transitions between body paragraphs.",
                "Quote your sources directly when supporting key claims."
            ],
            gradeRubric: nil,
            specificRewrites: nil,
            lockedFeatures: ["grade_rubric", "specific_rewrites"],
            isContentLimited: false,
            savedAnalysisId: nil
        ),
        coordinator: AnalyzeCoordinator()
    )
}
