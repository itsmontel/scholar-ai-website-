/**
 * Word Blitz — Trivia "Play for Fun" bank.
 *
 * Cloze-style sentences (one blank per sentence) with one correct answer
 * and three plausible distractors. The frontend assembles the four answer
 * buttons by combining `correctAnswer + distractors`, then runs the
 * Fisher-Yates shuffle (with the no-3-in-a-row safety) before display.
 *
 * The blank token is the literal string "{{blank}}" — `WordBlitzPage` splits
 * on this token and renders a styled inline pill in its place. Keep the
 * sentence under ~20 words and pick distractors from the same category
 * (so e.g. blanking an organ → other organs, blanking a year → other
 * years from the same era).
 */

export interface WordBlitzBankQuestion {
  /** Cloze sentence containing the literal "{{blank}}" token. */
  sentence: string;
  /** Word(s) that fill the blank correctly. 1-3 words ideal. */
  correctAnswer: string;
  /** Exactly three plausible-but-wrong alternatives, same category. */
  distractors: [string, string, string];
}

export const WORD_BLITZ_TRIVIA_BANK: WordBlitzBankQuestion[] = [
  // — Geography (capitals, landmarks, rivers) —
  { sentence: "The capital of France is {{blank}}.", correctAnswer: "Paris", distractors: ["Lyon", "Marseille", "Nice"] },
  { sentence: "The capital of Japan is {{blank}}.", correctAnswer: "Tokyo", distractors: ["Osaka", "Kyoto", "Nagoya"] },
  { sentence: "The capital of Australia is {{blank}}.", correctAnswer: "Canberra", distractors: ["Sydney", "Melbourne", "Perth"] },
  { sentence: "The capital of Canada is {{blank}}.", correctAnswer: "Ottawa", distractors: ["Toronto", "Montreal", "Vancouver"] },
  { sentence: "The capital of Brazil is {{blank}}.", correctAnswer: "Brasília", distractors: ["Rio de Janeiro", "São Paulo", "Salvador"] },
  { sentence: "The capital of Egypt is {{blank}}.", correctAnswer: "Cairo", distractors: ["Alexandria", "Luxor", "Giza"] },
  { sentence: "The capital of South Korea is {{blank}}.", correctAnswer: "Seoul", distractors: ["Busan", "Incheon", "Daegu"] },
  { sentence: "The capital of India is {{blank}}.", correctAnswer: "New Delhi", distractors: ["Mumbai", "Kolkata", "Chennai"] },
  { sentence: "The capital of Russia is {{blank}}.", correctAnswer: "Moscow", distractors: ["St. Petersburg", "Kazan", "Sochi"] },
  { sentence: "The capital of Argentina is {{blank}}.", correctAnswer: "Buenos Aires", distractors: ["Córdoba", "Rosario", "Mendoza"] },
  { sentence: "The longest river on Earth is the {{blank}}.", correctAnswer: "Nile", distractors: ["Amazon", "Yangtze", "Mississippi"] },
  { sentence: "The largest ocean on Earth is the {{blank}} Ocean.", correctAnswer: "Pacific", distractors: ["Atlantic", "Indian", "Arctic"] },
  { sentence: "The tallest mountain on Earth is Mount {{blank}}.", correctAnswer: "Everest", distractors: ["K2", "Kilimanjaro", "Denali"] },
  { sentence: "The Great Barrier Reef is off the coast of {{blank}}.", correctAnswer: "Australia", distractors: ["Indonesia", "Brazil", "Mexico"] },
  { sentence: "The Sahara Desert is on the continent of {{blank}}.", correctAnswer: "Africa", distractors: ["Asia", "Australia", "South America"] },
  { sentence: "The Amazon rainforest is mostly in {{blank}}.", correctAnswer: "Brazil", distractors: ["Peru", "Colombia", "Venezuela"] },
  { sentence: "The Eiffel Tower is located in {{blank}}.", correctAnswer: "Paris", distractors: ["Rome", "Madrid", "London"] },
  { sentence: "Mount Fuji is the tallest mountain in {{blank}}.", correctAnswer: "Japan", distractors: ["China", "Korea", "Vietnam"] },
  { sentence: "The Statue of Liberty was a gift from {{blank}}.", correctAnswer: "France", distractors: ["England", "Spain", "Italy"] },
  { sentence: "The Vatican City is located inside {{blank}}.", correctAnswer: "Rome", distractors: ["Florence", "Milan", "Venice"] },

  // — Science (biology, chemistry, physics, astronomy) —
  { sentence: "The mitochondria is the {{blank}} of the cell.", correctAnswer: "powerhouse", distractors: ["nucleus", "ribosome", "membrane"] },
  { sentence: "Plants make food through a process called {{blank}}.", correctAnswer: "photosynthesis", distractors: ["respiration", "digestion", "fermentation"] },
  { sentence: "The chemical symbol for gold is {{blank}}.", correctAnswer: "Au", distractors: ["Ag", "Fe", "Cu"] },
  { sentence: "The chemical symbol for iron is {{blank}}.", correctAnswer: "Fe", distractors: ["Ir", "In", "Au"] },
  { sentence: "Water boils at {{blank}} degrees Celsius.", correctAnswer: "100", distractors: ["90", "110", "212"] },
  { sentence: "Water freezes at {{blank}} degrees Celsius.", correctAnswer: "0", distractors: ["32", "10", "-10"] },
  { sentence: "The largest organ in the human body is the {{blank}}.", correctAnswer: "skin", distractors: ["liver", "brain", "heart"] },
  { sentence: "An adult human has {{blank}} bones.", correctAnswer: "206", distractors: ["198", "212", "220"] },
  { sentence: "DNA is made of two strands twisted into a {{blank}}.", correctAnswer: "double helix", distractors: ["triangle", "spiral cone", "hexagon"] },
  { sentence: "Plants absorb {{blank}} from the air during photosynthesis.", correctAnswer: "carbon dioxide", distractors: ["oxygen", "nitrogen", "hydrogen"] },
  { sentence: "The center of an atom is called the {{blank}}.", correctAnswer: "nucleus", distractors: ["electron", "proton shell", "orbital"] },
  { sentence: "The closest planet to the Sun is {{blank}}.", correctAnswer: "Mercury", distractors: ["Venus", "Earth", "Mars"] },
  { sentence: "The Red Planet is {{blank}}.", correctAnswer: "Mars", distractors: ["Venus", "Jupiter", "Mercury"] },
  { sentence: "The largest planet in our solar system is {{blank}}.", correctAnswer: "Jupiter", distractors: ["Saturn", "Neptune", "Uranus"] },
  { sentence: "Light from the Sun takes about {{blank}} minutes to reach Earth.", correctAnswer: "8", distractors: ["3", "15", "30"] },
  { sentence: "The hardest natural substance on Earth is {{blank}}.", correctAnswer: "diamond", distractors: ["quartz", "graphite", "topaz"] },
  { sentence: "The most abundant gas in Earth's atmosphere is {{blank}}.", correctAnswer: "nitrogen", distractors: ["oxygen", "carbon dioxide", "argon"] },
  { sentence: "Sound travels faster through {{blank}} than through air.", correctAnswer: "water", distractors: ["a vacuum", "ice", "fog"] },
  { sentence: "A baby kangaroo is called a {{blank}}.", correctAnswer: "joey", distractors: ["cub", "kit", "calf"] },
  { sentence: "Bees produce honey by collecting {{blank}}.", correctAnswer: "nectar", distractors: ["pollen", "sap", "dew"] },

  // — History (events, people, eras) —
  { sentence: "World War II ended in the year {{blank}}.", correctAnswer: "1945", distractors: ["1944", "1946", "1943"] },
  { sentence: "World War I began in the year {{blank}}.", correctAnswer: "1914", distractors: ["1913", "1915", "1916"] },
  { sentence: "Christopher Columbus reached the Americas in {{blank}}.", correctAnswer: "1492", distractors: ["1485", "1500", "1520"] },
  { sentence: "The Berlin Wall fell in the year {{blank}}.", correctAnswer: "1989", distractors: ["1988", "1990", "1991"] },
  { sentence: "The Titanic sank in the year {{blank}}.", correctAnswer: "1912", distractors: ["1910", "1914", "1908"] },
  { sentence: "The first humans landed on the Moon in {{blank}}.", correctAnswer: "1969", distractors: ["1967", "1971", "1973"] },
  { sentence: "The first president of the United States was {{blank}}.", correctAnswer: "George Washington", distractors: ["John Adams", "Thomas Jefferson", "Benjamin Franklin"] },
  { sentence: "The Declaration of Independence was written by {{blank}}.", correctAnswer: "Thomas Jefferson", distractors: ["George Washington", "John Adams", "Benjamin Franklin"] },
  { sentence: "The Roman Empire built the {{blank}} in Rome.", correctAnswer: "Colosseum", distractors: ["Acropolis", "Parthenon", "Hagia Sophia"] },
  { sentence: "The pyramids of Giza were built in ancient {{blank}}.", correctAnswer: "Egypt", distractors: ["Greece", "Persia", "Mesopotamia"] },
  { sentence: "The first man in space was {{blank}}.", correctAnswer: "Yuri Gagarin", distractors: ["Neil Armstrong", "John Glenn", "Buzz Aldrin"] },
  { sentence: "The Renaissance began in the country of {{blank}}.", correctAnswer: "Italy", distractors: ["France", "England", "Germany"] },
  { sentence: "The French Revolution began in {{blank}}.", correctAnswer: "1789", distractors: ["1776", "1804", "1812"] },
  { sentence: "The longest-reigning British monarch was Queen {{blank}}.", correctAnswer: "Elizabeth II", distractors: ["Victoria", "Elizabeth I", "Anne"] },
  { sentence: "The ancient city of Troy was located in modern-day {{blank}}.", correctAnswer: "Turkey", distractors: ["Greece", "Italy", "Egypt"] },

  // — Arts & Literature —
  { sentence: "Shakespeare wrote the play Romeo and {{blank}}.", correctAnswer: "Juliet", distractors: ["Helena", "Ophelia", "Portia"] },
  { sentence: "The Mona Lisa was painted by Leonardo da {{blank}}.", correctAnswer: "Vinci", distractors: ["Pisa", "Roma", "Firenze"] },
  { sentence: "The author of Pride and Prejudice is Jane {{blank}}.", correctAnswer: "Austen", distractors: ["Eyre", "Brontë", "Woolf"] },
  { sentence: "Vincent van Gogh painted The Starry {{blank}}.", correctAnswer: "Night", distractors: ["Sky", "Sea", "Field"] },
  { sentence: "The author of 1984 is George {{blank}}.", correctAnswer: "Orwell", distractors: ["Huxley", "Bradbury", "Wells"] },
  { sentence: "Harry Potter was written by J.K. {{blank}}.", correctAnswer: "Rowling", distractors: ["Lewis", "Tolkien", "Pullman"] },
  { sentence: "The Great Gatsby was written by F. Scott {{blank}}.", correctAnswer: "Fitzgerald", distractors: ["Hemingway", "Steinbeck", "Faulkner"] },
  { sentence: "Pablo Picasso helped create an art style called {{blank}}.", correctAnswer: "Cubism", distractors: ["Realism", "Impressionism", "Surrealism"] },
  { sentence: "A standard piano has {{blank}} keys.", correctAnswer: "88", distractors: ["64", "72", "96"] },
  { sentence: "A standard sonnet has {{blank}} lines.", correctAnswer: "14", distractors: ["10", "12", "16"] },

  // — Sports —
  { sentence: "A soccer team has {{blank}} players on the field.", correctAnswer: "11", distractors: ["10", "9", "12"] },
  { sentence: "A basketball team has {{blank}} players on the court.", correctAnswer: "5", distractors: ["6", "4", "7"] },
  { sentence: "In bowling, a perfect game scores {{blank}}.", correctAnswer: "300", distractors: ["200", "250", "400"] },
  { sentence: "There are {{blank}} rings on the Olympic flag.", correctAnswer: "5", distractors: ["4", "6", "7"] },
  { sentence: "A standard chess board has {{blank}} squares.", correctAnswer: "64", distractors: ["48", "72", "100"] },
  { sentence: "In tennis, the score after the first point is called {{blank}}.", correctAnswer: "fifteen", distractors: ["thirty", "love", "forty"] },
  { sentence: "A hockey game has {{blank}} periods.", correctAnswer: "three", distractors: ["two", "four", "five"] },
  { sentence: "The sport of using a shuttlecock is called {{blank}}.", correctAnswer: "badminton", distractors: ["squash", "tennis", "table tennis"] },
  { sentence: "A standard deck has {{blank}} playing cards.", correctAnswer: "52", distractors: ["48", "54", "50"] },
  { sentence: "In baseball, a home run scores {{blank}} runs minimum.", correctAnswer: "one", distractors: ["two", "three", "four"] },

  // — Misc / pop culture (timeless) —
  { sentence: "A spider has {{blank}} legs.", correctAnswer: "eight", distractors: ["six", "ten", "four"] },
  { sentence: "An octopus has {{blank}} arms.", correctAnswer: "eight", distractors: ["six", "ten", "twelve"] },
  { sentence: "A standard year has {{blank}} days.", correctAnswer: "365", distractors: ["360", "366", "364"] },
  { sentence: "The freezing point of water in Fahrenheit is {{blank}}.", correctAnswer: "32", distractors: ["0", "40", "212"] },
  { sentence: "The currency of Japan is the {{blank}}.", correctAnswer: "yen", distractors: ["won", "yuan", "rupee"] },
  { sentence: "The currency of the UK is the {{blank}}.", correctAnswer: "pound", distractors: ["euro", "dollar", "kroner"] },
  { sentence: "Sushi originated in the country of {{blank}}.", correctAnswer: "Japan", distractors: ["China", "Korea", "Thailand"] },
  { sentence: "Pasta is most associated with {{blank}}.", correctAnswer: "Italy", distractors: ["Spain", "Greece", "France"] },
  { sentence: "The main ingredient in guacamole is {{blank}}.", correctAnswer: "avocado", distractors: ["lime", "tomato", "onion"] },
  { sentence: "The main ingredient in hummus is {{blank}}.", correctAnswer: "chickpeas", distractors: ["lentils", "beans", "peas"] },
  { sentence: "A baby cat is called a {{blank}}.", correctAnswer: "kitten", distractors: ["cub", "pup", "calf"] },
  { sentence: "A baby dog is called a {{blank}}.", correctAnswer: "puppy", distractors: ["cub", "kit", "joey"] },
];
