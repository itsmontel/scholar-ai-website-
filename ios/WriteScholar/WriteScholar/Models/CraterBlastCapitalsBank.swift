//
//  CraterBlastCapitalsBank.swift
//  WriteScholar
//
//  Direct port of src/data/craterBlastCapitalCitiesBank.ts. ~135 capital
//  cities organized by region. The smart-wrong-picker bias matches
//  desktop: 2 plausible (same-region, non-obvious) + 1 obvious capital
//  decoy, then shuffled. Ensures Paris/London/Tokyo etc. don't dominate
//  the wrong-answer set.
//

import Foundation

enum CraterBlastCapitalsBank {

    enum Region: String, CaseIterable {
        case africa, asia, europe, americas, oceania, middleeast
    }

    /// Country, capital, region triple — order preserved from desktop.
    private static let data: [(country: String, capital: String, region: Region)] = [
        ("Afghanistan", "Kabul", .asia),
        ("Albania", "Tirana", .europe),
        ("Algeria", "Algiers", .africa),
        ("Argentina", "Buenos Aires", .americas),
        ("Australia", "Canberra", .oceania),
        ("Austria", "Vienna", .europe),
        ("Bangladesh", "Dhaka", .asia),
        ("Belgium", "Brussels", .europe),
        ("Brazil", "Brasília", .americas),
        ("Bulgaria", "Sofia", .europe),
        ("Canada", "Ottawa", .americas),
        ("Chile", "Santiago", .americas),
        ("China", "Beijing", .asia),
        ("Colombia", "Bogotá", .americas),
        ("Cuba", "Havana", .americas),
        ("Czech Republic", "Prague", .europe),
        ("Denmark", "Copenhagen", .europe),
        ("Egypt", "Cairo", .africa),
        ("Finland", "Helsinki", .europe),
        ("France", "Paris", .europe),
        ("Germany", "Berlin", .europe),
        ("Greece", "Athens", .europe),
        ("Hungary", "Budapest", .europe),
        ("Iceland", "Reykjavik", .europe),
        ("India", "New Delhi", .asia),
        ("Indonesia", "Jakarta", .asia),
        ("Iran", "Tehran", .middleeast),
        ("Iraq", "Baghdad", .middleeast),
        ("Ireland", "Dublin", .europe),
        ("Israel", "Jerusalem", .middleeast),
        ("Italy", "Rome", .europe),
        ("Japan", "Tokyo", .asia),
        ("Jordan", "Amman", .middleeast),
        ("Kenya", "Nairobi", .africa),
        ("Kuwait", "Kuwait City", .middleeast),
        ("Lebanon", "Beirut", .middleeast),
        ("Malaysia", "Kuala Lumpur", .asia),
        ("Mexico", "Mexico City", .americas),
        ("Morocco", "Rabat", .africa),
        ("Netherlands", "Amsterdam", .europe),
        ("New Zealand", "Wellington", .oceania),
        ("Nigeria", "Abuja", .africa),
        ("Norway", "Oslo", .europe),
        ("Pakistan", "Islamabad", .asia),
        ("Peru", "Lima", .americas),
        ("Philippines", "Manila", .asia),
        ("Poland", "Warsaw", .europe),
        ("Portugal", "Lisbon", .europe),
        ("Romania", "Bucharest", .europe),
        ("Russia", "Moscow", .europe),
        ("Saudi Arabia", "Riyadh", .middleeast),
        ("South Africa", "Pretoria", .africa),
        ("South Korea", "Seoul", .asia),
        ("Spain", "Madrid", .europe),
        ("Sweden", "Stockholm", .europe),
        ("Switzerland", "Bern", .europe),
        ("Thailand", "Bangkok", .asia),
        ("Turkey", "Ankara", .europe),
        ("Ukraine", "Kyiv", .europe),
        ("UAE", "Abu Dhabi", .middleeast),
        ("United Kingdom", "London", .europe),
        ("United States", "Washington D.C.", .americas),
        ("Vietnam", "Hanoi", .asia),
        ("Armenia", "Yerevan", .asia),
        ("Azerbaijan", "Baku", .asia),
        ("Belarus", "Minsk", .europe),
        ("Croatia", "Zagreb", .europe),
        ("Estonia", "Tallinn", .europe),
        ("Georgia", "Tbilisi", .asia),
        ("Kazakhstan", "Astana", .asia),
        ("Latvia", "Riga", .europe),
        ("Lithuania", "Vilnius", .europe),
        ("Moldova", "Chișinău", .europe),
        ("North Macedonia", "Skopje", .europe),
        ("Serbia", "Belgrade", .europe),
        ("Slovakia", "Bratislava", .europe),
        ("Slovenia", "Ljubljana", .europe),
        ("Uzbekistan", "Tashkent", .asia),
        ("Cambodia", "Phnom Penh", .asia),
        ("Mongolia", "Ulaanbaatar", .asia),
        ("Myanmar", "Naypyidaw", .asia),
        ("Nepal", "Kathmandu", .asia),
        ("Singapore", "Singapore", .asia),
        ("Sri Lanka", "Sri Jayawardenepura Kotte", .asia),
        ("Taiwan", "Taipei", .asia),
        ("Tajikistan", "Dushanbe", .asia),
        ("Turkmenistan", "Ashgabat", .asia),
        ("Angola", "Luanda", .africa),
        ("Cameroon", "Yaoundé", .africa),
        ("Ethiopia", "Addis Ababa", .africa),
        ("Ghana", "Accra", .africa),
        ("Madagascar", "Antananarivo", .africa),
        ("Senegal", "Dakar", .africa),
        ("Tanzania", "Dodoma", .africa),
        ("Tunisia", "Tunis", .africa),
        ("Uganda", "Kampala", .africa),
        ("Zambia", "Lusaka", .africa),
        ("Zimbabwe", "Harare", .africa),
        ("Bolivia", "Sucre", .americas),
        ("Ecuador", "Quito", .americas),
        ("Paraguay", "Asunción", .americas),
        ("Uruguay", "Montevideo", .americas),
        ("Venezuela", "Caracas", .americas),
        ("Costa Rica", "San José", .americas),
        ("Guatemala", "Guatemala City", .americas),
        ("Honduras", "Tegucigalpa", .americas),
        ("Nicaragua", "Managua", .americas),
        ("Panama", "Panama City", .americas),
        ("El Salvador", "San Salvador", .americas),
        ("Dominican Republic", "Santo Domingo", .americas),
        ("Haiti", "Port-au-Prince", .americas),
        ("Jamaica", "Kingston", .americas),
        ("Trinidad and Tobago", "Port of Spain", .americas),
        ("Bahrain", "Manama", .middleeast),
        ("Oman", "Muscat", .middleeast),
        ("Qatar", "Doha", .middleeast),
        ("Syria", "Damascus", .middleeast),
        ("Yemen", "Sana'a", .middleeast),
        ("Libya", "Tripoli", .africa),
        ("Sudan", "Khartoum", .africa),
        ("Mozambique", "Maputo", .africa),
        ("Rwanda", "Kigali", .africa),
        ("Malawi", "Lilongwe", .africa),
        ("Botswana", "Gaborone", .africa),
        ("Mali", "Bamako", .africa),
        ("Niger", "Niamey", .africa),
        ("Burkina Faso", "Ouagadougou", .africa),
        ("Guinea", "Conakry", .africa),
        ("Benin", "Porto-Novo", .africa),
        ("Laos", "Vientiane", .asia),
        ("Brunei", "Bandar Seri Begawan", .asia),
        ("Papua New Guinea", "Port Moresby", .oceania),
        ("Fiji", "Suva", .oceania),
        ("Samoa", "Apia", .oceania)
    ]

