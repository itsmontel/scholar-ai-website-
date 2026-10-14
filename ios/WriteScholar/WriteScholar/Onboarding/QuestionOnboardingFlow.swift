//
//  QuestionOnboardingFlow.swift
//  WriteScholar
//
//  The question-by-question onboarding, same flow as the website
//  (src/components/onboarding/CreditsOnboardingFlow.tsx):
//
//    0      Welcome: the B → A promise
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
            LinearGradient(colors: [Color(hex: 0xFAF7FF), Color(hex: 0xF3EAFF)], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

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
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(WSColor.foregroundMuted)
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("Back")
                Image.bundleResource("main-logo")
                    .resizable().scaledToFit()
                    .frame(width: 32, height: 32)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color.white))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(WSColor.duoBorder, lineWidth: 2))
                Text("WriteScholar").wsHeadline(.small, weight: .heavy).foregroundStyle(WSColor.duoText)
                Spacer()
                CreditChip(text: "\(OnboardingContent.trialCredits) free")
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(WSColor.backgroundElevated)
            WSProgressBar(fraction: Double(min(step, S.plan)) / Double(S.plan), tint: WSColor.duoPurple, height: 10)
                .frame(height: 10)
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
            WSSpeechBubble(text: "Hi! I'm Scholar. Let's get you that A.", tail: .none,
                           fillColor: .white, strokeColor: WSColor.duoBorder, maxWidth: 300)
                .wsStaggerEntry(0)
            ZStack {
                PulseRings()
                WSAnimatedImage(name: "mascot-celebrating").frame(width: 190, height: 190)
            }
            .frame(width: 220, height: 220)
            (Text("Let's turn your ").foregroundStyle(WSColor.duoText)
             + Text("B").foregroundStyle(WSColor.foregroundMuted)
             + Text(" into an ").foregroundStyle(WSColor.duoText)
             + Text("A.").foregroundStyle(WSColor.duoPurple))
                .wsHeadline(.huge, weight: .black)
                .multilineTextAlignment(.center)
                .wsStaggerEntry(1)
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
                                       fillColor: .white, strokeColor: WSColor.duoBorder, maxWidth: .infinity)
                            .id(OnboardingContent.bubble(for: q, answers))
                            .transition(.scale(scale: 0.8).combined(with: .opacity))
                    }
                    .animation(.wsBouncePop, value: OnboardingContent.bubble(for: q, answers))
                    Text(q.eyebrow.uppercased()).wsEyebrow().foregroundStyle(WSColor.duoPurple)
                    Text(q.title).wsHeadline(.large, weight: .black).foregroundStyle(WSColor.duoText)
                    if q.multi {
                        Text("Pick as many as you like").wsBody(.small, weight: .bold).foregroundStyle(WSColor.foregroundMuted)
                    }
                    ForEach(Array(q.options.enumerated()), id: \.element.id) { idx, o in
                        OptionRow(option: o, multi: q.multi,
                                  selected: q.multi ? answers.values(q.key).contains(o.id) : answers.value(q.key) == o.id) {
                            withAnimation(.wsBounceTight) { answers.toggle(q, o.id) }
                            Haptics.light()
                        }
                        .wsStaggerEntry(idx + 1)
                    }
                    if q.key == .target, let t = answers.value(.target), t != "pass" {
                        let j = OnboardingContent.gradeJump(answers)
                        HStack(spacing: 14) {
                            GradeTile(grade: j.from, muted: true)
                            Image(systemName: "arrow.right").font(.system(size: 22, weight: .bold)).foregroundStyle(WSColor.duoPurple)
                            GradeTile(grade: j.to, muted: false)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(14)
                        .background(RoundedRectangle(cornerRadius: 16).fill(WSColor.duoPurpleLight))
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
                    Text("WE HEAR YOU").wsEyebrow().foregroundStyle(WSColor.duoPurple)
                    Text(e.title).wsHeadline(.large, weight: .black).foregroundStyle(WSColor.duoText).multilineTextAlignment(.center)
                    Text(e.body).wsBody(.medium, weight: .semibold).foregroundStyle(WSColor.foregroundMuted).multilineTextAlignment(.center)
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(e.points, id: \.self) { p in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "checkmark.circle.fill").foregroundStyle(WSColor.duoPurple)
                                Text(p).wsBody(.small, weight: .bold).foregroundStyle(WSColor.duoText)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .wsChunkyCard(accent: WSColor.duoBorder)
                    .wsStaggerEntry(2)
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
                    Text(o.title).wsHeadline(.large, weight: .black).foregroundStyle(WSColor.duoText)
                    LoopingVideoView(resourceName: o.video)
                        .aspectRatio(16 / 10, contentMode: .fit)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(WSColor.duoBorder, lineWidth: 2))
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
                                Text("A · 90/100").wsHeadline(.small, weight: .black).foregroundStyle(WSColor.duoPurple)
                            }
                        }
                        .padding(14)
                        .background(RoundedRectangle(cornerRadius: 16).fill(Color.white))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(WSColor.duoBorder, lineWidth: 2))
                    }
                    ForEach(o.points, id: \.self) { p in
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "checkmark").font(.system(size: 15, weight: .black)).foregroundStyle(WSColor.duoPurple)
                            Text(p).wsBody(.small, weight: .bold).foregroundStyle(WSColor.duoText)
                        }
                    }
                    if let m = o.mascot {
                        HStack(spacing: 10) {
                            WSAnimatedImage(name: o.scholar).frame(width: 48, height: 48)
                            Text(m).wsBody(.small, weight: .heavy).foregroundStyle(WSColor.duoText)
                        }
                        .padding(12)
                        .background(RoundedRectangle(cornerRadius: 16).fill(WSColor.duoPurpleLight))
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
                    Text("Better grades. And your evenings back.").wsHeadline(.large, weight: .black).foregroundStyle(WSColor.duoText)
                    Text("No more rewriting the same essay at 2am, guessing if it's good enough.")
                        .wsBody(.medium, weight: .semibold).foregroundStyle(WSColor.foregroundMuted)
                    WeekRow(title: "Your week now", days: days,
                            cells: before.map { label -> (String, Color, Color) in (label, WSColor.duoBorder.opacity(0.6), WSColor.foregroundMuted) }, highlight: false)
                    Image(systemName: "arrow.down").font(.system(size: 18, weight: .black)).foregroundStyle(WSColor.duoPurple)
                        .frame(maxWidth: .infinity)
                    WeekRow(title: "Your week with WriteScholar", days: days,
                            cells: afterPlan.map { p -> (String, Color, Color) in
                                if let p { return (OnboardingContent.lifeShort[picks[p % picks.count]] ?? "Free", CreditChip.gold.opacity(0.3), Color(hex: 0x6B4E00)) }
                                return ("20 min", WSColor.duoPurpleLight, WSColor.duoPurple)
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
        let j = OnboardingContent.gradeJump(answers)
        let labels = ["Reading your answers", "Matching your goal: \(j.from) to \(j.to)", "Choosing where to start", "Planning your \(OnboardingContent.trialCredits) free credits"]
        return VStack(spacing: 18) {
            Spacer()
            ZStack {
                PulseRings()
                WSAnimatedImage(name: "mascot-juggling").frame(width: 150, height: 150)
            }
            .frame(width: 180, height: 180)
            Text("Building your plan…").wsHeadline(.large, weight: .black).foregroundStyle(WSColor.duoText)
            WSProgressBar(fraction: Double(buildTick) / 4, tint: WSColor.duoPurple, height: 14).frame(height: 14)
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(labels.enumerated()), id: \.offset) { i, l in
                    HStack(spacing: 12) {
                        Image(systemName: buildTick > i ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundStyle(buildTick > i ? WSColor.duoGreen : WSColor.duoBorder)
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
        let j = OnboardingContent.gradeJump(answers)
        let rec = OnboardingContent.recommendation(for: answers.path)
        return VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(spacing: 12) {
                        WSAnimatedImage(name: "mascot-jumping-joy").frame(width: 64, height: 64)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("YOUR PLAN IS READY").wsEyebrow().foregroundStyle(WSColor.duoPurple)
                            Text("\(j.from) to \(j.to), without losing your evenings")
                                .wsHeadline(.medium, weight: .black).foregroundStyle(WSColor.duoText)
                        }
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("START HERE").wsBody(.caption, weight: .black)
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(Capsule().fill(Color.white)).foregroundStyle(WSColor.duoPurple)
                        Text(rec.title).wsHeadline(.medium, weight: .black)
                        Text(rec.body).wsBody(.small, weight: .bold)
                    }
                    .foregroundStyle(Color.white)
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 18).fill(WSColor.duoPurple))
                    .background(RoundedRectangle(cornerRadius: 18).fill(WSColor.duoPurpleDark).offset(y: 4))
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("Your \(OnboardingContent.trialCredits) free credits").wsHeadline(.small, weight: .black).foregroundStyle(WSColor.duoText)
                            Spacer()
                            HStack(spacing: 2) { ForEach(0..<OnboardingContent.trialCredits, id: \.self) { _ in CreditCoin(size: 22) } }
                        }
                        ForEach(Array(OnboardingContent.trialPlan(for: answers.path).enumerated()), id: \.offset) { i, c in
                            HStack(spacing: 10) {
                                Text("\(i + 1)").wsBody(.caption, weight: .black)
                                    .frame(width: 22, height: 22).background(Circle().fill(CreditChip.gold))
                                Text(c.label).wsBody(.small, weight: .bold).foregroundStyle(WSColor.duoText)
                                Spacer()
                                Text(c.when).wsBody(.caption, weight: .black).foregroundStyle(Color(hex: 0x7A5A00))
                            }
                        }
                    }
                    .padding(16)
                    .background(RoundedRectangle(cornerRadius: 18).fill(Color(hex: 0xFFF6DB)))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color(hex: 0xF3DB93), lineWidth: 2))
                    VStack(alignment: .leading, spacing: 8) {
                        Text("How credits work").wsBody(.small, weight: .black).foregroundStyle(WSColor.duoText)
                        Label("1 credit = 1 essay analysis, study pack or citation search", systemImage: "circle.fill")
                            .labelStyle(CoinLabelStyle())
                        Label("Unused credits roll over every month, up to \(OnboardingContent.creditCap)", systemImage: "arrow.triangle.2.circlepath")
                            .wsBody(.small, weight: .bold).foregroundStyle(WSColor.duoText)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 18).fill(Color.white))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(WSColor.duoBorder, lineWidth: 2))
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
            .background(WSColor.backgroundElevated.ignoresSafeArea(edges: .bottom))
            .overlay(alignment: .top) { Rectangle().fill(WSColor.duoBorder).frame(height: 2) }
    }

    private func primary(_ title: String, disabled: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) { Text(title).frame(maxWidth: .infinity) }
            .buttonStyle(WSDuoPrimaryButtonStyle())
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
                        .fill(selected ? WSColor.duoPurple : Color.white)
                        .overlay(RoundedRectangle(cornerRadius: multi ? 9 : (option.badge != nil ? 10 : 16))
                            .stroke(selected ? WSColor.duoPurple : WSColor.duoBorder, lineWidth: 2))
                    if let b = option.badge, !(selected && multi) {
                        Text(b).font(WSFont.headline(15)).foregroundStyle(selected ? Color.white : WSColor.foregroundMuted)
                    } else if selected {
                        Image(systemName: "checkmark").font(.system(size: 14, weight: .black)).foregroundStyle(Color.white)
                    }
                }
                .frame(width: 32, height: 32)
                VStack(alignment: .leading, spacing: 2) {
                    Text(option.label).wsBody(.large, weight: .heavy).foregroundStyle(WSColor.duoText)
                    if let s = option.sub {
                        Text(s).wsBody(.small, weight: .semibold).foregroundStyle(WSColor.foregroundMuted)
                    }
                }
                .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(minHeight: 58)
            .background(RoundedRectangle(cornerRadius: 16).fill(selected ? WSColor.duoPurpleLight : Color.white))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(selected ? WSColor.duoPurple : WSColor.duoBorder, lineWidth: 2))
            .background(RoundedRectangle(cornerRadius: 16).fill(selected ? WSColor.duoPurple : WSColor.duoBorder).offset(y: 3))
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(selected ? .isSelected : [])
    }
}

