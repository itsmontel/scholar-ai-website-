/**
 * Play-for-fun question bank for Word Tower.
 * Each question has a yes/no criterion with 5-7 short items,
 * at least 2 correct AND at least 2 incorrect.
 */

export interface WordTowerItem {
  text: string;
  isCorrect: boolean;
}

export interface WordTowerQuestion {
  prompt: string;
  items: WordTowerItem[];
}

export const WORD_TOWER_WORD_BANK: WordTowerQuestion[] = [
  {
    prompt: "Which of these are mammals?",
    items: [
      { text: "Whale", isCorrect: true },
      { text: "Salmon", isCorrect: false },
      { text: "Bat", isCorrect: true },
      { text: "Lizard", isCorrect: false },
      { text: "Dolphin", isCorrect: true },
      { text: "Eagle", isCorrect: false },
    ],
  },
  {
    prompt: "Which of these are planets in our solar system?",
    items: [
      { text: "Mars", isCorrect: true },
      { text: "Pluto", isCorrect: false },
      { text: "Venus", isCorrect: true },
      { text: "Europa", isCorrect: false },
      { text: "Saturn", isCorrect: true },
      { text: "Sirius", isCorrect: false },
    ],
  },
  {
    prompt: "Which of these are primary colors?",
    items: [
      { text: "Red", isCorrect: true },
      { text: "Green", isCorrect: false },
      { text: "Blue", isCorrect: true },
      { text: "Orange", isCorrect: false },
      { text: "Yellow", isCorrect: true },
      { text: "Purple", isCorrect: false },
    ],
  },
  {
    prompt: "Which are countries in Europe?",
    items: [
      { text: "France", isCorrect: true },
      { text: "Egypt", isCorrect: false },
      { text: "Spain", isCorrect: true },
      { text: "Brazil", isCorrect: false },
      { text: "Italy", isCorrect: true },
      { text: "Japan", isCorrect: false },
    ],
  },
  {
    prompt: "Which of these are NOT mammals?",
    items: [
      { text: "Shark", isCorrect: true },
      { text: "Tiger", isCorrect: false },
      { text: "Eagle", isCorrect: true },
      { text: "Horse", isCorrect: false },
      { text: "Frog", isCorrect: true },
      { text: "Wolf", isCorrect: false },
    ],
  },
  {
    prompt: "Which are noble gases?",
    items: [
      { text: "Helium", isCorrect: true },
      { text: "Oxygen", isCorrect: false },
      { text: "Neon", isCorrect: true },
      { text: "Carbon", isCorrect: false },
      { text: "Argon", isCorrect: true },
      { text: "Iron", isCorrect: false },
    ],
  },
  {
    prompt: "Which are Shakespeare plays?",
    items: [
      { text: "Hamlet", isCorrect: true },
      { text: "Faust", isCorrect: false },
      { text: "Macbeth", isCorrect: true },
      { text: "Oedipus", isCorrect: false },
      { text: "Othello", isCorrect: true },
      { text: "Iliad", isCorrect: false },
    ],
  },
  {
    prompt: "Which are programming languages?",
    items: [
      { text: "Python", isCorrect: true },
      { text: "Linux", isCorrect: false },
      { text: "Ruby", isCorrect: true },
      { text: "Apache", isCorrect: false },
      { text: "Rust", isCorrect: true },
      { text: "Docker", isCorrect: false },
    ],
  },
  {
    prompt: "Which of these are oceans?",
    items: [
      { text: "Pacific", isCorrect: true },
      { text: "Caspian", isCorrect: false },
      { text: "Atlantic", isCorrect: true },
      { text: "Mediterranean", isCorrect: false },
      { text: "Indian", isCorrect: true },
      { text: "Baltic", isCorrect: false },
    ],
  },
  {
    prompt: "Which are reptiles?",
    items: [
      { text: "Snake", isCorrect: true },
      { text: "Salamander", isCorrect: false },
      { text: "Turtle", isCorrect: true },
      { text: "Newt", isCorrect: false },
      { text: "Crocodile", isCorrect: true },
      { text: "Toad", isCorrect: false },
    ],
  },
  {
    prompt: "Which are even numbers?",
    items: [
      { text: "12", isCorrect: true },
      { text: "7", isCorrect: false },
      { text: "30", isCorrect: true },
      { text: "15", isCorrect: false },
      { text: "48", isCorrect: true },
      { text: "21", isCorrect: false },
    ],
  },
  {
    prompt: "Which are prime numbers?",
    items: [
      { text: "7", isCorrect: true },
      { text: "9", isCorrect: false },
      { text: "13", isCorrect: true },
      { text: "21", isCorrect: false },
      { text: "17", isCorrect: true },
      { text: "25", isCorrect: false },
    ],
  },
  {
    prompt: "Which are continents?",
    items: [
      { text: "Asia", isCorrect: true },
      { text: "Greenland", isCorrect: false },
      { text: "Africa", isCorrect: true },
      { text: "Arabia", isCorrect: false },
      { text: "Europe", isCorrect: true },
      { text: "Siberia", isCorrect: false },
    ],
  },
  {
    prompt: "Which are precious metals?",
    items: [
      { text: "Gold", isCorrect: true },
      { text: "Iron", isCorrect: false },
      { text: "Silver", isCorrect: true },
      { text: "Copper", isCorrect: false },
      { text: "Platinum", isCorrect: true },
      { text: "Tin", isCorrect: false },
    ],
  },
  {
    prompt: "Which are types of triangle?",
    items: [
      { text: "Scalene", isCorrect: true },
      { text: "Hexagonal", isCorrect: false },
      { text: "Isosceles", isCorrect: true },
      { text: "Trapezoid", isCorrect: false },
      { text: "Equilateral", isCorrect: true },
      { text: "Rhombic", isCorrect: false },
    ],
  },
  {
    prompt: "Which are Greek gods?",
    items: [
      { text: "Zeus", isCorrect: true },
      { text: "Thor", isCorrect: false },
      { text: "Apollo", isCorrect: true },
      { text: "Odin", isCorrect: false },
      { text: "Athena", isCorrect: true },
      { text: "Loki", isCorrect: false },
    ],
  },
  {
    prompt: "Which are NOT fruits?",
    items: [
      { text: "Carrot", isCorrect: true },
      { text: "Apple", isCorrect: false },
      { text: "Broccoli", isCorrect: true },
      { text: "Mango", isCorrect: false },
      { text: "Spinach", isCorrect: true },
      { text: "Banana", isCorrect: false },
    ],
  },
  {
    prompt: "Which are dinosaurs?",
    items: [
      { text: "T-Rex", isCorrect: true },
      { text: "Mammoth", isCorrect: false },
      { text: "Velociraptor", isCorrect: true },
      { text: "Sabertooth", isCorrect: false },
      { text: "Stegosaurus", isCorrect: true },
      { text: "Dodo", isCorrect: false },
    ],
  },
  {
    prompt: "Which are US states?",
    items: [
      { text: "Texas", isCorrect: true },
      { text: "Toronto", isCorrect: false },
      { text: "Oregon", isCorrect: true },
      { text: "Quebec", isCorrect: false },
      { text: "Nevada", isCorrect: true },
      { text: "Ontario", isCorrect: false },
    ],
  },
  {
    prompt: "Which of these are vowels?",
    items: [
      { text: "A", isCorrect: true },
      { text: "B", isCorrect: false },
      { text: "E", isCorrect: true },
      { text: "K", isCorrect: false },
      { text: "U", isCorrect: true },
      { text: "T", isCorrect: false },
    ],
  },
];
