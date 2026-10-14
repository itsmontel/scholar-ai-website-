//
//  OnboardingContent.swift
//  WriteScholar
//
//  Copy and branching for the question-by-question onboarding. Mirrors
//  src/components/onboarding/onboardingContent.ts on the website —
//  change both together so the app and the site ask the same things.
//  Answer ids are the allowlist in POST /api/users/onboarding-survey.
//

import Foundation

enum OnboardingPath: String, Codable, Sendable {
    case essay, exam, both
}

struct OnboardingOption: Identifiable, Sendable {
    let id: String
    let label: String
    var sub: String? = nil
    var badge: String? = nil
    var reply: String? = nil
}

enum OnboardingKey: String, Sendable {
    case level, pressure, current, target, confidence, struggles, deadline, life, source
}

struct OnboardingQuestion: Sendable {
    let key: OnboardingKey
    var multi: Bool = false
    let eyebrow: String
    let title: String
    let prompt: String
    let options: [OnboardingOption]
}

/// Answers, saved locally until the user has an account to attach them to.
struct OnboardingAnswers: Codable, Equatable, Sendable {
    var single: [String: String] = [:]
    var multi: [String: [String]] = [:]

    func value(_ key: OnboardingKey) -> String? { single[key.rawValue] }
    func values(_ key: OnboardingKey) -> [String] { multi[key.rawValue] ?? [] }

    func isAnswered(_ q: OnboardingQuestion) -> Bool {
        q.multi ? !values(q.key).isEmpty : value(q.key) != nil
    }

    mutating func toggle(_ q: OnboardingQuestion, _ id: String) {
        if q.multi {
            var list = values(q.key)
            if let i = list.firstIndex(of: id) { list.remove(at: i) } else { list.append(id) }
            multi[q.key.rawValue] = list
        } else {
            single[q.key.rawValue] = id
        }
    }

    var path: OnboardingPath { OnboardingPath(rawValue: value(.pressure) ?? "") ?? .both }

    // MARK: Persistence

    private static let storageKey = "ws_onboarding_answers_v2"
    private static let uploadedKey = "ws_onboarding_answers_uploaded"

    static func load() -> OnboardingAnswers {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let a = try? JSONDecoder().decode(OnboardingAnswers.self, from: data) else { return OnboardingAnswers() }
        return a
    }

    func save() {
        if let data = try? JSONEncoder().encode(self) {
            UserDefaults.standard.set(data, forKey: Self.storageKey)
            UserDefaults.standard.set(false, forKey: Self.uploadedKey)
        }
    }

    /// Sends saved answers to the survey endpoint once there's a signed-in
    /// account. Fire-and-forget: analytics never blocks the app.
    static func uploadIfNeeded() async {
        let defaults = UserDefaults.standard
        guard defaults.data(forKey: storageKey) != nil, !defaults.bool(forKey: uploadedKey) else { return }
        let a = load()
        let path = a.path
        let body = SurveyBody(
            referralSource: a.value(.source),
            useGoal: path == .essay ? "essays" : path == .exam ? "exams" : "grades",
            featureInterests: path == .essay ? ["essays"] : path == .exam ? ["study_packs"] : ["essays", "study_packs"],
            answers: SurveyAnswers(
                level: a.value(.level), pressure: a.value(.pressure), current: a.value(.current),
                target: a.value(.target), confidence: a.value(.confidence), struggles: a.values(.struggles),
                deadline: a.value(.deadline), life: a.values(.life), source: a.value(.source)
            )
        )
        do {
            let _: APIEmpty = try await APIClient.shared.post(path: "users/onboarding-survey", body: body, requiresAuth: true)
            defaults.set(true, forKey: uploadedKey)
        } catch APIError.noData {
            // The endpoint answers { success: true } with no data — that's a success.
            defaults.set(true, forKey: uploadedKey)
        } catch {
            // Try again next launch.
        }
    }

    private struct SurveyBody: Encodable {
        let referralSource: String?
        let useGoal: String
        let featureInterests: [String]
        let answers: SurveyAnswers
    }

    private struct SurveyAnswers: Encodable {
        let level, pressure, current, target, confidence: String?
        let struggles: [String]
        let deadline: String?
        let life: [String]
        let source: String?
    }
}

enum OnboardingContent {
    static let trialCredits = 3
    static let trialDays = 3
    static let proMonthlyCredits = 99
    static let creditCap = 499
    static let proMonthlyPrice = "$19.99"

