import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../../common/WriteScholarEditorialBackground';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';

interface GrammarCheckerPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

interface GrammarIssue {
  type: 'error' | 'warning' | 'suggestion';
  category: string;
  message: string;
  match: string;
  suggestion?: string;
  position?: number;
}

const GrammarCheckerPage = ({ onNavigate, user, onLogout }: GrammarCheckerPageProps) => {
  const [text, setText] = useState('');
  const [issues, setIssues] = useState<GrammarIssue[]>([]);

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Free Grammar Checker - Fix Spelling & Punctuation | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free online grammar checker. Find and fix spelling, punctuation, and grammar errors instantly. Get suggestions to improve your writing. No signup required.');
    }
  }, []);

  const grammarRules: { pattern: RegExp; type: 'error' | 'warning' | 'suggestion'; category: string; message: string; suggestion?: string }[] = [
    // Capitalization errors
    { pattern: /\bi\b(?!['\u2019])/g, type: 'error', category: 'Capitalization', message: '"i" should be capitalized to "I"', suggestion: 'I' },
    { pattern: /[.!?]\s+[a-z]/g, type: 'error', category: 'Capitalization', message: 'Sentence should start with a capital letter' },
    { pattern: /^[a-z]/g, type: 'error', category: 'Capitalization', message: 'Text should start with a capital letter' },
    
    // Common spelling errors
    { pattern: /\b(alot)\b/gi, type: 'error', category: 'Spelling', message: '"alot" should be "a lot"', suggestion: 'a lot' },
    { pattern: /\b(definately|definatly)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "definitely"', suggestion: 'definitely' },
    { pattern: /\b(seperate)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "separate"', suggestion: 'separate' },
    { pattern: /\b(occured)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "occurred"', suggestion: 'occurred' },
    { pattern: /\b(recieve)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "receive"', suggestion: 'receive' },
    { pattern: /\b(untill)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "until"', suggestion: 'until' },
    { pattern: /\b(wierd)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "weird"', suggestion: 'weird' },
    { pattern: /\b(accomodate)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "accommodate"', suggestion: 'accommodate' },
    { pattern: /\b(occurence)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "occurrence"', suggestion: 'occurrence' },
    { pattern: /\b(refering|reffering)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "referring"', suggestion: 'referring' },
    { pattern: /\b(begining)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "beginning"', suggestion: 'beginning' },
    { pattern: /\b(beleive|belive)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "believe"', suggestion: 'believe' },
    { pattern: /\b(calender)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "calendar"', suggestion: 'calendar' },
    { pattern: /\b(collegue)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "colleague"', suggestion: 'colleague' },
    { pattern: /\b(commited|comitted)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "committed"', suggestion: 'committed' },
    { pattern: /\b(concious)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "conscious"', suggestion: 'conscious' },
    { pattern: /\b(consensus)\b/gi, type: 'warning', category: 'Spelling', message: 'Double-check spelling of "consensus"' },
    { pattern: /\b(embarass|embaress)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "embarrass"', suggestion: 'embarrass' },
    { pattern: /\b(enviroment)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "environment"', suggestion: 'environment' },
    { pattern: /\b(explaination)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "explanation"', suggestion: 'explanation' },
    { pattern: /\b(foriegn)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "foreign"', suggestion: 'foreign' },
    { pattern: /\b(goverment)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "government"', suggestion: 'government' },
    { pattern: /\b(grammer)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "grammar"', suggestion: 'grammar' },
    { pattern: /\b(harrass)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "harass"', suggestion: 'harass' },
    { pattern: /\b(immediatly|imediately)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "immediately"', suggestion: 'immediately' },
    { pattern: /\b(independant)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "independent"', suggestion: 'independent' },
    { pattern: /\b(knowlege)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "knowledge"', suggestion: 'knowledge' },
    { pattern: /\b(liason)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "liaison"', suggestion: 'liaison' },
    { pattern: /\b(maintainance)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "maintenance"', suggestion: 'maintenance' },
    { pattern: /\b(millenium)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "millennium"', suggestion: 'millennium' },
    { pattern: /\b(miniscule)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "minuscule"', suggestion: 'minuscule' },
    { pattern: /\b(mispell)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "misspell"', suggestion: 'misspell' },
    { pattern: /\b(neccessary|necesary)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "necessary"', suggestion: 'necessary' },
    { pattern: /\b(noticable)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "noticeable"', suggestion: 'noticeable' },
    { pattern: /\b(occassion)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "occasion"', suggestion: 'occasion' },
    { pattern: /\b(pasttime)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "pastime"', suggestion: 'pastime' },
    { pattern: /\b(perseverence)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "perseverance"', suggestion: 'perseverance' },
    { pattern: /\b(posession)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "possession"', suggestion: 'possession' },
    { pattern: /\b(priviledge)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "privilege"', suggestion: 'privilege' },
    { pattern: /\b(pronounciation)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "pronunciation"', suggestion: 'pronunciation' },
    { pattern: /\b(publically)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "publicly"', suggestion: 'publicly' },
    { pattern: /\b(recomend)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "recommend"', suggestion: 'recommend' },
    { pattern: /\b(relevent)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "relevant"', suggestion: 'relevant' },
    { pattern: /\b(religous)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "religious"', suggestion: 'religious' },
    { pattern: /\b(restaraunt)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "restaurant"', suggestion: 'restaurant' },
    { pattern: /\b(succesful|successfull)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "successful"', suggestion: 'successful' },
    { pattern: /\b(suprise)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "surprise"', suggestion: 'surprise' },
    { pattern: /\b(tommorow|tommorrow)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "tomorrow"', suggestion: 'tomorrow' },
    { pattern: /\b(truely)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "truly"', suggestion: 'truly' },
    { pattern: /\b(writting)\b/gi, type: 'error', category: 'Spelling', message: 'Misspelling - should be "writing"', suggestion: 'writing' },
    
    // Commonly confused words
    { pattern: /\b(your)\s+(a|an)\b/gi, type: 'error', category: 'Grammar', message: 'Should be "you\'re" (you are)', suggestion: "you're" },
    { pattern: /\b(your)\s+(very|so|too|really)\b/gi, type: 'warning', category: 'Grammar', message: 'Check if "you\'re" (you are) is intended' },
    { pattern: /\b(its)\s+(a|an|the)\s+\w+ing\b/gi, type: 'warning', category: 'Grammar', message: 'Check if "it\'s" (it is) is intended' },
    { pattern: /\b(would of|could of|should of)\b/gi, type: 'error', category: 'Grammar', message: 'Should be "would have/could have/should have"' },
    { pattern: /\b(must of)\b/gi, type: 'error', category: 'Grammar', message: 'Should be "must have"', suggestion: 'must have' },
    { pattern: /\b(might of)\b/gi, type: 'error', category: 'Grammar', message: 'Should be "might have"', suggestion: 'might have' },
    { pattern: /\b(than)\s+(I|me|him|her|us|them)\s+(is|am|are|was|were)\b/gi, type: 'warning', category: 'Grammar', message: 'Check if "then" is intended instead of "than"' },
    { pattern: /\b(then)\s+\w+\s+(than|then)\b/gi, type: 'warning', category: 'Grammar', message: 'Possible confusion between "than" and "then"' },
    { pattern: /\b(affect)\s+(on|of)\b/gi, type: 'warning', category: 'Grammar', message: 'Check if "effect" (noun) is intended instead of "affect" (verb)' },
    { pattern: /\b(effect)\s+(a|the)\s+change\b/gi, type: 'warning', category: 'Grammar', message: 'Check if "affect" (verb) is intended' },
    { pattern: /\b(loose)\s+(weight|time|money|my|his|her|their)\b/gi, type: 'error', category: 'Grammar', message: '"Loose" means not tight; use "lose" for loss', suggestion: 'lose' },
    { pattern: /\b(lead)\s+(me|him|her|us|them)\s+(to|into)\b.*\b(yesterday|last|ago)\b/gi, type: 'warning', category: 'Grammar', message: 'Past tense of "lead" is "led"' },
    { pattern: /\b(who's)\s+(book|car|house|idea|fault)\b/gi, type: 'error', category: 'Grammar', message: '"Who\'s" means "who is"; use "whose" for possession', suggestion: 'whose' },
    { pattern: /\b(whose)\s+(going|coming|doing|making)\b/gi, type: 'error', category: 'Grammar', message: '"Whose" shows possession; use "who\'s" for "who is"', suggestion: "who's" },
    { pattern: /\b(there)\s+(going|coming|doing)\b/gi, type: 'error', category: 'Grammar', message: '"There" is a place; use "they\'re" for "they are"', suggestion: "they're" },
    { pattern: /\b(their)\s+(is|are|was|were)\b/gi, type: 'error', category: 'Grammar', message: '"Their" shows possession; use "there" or "they\'re"' },
    
    // Subject-verb agreement
    { pattern: /\b(everyone|everybody|someone|somebody|anyone|anybody|no one|nobody)\s+(are|were|have)\b/gi, type: 'error', category: 'Grammar', message: 'Indefinite pronouns take singular verbs (is/was/has)' },
    { pattern: /\b(each|every)\s+\w+\s+(are|were|have)\b/gi, type: 'warning', category: 'Grammar', message: '"Each" and "every" typically take singular verbs' },
    { pattern: /\b(none)\s+of\s+the\s+\w+\s+(are|were)\b/gi, type: 'suggestion', category: 'Grammar', message: '"None" can be singular or plural depending on context' },
    { pattern: /\b(the number of)\s+\w+\s+(are|were)\b/gi, type: 'error', category: 'Grammar', message: '"The number of" takes a singular verb' },
    { pattern: /\b(a number of)\s+\w+\s+(is|was)\b/gi, type: 'error', category: 'Grammar', message: '"A number of" takes a plural verb' },
    
    // Word choice issues
    { pattern: /\b(irregardless)\b/gi, type: 'error', category: 'Word Choice', message: '"irregardless" is not standard; use "regardless"', suggestion: 'regardless' },
    { pattern: /\b(supposably)\b/gi, type: 'error', category: 'Word Choice', message: '"supposably" should be "supposedly"', suggestion: 'supposedly' },
    { pattern: /\b(very unique|most unique|really unique)\b/gi, type: 'warning', category: 'Word Choice', message: '"Unique" is absolute; avoid modifiers like "very"' },
    { pattern: /\b(very perfect|most perfect)\b/gi, type: 'warning', category: 'Word Choice', message: '"Perfect" is absolute; avoid modifiers' },
    { pattern: /\b(more better|more worse)\b/gi, type: 'error', category: 'Word Choice', message: 'Double comparative - use "better" or "worse" alone' },
    { pattern: /\b(most best|most worst)\b/gi, type: 'error', category: 'Word Choice', message: 'Double superlative - use "best" or "worst" alone' },
    { pattern: /\b(could care less)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "couldn\'t care less"', suggestion: "couldn't care less" },
    { pattern: /\b(for all intensive purposes)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "for all intents and purposes"', suggestion: 'for all intents and purposes' },
    { pattern: /\b(peaked my interest)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "piqued my interest"', suggestion: 'piqued my interest' },
    { pattern: /\b(sneak peak)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "sneak peek"', suggestion: 'sneak peek' },
    { pattern: /\b(case and point)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "case in point"', suggestion: 'case in point' },
    { pattern: /\b(one in the same)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "one and the same"', suggestion: 'one and the same' },
    { pattern: /\b(escape goat)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "scapegoat"', suggestion: 'scapegoat' },
    { pattern: /\b(mute point)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "moot point"', suggestion: 'moot point' },
    { pattern: /\b(nip it in the butt)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "nip it in the bud"', suggestion: 'nip it in the bud' },
    { pattern: /\b(baited breath)\b/gi, type: 'error', category: 'Word Choice', message: 'Should be "bated breath"', suggestion: 'bated breath' },
    { pattern: /\b(chomping at the bit)\b/gi, type: 'warning', category: 'Word Choice', message: 'Traditional phrase is "champing at the bit"', suggestion: 'champing at the bit' },
    
    // Punctuation
    { pattern: /\s{2,}/g, type: 'warning', category: 'Punctuation', message: 'Multiple spaces detected', suggestion: ' ' },
    { pattern: /\.\.\.\./g, type: 'warning', category: 'Punctuation', message: 'Ellipsis should only have three dots (...)' },
    { pattern: /[!]{2,}/g, type: 'suggestion', category: 'Punctuation', message: 'Multiple exclamation marks - consider using just one' },
    { pattern: /[?]{2,}/g, type: 'suggestion', category: 'Punctuation', message: 'Multiple question marks - consider using just one' },
    { pattern: /\b(etc\.\.)/g, type: 'error', category: 'Punctuation', message: '"etc." only needs one period' },
    { pattern: /[,]{2,}/g, type: 'error', category: 'Punctuation', message: 'Multiple commas detected' },
    { pattern: /\s+[,]/g, type: 'warning', category: 'Punctuation', message: 'Space before comma' },
    { pattern: /\s+[.]/g, type: 'warning', category: 'Punctuation', message: 'Space before period' },
    { pattern: /[,][^\s]/g, type: 'warning', category: 'Punctuation', message: 'Missing space after comma' },
    
    // Redundancy
    { pattern: /\b(and etc)\b/gi, type: 'error', category: 'Redundancy', message: '"and etc" is redundant; "etc." already implies "and others"' },
    { pattern: /\b(very)\s+(very)\b/gi, type: 'warning', category: 'Redundancy', message: 'Repeated "very" - consider stronger word choice' },
    { pattern: /\b(ATM machine)\b/gi, type: 'warning', category: 'Redundancy', message: 'Redundant - ATM already means "machine"', suggestion: 'ATM' },
    { pattern: /\b(PIN number)\b/gi, type: 'warning', category: 'Redundancy', message: 'Redundant - PIN already includes "number"', suggestion: 'PIN' },
    { pattern: /\b(HIV virus)\b/gi, type: 'warning', category: 'Redundancy', message: 'Redundant - HIV already includes "virus"', suggestion: 'HIV' },
    { pattern: /\b(LCD display)\b/gi, type: 'warning', category: 'Redundancy', message: 'Redundant - LCD already includes "display"', suggestion: 'LCD' },
    { pattern: /\b(added bonus)\b/gi, type: 'suggestion', category: 'Redundancy', message: '"Added bonus" is redundant - bonuses are added', suggestion: 'bonus' },
    { pattern: /\b(close proximity)\b/gi, type: 'suggestion', category: 'Redundancy', message: '"Close proximity" is redundant', suggestion: 'proximity' },
    { pattern: /\b(end result)\b/gi, type: 'suggestion', category: 'Redundancy', message: '"End result" is redundant', suggestion: 'result' },
    { pattern: /\b(free gift)\b/gi, type: 'suggestion', category: 'Redundancy', message: '"Free gift" is redundant - gifts are free', suggestion: 'gift' },
    { pattern: /\b(past history)\b/gi, type: 'suggestion', category: 'Redundancy', message: '"Past history" is redundant', suggestion: 'history' },
    { pattern: /\b(plan ahead)\b/gi, type: 'suggestion', category: 'Redundancy', message: '"Plan ahead" is redundant - planning is for the future', suggestion: 'plan' },
    { pattern: /\b(repeat again)\b/gi, type: 'warning', category: 'Redundancy', message: '"Repeat again" is redundant', suggestion: 'repeat' },
    { pattern: /\b(revert back)\b/gi, type: 'warning', category: 'Redundancy', message: '"Revert back" is redundant', suggestion: 'revert' },
    
    // Style/conciseness
    { pattern: /\b(basically|actually|literally|really|very|just)\b/gi, type: 'suggestion', category: 'Style', message: 'Filler word detected - consider if it\'s necessary' },
    { pattern: /\b(in order to)\b/gi, type: 'suggestion', category: 'Conciseness', message: '"In order to" can usually be shortened to "to"', suggestion: 'to' },
    { pattern: /\b(due to the fact that)\b/gi, type: 'suggestion', category: 'Conciseness', message: '"Due to the fact that" can be shortened to "because"', suggestion: 'because' },
    { pattern: /\b(at this point in time)\b/gi, type: 'suggestion', category: 'Conciseness', message: '"At this point in time" can be shortened to "now"', suggestion: 'now' },
    { pattern: /\b(in the event that)\b/gi, type: 'suggestion', category: 'Conciseness', message: '"In the event that" can be shortened to "if"', suggestion: 'if' },
    { pattern: /\b(in spite of the fact that)\b/gi, type: 'suggestion', category: 'Conciseness', message: '"In spite of the fact that" can be shortened to "although"', suggestion: 'although' },
    { pattern: /\b(for the purpose of)\b/gi, type: 'suggestion', category: 'Conciseness', message: '"For the purpose of" can be shortened to "to" or "for"', suggestion: 'for' },
    { pattern: /\b(with regard to|with respect to)\b/gi, type: 'suggestion', category: 'Conciseness', message: 'Can be shortened to "about" or "regarding"', suggestion: 'about' },
    { pattern: /\b(it is important to note that)\b/gi, type: 'suggestion', category: 'Conciseness', message: 'Consider removing - just state the point directly' },
    { pattern: /\b(it should be noted that)\b/gi, type: 'suggestion', category: 'Conciseness', message: 'Consider removing - just state the point directly' },
    { pattern: /\b(the reason why is that)\b/gi, type: 'suggestion', category: 'Conciseness', message: 'Can be shortened to "because"', suggestion: 'because' },
    { pattern: /\b(in my opinion|i think that|i believe that)\b/gi, type: 'suggestion', category: 'Style', message: 'Often unnecessary in academic writing - just state your view' },
    { pattern: /\b(in today's society|in modern society)\b/gi, type: 'suggestion', category: 'Style', message: 'Can often be shortened to "today" or removed' },
    { pattern: /\b(each and every)\b/gi, type: 'suggestion', category: 'Redundancy', message: '"Each and every" is redundant - use "each" or "every"' },
    { pattern: /\b(first and foremost)\b/gi, type: 'suggestion', category: 'Redundancy', message: '"First and foremost" is redundant - use "first"', suggestion: 'first' },
    { pattern: /\b(the fact of the matter is)\b/gi, type: 'suggestion', category: 'Conciseness', message: 'Wordy phrase - state the fact directly' },
    { pattern: /\b(as a matter of fact)\b/gi, type: 'suggestion', category: 'Conciseness', message: 'Can often be removed or replaced with "indeed"' },
    { pattern: /\b(in conclusion|to conclude|in summary)\b/gi, type: 'suggestion', category: 'Style', message: 'In academic writing, these phrases can often be removed' },
  ];

  useEffect(() => {
    if (!text.trim()) {
      setIssues([]);
      return;
    }

    const foundIssues: GrammarIssue[] = [];
    const seenMessages = new Set<string>();

    grammarRules.forEach(rule => {
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        const key = `${rule.message}-${match[0].toLowerCase()}`;
        if (!seenMessages.has(key)) {
          seenMessages.add(key);
          foundIssues.push({
            type: rule.type,
            category: rule.category,
            message: rule.message,
            match: match[0],
            suggestion: rule.suggestion,
            position: match.index
          });
        }
      }
    });

    foundIssues.sort((a, b) => (a.position || 0) - (b.position || 0));
    setIssues(foundIssues.slice(0, 25));
  }, [text]);

  const getIssueColor = (type: 'error' | 'warning' | 'suggestion') => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200 text-red-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'suggestion': return 'bg-violet-50 border-violet-200 text-violet-700';
    }
  };

  const getIssueIcon = (type: 'error' | 'warning' | 'suggestion') => {
    switch (type) {
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'suggestion': return '💡';
    }
  };

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const suggestionCount = issues.filter(i => i.type === 'suggestion').length;

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="grammar-checker" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-red-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Grammar Checker
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Check your writing for 100+ common spelling, grammar, punctuation, and style errors. Instant client-side analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Text Input Area */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Text</h2>
                  <button
                    onClick={() => setText('')}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium"
                  >
                    Clear
                  </button>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or type your text here to check for grammar and spelling errors. Try typing 'I recieve alot of emails' to see it in action..."
                  className="w-full h-80 p-4 text-gray-700 bg-gray-50 border-0 rounded-xl outline-none resize-none placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
                
                {/* Stats */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-gray-500">{wordCount} words • {sentenceCount} sentences</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      <span className="text-gray-600">{errorCount} errors</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                      <span className="text-gray-600">{warningCount} warnings</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 bg-violet-500 rounded-full"></span>
                      <span className="text-gray-600">{suggestionCount} suggestions</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues Panel */}
            <div className="space-y-4">
              {issues.length > 0 ? (
                <>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues Found ({issues.length})</h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {issues.map((issue, index) => (
                        <div key={index} className={`p-3 rounded-xl border ${getIssueColor(issue.type)}`}>
                          <div className="flex items-start space-x-2">
                            <span className="text-lg flex-shrink-0">{getIssueIcon(issue.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium opacity-70 mb-1">{issue.category}</div>
                              <div className="text-sm font-medium">{issue.message}</div>
                              {issue.match && (
                                <div className="text-xs mt-1 opacity-70 truncate">Found: "{issue.match}"</div>
                              )}
                              {issue.suggestion && (
                                <div className="text-xs mt-1 flex items-center space-x-1">
                                  <span>→</span>
                                  <span className="font-medium bg-white/50 px-1.5 py-0.5 rounded">{issue.suggestion}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> This tool checks for common issues. For comprehensive context-aware grammar analysis, try WriteScholar's AI tools.
                    </p>
                  </div>
                </>
              ) : text ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-green-800 mb-1">Looking Good!</h3>
                  <p className="text-sm text-green-600">No common issues detected</p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Your Text</h3>
                  <p className="text-gray-500 text-sm">Paste text to check for 100+ common grammar and style issues</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What We Check Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What We Check For</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-red-600 font-bold text-lg">Aa</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">50+ Spelling Errors</h3>
              <p className="text-gray-600 text-sm">Common misspellings like "definately", "seperate", "occured", and many more.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-yellow-600 font-bold text-lg">!</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Grammar Rules</h3>
              <p className="text-gray-600 text-sm">Subject-verb agreement, commonly confused words (your/you're, its/it's, etc.).</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-violet-600 font-bold text-lg">"</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Word Choice</h3>
              <p className="text-gray-600 text-sm">Common malapropisms like "for all intensive purposes" or "escape goat".</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-red-600 font-bold text-lg">✂</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Style & Conciseness</h3>
              <p className="text-gray-600 text-sm">Wordy phrases, redundancies, and filler words that weaken your writing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Need advanced grammar checking?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            WriteScholar uses AI to understand context and provide comprehensive grammar analysis, style suggestions, and academic writing feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Try WriteScholar Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default GrammarCheckerPage;