private struct GradeTile: View {
    let grade: String
    let muted: Bool
    var body: some View {
        Text(grade)
            .font(WSFont.headline(24))
            .foregroundStyle(muted ? WSColor.foregroundMuted : Color.white)
            .frame(minWidth: 50, minHeight: 50)
            .padding(.horizontal, 4)
            .background(RoundedRectangle(cornerRadius: 14).fill(muted ? Color.white : WSColor.duoPurple))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(muted ? WSColor.duoBorder : WSColor.duoPurpleDark, lineWidth: 2))
    }
}

private struct Tag: View {
    let text: String
    var body: some View {
        Text(text.uppercased()).wsBody(.caption, weight: .black)
            .padding(.horizontal, 12).padding(.vertical, 5)
            .background(Capsule().fill(WSColor.duoPurpleLight))
            .foregroundStyle(WSColor.duoPurple)
    }
}

private struct WeekRow: View {
    let title: String
    let days: [String]
    let cells: [(String, Color, Color)]
    let highlight: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).wsBody(.small, weight: .black).foregroundStyle(highlight ? WSColor.duoPurple : WSColor.foregroundMuted)
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
                    }
                }
            }
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 18).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(highlight ? WSColor.duoPurple : WSColor.duoBorder, lineWidth: 2))
    }
}

