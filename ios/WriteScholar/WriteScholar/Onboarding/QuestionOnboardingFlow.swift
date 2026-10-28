//
//  QuestionOnboardingFlow.swift
//  WriteScholar
//
//  The question-by-question onboarding, same flow as the website
//  (src/components/onboarding/CreditsOnboardingFlow.tsx):
//
//    0      Welcome: better grades, less stress
//    1–8    Questions, Scholar replies to every answer
//    9      "We hear you": their answers played back
//    10–11  Outcomes, chosen by what's weighing on them
//    12     Their week now vs. with WriteScholar
//    13     How did you find us?
//    14     Building your plan
//    15     Plan + 3 free credits → create account → start the trial
//
//  Answers are saved locally and uploaded once the user has an account
//  (OnboardingAnswers.uploadIfNeeded).
//

import SwiftUI

struct QuestionOnboardingFlow: View {
    @Binding var onboardingComplete: Bool

    @State private var step: Int = 0
    @State private var answers = OnboardingAnswers.load()
    @State private var buildTick = 0
    @State private var forward = true

    private enum S {
        static let welcome = 0, empathy = 9, outA = 10, outB = 11, life = 12, source = 13, build = 14, plan = 15
    }

    private var question: OnboardingQuestion? {
        if (1...OnboardingContent.questions.count).contains(step) { return OnboardingContent.questions[step - 1] }
        if step == S.source { return OnboardingContent.sourceQuestion }
        return nil
    }

