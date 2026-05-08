//
//  SportsQuestionBank.swift
//  WriteScholar
//
//  Sports questions limited to *rules*, *equipment*, *origins*, and
//  *defined dimensions*. We deliberately avoid records and standings —
//  those are exactly the Lakers-championship problem the user flagged.
//

import Foundation

enum SportsQuestionBank {

    static let questions: [QuizQuestion] = [
        q(700_000, "How many players are on the field per side in football (soccer)?",
          ["9", "10", "11", "12"], "11",
          "Including the goalkeeper."),
        q(700_001, "How many players are on the court per side in basketball?",
          ["4", "5", "6", "7"], "5",
          "Each team has 5 players on court."),
        q(700_002, "How long is a marathon?",
          ["21.1 km", "26.2 km", "42.195 km", "50 km"], "42.195 km",
          "26 miles 385 yards = 42.195 km."),
        q(700_003, "In tennis, what is a score of zero called?",
          ["Nil", "Zero", "Love", "Duck"], "Love",
          "Possibly from French 'l'oeuf' (egg)."),
        q(700_004, "How many holes are in a standard round of golf?",
          ["9", "12", "18", "20"], "18",
          "A standard golf course has 18 holes."),
        q(700_005, "In which sport would you perform a 'slam dunk'?",
          ["Volleyball", "Basketball", "Tennis", "Hockey"], "Basketball",
          "Forcing the ball through the hoop from above."),
        q(700_006, "How many points is a touchdown worth in American football?",
          ["3", "5", "6", "7"], "6",
          "Plus 1 or 2 for the extra point conversion."),
        q(700_007, "How many players are on a baseball team's defensive lineup on the field?",
          ["7", "8", "9", "10"], "9",
          "Pitcher, catcher, four infielders, three outfielders."),
        q(700_008, "How many players are on a cricket team?",
          ["10", "11", "12", "13"], "11",
          "Including the wicketkeeper."),
        q(700_009, "What's the maximum break in snooker?",
          ["100", "147", "180", "200"], "147",
          "15 reds + 15 blacks + all colours."),
        q(700_010, "In which sport is the term 'birdie' used?",
          ["Tennis", "Cricket", "Golf", "Bowling"], "Golf",
          "One stroke under par on a hole."),
        q(700_011, "How long is an Olympic-size swimming pool?",
          ["25 m", "33 m", "50 m", "100 m"], "50 m",
          "Standard for World Championships and Olympics."),
        q(700_012, "Which colour jersey does the leader of the Tour de France wear?",
          ["Green", "Yellow", "Polka dot", "White"], "Yellow",
          "The 'maillot jaune' — yellow since 1919."),
        q(700_013, "What sport is associated with Wimbledon?",
          ["Cricket", "Tennis", "Golf", "Rugby"], "Tennis",
          "Held annually at the All England Club."),
        q(700_014, "Which sport uses the terms 'love', 'deuce' and 'ace'?",
          ["Cricket", "Tennis", "Squash", "Badminton"], "Tennis",
          "Standard tennis scoring vocabulary."),
        q(700_015, "How many points is a try worth in rugby union?",
          ["3", "4", "5", "7"], "5",
          "Plus 2 for the conversion."),
        q(700_016, "In boxing, how many rounds does a typical world title fight last (max)?",
          ["10", "12", "15", "20"], "12",
          "Reduced from 15 rounds in 1988."),
        q(700_017, "Which country is the origin of judo?",
          ["China", "Japan", "Korea", "Thailand"], "Japan",
          "Founded by Jigoro Kano in 1882."),
        q(700_018, "Which country is the origin of taekwondo?",
          ["Japan", "China", "Korea", "Vietnam"], "Korea",
          "Modern taekwondo took shape in Korea in the 1940s–50s."),
        q(700_019, "Which sport features a 'scrum'?",
          ["Soccer", "Rugby", "Lacrosse", "Field hockey"], "Rugby",
          "Pack of forwards binding to contest the ball."),
        q(700_020, "What is the diameter of a standard basketball hoop (inches)?",
          ["16", "18", "20", "22"], "18",
          "Standard regulation hoop diameter."),
        q(700_021, "How many players are on an ice hockey team on the ice (per side, including goalie)?",
          ["5", "6", "7", "8"], "6",
          "Five skaters and a goaltender."),
        q(700_022, "What sport uses a shuttlecock?",
          ["Squash", "Table tennis", "Badminton", "Padel"], "Badminton",
          "Also called a birdie."),
        q(700_023, "Which sport's Grand Slam events include the US Open and Wimbledon?",
          ["Golf", "Tennis", "Both", "Neither"], "Both",
          "Both tennis and golf have a 'US Open' and tennis has Wimbledon while golf has The Open."),
        q(700_024, "What's the standard length of an NBA basketball court (feet)?",
          ["80", "84", "94", "100"], "94",
          "94 ft long, 50 ft wide."),
        q(700_025, "How many laps are in an Indianapolis 500?",
          ["100", "150", "200", "250"], "200",
          "200 laps × 2.5 mile track = 500 miles."),
        q(700_026, "Which Olympic event combines swimming, cycling, and running?",
          ["Pentathlon", "Triathlon", "Decathlon", "Heptathlon"], "Triathlon",
          "Olympic distance: 1.5 km swim, 40 km bike, 10 km run.")
    ]

    static let flashcards: [Flashcard] = [
        Flashcard(front: "Marathon distance",        back: "42.195 km (26 miles 385 yards)."),
        Flashcard(front: "Tennis: zero",              back: "Called 'love'."),
        Flashcard(front: "Golf round",                back: "18 holes."),
        Flashcard(front: "Basketball players on court", back: "5 per team."),
        Flashcard(front: "Olympic pool length",       back: "50 metres."),
        Flashcard(front: "Snooker max break",         back: "147."),
        Flashcard(front: "Tour de France leader",     back: "Wears the yellow jersey ('maillot jaune')."),
        Flashcard(front: "Soccer players per side",   back: "11 (including goalkeeper).")
    ]

    private static func q(_ id: Int, _ q: String, _ opts: [String], _ correct: String, _ why: String) -> QuizQuestion {
        QuizQuestion(id: id, type: .multipleChoice, question: q, options: opts, correctAnswer: correct, explanation: why)
    }
}