    static let questions: [OnboardingQuestion] = [
        OnboardingQuestion(key: .level, eyebrow: "About you", title: "Where are you in school right now?",
                           prompt: "Let's get to know you. No wrong answers here!", options: [
            OnboardingOption(id: "underclass", label: "College: freshman or sophomore", reply: "New classes, new professors, new expectations. We've got you."),
            OnboardingOption(id: "upperclass", label: "College: junior or senior", reply: "The classes that count toward your GPA the most. Let us help."),
            OnboardingOption(id: "masters", label: "Master's program", reply: "Grad school raises the bar, so our feedback does too."),
            OnboardingOption(id: "other", label: "PhD, community college or other", reply: "Whatever the program, every paper still counts."),
        ]),
        OnboardingQuestion(key: .pressure, eyebrow: "What brought you here", title: "What's weighing on you most right now?",
                           prompt: "Be honest. This decides where we start.", options: [
            OnboardingOption(id: "essay", label: "Essays & papers", sub: "Drafts, deadlines, not knowing what your professor wants", reply: "Got it. You'll see your grade before you submit, not after."),
            OnboardingOption(id: "exam", label: "Exams & studying", sub: "Too much to remember, not enough time", reply: "Got it. We'll turn your notes into something that sticks."),
            OnboardingOption(id: "both", label: "Honestly, both", sub: "It's all piling up at once", reply: "That's a lot to carry. Let's take some of it off you."),
        ]),
        OnboardingQuestion(key: .current, eyebrow: "Where you are now", title: "What grades do you usually get on papers?",
                           prompt: "Closest match is fine.", options: [
            OnboardingOption(id: "A", label: "Mostly A's", sub: "Around a 3.7+ GPA", badge: "A", reply: "Strong already! We'll help you stay there with less stress."),
            OnboardingOption(id: "B", label: "Mostly B's", sub: "Around a 3.0–3.6 GPA", badge: "B", reply: "B's mean you're close. It's usually a few fixable things."),
            OnboardingOption(id: "C", label: "Mostly C's", sub: "Around a 2.0–2.9 GPA", badge: "C", reply: "A C is a starting point, not a ceiling."),
            OnboardingOption(id: "D", label: "Lower than I want", badge: "D", reply: "Thanks for being honest. That's exactly why we're here."),
        ]),
        OnboardingQuestion(key: .target, eyebrow: "Where you want to be", title: "What grade are you going for?",
                           prompt: "Pick the one you actually want, not the safe one.", options: [
            OnboardingOption(id: "A", label: "Straight A's", sub: "Protect or reach a 4.0", badge: "A"),
            OnboardingOption(id: "Aminus", label: "A's and A-minuses", sub: "Dean's list territory", badge: "A−"),
            OnboardingOption(id: "B", label: "Solid B-pluses", badge: "B+"),
            OnboardingOption(id: "pass", label: "Just pass, please", badge: "P"),
        ]),
        OnboardingQuestion(key: .confidence, eyebrow: "Writing", title: "How confident do you feel writing essays?",
                           prompt: "This tells us how much help you want.", options: [
            OnboardingOption(id: "1", label: "I freeze at a blank page", badge: "1", reply: "Starting is the hardest bit. We'll make it the easiest."),
            OnboardingOption(id: "2", label: "I get there, but it's painful", badge: "2", reply: "We'll take the guesswork out of every paragraph."),
            OnboardingOption(id: "3", label: "Okay, but never sure it's good", badge: "3", reply: "That's the gap we close. You'll know before you hand it in."),
            OnboardingOption(id: "4", label: "Pretty good, I want the extra marks", badge: "4", reply: "The last few marks live in the details. Perfect."),
            OnboardingOption(id: "5", label: "Confident, I want a second pair of eyes", badge: "5", reply: "Think of us as the TA who checks it before your professor does."),
        ]),
        OnboardingQuestion(key: .struggles, multi: true, eyebrow: "What trips you up", title: "What do you struggle with most?",
                           prompt: "Everyone has something. Tell us yours and we'll aim right at it.", options: [
            OnboardingOption(id: "marker", label: "Knowing what my professor wants"),
            OnboardingOption(id: "structure", label: "Structuring my argument"),
            OnboardingOption(id: "start", label: "Getting started"),
            OnboardingOption(id: "refs", label: "Referencing and citations"),
            OnboardingOption(id: "remember", label: "Remembering content for exams"),
            OnboardingOption(id: "time", label: "Running out of time"),
        ]),
        OnboardingQuestion(key: .deadline, eyebrow: "Timing", title: "When's your next deadline or exam?",
                           prompt: "So we know how fast to move.", options: [
            OnboardingOption(id: "week", label: "This week", reply: "Then let's start today. You've still got time to fix it."),
            OnboardingOption(id: "twoweeks", label: "In the next 2 weeks", reply: "Good window. Enough time to draft, check and improve."),
            OnboardingOption(id: "month", label: "This month", reply: "Starting early is the cheat code. Nice!"),
            OnboardingOption(id: "none", label: "Nothing urgent yet", reply: "Perfect time to build the habit, before the panic."),
        ]),
        OnboardingQuestion(key: .life, multi: true, eyebrow: "The bit that matters", title: "If studying took less of your week, what would you do?",
                           prompt: "Grades matter. So does having a life.", options: [
            OnboardingOption(id: "sleep", label: "Actually sleep"),
            OnboardingOption(id: "friends", label: "See my friends"),
            OnboardingOption(id: "gym", label: "Gym or sport"),
            OnboardingOption(id: "work", label: "Work and earn money"),
            OnboardingOption(id: "off", label: "Switch off and have fun"),
        ]),
    ]