    var body: some View {
        ZStack {
            WSColor.lilac.ignoresSafeArea()

            VStack(spacing: 0) {
                if step != S.welcome && step != S.build { topBar }
                ZStack {
                    screen
                        .id(step)
                        .transition(.asymmetric(
                            insertion: .move(edge: forward ? .trailing : .leading).combined(with: .opacity),
                            removal: .opacity))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .onChange(of: answers) { _, a in a.save() }
        .onChange(of: step) { _, s in
            Haptics.selection()
            if s == S.build { runBuild() }
        }
    }

    // MARK: - Chrome

    private var topBar: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Button { go(step == S.plan ? S.source : step - 1) } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 15, weight: .black))
                        .foregroundStyle(WSColor.foreground)
                        .frame(width: 40, height: 40)
                        .wsStickerCircle(fill: WSColor.backgroundElevated, depth: 3)
                        .padding(.bottom, 3)
                }
                .buttonStyle(WSStickerPressStyle())
                .accessibilityLabel("Back")
                WSStripeBar(fraction: Double(min(step, S.plan)) / Double(S.plan), fill: WSColor.purple, height: 14)
                CreditChip(text: "\(OnboardingContent.trialCredits) free")
            }
            .padding(.horizontal, 20)
            .padding(.top, 6)
            .padding(.bottom, 4)
        }
    }

    @ViewBuilder
    private var screen: some View {
        if step == S.welcome {
            welcome
        } else if let q = question {
            questionScreen(q)
        } else if step == S.empathy {
            empathyScreen
        } else if step == S.outA || step == S.outB {
            let pair = OnboardingContent.outcomes(for: answers.path)
            outcomeScreen(step == S.outA ? pair.0 : pair.1)
        } else if step == S.life {
            lifeScreen
        } else if step == S.build {
            buildScreen
        } else {
            planScreen
        }
    }

    // MARK: - Screens

    private var welcome: some View {
        VStack(spacing: 14) {
            Spacer()
            WSSpeechBubble(text: OnboardingContent.welcomeGreeting, tail: .none,
                           fillColor: .white, strokeColor: WSColor.ink, maxWidth: 300)
                .rotationEffect(.degrees(-2))
                .wsPop()
            ZStack {
                PulseRings()
                WSAnimatedImage(name: "mascot-celebrating").frame(width: 190, height: 190)
                    .wsMascotBob(amount: 10, rock: 3, duration: 0.9)
            }
            .frame(width: 230, height: 230)
            (Text("Better grades.\n").foregroundStyle(WSColor.purple)
             + Text("Less stress.").foregroundStyle(WSColor.foreground))
                .font(WSFont.headline(46, weight: .black))
                .tracking(-1.6)
                .multilineTextAlignment(.center)
                .wsPop(delay: 0.15)
            Text("A few quick questions about your grades, your deadlines and your life. Then we'll build your plan.")
                .wsBody(.medium, weight: .semibold)
                .foregroundStyle(WSColor.foregroundMuted)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
                .wsStaggerEntry(2)
            Spacer()
            footer {
                primary("Let's go") { go(1) }
                Button("I already have an account") { finish() }
                    .wsBody(.small, weight: .bold)
                    .foregroundStyle(WSColor.foregroundMuted)
                    .frame(minHeight: 44)
            }
        }
    }

    private func questionScreen(_ q: OnboardingQuestion) -> some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(alignment: .bottom, spacing: 10) {
                        WSAnimatedImage(name: OnboardingContent.scholar(for: q.key)).frame(width: 60, height: 60)
                        WSSpeechBubble(text: OnboardingContent.bubble(for: q, answers), tail: .leading,
                                       fillColor: .white, strokeColor: WSColor.ink, maxWidth: .infinity)
                            .id(OnboardingContent.bubble(for: q, answers))
                            .transition(.scale(scale: 0.8).combined(with: .opacity))
                    }
                    .animation(.wsBouncePop, value: OnboardingContent.bubble(for: q, answers))
                    Tag(text: q.eyebrow)
                    Text(q.title)
                        .font(WSFont.headline(30, weight: .black))
                        .tracking(-0.8)
                        .foregroundStyle(WSColor.foreground)
                        .fixedSize(horizontal: false, vertical: true)
                    if q.multi {
                        Text("Pick as many as you like").wsBody(.small, weight: .bold).foregroundStyle(WSColor.foregroundMuted)
                    }
                    ForEach(Array(q.options.enumerated()), id: \.element.id) { idx, o in
                        OptionRow(option: o, multi: q.multi,
                                  selected: q.multi ? answers.values(q.key).contains(o.id) : answers.value(q.key) == o.id) {
                            withAnimation(.wsBounceTight) { answers.toggle(q, o.id) }
                            Haptics.light()
                        }
                        .wsPop(delay: 0.05 * Double(idx))
                    }
                    if q.key == .target, answers.value(.target) != nil, OnboardingContent.gradeGoal(answers) == .climb {
                        let j = OnboardingContent.gradeJump(answers)
                        HStack(spacing: 14) {
                            GradeTile(grade: j.from, muted: true)
                            Image(systemName: "arrow.right").font(.system(size: 22, weight: .black)).foregroundStyle(WSColor.foreground)
                            GradeTile(grade: j.to, muted: false)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .wsSticker(fill: WSColor.lilacDeep, radius: 20, depth: 3)
                        .transition(.scale.combined(with: .opacity))
                    }
                }
                .padding(20)
            }
            footer { primary("Continue", disabled: !answers.isAnswered(q)) { go(step + 1) } }
        }
    }

    private var empathyScreen: some View {
        let e = OnboardingContent.empathy(answers)
        return VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 14) {
                    WSAnimatedImage(name: "mascot-thinking").frame(width: 140, height: 140)
                        .wsMascotBob(amount: 5, rock: 2, duration: 1.6)
                    Tag(text: "We hear you")
                    Text(e.title)
                        .font(WSFont.headline(30, weight: .black))
                        .tracking(-0.8)
                        .foregroundStyle(WSColor.foreground)
                        .multilineTextAlignment(.center)
                    Text(e.body).wsBody(.medium, weight: .semibold).foregroundStyle(WSColor.foregroundMuted).multilineTextAlignment(.center)
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(e.points, id: \.self) { p in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 11, weight: .black))
                                    .foregroundStyle(WSColor.inkText)
                                    .frame(width: 22, height: 22)
                                    .wsStickerCircle(fill: WSColor.lime)
                                Text(p).wsBody(.small, weight: .bold).foregroundStyle(WSColor.duoText)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .wsChunkyCard()
                    .wsPop(delay: 0.15)
                }
                .padding(20)
            }
            footer { primary("Show me how") { go(step + 1) } }
        }
    }

    private func outcomeScreen(_ o: OnboardingContent.Outcome) -> some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Tag(text: o.tag)
                    Text(o.title)
                        .font(WSFont.headline(30, weight: .black))
                        .tracking(-0.8)
                        .foregroundStyle(WSColor.foreground)
                        .fixedSize(horizontal: false, vertical: true)
                    LoopingVideoView(resourceName: o.video)
                        .aspectRatio(16 / 10, contentMode: .fit)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
                        .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(WSColor.ink).offset(y: 5))
                        .padding(.bottom, 5)
                        .rotationEffect(.degrees(-1))
                        .accessibilityLabel(o.tag)
                    if o.showsScore {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Example draft").wsBody(.caption, weight: .heavy).foregroundStyle(WSColor.foregroundMuted)
                                Text("B · 80/100").wsHeadline(.small, weight: .black).foregroundStyle(WSColor.foregroundMuted)
                            }
                            Spacer()
                            Image(systemName: "arrow.right").foregroundStyle(WSColor.duoPurple)
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("After the fixes").wsBody(.caption, weight: .heavy).foregroundStyle(WSColor.foregroundMuted)
                                Text("A · 90/100").wsHeadline(.small, weight: .black).foregroundStyle(WSColor.inkText)
                                    .padding(.horizontal, 8).padding(.vertical, 2)
                                    .background(RoundedRectangle(cornerRadius: 8).fill(WSColor.lime))
                            }
                        }
                        .padding(14)
                        .wsSticker(radius: 18, depth: 3)
                    }
                    ForEach(o.points, id: \.self) { p in
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 11, weight: .black))
                                .foregroundStyle(WSColor.inkText)
                                .frame(width: 22, height: 22)
                                .wsStickerCircle(fill: WSColor.lime)
                            Text(p).wsBody(.small, weight: .bold).foregroundStyle(WSColor.duoText)
                        }
                    }
                    if let m = o.mascot {
                        HStack(spacing: 10) {
                            WSAnimatedImage(name: o.scholar).frame(width: 48, height: 48)
                            Text(m).wsBody(.small, weight: .heavy).foregroundStyle(WSColor.duoText)
                        }
                        .padding(12)
                        .wsSticker(fill: WSColor.lilacDeep, radius: 18, depth: 3)
                    }
                }
                .padding(20)
            }
            footer { primary("Continue") { go(step + 1) } }
        }
    }

    private var lifeScreen: some View {
        let picks = answers.values(.life).isEmpty ? ["friends", "sleep"] : answers.values(.life)
        let days = ["M", "T", "W", "T", "F", "S", "S"]
        let before = ["Essay", "Essay", "Cram", "Essay", "Stress", "Cram", "Essay"]
        let afterPlan: [Int?] = [nil, 0, nil, 1, 0, 1, nil]
        return VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Tag(text: "The real outcome")
                    Text("Better grades. And your evenings back.")
                        .font(WSFont.headline(30, weight: .black))
                        .tracking(-0.8)
                        .foregroundStyle(WSColor.foreground)
                    Text("No more rewriting the same essay at 2am, guessing if it's good enough.")
                        .wsBody(.medium, weight: .semibold).foregroundStyle(WSColor.foregroundMuted)
                    WeekRow(title: "Your week now", days: days,
                            cells: before.map { label -> (String, Color, Color) in (label, WSColor.duoBorder.opacity(0.6), WSColor.foregroundMuted) }, highlight: false)
                    Image(systemName: "arrow.down")
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(WSColor.inkText)
                        .frame(width: 36, height: 36)
                        .wsStickerCircle(fill: WSColor.lime)
                        .frame(maxWidth: .infinity)
                    WeekRow(title: "Your week with WriteScholar", days: days,
                            cells: afterPlan.map { p -> (String, Color, Color) in
                                if let p { return (OnboardingContent.lifeShort[picks[p % picks.count]] ?? "Free", WSColor.lime, WSColor.inkText) }
                                return ("20 min", WSColor.sky, WSColor.inkText)
                            }, highlight: true)
                    Text(OnboardingContent.lifeLine(answers))
                        .wsBody(.small, weight: .heavy).foregroundStyle(WSColor.duoText)
                        .frame(maxWidth: .infinity).multilineTextAlignment(.center)
                }
                .padding(20)
            }
            footer { primary("I want that") { go(step + 1) } }
        }
    }

    private var buildScreen: some View {
        let labels = ["Reading your answers", OnboardingContent.goalLine(answers), "Choosing where to start", "Planning your \(OnboardingContent.trialCredits) free credits"]
        return VStack(spacing: 18) {
            Spacer()
            ZStack {
                PulseRings()
                WSAnimatedImage(name: "mascot-juggling").frame(width: 150, height: 150)
            }
            .frame(width: 180, height: 180)
            Text("Building your plan…")
                .font(WSFont.headline(32, weight: .black))
                .tracking(-0.9)
                .foregroundStyle(WSColor.foreground)
            WSStripeBar(fraction: Double(buildTick) / 4, fill: WSColor.purple, height: 16)
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(labels.enumerated()), id: \.offset) { i, l in
                    HStack(spacing: 12) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(buildTick > i ? WSColor.inkText : .clear)
                            .frame(width: 28, height: 28)
                            .wsStickerCircle(fill: buildTick > i ? WSColor.lime : WSColor.backgroundElevated)
                            .scaleEffect(buildTick > i ? 1 : 0.85)
                        Text(l).wsBody(.medium, weight: .heavy)
                            .foregroundStyle(buildTick > i ? WSColor.duoText : WSColor.foregroundMuted)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Spacer()
        }
        .padding(.horizontal, 28)
    }

    private var planScreen: some View {
        let rec = OnboardingContent.recommendation(for: answers.path)
        return VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 12) {
                        WSAnimatedImage(name: "mascot-jumping-joy").frame(width: 72, height: 72)
                            .wsMascotBob(amount: 6, rock: 3, duration: 0.8)
                        VStack(alignment: .leading, spacing: 4) {
                            Tag(text: "Your plan is ready")
                            Text(OnboardingContent.planHeadline(answers))
                                .font(WSFont.headline(24, weight: .black))
                                .tracking(-0.6)
                                .foregroundStyle(WSColor.foreground)
                        }
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("START HERE").font(WSFont.sans(11, weight: .black)).tracking(1.3)
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(Capsule().fill(WSColor.lime))
                            .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
                            .foregroundStyle(WSColor.inkText)
                        Text(rec.title).font(WSFont.headline(22, weight: .black))
                        Text(rec.body).wsBody(.small, weight: .bold)
                    }
                    .foregroundStyle(Color.white)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .wsSticker(fill: WSColor.purple, radius: 22, depth: 5)
                    .rotationEffect(.degrees(-1))
                    .wsPop(delay: 0.1)
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("Your \(OnboardingContent.trialCredits) free credits").wsHeadline(.small, weight: .black).foregroundStyle(WSColor.inkText)
                            Spacer()
                            HStack(spacing: 2) { ForEach(0..<OnboardingContent.trialCredits, id: \.self) { _ in CreditCoin(size: 22) } }
                        }
                        ForEach(Array(OnboardingContent.trialPlan(for: answers.path).enumerated()), id: \.offset) { i, c in
                            HStack(spacing: 10) {
                                Text("\(i + 1)").wsBody(.caption, weight: .black)
                                    .foregroundStyle(WSColor.inkText)
                                    .frame(width: 24, height: 24).wsStickerCircle(fill: WSColor.sun)
                                Text(c.label).wsBody(.small, weight: .bold).foregroundStyle(WSColor.inkText)
                                Spacer()
                                Text(c.when).wsBody(.caption, weight: .black).foregroundStyle(WSColor.inkMuted)
                            }
                        }
                    }
                    .padding(16)
                    .wsSticker(fill: Color(hex: 0xFFF1B8), radius: 22, depth: 4)
                    .wsPop(delay: 0.18)
                    VStack(alignment: .leading, spacing: 8) {
                        Text("How credits work").wsBody(.small, weight: .black).foregroundStyle(WSColor.duoText)
                        Label("1 credit = 1 essay analysis, study pack or citation search", systemImage: "circle.fill")
                            .labelStyle(CoinLabelStyle())
                        Label("Unused credits roll over every month, up to \(OnboardingContent.creditCap)", systemImage: "arrow.triangle.2.circlepath")
                            .wsBody(.small, weight: .bold).foregroundStyle(WSColor.duoText)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .wsSticker(radius: 22, depth: 4)
                }
                .padding(20)
            }
            footer {
                primary("Start my free trial") {
                    UserDefaults.standard.set(true, forKey: TrialIntent.key)
                    Haptics.success()
                    finish()
                }
                Text("\(OnboardingContent.trialDays) days free with \(OnboardingContent.trialCredits) credits · then \(OnboardingContent.proMonthlyPrice)/mo for \(OnboardingContent.proMonthlyCredits) credits · cancel anytime")
                    .wsBody(.caption, weight: .bold).foregroundStyle(WSColor.foregroundMuted)
                    .multilineTextAlignment(.center)
            }
        }
    }

    // MARK: - Helpers

    private func footer<Content: View>(@ViewBuilder _ content: () -> Content) -> some View {
        VStack(spacing: 8) { content() }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 12)
            .background(WSColor.lilac.ignoresSafeArea(edges: .bottom))
    }

    private func primary(_ title: String, disabled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) { Text(title) }
            .buttonStyle(WSStickerButtonStyle(fill: WSColor.purple, foreground: .white, radius: 20, height: 60,
                                              font: WSFont.headline(19, weight: .black)))
            .disabled(disabled)
            .opacity(disabled ? 0.45 : 1)
    }

    private func go(_ n: Int) {
        let target = max(0, min(S.plan, n))
        forward = target >= step
        withAnimation(.spring(response: 0.45, dampingFraction: 0.85)) { step = target }
    }

    private func runBuild() {
        buildTick = 0
        Task { @MainActor in
            for t in 1...4 {
                try? await Task.sleep(nanoseconds: 700_000_000)
                guard step == S.build else { return }
                withAnimation(.wsBouncePop) { buildTick = t }
            }
            try? await Task.sleep(nanoseconds: 500_000_000)
            if step == S.build { go(S.plan) }
        }
    }

    private func finish() {
        answers.save()
        withAnimation(.easeInOut(duration: 0.35)) { onboardingComplete = true }
    }
}

