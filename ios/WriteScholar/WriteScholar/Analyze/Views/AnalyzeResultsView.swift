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
                    // Essays is a tab now, so "back" returns to a fresh input.
                    coordinator.reset()
                }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .frame(width: 40, height: 40)
                    .wsStickerCircle(fill: WSColor.backgroundElevated, depth: 3)
                    .padding(.bottom, 3)
            }
            .buttonStyle(WSStickerPressStyle())
            .accessibilityLabel(showFullFeedback ? "Back to summary" : "Grade another essay")

            Spacer()
            WSKicker(text: showFullFeedback ? "Every comment" : "Essay grade")
            Spacer()

            Button {
                Haptics.light()
                Task { await coordinator.analyze(text: content) }
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .frame(width: 40, height: 40)
                    .wsStickerCircle(fill: WSColor.backgroundElevated, depth: 3)
                    .padding(.bottom, 3)
            }
            .buttonStyle(WSStickerPressStyle())
            .accessibilityLabel("Re-analyze")
        }
    }

    // MARK: - Summary layer (the mockup screen)

    private var summaryLayer: some View {
        ScrollView {
            VStack(spacing: 16) {
                celebrationHeader
                overallScoreCard.wsPop(delay: 0.1)
                criteriaRows
                Spacer(minLength: 8)
            }
            .padding(.horizontal, 20)
            .padding(.top, 18)
            .padding(.bottom, 16)
        }
        .safeAreaInset(edge: .bottom) { bottomCTA }
    }

    /// Headline + the letter-grade sticker on a spinning starburst.
    private var celebrationHeader: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                WSKicker(text: "Your essay grade")
                Text(encouragement)
                    .font(WSFont.headline(32, weight: .black))
                    .tracking(-1)
                    .foregroundStyle(WSColor.foreground)
                    .fixedSize(horizontal: false, vertical: true)
                if let clarity = result.clarityRating, !clarity.isEmpty {
                    Text("Clarity: \(clarity)")
                        .wsBody(.small, weight: .bold)
                        .foregroundStyle(WSColor.foregroundMuted)
                }
            }
            Spacer(minLength: 0)
            ZStack {
                WSStarburst(points: 14, inset: 0.84)
                    .fill(WSColor.sun)
                    .overlay(WSStarburst(points: 14, inset: 0.84).stroke(WSColor.ink, lineWidth: 2.5))
                    .frame(width: 124, height: 124)
                    .wsSpin(period: 18)
                let gradeText = result.gradeEstimate ?? scoreLabel
                Text(gradeText)
                    .font(WSFont.headline(gradeText.count > 2 ? 26 : 40, weight: .black))
                    .tracking(-1)
                    .foregroundStyle(WSColor.inkText)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                    .frame(width: 80, height: 80)
                    .wsStickerCircle(fill: .white, depth: 4)
                    .rotationEffect(.degrees(-6))
            }
            .wsPop(delay: 0.15)
            .accessibilityLabel("Grade \(result.gradeEstimate ?? scoreLabel)")
        }
        .padding(.top, 4)
    }

    /// Big "82 / 100" + a striped bar in the tier color.
    private var overallScoreCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            WSKicker(text: "Overall score")

            HStack(alignment: .firstTextBaseline, spacing: 5) {
                Text("\(displayedScore)")
                    .font(WSFont.headline(56, weight: .black))
                    .tracking(-2)
                    .foregroundStyle(WSColor.foreground)
                    .monospacedDigit()
                Text("/ 100")
                    .font(WSFont.headline(20, weight: .black))
                    .foregroundStyle(WSColor.foregroundMuted)
                Spacer()
                if let lockedFeatures = result.lockedFeatures, !lockedFeatures.isEmpty {
                    WSStickerBadge(text: "\(lockedFeatures.count) Pro locked", icon: "lock.fill", fill: WSColor.sun, size: 13, depth: 2, radius: 10)
                }
            }

            WSStripeBar(fraction: Double(scoreFraction), fill: tierColor, height: 16)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 24)
    }

    /// The criteria rows — real scores when the rubric exists, locked
    /// rows for free users.
    @ViewBuilder
    private var criteriaRows: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let rubric = result.gradeRubric, !rubric.isEmpty {
                Text("The breakdown")
                    .font(WSFont.headline(22, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .padding(.top, 4)
                ForEach(Array(Self.orderedRubricKeys(rubric).enumerated()), id: \.element) { i, key in
                    if let criterion = rubric[key] {
                        criteriaRow(key: key, criterion: criterion)
                            .wsPop(delay: 0.2 + Double(i) * 0.06)
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
        let barColor: Color = frac >= 0.85 ? WSColor.lime : (frac >= 0.65 ? WSColor.sky : (frac >= 0.45 ? WSColor.orange : WSColor.pink))
        return VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                Image(systemName: meta.icon)
                    .font(.system(size: 17, weight: .black))
                    .foregroundStyle(WSColor.inkText)
                    .frame(width: 42, height: 42)
                    .background(
                        ZStack {
                            RoundedRectangle(cornerRadius: 13, style: .continuous).fill(WSStickerTint.face(for: meta.tint))
                            RoundedRectangle(cornerRadius: 13, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                        }
                    )
                Text(Self.prettyCriteriaKey(key))
                    .font(WSFont.headline(17, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                    .lineLimit(1)
                Spacer(minLength: 8)
                if let s = criterion.score, let m = criterion.maxScore {
                    Text("\(Int(s))/\(Int(m))")
                        .font(WSFont.headline(18, weight: .black))
                        .foregroundStyle(WSColor.foreground)
                        .monospacedDigit()
                }
            }
            WSStripeBar(fraction: frac, fill: barColor, height: 12, stripes: false)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 20, horizontalPadding: 14, verticalPadding: 12)
    }

    private func lockedCriteriaRow(key: String) -> some View {
        let meta = Self.criteriaMeta(for: key)
        return HStack(spacing: 12) {
            Image(systemName: meta.icon)
                .font(.system(size: 17, weight: .black))
                .foregroundStyle(WSColor.inkText.opacity(0.5))
                .frame(width: 42, height: 42)
                .background(
                    ZStack {
                        RoundedRectangle(cornerRadius: 13, style: .continuous).fill(WSColor.lilacDeep)
                        RoundedRectangle(cornerRadius: 13, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke)
                    }
                )
            Text(Self.prettyCriteriaKey(key))
                .font(WSFont.headline(17, weight: .black))
                .foregroundStyle(WSColor.foregroundMuted)
                .lineLimit(1)
            Spacer(minLength: 8)
            Image(systemName: "lock.fill")
                .font(.system(size: 13, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 30, height: 30)
                .wsStickerCircle(fill: WSColor.sun)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .wsChunkyCard(cornerRadius: 20, horizontalPadding: 14, verticalPadding: 12)
    }

    /// Mascot + wide "View full feedback" purple button.
    private var bottomCTA: some View {
        HStack(spacing: 12) {
            WSAnimatedImage(name: "mascot-paper", ext: "webp")
                .frame(width: 66, height: 66)
                .wsMascotBob(amount: 4, rock: 3, duration: 1.4)
            Button {
                Haptics.medium()
                withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
                    showFullFeedback = true
                }
            } label: {
                Text("See every comment")
            }
            .buttonStyle(WSStickerButtonStyle(fill: WSColor.purple, foreground: .white))
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 6)
        .background(WSColor.background.ignoresSafeArea(edges: .bottom))
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
        scoreFraction >= 0.7 ? WSColor.lime : (scoreFraction >= 0.45 ? WSColor.orange : WSColor.pink)
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
        if f >= 0.85 { return "This one slaps." }
        if f >= 0.70 { return "Solid. Polish it." }
        if f >= 0.50 { return "Good bones." }
        return "Let's fix it up."
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
                            .font(.system(size: 12, weight: .black))
                        Text(t.rawValue)
                            .font(WSFont.headline(14, weight: .black))
                    }
                    .foregroundStyle(active ? WSColor.inkText : WSColor.foreground)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 8)
                    .background(
                        ZStack {
                            Capsule().fill(WSColor.ink).offset(y: active ? 3 : 2)
                            Capsule().fill(active ? WSColor.lime : WSColor.backgroundElevated)
                            Capsule().strokeBorder(WSColor.ink, lineWidth: 2)
                        }
                    )
                    .padding(.bottom, 3)
                }
                .buttonStyle(WSStickerPressStyle())
            }
            Spacer()
        }
        .padding(.horizontal, 20)
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
                    .wsChunkyCard(cornerRadius: 24)

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
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
    }

    private var legendRow: some View {
        HStack(spacing: 8) {
            Text("\(annotations.count) comments")
                .font(WSFont.headline(17, weight: .black))
                .foregroundStyle(WSColor.foreground)
            Spacer()
            ForEach([Annotation.AnnotationType.strong, .improve, .concern], id: \.self) { type in
                let count = annotations.filter { $0.type == type }.count
                if count > 0 {
                    Text("\(count)")
                        .font(WSFont.headline(13, weight: .black))
                        .foregroundStyle(WSColor.inkText)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(tint(for: type)))
                        .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
                }
            }
        }
    }

    private func tint(for type: Annotation.AnnotationType) -> Color {
        switch type {
        case .strong:  return WSColor.lime
        case .improve: return WSColor.orange
        case .concern: return WSColor.pink
        }
    }

    /// Renders the essay with inline colored backgrounds for each annotation
    /// span. Concatenated `Text` segments keep this lightweight; tap detection
    /// happens via the AnnotationCard list below.
    private var annotatedEssay: some View {
        let segments = AnnotationLayout.segments(for: content, annotations: annotations)
        // One AttributedString so highlighted spans get a marker-pen fill.
        var composed = AttributedString()
        for seg in segments {
            var part = AttributedString(seg.text)
            part.foregroundColor = WSColor.foreground
            if let ann = seg.annotation {
                part.font = WSFont.sans(16, weight: .bold)
                part.backgroundColor = tint(for: ann.type).opacity(0.55)
                part.foregroundColor = WSColor.inkText
            } else {
                part.font = WSFont.sans(16)
            }
            composed += part
        }
        return Text(composed)
            .lineSpacing(6)
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
        case .strong:  return WSColor.lime
        case .improve: return WSColor.orange
        case .concern: return WSColor.pink
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                HStack(spacing: 5) {
                    Image(systemName: annotation.icon)
                        .font(.system(size: 11, weight: .black))
                    Text(annotation.label.uppercased())
                        .font(WSFont.sans(11, weight: .black))
                        .tracking(1.2)
                }
                .foregroundStyle(WSColor.inkText)
                .padding(.horizontal, 9)
                .padding(.vertical, 4)
                .background(RoundedRectangle(cornerRadius: 9).fill(cardTint))
                .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(WSColor.ink, lineWidth: 2))
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
                .wsBody(.small, weight: .bold)
                .foregroundStyle(WSColor.foreground)
                .lineLimit(expanded ? nil : 2)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(WSColor.lilacDeep)
                )
                .overlay(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 2).fill(cardTint).frame(width: 4).padding(.vertical, 6)
                }

            Text(annotation.comment)
                .wsBody(.medium, weight: .medium)
                .foregroundStyle(WSColor.foreground)
                .lineLimit(expanded ? nil : 3)

            if expanded, let suggestion = annotation.suggestion, !suggestion.isEmpty {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "wand.and.stars")
                    Text(suggestion)
                        .wsBody(.small, weight: .semibold)
                }
                .foregroundStyle(WSColor.inkText)
                .padding(10)
                .wsSticker(fill: cardTint, radius: 12, depth: 2)
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
                message: "Upgrade to see each part of your grade scored on its own: structure, argument, citations, clarity and academic style.",
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
            if frac >= 0.85 { return WSColor.lime }
            if frac >= 0.65 { return WSColor.sky }
            if frac >= 0.45 { return WSColor.orange }
            return WSColor.pink
        }()

        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(name)
                    .font(WSFont.headline(17, weight: .black))
                    .foregroundStyle(WSColor.foreground)
                Spacer()
                if let s = criterion.score, let m = criterion.maxScore {
                    Text("\(Int(s))/\(Int(m))")
                        .font(WSFont.headline(14, weight: .black))
                        .foregroundStyle(WSColor.inkText)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(Capsule().fill(color))
                        .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
                }
            }
            WSStripeBar(fraction: frac, fill: color, height: 12, stripes: false)

            if let feedback = criterion.feedback, !feedback.isEmpty {
                Text(feedback)
                    .wsBody(.small, weight: .medium)
                    .foregroundStyle(WSColor.foreground)
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
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
    }

    private func suggestionRow(idx: Int, tip: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(idx + 1)")
                .font(WSFont.headline(15, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 32, height: 32)
                .wsStickerCircle(fill: [WSColor.lime, WSColor.sky, WSColor.pink, WSColor.orange][idx % 4])
            Text(tip)
                .wsBody(.medium, weight: .medium)
                .foregroundStyle(WSColor.foreground)
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
                .font(WSFont.headline(22, weight: .black))
                .foregroundStyle(WSColor.foreground)

            ForEach(rewrites) { rw in
                VStack(alignment: .leading, spacing: 8) {
                    if let original = rw.original {
                        Text(original)
                            .wsBody(.small)
                            .foregroundStyle(WSColor.inkText)
                            .strikethrough(true, color: WSColor.inkText.opacity(0.6))
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 10).fill(WSColor.pinkSoft))
                            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(WSColor.ink, lineWidth: 2))
                    }
                    if let rewrite = rw.rewrite {
                        Text(rewrite)
                            .wsBody(.small, weight: .bold)
                            .foregroundStyle(WSColor.inkText)
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 10).fill(WSColor.lime))
                            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(WSColor.ink, lineWidth: 2))
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
                .font(.system(size: 17, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 40, height: 40)
                .wsStickerCircle(fill: WSColor.sun)
            VStack(alignment: .leading, spacing: 2) {
                Text("Specific rewrites are Pro")
                    .font(WSFont.headline(16, weight: .black))
                    .foregroundStyle(WSColor.foreground)
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
            Image(systemName: icon)
                .font(.system(size: 34, weight: .black))
                .foregroundStyle(WSColor.inkText)
                .frame(width: 96, height: 96)
                .wsStickerCircle(fill: WSColor.sun, depth: 4)
            Text(title)
                .font(WSFont.headline(22, weight: .black))
                .foregroundStyle(WSColor.foreground)
            Text(message)
                .wsBody(.small)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Upgrade to Pro") {
                // Chapter 6 -- RevenueCat paywall
            }
            .buttonStyle(WSStickerButtonStyle(fill: WSColor.sun, foreground: WSColor.inkText, fullWidth: false, height: 54))
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
