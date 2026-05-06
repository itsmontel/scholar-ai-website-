//
//  CraterBlastFlagsBank.swift
//  WriteScholar
//
//  Direct port of src/data/craterBlastFlagsBank.ts. Each prompt embeds
//  the flag emoji built from the ISO country code (regional indicator
//  symbols) — renders natively on iOS without any image assets.
//
//  The "obvious country" decoy bias matches desktop: 2 plausible
//  same-region wrong answers + 1 obvious country (Spain, France, etc.).
//

import Foundation

enum CraterBlastFlagsBank {

    enum Region: String, CaseIterable {
        case africa, asia, europe, americas, oceania, middleeast
    }

    private static let data: [(country: String, iso: String, region: Region)] = [
        ("United States", "US", .americas),
        ("United Kingdom", "GB", .europe),
        ("France", "FR", .europe),
        ("Germany", "DE", .europe),
        ("Japan", "JP", .asia),
        ("Italy", "IT", .europe),
        ("Spain", "ES", .europe),
        ("Canada", "CA", .americas),
        ("Australia", "AU", .oceania),
        ("Brazil", "BR", .americas),
        ("China", "CN", .asia),
        ("India", "IN", .asia),
        ("Russia", "RU", .europe),
        ("South Korea", "KR", .asia),
        ("Mexico", "MX", .americas),
        ("Netherlands", "NL", .europe),
        ("Belgium", "BE", .europe),
        ("Switzerland", "CH", .europe),
        ("Austria", "AT", .europe),
        ("Sweden", "SE", .europe),
        ("Norway", "NO", .europe),
        ("Denmark", "DK", .europe),
        ("Finland", "FI", .europe),
        ("Poland", "PL", .europe),
        ("Portugal", "PT", .europe),
        ("Greece", "GR", .europe),
        ("Turkey", "TR", .europe),
        ("Ireland", "IE", .europe),
        ("Argentina", "AR", .americas),
        ("Chile", "CL", .americas),
        ("Colombia", "CO", .americas),
        ("Peru", "PE", .americas),
        ("Egypt", "EG", .africa),
        ("South Africa", "ZA", .africa),
        ("Nigeria", "NG", .africa),
        ("Kenya", "KE", .africa),
        ("Thailand", "TH", .asia),
        ("Vietnam", "VN", .asia),
        ("Indonesia", "ID", .asia),
        ("Philippines", "PH", .asia),
        ("Malaysia", "MY", .asia),
        ("Singapore", "SG", .asia),
        ("New Zealand", "NZ", .oceania),
        ("Israel", "IL", .middleeast),
        ("Saudi Arabia", "SA", .middleeast),
        ("UAE", "AE", .middleeast),
        ("Iran", "IR", .middleeast),
        ("Iraq", "IQ", .middleeast),
        ("Pakistan", "PK", .asia),
        ("Bangladesh", "BD", .asia),
        ("Ukraine", "UA", .europe),
        ("Czech Republic", "CZ", .europe),
        ("Romania", "RO", .europe),
        ("Hungary", "HU", .europe),
        ("Croatia", "HR", .europe),
        ("Serbia", "RS", .europe),
        ("Bulgaria", "BG", .europe),
        ("Slovakia", "SK", .europe),
        ("Slovenia", "SI", .europe),
        ("Lithuania", "LT", .europe),
        ("Latvia", "LV", .europe),
        ("Estonia", "EE", .europe),
        ("Belarus", "BY", .europe),
        ("Kazakhstan", "KZ", .asia),
        ("Georgia", "GE", .asia),
        ("Armenia", "AM", .asia),
        ("Azerbaijan", "AZ", .asia),
        ("Uzbekistan", "UZ", .asia),
        ("Mongolia", "MN", .asia),
        ("Cambodia", "KH", .asia),
        ("Myanmar", "MM", .asia),
        ("Sri Lanka", "LK", .asia),
        ("Nepal", "NP", .asia),
        ("Taiwan", "TW", .asia),
        ("Cuba", "CU", .americas),
        ("Jamaica", "JM", .americas),
        ("Dominican Republic", "DO", .americas),
        ("Venezuela", "VE", .americas),
        ("Ecuador", "EC", .americas),
        ("Bolivia", "BO", .americas),
        ("Paraguay", "PY", .americas),
        ("Uruguay", "UY", .americas),
        ("Morocco", "MA", .africa),
        ("Algeria", "DZ", .africa),
        ("Tunisia", "TN", .africa),
        ("Libya", "LY", .africa),
        ("Ethiopia", "ET", .africa),
        ("Ghana", "GH", .africa),
        ("Tanzania", "TZ", .africa),
        ("Uganda", "UG", .africa),
        ("Senegal", "SN", .africa),
        ("Ivory Coast", "CI", .africa),
        ("Cameroon", "CM", .africa),
        ("Zimbabwe", "ZW", .africa),
        ("Zambia", "ZM", .africa),
        ("Botswana", "BW", .africa),
        ("Madagascar", "MG", .africa),
        ("Mozambique", "MZ", .africa),
        ("Rwanda", "RW", .africa),
        ("Angola", "AO", .africa),
        ("Sudan", "SD", .africa),
        ("Malawi", "MW", .africa),
        ("Lebanon", "LB", .middleeast),
        ("Jordan", "JO", .middleeast),
        ("Syria", "SY", .middleeast),
        ("Qatar", "QA", .middleeast),
        ("Kuwait", "KW", .middleeast),
        ("Bahrain", "BH", .middleeast),
        ("Oman", "OM", .middleeast),
        ("Yemen", "YE", .middleeast),
        ("Iceland", "IS", .europe),
        ("Luxembourg", "LU", .europe),
        ("Cyprus", "CY", .europe),
        ("Malta", "MT", .europe),
        ("Albania", "AL", .europe),
        ("North Macedonia", "MK", .europe),
        ("Bosnia and Herzegovina", "BA", .europe),
        ("Montenegro", "ME", .europe),
        ("Moldova", "MD", .europe),
        ("Tajikistan", "TJ", .asia),
        ("Kyrgyzstan", "KG", .asia),
        ("Turkmenistan", "TM", .asia),
        ("Afghanistan", "AF", .asia),
        ("Laos", "LA", .asia),
        ("Brunei", "BN", .asia),
        ("Papua New Guinea", "PG", .oceania),
        ("Fiji", "FJ", .oceania),
        ("Haiti", "HT", .americas),
        ("Trinidad and Tobago", "TT", .americas),
        ("Costa Rica", "CR", .americas),
        ("Panama", "PA", .americas),
        ("Guatemala", "GT", .americas),
        ("Honduras", "HN", .americas),
        ("El Salvador", "SV", .americas),
        ("Nicaragua", "NI", .americas)
    ]