/// Set when the plan screen's "Start my free trial" was tapped, so the
/// signed-in home screen leads with the trial.
enum TrialIntent {
    static let key = "ws_trial_intent"
}

// MARK: - Pieces

private struct OptionRow: View {
    let option: OnboardingOption
    let multi: Bool
    let selected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: multi ? 9 : (option.badge != nil ? 10 : 16))
                        .fill(selected ? WSColor.inkText : WSColor.lilacDeep)
                        .overlay(RoundedRectangle(cornerRadius: multi ? 9 : (option.badge != nil ? 10 : 16))
                            .strokeBorder(WSColor.ink, lineWidth: 2))
                    if let b = option.badge, !(selected && multi) {
                        Text(b).font(WSFont.headline(15)).foregroundStyle(selected ? WSColor.lime : WSColor.foreground)
                    } else if selected {
                        Image(systemName: "checkmark").font(.system(size: 14, weight: .black)).foregroundStyle(WSColor.lime)
                    }
                }
                .frame(width: 32, height: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text(option.label).font(WSFont.headline(17, weight: .black)).foregroundStyle(selected ? WSColor.inkText : WSColor.foreground)
                    if let s = option.sub {
                        Text(s).wsBody(.small, weight: .semibold).foregroundStyle(selected ? WSColor.inkMuted : WSColor.foregroundMuted)
                    }
                }
                .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(minHeight: 58)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(selected ? WSColor.lime : WSColor.backgroundElevated))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(WSColor.ink, lineWidth: WSSticker.stroke))
            .offset(y: selected ? 2 : 0)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(WSColor.ink).offset(y: 4))
            .padding(.bottom, 4)
            .scaleEffect(selected ? 1.01 : 1)
            .animation(.wsBounceTight, value: selected)
        }
        .buttonStyle(WSStickerPressStyle(tilt: 0))
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