    static let sourceQuestion = OnboardingQuestion(
        key: .source, eyebrow: "Last one", title: "How did you find us?",
        prompt: "Helps us know where to say hi.", options: [
            OnboardingOption(id: "tiktok", label: "TikTok"),
            OnboardingOption(id: "instagram", label: "Instagram"),
            OnboardingOption(id: "youtube", label: "YouTube"),
            OnboardingOption(id: "google", label: "Google"),
            OnboardingOption(id: "friend", label: "A friend"),
            OnboardingOption(id: "reddit", label: "Reddit"),
            OnboardingOption(id: "app_store", label: "App Store"),
            OnboardingOption(id: "other", label: "Somewhere else"),
        ])

    struct Outcome: Sendable {
        let tag: String
        let title: String
        let video: String
        let points: [String]
        var showsScore: Bool = false
        var mascot: String? = nil
        /// Scholar animation (Resources/*.webp) shown with this outcome.
        var scholar: String = "mascot-study"
    }

    /// Which Scholar animation plays on each question (same as the website).
    static func scholar(for key: OnboardingKey) -> String {
        switch key {
        case .level: return "mascot-study"
        case .pressure: return "mascot-thinking"
        case .current: return "mascot-study"
        case .target: return "mascot-jumping-joy"
        case .confidence: return "mascot-paper"
        case .struggles: return "mascot-juggling"
        case .deadline: return "mascot-laptop"
        case .life: return "mascot-dance"
        case .source: return "mascot-celebrating"
        }
    }

    private static let essayOutcome = Outcome(
        tag: "Essay Feedback", title: "See your grade before your professor does", video: "hero-essay",
        points: ["Every sentence color-coded: strong, needs work, needs revising",
                 "A grade estimate out of 100, checked against your rubric",
                 "The exact fix for each weak line. Apply it, re-check, submit."],
        showsScore: true, mascot: "Watch this. Every line gets marked before your professor sees it.", scholar: "mascot-paper")
    private static let studyOutcome = Outcome(
        tag: "Study Packs", title: "Turn your notes into a lesson, flashcards and a quiz", video: "hero-flashcards",
        points: ["Upload lecture notes, slides or a study guide",
                 "Get a lesson, flashcards, a quiz and games from it",
                 "Study in 10 minutes between classes, not a whole night"],
        mascot: "Exams feel different when you have already tested yourself on everything.")
    private static let quizOutcome = Outcome(
        tag: "Quizzes", title: "Find your gaps before the exam does", video: "hero-quiz",
        points: ["Quizzes built from your own notes, not generic ones",
                 "See exactly which topics you are shaky on",
                 "Daily Review keeps it fresh until exam day"],
        mascot: "Walk in knowing what is coming. That is what calm feels like.", scholar: "mascot-laptop")
    private static let studyAfterEssay = Outcome(
        tag: "Study Packs", title: "And when exams come, actually remember it", video: "hero-flashcards",
        points: studyOutcome.points,
        mascot: "Papers sorted, exams covered. That is the whole semester handled.")

    static func outcomes(for path: OnboardingPath) -> (Outcome, Outcome) {
        path == .exam ? (studyOutcome, quizOutcome) : (essayOutcome, studyAfterEssay)
    }

    struct Recommendation: Sendable {
        let title: String
        let body: String
    }

