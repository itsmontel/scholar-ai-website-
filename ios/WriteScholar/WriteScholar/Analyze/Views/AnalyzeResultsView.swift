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

    @Environment(\.dismiss) private var dismiss

    @State private var tab: ResultTab = .highlights
    @State private var celebrate = 0
    @State private var didCelebrate = false
    /// false = mockup summary (grade badge · score card · criteria rows);
    /// true = the deep three-tab feedback layer.
    @State private var showFullFeedback = false
    /// Count-up value for the big score numeral.
    @State private var displayedScore = 0

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
                screenHeader
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                if showFullFeedback {
                    tabStrip
                        .padding(.top, 12)
                    content(for: tab)
                } else {
                    summaryLayer
                }
            }

            WSConfettiView(trigger: $celebrate)
                .allowsHitTesting(false)
        }
        .onAppear {
            guard !didCelebrate else { return }
            didCelebrate = true
            if scoreFraction >= 0.7 {
                celebrate += 1
                Haptics.success()
            }
            countUpScore()
        }
    }

    // MARK: - Header  (‹ · Essay Analyzer · ↻)

    private var screenHeader: some View {
        HStack {
            Button {
                Haptics.light()
                if showFullFeedback {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
                        showFullFeedback = false
                    }
                } else {
                    dismiss()
                }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .frame(width: 38, height: 38)
                    .background(
                        Circle()
                            .fill(WSColor.backgroundElevated)
                            .shadow(color: Color.black.opacity(0.05), radius: 5, y: 2)
                    )
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel(showFullFeedback ? "Back to summary" : "Close")

            Spacer()
            Text("Essay Analyzer")
                .wsHeadline(.small, weight: .black)
                .foregroundStyle(WSColor.foreground)
            Spacer()

            Button {
                Haptics.light()
                Task { await coordinator.analyze(text: content) }
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(WSColor.duoPurple)
                    .frame(width: 38, height: 38)
                    .background(
                        Circle()
                            .fill(WSColor.backgroundElevated)
                            .shadow(color: Color.black.opacity(0.05), radius: 5, y: 2)
                    )
            }
            .buttonStyle(WSBouncyButtonStyle())
            .accessibilityLabel("Re-analyze")
        }
    }

    // MARK: - Summary layer (the mockup screen)

    private var summaryLayer: some View {
        ScrollView {
            VStack(spacing: 16) {
                celebrationHeader.wsStaggerEntry(0)
                overallScoreCard.wsStaggerEntry(1)
                criteriaRows.wsStaggerEntry(2)
                Spacer(minLength: 8)
            }
            .padding(.horizontal, 16)
            .padding(.top, 18)
            .padding(.bottom, 16)
        }
        .safeAreaInset(edge: .bottom) { bottomCTA }
    }

    /// "Great work!" + the circular letter-grade badge.
    private var celebrationHeader: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text(encouragement)
                    .wsHeadline(.large, weight: .black)
                    .foregroundStyle(WSColor.foreground)
                if let clarity = result.clarityRating, !clarity.isEmpty {
                    Text("Clarity: \(clarity)")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
            Spacer()
            ZStack {
                Circle()
                    .fill(tierColor)
                    .frame(width: 76, height: 76)
                    .shadow(color: tierColor.opacity(0.4), radius: 12, y: 5)
                let gradeText = result.gradeEstimate ?? scoreLabel
                Text(gradeText)
                    .font(WSFont.headline(gradeText.count > 2 ? 22 : 30, weight: .black))
                    .foregroundStyle(.white)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                    .padding(.horizontal, 6)
            }
        }
        .padding(.top, 4)
    }

    /// Big "82 / 100" + red→yellow→green gradient bar with a marker.
    private var overallScoreCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("OVERALL SCORE")
                .font(WSFont.sans(10, weight: .black))
                .tracking(1.2)
                .foregroundStyle(WSColor.foregroundMuted)

            HStack(alignment: .firstTextBaseline, spacing: 5) {
                Text("\(displayedScore)")
                    .font(WSFont.headline(44, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .monospacedDigit()
                Text("/ 100")
                    .wsBody(.large, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [WSColor.duoRed, WSColor.duoOrange, WSColor.duoYellow, WSColor.duoGreen],
                                startPoint: .leading, endPoint: .trailing
                            )
                        )
                        .frame(height: 12)
                    Circle()
                        .fill(.white)
                        .frame(width: 20, height: 20)
                        .overlay(Circle().stroke(tierColor, lineWidth: 3))
                        .shadow(color: Color.black.opacity(0.18), radius: 3, y: 1)
                        .offset(x: (geo.size.width - 20) * scoreFraction)
                        .animation(.spring(response: 0.8, dampingFraction: 0.75), value: displayedScore)
                }
                .frame(maxHeight: .infinity, alignment: .center)
            }
            .frame(height: 22)

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
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 22)
    }

    /// The mockup's criteria rows — real scores when the rubric exists,
    /// locked rows for free users.
    @ViewBuilder
    private var criteriaRows: some View {
        VStack(spacing: 10) {
            if let rubric = result.gradeRubric, !rubric.isEmpty {
                ForEach(Self.orderedRubricKeys(rubric), id: \.self) { key in
                    if let criterion = rubric[key] {
                        criteriaRow(key: key, criterion: criterion)
                    }
                }
            } else if result.lockedFeatures?.contains("grade_rubric") == true {
                ForEach(Self.expectedCriteria, id: \.self) { key in
                    lockedCriteriaRow(key: key)
                }
            }
        }
    }

    private func criteriaRow(key: String, criterion: RubricCriterion) -> some View {
        let meta = Self.criteriaMeta(for: key)
        let frac = criterion.fraction
        let scoreColor: Color = frac >= 0.85 ? WSColor.duoGreen : (frac >= 0.65 ? WSColor.duoBlue : (frac >= 0.45 ? WSColor.duoOrange : WSColor.duoRed))
        return HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(meta.tint.opacity(0.14))
                .frame(width: 44, height: 44)
                .overlay(
                    Image(systemName: meta.icon)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(meta.tint)
                )
            Text(Self.prettyCriteriaKey(key))
                .wsBody(.medium, weight: .black)
                .foregroundStyle(WSColor.foreground)
                .lineLimit(1)
            Spacer(minLength: 8)
            if let s = criterion.score, let m = criterion.maxScore {
                Text("\(Int(s))/\(Int(m))")
                    .wsBody(.large, weight: .black)
                    .foregroundStyle(scoreColor)
                    .monospacedDigit()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 16, horizontalPadding: 14, verticalPadding: 12)
    }

    private func lockedCriteriaRow(key: String) -> some View {
        let meta = Self.criteriaMeta(for: key)
        return HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(meta.tint.opacity(0.10))
                .frame(width: 44, height: 44)
                .overlay(
                    Image(systemName: meta.icon)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(meta.tint.opacity(0.55))
                )
            Text(Self.prettyCriteriaKey(key))
                .wsBody(.medium, weight: .black)
                .foregroundStyle(WSColor.foregroundMuted)
                .lineLimit(1)
            Spacer(minLength: 8)
            Image(systemName: "lock.fill")
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(WSColor.duoOrange)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 16, horizontalPadding: 14, verticalPadding: 12)
    }

    /// Mascot + wide "View full feedback" purple button.
    private var bottomCTA: some View {
        HStack(spacing: 12) {
            WSAnimatedImage(name: "mascot-paper", ext: "webp")
                .frame(width: 66, height: 66)
                .wsBobbing()
            Button {
                Haptics.medium()
                withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
                    showFullFeedback = true
                }
            } label: {
                Text("View full feedback").frame(maxWidth: .infinity)
            }
            .buttonStyle(WSDuoPrimaryButtonStyle(fullWidth: true))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            WSColor.backgroundElevated
                .shadow(color: Color.black.opacity(0.06), radius: 10, y: -3)
                .ignoresSafeArea(edges: .bottom)
        )
    }

    // MARK: - Criteria metadata

    static let expectedCriteria = ["thesis_argument", "organization", "writing_quality", "grammar_mechanics"]

    static func criteriaMeta(for key: String) -> (icon: String, tint: Color) {
        switch key {
        case "thesis_argument", "argument", "thesis": return ("lightbulb.fill", WSColor.duoBlue)
        case "organization", "structure":             return ("square.stack.3d.up.fill", WSColor.duoOrange)
        case "writing_quality", "style", "clarity":   return ("pencil.and.outline", WSColor.duoPurple)
        case "grammar_mechanics", "grammar":          return ("checkmark.seal.fill", WSColor.duoGreen)
        case "evidence", "citations":                 return ("text.quote", WSColor.duoPink)
        default:                                      return ("doc.text.fill", WSColor.duoPurple)
        }
    }

    static func prettyCriteriaKey(_ key: String) -> String {
        switch key {
        case "thesis_argument":   return "Thesis & Argument"
        case "grammar_mechanics": return "Grammar & Mechanics"
        default:
            return key.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    /// Mockup ordering first, then legacy keys, then anything else.
    static func orderedRubricKeys(_ dict: [String: RubricCriterion]) -> [String] {
        let preferred = ["thesis_argument", "organization", "writing_quality", "grammar_mechanics",
                         "structure", "argument", "evidence", "clarity", "citations", "style", "tone", "grammar"]
        let knownInOrder = preferred.filter { dict.keys.contains($0) }
        let extras = dict.keys.filter { !preferred.contains($0) }.sorted()
        return knownInOrder + extras
    }

    private var tierColor: Color {
        scoreFraction >= 0.7 ? WSColor.duoGreen : (scoreFraction >= 0.45 ? WSColor.duoOrange : WSColor.duoRed)
    }

    /// Animates the big numeral 0 → score over ~0.8s.
    private func countUpScore() {
        guard let target = result.overallScore.map({ Int(round($0)) }), target > 0 else { return }
        displayedScore = 0
        let steps = 24
        for step in 1...steps {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8 * Double(step) / Double(steps)) {
                displayedScore = Int(Double(target) * Double(step) / Double(steps))
            }
        }
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
        // Comprehensive-analysis keys first (mockup order), then legacy keys,
        // then anything else alphabetically.
        let preferred = ["thesis_argument", "organization", "writing_quality", "grammar_mechanics",
                         "structure", "argument", "evidence", "clarity", "citations", "style", "tone", "grammar"]
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
                    startIndex: 26, endIndex: 38,
                    comment: "Strong, focused thesis sets up the rest of the essay.",
                    suggestion: nil, isCoverageOnly: nil
                ),
                Annotation(
                    id: "2", type: .improve, text: "transitions between paragraphs are abrupt",
                    startIndex: 49, endIndex: 90,
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