private struct GradeTile: View {
    let grade: String
    let muted: Bool
    var body: some View {
        Text(grade)
            .font(WSFont.headline(24))
            .foregroundStyle(muted ? WSColor.inkMuted : WSColor.inkText)
            .frame(minWidth: 54, minHeight: 54)
            .padding(.horizontal, 4)
            .wsSticker(fill: muted ? Color.white : WSColor.lime, radius: 16, depth: 3)
            .rotationEffect(.degrees(muted ? -4 : 4))
    }
}

private struct Tag: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(WSFont.sans(11, weight: .black))
            .tracking(1.3)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(RoundedRectangle(cornerRadius: 9).fill(WSColor.pink))
            .overlay(RoundedRectangle(cornerRadius: 9).strokeBorder(WSColor.ink, lineWidth: 2))
            .foregroundStyle(WSColor.inkText)
    }
}

private struct WeekRow: View {
    let title: String
    let days: [String]
    let cells: [(String, Color, Color)]
    let highlight: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(WSFont.headline(16, weight: .black)).foregroundStyle(highlight ? WSColor.foreground : WSColor.foregroundMuted)
            HStack(spacing: 5) {
                ForEach(0..<min(days.count, cells.count), id: \.self) { i in
                    VStack(spacing: 4) {
                        Text(days[i]).wsBody(.caption, weight: .heavy).foregroundStyle(WSColor.foregroundMuted)
                        Text(cells[i].0.uppercased())
                            .font(WSFont.sans(8, weight: .black))
                            .foregroundStyle(cells[i].2)
                            .lineLimit(1).minimumScaleFactor(0.7)
                            .frame(maxWidth: .infinity, minHeight: 56, alignment: .bottom)
                            .padding(.bottom, 6)
                            .background(RoundedRectangle(cornerRadius: 10).fill(cells[i].1))
                            .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(WSColor.ink.opacity(highlight ? 1 : 0.25), lineWidth: 2))
                    }
                }
            }
        }
        .padding(14)
        .wsSticker(radius: 20, depth: highlight ? 5 : 2)
    }
}