    static func recommendation(for path: OnboardingPath) -> Recommendation {
        switch path {
        case .essay:
            return Recommendation(title: "Essay Feedback", body: "Upload your draft and see the grade it is heading for, every line costing you points, and the fix, before your professor grades it.")
        case .exam:
            return Recommendation(title: "Study Packs", body: "Drop in your lecture notes and get a lesson, flashcards and a quiz. Test yourself on every topic before the midterm.")
        case .both:
            return Recommendation(title: "Essay Feedback, then Study Packs", body: "Fix the paper that is due first, then turn your notes into flashcards and a quiz for the exam after it.")
        }
    }

    static func trialPlan(for path: OnboardingPath) -> [(label: String, when: String)] {
        switch path {
        case .essay: return [("Analyze your current draft", "Today"), ("Re-check it after your fixes", "Tomorrow"), ("Study pack from your lecture notes", "Day 3")]
        case .exam: return [("Study pack from your hardest topic", "Today"), ("Study pack from your next topic", "Tomorrow"), ("Study pack from your study guide", "Day 3")]
        case .both: return [("Analyze your current draft", "Today"), ("Re-check it after your fixes", "Tomorrow"), ("Study pack for your next exam", "Day 3")]
        }
    }

    private static let struggleFix: [String: String] = [
        "marker": "You will see your paper the way your professor will, before they grade it",
        "structure": "You will get told exactly where your argument loses the thread",
        "start": "You will never face a blank page with no idea where to begin",
        "refs": "Citations found and formatted for you, in APA, MLA or Chicago",
        "remember": "Your notes become quizzes, so it sticks on exam day",
        "time": "You will fix what matters most first, so nothing is left to the last night",
    ]
    private static let lifePhrase: [String: String] = [
        "sleep": "actually sleep", "friends": "see your friends", "gym": "get to the gym",
        "work": "pick up more shifts", "off": "switch off and have fun",
    ]
    static let lifeShort: [String: String] = [
        "sleep": "Sleep", "friends": "Friends", "gym": "Gym", "work": "Shift", "off": "Fun",
    ]

    static func gradeJump(_ a: OnboardingAnswers) -> (from: String, to: String) {
        let from = questions[2].options.first { $0.id == a.value(.current) }?.badge ?? "B"
        let target = questions[3].options.first { $0.id == a.value(.target) }?.badge
        let to = target == nil ? "A" : target == "P" ? "Pass" : target!
        return (from, to)
    }

    static func bubble(for q: OnboardingQuestion, _ a: OnboardingAnswers) -> String {
        switch q.key {
        case .target:
            guard let v = a.value(.target) else { return q.prompt }
            if v == "pass" { return "No shame in that. We'll get you over the line, calmly." }
            let j = gradeJump(a)
            return "From \(j.from) to \(j.to)? That jump is exactly what we are built for."
        case .struggles:
            let n = a.values(.struggles).count
            if n == 0 { return q.prompt }
            return n > 2 ? "That's a lot at once. We'll tackle the biggest first." : "Noted. That goes straight into your plan."
        case .life:
            return a.values(.life).isEmpty ? q.prompt : "That's the real goal. Better grades in fewer hours."
        case .source:
            return a.value(.source) == nil ? q.prompt : "Thanks! That really helps us."
        default:
            if let v = a.value(q.key), let reply = q.options.first(where: { $0.id == v })?.reply { return reply }
            return q.prompt
        }
    }

    static func empathy(_ a: OnboardingAnswers) -> (title: String, body: String, points: [String]) {
        let from = gradeJump(a).from
        let article = from.hasPrefix("A") ? "an" : "a"
        let title = from == "A"
            ? "Staying at the top shouldn't cost you every evening."
            : "You're not \(article) \(from) student. You just never see your mistakes in time."
        let picked = a.values(.struggles)
        var points = (picked.isEmpty ? ["marker", "time"] : Array(picked.prefix(2))).compactMap { struggleFix[$0] }
        points.append(a.value(.deadline) == "week"
            ? "And with a deadline this week, you can start fixing today"
            : "And you will get there in fewer hours, not more")
        return (title,
                "Most students only find out what was wrong when the grade comes back on Canvas, and by then it is too late to fix. That is the part we change.",
                points)
    }

    static func lifeLine(_ a: OnboardingAnswers) -> String {
        let picks = a.values(.life).isEmpty ? ["friends", "sleep"] : a.values(.life)
        let phrases = picks.prefix(2).compactMap { lifePhrase[$0] }
        let joined = phrases.count == 2 ? "\(phrases[0]) and \(phrases[1])" : (phrases.first ?? "live a little")
        return "More time to \(joined). That is the point."
    }
}
