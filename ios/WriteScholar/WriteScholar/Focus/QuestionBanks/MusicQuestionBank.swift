//
//  MusicQuestionBank.swift
//  WriteScholar
//
//  Classical composers and their famous works, instrument families,
//  and music theory basics. All facts are timeless — works composed
//  centuries ago, theory rules that don't shift.
//

import Foundation

enum MusicQuestionBank {

    static let questions: [QuizQuestion] = [
        q(600_000, "Who composed 'The Four Seasons'?",
          ["Bach", "Vivaldi", "Mozart", "Handel"], "Vivaldi",
          "Antonio Vivaldi composed it ~1720."),
        q(600_001, "Who composed the opera 'The Marriage of Figaro'?",
          ["Mozart", "Verdi", "Puccini", "Wagner"], "Mozart",
          "Premiered in 1786."),
        q(600_002, "Who composed the 'Brandenburg Concertos'?",
          ["Bach", "Handel", "Telemann", "Pachelbel"], "Bach",
          "Johann Sebastian Bach, completed in 1721."),
        q(600_003, "Who wrote the opera 'La Bohème'?",
          ["Verdi", "Puccini", "Mozart", "Bizet"], "Puccini",
          "Premiered in 1896."),
        q(600_004, "Who composed 'The Ride of the Valkyries'?",
          ["Wagner", "Tchaikovsky", "Strauss", "Brahms"], "Wagner",
          "From the opera 'Die Walküre'."),
        q(600_005, "Beethoven's Ninth Symphony famously sets which poem to music?",
          ["Ode to a Nightingale", "Ode to Joy", "The Raven", "Kubla Khan"], "Ode to Joy",
          "Schiller's poem in the choral fourth movement."),
        q(600_006, "How many strings does a standard violin have?",
          ["3", "4", "5", "6"], "4",
          "Tuned G, D, A, E."),
        q(600_007, "How many strings does a standard guitar have?",
          ["4", "5", "6", "7"], "6",
          "Standard tuning E, A, D, G, B, E."),
        q(600_008, "How many keys does a standard modern piano have?",
          ["76", "85", "88", "92"], "88",
          "52 white + 36 black keys."),
        q(600_009, "Which family does the trumpet belong to?",
          ["Woodwind", "Brass", "Percussion", "String"], "Brass",
          "Sound is made by lip vibration into a metal mouthpiece."),
        q(600_010, "Which family does the clarinet belong to?",
          ["Brass", "Woodwind", "String", "Percussion"], "Woodwind",
          "Single-reed instrument."),
        q(600_011, "How many lines does a standard music staff have?",
          ["3", "4", "5", "6"], "5",
          "With four spaces between them."),
        q(600_012, "How many beats are in a 4/4 time signature?",
          ["2", "3", "4", "6"], "4",
          "Each measure has four quarter-note beats."),
        q(600_013, "Which Italian word means 'fast and lively'?",
          ["Adagio", "Allegro", "Largo", "Lento"], "Allegro",
          "A common tempo marking."),
        q(600_014, "Which Italian word means 'slow'?",
          ["Allegro", "Presto", "Adagio", "Vivace"], "Adagio",
          "Slower than andante, faster than largo."),
        q(600_015, "How many semitones are in an octave?",
          ["7", "8", "10", "12"], "12",
          "Western music divides the octave into 12 equal semitones."),
        q(600_016, "What does 'forte' mean in music?",
          ["Soft", "Loud", "Slow", "Fast"], "Loud",
          "Italian for 'strong'. Symbol: f."),
        q(600_017, "What does 'piano' mean as a dynamic marking?",
          ["Loud", "Soft", "Fast", "Stately"], "Soft",
          "Italian for 'soft'. Symbol: p."),
        q(600_018, "Who composed 'Eine kleine Nachtmusik'?",
          ["Haydn", "Mozart", "Beethoven", "Bach"], "Mozart",
          "Composed in 1787."),
        q(600_019, "Who composed the '1812 Overture'?",
          ["Tchaikovsky", "Rimsky-Korsakov", "Borodin", "Stravinsky"], "Tchaikovsky",
          "Commemorates Russia's defence against Napoleon."),
        q(600_020, "Which composer became deaf later in life?",
          ["Bach", "Mozart", "Beethoven", "Schubert"], "Beethoven",
          "Began losing his hearing in his late 20s."),
        q(600_021, "Who is known as the 'Father of the Symphony'?",
          ["Haydn", "Mozart", "Bach", "Handel"], "Haydn",
          "Joseph Haydn composed 104 numbered symphonies."),
        q(600_022, "Which instrument has pedals, strings, and a soundboard, and is plucked?",
          ["Harp", "Cello", "Piano", "Guitar"], "Harp",
          "The pedals shorten strings to change pitch."),
        q(600_023, "How many lines is a treble clef centred on?",
          ["The 1st line (G below middle C)", "The 2nd line (G above middle C)", "The 3rd line", "The 4th line"], "The 2nd line (G above middle C)",
          "The treble clef is also called the G clef."),
        q(600_024, "Which composer wrote 'The Magic Flute'?",
          ["Beethoven", "Mozart", "Wagner", "Handel"], "Mozart",
          "His final opera, premiered 1791."),
        q(600_025, "Which note is twice the duration of a half note?",
          ["Quarter note", "Eighth note", "Whole note", "Sixteenth note"], "Whole note",
          "Whole = 4 beats; half = 2 beats."),
        q(600_026, "What does 'crescendo' mean?",
          ["Gradually faster", "Gradually slower", "Gradually louder", "Gradually softer"], "Gradually louder",
          "Italian for 'growing'."),
        q(600_027, "What does 'staccato' mean?",
          ["Smooth and connected", "Short and detached", "Loud and accented", "Gradually faster"], "Short and detached",
          "Indicated by a dot above or below the note."),
        q(600_028, "Which Bach piece is famously played on the organ in 'Phantom of the Opera'?",
          ["Goldberg Variations", "Toccata and Fugue in D minor", "Mass in B minor", "Air on the G string"], "Toccata and Fugue in D minor",
          "BWV 565, attributed to J. S. Bach.")
    ]

    static let flashcards: [Flashcard] = [
        Flashcard(front: "Forte (f)",       back: "Loud."),
        Flashcard(front: "Piano (p)",       back: "Soft."),
        Flashcard(front: "Crescendo",       back: "Gradually getting louder."),
        Flashcard(front: "Diminuendo",      back: "Gradually getting softer."),
        Flashcard(front: "Allegro",         back: "Fast and lively tempo."),
        Flashcard(front: "Adagio",          back: "Slow tempo."),
        Flashcard(front: "Octave",          back: "Interval of 12 semitones; pitches an octave apart sound 'the same' but higher/lower."),
        Flashcard(front: "Treble clef",     back: "G clef — its curl wraps around the line for G above middle C."),
        Flashcard(front: "Bass clef",       back: "F clef — its two dots straddle the line for F below middle C."),
        Flashcard(front: "Standard piano",  back: "88 keys: 52 white, 36 black.")
    ]

    private static func q(_ id: Int, _ q: String, _ opts: [String], _ correct: String, _ why: String) -> QuizQuestion {
        QuizQuestion(id: id, type: .multipleChoice, question: q, options: opts, correctAnswer: correct, explanation: why)
    }
}
