/**
 * Word Blitz — Mental Math "Play for Fun" bank.
 *
 * Single-line arithmetic problems posed as cloze sentences. Distractors
 * are off-by-one or near-miss numbers (so the player can't eyeball the
 * right magnitude — they have to actually do the math).
 *
 * Mix of:
 *   - Times tables (×6 through ×12)
 *   - Squares & cubes
 *   - Percentages of round numbers
 *   - Fractions of round numbers
 *   - Order of operations (PEMDAS)
 *   - Word-problem style
 */

import type { WordBlitzBankQuestion } from './wordBlitzTriviaBank';

export const WORD_BLITZ_MENTAL_MATH_BANK: WordBlitzBankQuestion[] = [
  // — Multiplication —
  { sentence: "7 × 8 = {{blank}}", correctAnswer: "56", distractors: ["54", "58", "64"] },
  { sentence: "9 × 6 = {{blank}}", correctAnswer: "54", distractors: ["56", "48", "63"] },
  { sentence: "11 × 12 = {{blank}}", correctAnswer: "132", distractors: ["121", "144", "120"] },
  { sentence: "13 × 7 = {{blank}}", correctAnswer: "91", distractors: ["84", "98", "89"] },
  { sentence: "15 × 6 = {{blank}}", correctAnswer: "90", distractors: ["75", "96", "85"] },
  { sentence: "8 × 12 = {{blank}}", correctAnswer: "96", distractors: ["86", "100", "108"] },
  { sentence: "14 × 5 = {{blank}}", correctAnswer: "70", distractors: ["65", "75", "60"] },
  { sentence: "16 × 4 = {{blank}}", correctAnswer: "64", distractors: ["60", "68", "72"] },
  { sentence: "25 × 4 = {{blank}}", correctAnswer: "100", distractors: ["80", "120", "90"] },
  { sentence: "12 × 12 = {{blank}}", correctAnswer: "144", distractors: ["132", "156", "121"] },

  // — Division —
  { sentence: "144 ÷ 12 = {{blank}}", correctAnswer: "12", distractors: ["11", "13", "14"] },
  { sentence: "84 ÷ 7 = {{blank}}", correctAnswer: "12", distractors: ["11", "13", "14"] },
  { sentence: "96 ÷ 8 = {{blank}}", correctAnswer: "12", distractors: ["11", "10", "13"] },
  { sentence: "108 ÷ 9 = {{blank}}", correctAnswer: "12", distractors: ["11", "13", "10"] },
  { sentence: "72 ÷ 6 = {{blank}}", correctAnswer: "12", distractors: ["11", "13", "10"] },
  { sentence: "100 ÷ 4 = {{blank}}", correctAnswer: "25", distractors: ["20", "30", "24"] },
  { sentence: "200 ÷ 8 = {{blank}}", correctAnswer: "25", distractors: ["20", "30", "24"] },
  { sentence: "150 ÷ 5 = {{blank}}", correctAnswer: "30", distractors: ["25", "35", "20"] },

  // — Squares —
  { sentence: "13 squared = {{blank}}", correctAnswer: "169", distractors: ["144", "196", "156"] },
  { sentence: "14 squared = {{blank}}", correctAnswer: "196", distractors: ["169", "225", "186"] },
  { sentence: "15 squared = {{blank}}", correctAnswer: "225", distractors: ["196", "256", "215"] },
  { sentence: "16 squared = {{blank}}", correctAnswer: "256", distractors: ["225", "289", "236"] },
  { sentence: "17 squared = {{blank}}", correctAnswer: "289", distractors: ["256", "324", "279"] },
  { sentence: "11 squared = {{blank}}", correctAnswer: "121", distractors: ["110", "132", "144"] },
  { sentence: "12 squared = {{blank}}", correctAnswer: "144", distractors: ["121", "169", "132"] },
  { sentence: "20 squared = {{blank}}", correctAnswer: "400", distractors: ["200", "440", "420"] },

  // — Cubes —
  { sentence: "3 cubed = {{blank}}", correctAnswer: "27", distractors: ["9", "18", "30"] },
  { sentence: "4 cubed = {{blank}}", correctAnswer: "64", distractors: ["48", "72", "60"] },
  { sentence: "5 cubed = {{blank}}", correctAnswer: "125", distractors: ["75", "150", "100"] },
  { sentence: "6 cubed = {{blank}}", correctAnswer: "216", distractors: ["196", "256", "186"] },
  { sentence: "10 cubed = {{blank}}", correctAnswer: "1000", distractors: ["100", "10000", "500"] },

  // — Percentages —
  { sentence: "10% of 250 = {{blank}}", correctAnswer: "25", distractors: ["20", "30", "50"] },
  { sentence: "20% of 80 = {{blank}}", correctAnswer: "16", distractors: ["20", "12", "8"] },
  { sentence: "25% of 200 = {{blank}}", correctAnswer: "50", distractors: ["40", "60", "75"] },
  { sentence: "50% of 64 = {{blank}}", correctAnswer: "32", distractors: ["28", "36", "30"] },
  { sentence: "75% of 80 = {{blank}}", correctAnswer: "60", distractors: ["50", "70", "65"] },
  { sentence: "15% of 200 = {{blank}}", correctAnswer: "30", distractors: ["25", "35", "20"] },
  { sentence: "5% of 400 = {{blank}}", correctAnswer: "20", distractors: ["15", "25", "40"] },
  { sentence: "30% of 90 = {{blank}}", correctAnswer: "27", distractors: ["25", "30", "33"] },
  { sentence: "40% of 50 = {{blank}}", correctAnswer: "20", distractors: ["18", "22", "25"] },
  { sentence: "60% of 150 = {{blank}}", correctAnswer: "90", distractors: ["80", "100", "75"] },

  // — Fractions —
  { sentence: "1/4 of 80 = {{blank}}", correctAnswer: "20", distractors: ["16", "24", "32"] },
  { sentence: "1/3 of 90 = {{blank}}", correctAnswer: "30", distractors: ["27", "33", "45"] },
  { sentence: "2/3 of 60 = {{blank}}", correctAnswer: "40", distractors: ["36", "45", "30"] },
  { sentence: "3/4 of 100 = {{blank}}", correctAnswer: "75", distractors: ["70", "80", "60"] },
  { sentence: "5/6 of 60 = {{blank}}", correctAnswer: "50", distractors: ["48", "52", "55"] },
  { sentence: "2/5 of 100 = {{blank}}", correctAnswer: "40", distractors: ["35", "45", "50"] },
  { sentence: "3/8 of 80 = {{blank}}", correctAnswer: "30", distractors: ["25", "35", "40"] },

  // — Order of operations (PEMDAS) —
  { sentence: "3 + 4 × 2 = {{blank}}", correctAnswer: "11", distractors: ["14", "10", "8"] },
  { sentence: "(3 + 4) × 2 = {{blank}}", correctAnswer: "14", distractors: ["11", "10", "12"] },
  { sentence: "10 − 2 × 3 = {{blank}}", correctAnswer: "4", distractors: ["24", "6", "5"] },
  { sentence: "20 ÷ 4 + 3 = {{blank}}", correctAnswer: "8", distractors: ["10", "5", "7"] },
  { sentence: "6 + 6 ÷ 2 = {{blank}}", correctAnswer: "9", distractors: ["6", "12", "8"] },
  { sentence: "12 − 4 + 2 = {{blank}}", correctAnswer: "10", distractors: ["6", "8", "14"] },
  { sentence: "8 × (3 + 2) = {{blank}}", correctAnswer: "40", distractors: ["26", "30", "48"] },
  { sentence: "100 ÷ (5 × 2) = {{blank}}", correctAnswer: "10", distractors: ["20", "40", "50"] },

  // — Quick word problems —
  { sentence: "If 3 apples cost $1.50, then 9 apples cost ${{blank}}.", correctAnswer: "4.50", distractors: ["3.00", "5.50", "6.00"] },
  { sentence: "A train travels 60 mph for 3 hours and covers {{blank}} miles.", correctAnswer: "180", distractors: ["120", "200", "240"] },
  { sentence: "Half of 88 is {{blank}}.", correctAnswer: "44", distractors: ["48", "40", "42"] },
  { sentence: "Double 37 is {{blank}}.", correctAnswer: "74", distractors: ["72", "76", "70"] },
  { sentence: "Triple 22 is {{blank}}.", correctAnswer: "66", distractors: ["44", "60", "72"] },
  { sentence: "If a dozen eggs costs $4.80, each egg costs ${{blank}}.", correctAnswer: "0.40", distractors: ["0.30", "0.45", "0.50"] },
  { sentence: "If you save $5 a week, after 12 weeks you have ${{blank}}.", correctAnswer: "60", distractors: ["50", "55", "65"] },
  { sentence: "A 20% tip on a $50 bill is ${{blank}}.", correctAnswer: "10", distractors: ["5", "15", "8"] },
  { sentence: "A 15% tip on a $40 bill is ${{blank}}.", correctAnswer: "6", distractors: ["4", "8", "5"] },
  { sentence: "A 10% discount on $80 makes it ${{blank}}.", correctAnswer: "72", distractors: ["70", "75", "68"] },

  // — Quick addition / subtraction —
  { sentence: "47 + 28 = {{blank}}", correctAnswer: "75", distractors: ["65", "85", "73"] },
  { sentence: "63 + 39 = {{blank}}", correctAnswer: "102", distractors: ["92", "112", "98"] },
  { sentence: "85 − 47 = {{blank}}", correctAnswer: "38", distractors: ["42", "32", "48"] },
  { sentence: "100 − 37 = {{blank}}", correctAnswer: "63", distractors: ["73", "53", "67"] },
  { sentence: "256 + 144 = {{blank}}", correctAnswer: "400", distractors: ["380", "420", "390"] },
  { sentence: "1000 − 234 = {{blank}}", correctAnswer: "766", distractors: ["756", "776", "734"] },

  // — Roots —
  { sentence: "The square root of 81 is {{blank}}.", correctAnswer: "9", distractors: ["8", "10", "11"] },
  { sentence: "The square root of 144 is {{blank}}.", correctAnswer: "12", distractors: ["10", "14", "11"] },
  { sentence: "The square root of 225 is {{blank}}.", correctAnswer: "15", distractors: ["14", "16", "13"] },
  { sentence: "The square root of 256 is {{blank}}.", correctAnswer: "16", distractors: ["14", "18", "15"] },
  { sentence: "The cube root of 64 is {{blank}}.", correctAnswer: "4", distractors: ["8", "3", "5"] },
  { sentence: "The cube root of 125 is {{blank}}.", correctAnswer: "5", distractors: ["4", "6", "10"] },
];