/// Spinning lime starburst + an ink ring that pings outward.
private struct PulseRings: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var pulse = false
    var body: some View {
        ZStack {
            WSStarburst(points: 16, inset: 0.86)
                .fill(WSColor.lime)
                .overlay(WSStarburst(points: 16, inset: 0.86).stroke(WSColor.ink, lineWidth: 2.5))
                .padding(14)
                .wsSpin(period: 20)
            Circle().stroke(WSColor.ink, lineWidth: 2.5).scaleEffect(pulse ? 1.15 : 0.8).opacity(pulse ? 0 : 0.6)
        }
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeOut(duration: 2.2).repeatForever(autoreverses: false)) { pulse = true }
        }
        .accessibilityHidden(true)
    }
}

private struct CoinLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .top, spacing: 8) {
            CreditCoin(size: 16)
            configuration.title.wsBody(.small, weight: .bold).foregroundStyle(WSColor.foreground)
        }
    }
}

// MARK: - Credit coin + chip (shared with the home screen)

struct CreditCoin: View {
    var size: CGFloat = 24
    var body: some View {
        ZStack {
            Circle().fill(WSColor.sun)
            Circle().strokeBorder(WSColor.ink, lineWidth: max(1.5, size * 0.08))
            Image(systemName: "bolt.fill").font(.system(size: size * 0.42, weight: .black)).foregroundStyle(WSColor.inkText)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

struct CreditChip: View {
    static let gold = Color(hex: 0xF5B70A)
    let text: String
    var body: some View {
        HStack(spacing: 5) {
            CreditCoin(size: 18)
            Text(text).font(WSFont.headline(14, weight: .black)).foregroundStyle(WSColor.inkText)
        }
        .padding(.leading, 5).padding(.trailing, 10)
        .frame(height: 32)
        .background(Capsule().fill(Color(hex: 0xFFF1B8)))
        .overlay(Capsule().strokeBorder(WSColor.ink, lineWidth: 2))
    }
}

#Preview {
    QuestionOnboardingFlow(onboardingComplete: .constant(false))
}