    private static let obvious: Set<String> = [
        "United States", "United Kingdom", "France", "Germany", "Japan", "Italy", "Spain",
        "Canada", "Australia", "China", "India", "Russia", "Brazil", "Mexico", "Netherlands",
        "Belgium", "Switzerland", "Sweden", "Norway", "Denmark", "Finland", "Poland",
        "Portugal", "Greece", "Ireland", "South Korea", "New Zealand"
    ]

    private static let byRegion: [Region: [String]] = {
        var out: [Region: [String]] = [:]
        for entry in data {
            out[entry.region, default: []].append(entry.country)
        }
        return out
    }()

    // MARK: - Public

    static func allQuestions(shuffled: Bool = true) -> [CraterBlastQuestion] {
        var seen = Set<String>()
        var out: [CraterBlastQuestion] = []
        for entry in data {
            let key = "\(entry.country)|\(entry.iso)"
            if seen.contains(key) { continue }
            seen.insert(key)
            let answerSet = buildAnswers(correct: entry.country, region: entry.region)
            let emoji = isoToEmoji(entry.iso)
            out.append(Self.q(
                prompt: "Which country has this flag? \(emoji)",
                answers: answerSet.answers,
                correctIndex: answerSet.correctIndex
            ))
        }
        return shuffled ? out.shuffled() : out
    }

    // MARK: - Flag emoji from ISO

    /// Maps "US" → 🇺🇸 by combining regional indicator symbols (U+1F1E6..F).
    private static func isoToEmoji(_ iso: String) -> String {
        let base: UInt32 = 0x1F1E6
        let scalars = iso.uppercased().unicodeScalars.compactMap { sc -> Unicode.Scalar? in
            guard ("A"..."Z").contains(Character(sc)) else { return nil }
            return Unicode.Scalar(base + (sc.value - 65))
        }
        var s = String.UnicodeScalarView()
        s.append(contentsOf: scalars)
        return String(s)
    }

    // MARK: - Smart wrong picker (matches desktop)

    private static func buildAnswers(correct: String, region: Region) -> (answers: [String], correctIndex: Int) {
        let wrongs = pickSmartWrongs(correct: correct, region: region)
        let all = ([correct] + wrongs).shuffled()
        return (all, all.firstIndex(of: correct) ?? 0)
    }

    private static func pickSmartWrongs(correct: String, region: Region) -> [String] {
        let sameRegion = (byRegion[region] ?? []).filter { $0 != correct }
        let plausiblePool: [String] = {
            if sameRegion.count >= 2 { return sameRegion }
            let other = Region.allCases.filter { $0 != region }
                .flatMap { byRegion[$0] ?? [] }
            return sameRegion + other.filter { !obvious.contains($0) }
        }()
        let obviousPool = Array(obvious).filter { $0 != correct }
        var out: [String] = []
        var used: Set<String> = [correct]

        for c in plausiblePool.shuffled() {
            if out.count >= 2 { break }
            if !used.contains(c) && !obvious.contains(c) {
                used.insert(c)
                out.append(c)
            }
        }
        if let oneObvious = obviousPool.randomElement(), !used.contains(oneObvious) {
            out.append(oneObvious)
            used.insert(oneObvious)
        }
        while out.count < 3 {
            if let extra = plausiblePool.first(where: { !used.contains($0) && $0 != correct }) {
                used.insert(extra)
                out.append(extra)
            } else {
                break
            }
        }
        return Array(out.shuffled().prefix(3))
    }

    private static func q(prompt: String, answers: [String], correctIndex: Int) -> CraterBlastQuestion {
        var ordered = answers
        if correctIndex != 0, ordered.indices.contains(correctIndex) {
            let correctValue = ordered.remove(at: correctIndex)
            ordered.insert(correctValue, at: 0)
        }
        let json: [String: Any] = [
            "id": UUID().uuidString,
            "prompt": prompt,
            "answers": ordered,
            "correctIndex": 0
        ]
        let data = try! JSONSerialization.data(withJSONObject: json)
        return try! JSONDecoder().decode(CraterBlastQuestion.self, from: data)
    }
}