private struct PulseRings: View {
    @State private var pulse = false
    var body: some View {
        ZStack {
            Circle().fill(WSColor.duoPurple.opacity(0.18)).blur(radius: 18).scaleEffect(pulse ? 1.08 : 0.95)
            Circle().stroke(WSColor.duoPurple.opacity(0.4), lineWidth: 3).scaleEffect(pulse ? 1.25 : 0.8).opacity(pulse ? 0 : 0.9)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 2.2).repeatForever(autoreverses: false)) { pulse = true }
        }
        .accessibilityHidden(true)
    }
}

private struct CoinLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .top, spacing: 8) {
            CreditCoin(size: 16)
            configuration.title.wsBody(.small, weight: .bold).foregroundStyle(WSColor.duoText)
        }
    }
}

// MARK: - Credit coin + chip (shared with the home screen)

struct CreditCoin: View {
    var size: CGFloat = 24
    var body: some View {
        ZStack {
            Circle().fill(CreditChip.gold)
            Circle().stroke(Color(hex: 0xB7800A), lineWidth: size * 0.07).padding(size * 0.18)
            Image(systemName: "bolt.fill").font(.system(size: size * 0.4, weight: .black)).foregroundStyle(Color(hex: 0x7A5A00))
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
            Text(text).font(WSFont.sans(13, weight: .black)).foregroundStyle(Color(hex: 0x7A5A00))
        }
        .padding(.leading, 5).padding(.trailing, 10)
        .frame(height: 32)
        .background(Capsule().fill(Color(hex: 0xFFF6DB)))
        .overlay(Capsule().stroke(Color(hex: 0xF3DB93), lineWidth: 2))
    }
}

#Preview {
    QuestionOnboardingFlow(onboardingComplete: .constant(false))
}
