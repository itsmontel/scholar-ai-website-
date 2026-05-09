/**
 * Word Blitz — Famous Quotes "Play for Fun" bank.
 *
 * Each entry blanks out a single iconic word from a famous quote, song
 * lyric, movie line or proverb. Distractors are word-class-matched
 * substitutes that almost-but-don't-quite work — close enough that the
 * player has to actually know the line, not just guess from grammar.
 *
 * Curated to be timeless: classic literature, Shakespeare, MLK, JFK,
 * Lincoln, Twain, proverbs. No celebrity-of-the-month quotes that age out.
 */

import type { WordBlitzBankQuestion } from './wordBlitzTriviaBank';

export const WORD_BLITZ_QUOTES_BANK: WordBlitzBankQuestion[] = [
  // — Shakespeare —
  { sentence: "Shakespeare wrote: \"To be or not to {{blank}}, that is the question.\"", correctAnswer: "be", distractors: ["live", "die", "dream"] },
  { sentence: "Shakespeare wrote: \"All the world's a {{blank}}, and all the men and women merely players.\"", correctAnswer: "stage", distractors: ["dream", "story", "game"] },
  { sentence: "Shakespeare wrote: \"A rose by any other name would smell as {{blank}}.\"", correctAnswer: "sweet", distractors: ["pure", "bright", "rich"] },
  { sentence: "Shakespeare wrote: \"What's in a {{blank}}?\"", correctAnswer: "name", distractors: ["dream", "kiss", "word"] },
  { sentence: "Shakespeare wrote: \"Brevity is the soul of {{blank}}.\"", correctAnswer: "wit", distractors: ["art", "truth", "love"] },
  { sentence: "Shakespeare wrote: \"The course of true love never did run {{blank}}.\"", correctAnswer: "smooth", distractors: ["true", "long", "deep"] },

  // — US presidents & historic speeches —
  { sentence: "JFK said: \"Ask not what your country can do for you — ask what you can do for your {{blank}}.\"", correctAnswer: "country", distractors: ["family", "people", "nation"] },
  { sentence: "MLK said: \"I have a {{blank}}.\"", correctAnswer: "dream", distractors: ["plan", "vision", "promise"] },
  { sentence: "Lincoln said: \"Four score and seven years {{blank}}, our fathers brought forth a new nation.\"", correctAnswer: "ago", distractors: ["since", "past", "back"] },
  { sentence: "Roosevelt said: \"The only thing we have to fear is {{blank}} itself.\"", correctAnswer: "fear", distractors: ["doubt", "loss", "death"] },
  { sentence: "Lincoln said: \"Government of the people, by the people, for the {{blank}}.\"", correctAnswer: "people", distractors: ["nation", "country", "free"] },
  { sentence: "Patrick Henry said: \"Give me liberty or give me {{blank}}!\"", correctAnswer: "death", distractors: ["freedom", "honor", "justice"] },

  // — Proverbs & sayings —
  { sentence: "Proverb: \"A picture is worth a thousand {{blank}}.\"", correctAnswer: "words", distractors: ["dollars", "stories", "memories"] },
  { sentence: "Proverb: \"An apple a day keeps the {{blank}} away.\"", correctAnswer: "doctor", distractors: ["dentist", "nurse", "illness"] },
  { sentence: "Proverb: \"Rome wasn't built in a {{blank}}.\"", correctAnswer: "day", distractors: ["year", "month", "week"] },
  { sentence: "Proverb: \"The early bird catches the {{blank}}.\"", correctAnswer: "worm", distractors: ["fish", "bug", "prey"] },
  { sentence: "Proverb: \"Don't count your chickens before they {{blank}}.\"", correctAnswer: "hatch", distractors: ["fly", "grow", "sleep"] },
  { sentence: "Proverb: \"A bird in the hand is worth two in the {{blank}}.\"", correctAnswer: "bush", distractors: ["sky", "tree", "wild"] },
  { sentence: "Proverb: \"You can't judge a book by its {{blank}}.\"", correctAnswer: "cover", distractors: ["title", "author", "spine"] },
  { sentence: "Proverb: \"Where there's smoke, there's {{blank}}.\"", correctAnswer: "fire", distractors: ["heat", "danger", "trouble"] },
  { sentence: "Proverb: \"Beauty is in the eye of the {{blank}}.\"", correctAnswer: "beholder", distractors: ["lover", "artist", "viewer"] },
  { sentence: "Proverb: \"Honesty is the best {{blank}}.\"", correctAnswer: "policy", distractors: ["virtue", "lesson", "answer"] },
  { sentence: "Proverb: \"Practice makes {{blank}}.\"", correctAnswer: "perfect", distractors: ["progress", "easier", "skill"] },
  { sentence: "Proverb: \"When in Rome, do as the {{blank}} do.\"", correctAnswer: "Romans", distractors: ["Italians", "natives", "locals"] },
  { sentence: "Proverb: \"All that glitters is not {{blank}}.\"", correctAnswer: "gold", distractors: ["silver", "shiny", "real"] },
  { sentence: "Proverb: \"Necessity is the mother of {{blank}}.\"", correctAnswer: "invention", distractors: ["progress", "creation", "wisdom"] },
  { sentence: "Proverb: \"A penny saved is a penny {{blank}}.\"", correctAnswer: "earned", distractors: ["spent", "made", "kept"] },
  { sentence: "Proverb: \"Two heads are better than {{blank}}.\"", correctAnswer: "one", distractors: ["none", "three", "many"] },
  { sentence: "Proverb: \"Actions speak louder than {{blank}}.\"", correctAnswer: "words", distractors: ["thoughts", "promises", "lies"] },
  { sentence: "Proverb: \"Better late than {{blank}}.\"", correctAnswer: "never", distractors: ["sorry", "early", "missing"] },
  { sentence: "Proverb: \"The grass is always greener on the other {{blank}}.\"", correctAnswer: "side", distractors: ["yard", "field", "hill"] },
  { sentence: "Proverb: \"Don't put all your eggs in one {{blank}}.\"", correctAnswer: "basket", distractors: ["bag", "box", "place"] },
  { sentence: "Proverb: \"You can lead a horse to water, but you can't make him {{blank}}.\"", correctAnswer: "drink", distractors: ["swim", "run", "stay"] },
  { sentence: "Proverb: \"The squeaky wheel gets the {{blank}}.\"", correctAnswer: "grease", distractors: ["money", "attention", "fix"] },

  // — Movies (timeless lines) —
  { sentence: "Star Wars: \"May the {{blank}} be with you.\"", correctAnswer: "Force", distractors: ["light", "stars", "power"] },
  { sentence: "The Godfather: \"I'm gonna make him an offer he can't {{blank}}.\"", correctAnswer: "refuse", distractors: ["resist", "deny", "ignore"] },
  { sentence: "Forrest Gump: \"Life is like a box of {{blank}}.\"", correctAnswer: "chocolates", distractors: ["candy", "gifts", "surprises"] },
  { sentence: "The Wizard of Oz: \"There's no place like {{blank}}.\"", correctAnswer: "home", distractors: ["earth", "Kansas", "here"] },
  { sentence: "Jerry Maguire: \"Show me the {{blank}}!\"", correctAnswer: "money", distractors: ["truth", "deal", "way"] },
  { sentence: "Apollo 13: \"Houston, we have a {{blank}}.\"", correctAnswer: "problem", distractors: ["situation", "issue", "crisis"] },
  { sentence: "The Terminator: \"I'll be {{blank}}.\"", correctAnswer: "back", distractors: ["here", "ready", "watching"] },
  { sentence: "Casablanca: \"Here's looking at you, {{blank}}.\"", correctAnswer: "kid", distractors: ["dear", "love", "friend"] },
  { sentence: "Dirty Harry: \"Go ahead, make my {{blank}}.\"", correctAnswer: "day", distractors: ["move", "year", "decision"] },
  { sentence: "Cool Hand Luke: \"What we've got here is failure to {{blank}}.\"", correctAnswer: "communicate", distractors: ["cooperate", "negotiate", "perform"] },

  // — Classic literature lines —
  { sentence: "Dickens opened with: \"It was the best of times, it was the worst of {{blank}}.\"", correctAnswer: "times", distractors: ["days", "years", "all"] },
  { sentence: "Austen wrote: \"It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a {{blank}}.\"", correctAnswer: "wife", distractors: ["partner", "friend", "title"] },
  { sentence: "Tolkien wrote: \"Not all those who wander are {{blank}}.\"", correctAnswer: "lost", distractors: ["lonely", "tired", "found"] },
  { sentence: "Twain said: \"The reports of my death have been greatly {{blank}}.\"", correctAnswer: "exaggerated", distractors: ["misstated", "rumored", "premature"] },
  { sentence: "Hemingway: \"The world breaks everyone, and afterward, some are strong at the broken {{blank}}.\"", correctAnswer: "places", distractors: ["parts", "edges", "spots"] },
  { sentence: "Frost wrote: \"Two roads diverged in a {{blank}} wood.\"", correctAnswer: "yellow", distractors: ["dark", "lonely", "snowy"] },
  { sentence: "Carroll wrote: \"Curiouser and {{blank}}!\"", correctAnswer: "curiouser", distractors: ["stranger", "wilder", "deeper"] },
  { sentence: "Orwell's 1984: \"Big {{blank}} is watching you.\"", correctAnswer: "Brother", distractors: ["Father", "Sister", "Mother"] },
  { sentence: "Salinger: \"Don't ever tell anybody anything. If you do, you start missing {{blank}}.\"", correctAnswer: "everybody", distractors: ["nobody", "somebody", "anybody"] },

  // — Songs & musicals —
  { sentence: "The Beatles sang: \"All you need is {{blank}}.\"", correctAnswer: "love", distractors: ["peace", "hope", "music"] },
  { sentence: "Queen sang: \"We are the {{blank}}, my friends.\"", correctAnswer: "champions", distractors: ["heroes", "legends", "winners"] },
  { sentence: "The Rolling Stones sang: \"You can't always get what you {{blank}}.\"", correctAnswer: "want", distractors: ["need", "love", "see"] },
  { sentence: "Frank Sinatra sang: \"I did it {{blank}} way.\"", correctAnswer: "my", distractors: ["the", "his", "your"] },
  { sentence: "Don McLean sang: \"Bye bye, Miss American {{blank}}.\"", correctAnswer: "Pie", distractors: ["Dream", "Star", "Soul"] },
  { sentence: "Lennon sang: \"Imagine all the {{blank}}.\"", correctAnswer: "people", distractors: ["children", "lovers", "dreamers"] },

  // — Other historic & philosophical —
  { sentence: "Descartes said: \"I think, therefore I {{blank}}.\"", correctAnswer: "am", distractors: ["dream", "live", "see"] },
  { sentence: "Socrates said: \"The only true wisdom is in knowing you know {{blank}}.\"", correctAnswer: "nothing", distractors: ["something", "everything", "little"] },
  { sentence: "Caesar said: \"Veni, vidi, {{blank}}.\" (I came, I saw, I conquered)", correctAnswer: "vici", distractors: ["vita", "veritas", "valor"] },
  { sentence: "Galileo said: \"And yet it {{blank}}.\" (about the Earth)", correctAnswer: "moves", distractors: ["spins", "turns", "rotates"] },
  { sentence: "Newton said: \"If I have seen further it is by standing on the shoulders of {{blank}}.\"", correctAnswer: "giants", distractors: ["masters", "heroes", "legends"] },
  { sentence: "Edison said: \"Genius is one percent inspiration and ninety-nine percent {{blank}}.\"", correctAnswer: "perspiration", distractors: ["dedication", "preparation", "concentration"] },
  { sentence: "Einstein said: \"Imagination is more important than {{blank}}.\"", correctAnswer: "knowledge", distractors: ["wisdom", "intelligence", "memory"] },
  { sentence: "Gandhi said: \"Be the {{blank}} you wish to see in the world.\"", correctAnswer: "change", distractors: ["good", "light", "peace"] },
  { sentence: "Mandela said: \"Education is the most powerful {{blank}} which you can use to change the world.\"", correctAnswer: "weapon", distractors: ["tool", "force", "gift"] },
  { sentence: "Churchill said: \"Never, never, never give {{blank}}.\"", correctAnswer: "up", distractors: ["in", "way", "out"] },
  { sentence: "Voltaire said: \"With great power comes great {{blank}}.\" (popularized later by Spider-Man)", correctAnswer: "responsibility", distractors: ["destiny", "ability", "humility"] },
  { sentence: "Confucius said: \"It does not matter how slowly you go as long as you do not {{blank}}.\"", correctAnswer: "stop", distractors: ["fall", "quit", "rest"] },
  { sentence: "Aristotle said: \"We are what we repeatedly {{blank}}.\"", correctAnswer: "do", distractors: ["think", "say", "feel"] },
  { sentence: "Plato said: \"The beginning is the most important part of the {{blank}}.\"", correctAnswer: "work", distractors: ["journey", "process", "plan"] },
];