    private static let obviousCapitals: Set<String> = [
        "Paris", "London", "Tokyo", "Beijing", "Washington D.C.", "Berlin", "Rome",
        "Madrid", "Ottawa", "Canberra", "Brasília", "Moscow", "Seoul", "Mexico City",
        "Amsterdam", "Brussels", "Stockholm", "Oslo", "Copenhagen", "Helsinki",
        "Warsaw", "Lisbon", "Athens", "Dublin", "Vienna", "Prague", "Budapest",
        "Cairo", "New Delhi"
    ]

    /// Capitals grouped by region for the smart wrong-answer picker.
    private static let byRegion: [Region: [String]] = {
        var out: [Region: [String]] = [:]
        for entry in data {
            out[entry.region, default: []].append(entry.capital)
        }
        return out
    }()

    // MARK: - Public

    /// All capitals questions, ready for the iOS Crater Blast view.
    /// Each call reshuffles the answer order independently per question.
    static func allQuestions(shuffled: Bool = true) -> [CraterBlastQuestion] {
        var seen = Set<String>()
        var out: [CraterBlastQuestion] = []
        for entry in data {
            let key = "\(entry.country)|\(entry.capital)"
            if seen.contains(key) { continue }
            seen.insert(key)
            let answerSet = buildAnswers(correct: entry.capital, region: entry.region)
            out.append(Self.q(
                prompt: "What is the capital of \(entry.country)?",
                answers: answerSet.answers,
                correctIndex: answerSet.correctIndex
            ))
        }
        return shuffled ? out.shuffled() : out
    }

    // MARK: - Smart wrong picker (matches desktop)

    private static func buildAnswers(correct: String, region: Region) -> (answers: [String], correctIndex: Int) {
        let wrongs = pickSmartWrongs(correct: correct, region: region)
        let all = ([correct] + wrongs).shuffled()
        let idx = all.firstIndex(of: correct) ?? 0
        return (all, idx)
    }

    private static func pickSmartWrongs(correct: String, region: Region) -> [String] {
        let sameRegion = (byRegion[region] ?? []).filter { $0 != correct }
        let plausiblePool: [String] = {
            if sameRegion.count >= 2 { return sameRegion }
            let other = Region.allCases.filter { $0 != region }
                .flatMap { byRegion[$0] ?? [] }
            return sameRegion + other.filter { !obviousCapitals.contains($0) }
        }()
        let obviousPool = Array(obviousCapitals).filter { $0 != correct }
        var out: [String] = []
        var used: Set<String> = [correct]

        for c in plausiblePool.shuffled() {
            if out.count >= 2 { break }
            if !used.contains(c) && !obviousCapitals.contains(c) {
                used.insert(c)
                out.append(c)
            }
        }
        if let oneObvious = obviousPool.randomElement(), !used.contains(oneObvious) {
            out.append(oneObvious)
            used.insert(oneObvious)
        }
        // Fallback: top up if still short
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

    // MARK: - Builder helper

    private static func q(prompt: String, answers: [String], correctIndex: Int) -> CraterBlastQuestion {
        // Reorder so the correct answer sits at index 0 (the iOS view
        // re-shuffles for display anyway, but the model contract expects
        // correctIndex == 0).
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
