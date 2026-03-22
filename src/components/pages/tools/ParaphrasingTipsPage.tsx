import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../../common/WriteScholarEditorialBackground';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';

interface ParaphrasingTipsPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

interface WordAnalysis {
  overusedWords: { word: string; count: number; suggestions: string[] }[];
  passiveVoice: { phrase: string; suggestion: string }[];
  wordyPhrases: { original: string; suggestion: string }[];
  weakVerbs: { verb: string; count: number; alternatives: string[] }[];
  cliches: string[];
  hedgingLanguage: string[];
  totalWords: number;
  uniqueWords: number;
  vocabularyDiversity: number;
  sentenceVariety: { short: number; medium: number; long: number };
  avgSentenceLength: number;
}

const ParaphrasingTipsPage = ({ onNavigate, user, onLogout }: ParaphrasingTipsPageProps) => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<WordAnalysis | null>(null);

  // SEO: Set page title and meta description
  useEffect(() => {
    document.title = 'Free Paraphrasing Tips Tool - Improve Your Writing Style | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free paraphrasing tips tool. Get synonym suggestions, identify wordy phrases, detect passive voice, and improve your writing style. No signup required.');
    }
  }, []);

  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'if', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'once', 'any', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'being', 'having', 'doing', 'because', 'while', 'although', 'though', 'however', 'therefore', 'thus', 'hence', 'since', 'until', 'unless', 'whether']);

  const synonymSuggestions: Record<string, string[]> = {
    // Academic verbs
    'important': ['significant', 'crucial', 'essential', 'vital', 'key', 'critical', 'paramount', 'pivotal'],
    'good': ['excellent', 'effective', 'beneficial', 'favorable', 'positive', 'advantageous', 'valuable', 'constructive'],
    'bad': ['negative', 'detrimental', 'unfavorable', 'poor', 'adverse', 'harmful', 'problematic', 'inadequate'],
    'big': ['large', 'substantial', 'significant', 'considerable', 'extensive', 'major', 'vast', 'immense'],
    'small': ['minor', 'limited', 'minimal', 'modest', 'slight', 'marginal', 'negligible', 'trivial'],
    'many': ['numerous', 'several', 'various', 'multiple', 'countless', 'abundant', 'myriad', 'a plethora of'],
    'very': ['highly', 'extremely', 'particularly', 'considerably', 'remarkably', 'exceptionally', 'notably'],
    'thing': ['aspect', 'element', 'factor', 'component', 'item', 'entity', 'phenomenon', 'concept'],
    'things': ['aspects', 'elements', 'factors', 'components', 'items', 'entities', 'phenomena', 'concepts'],
    'show': ['demonstrate', 'illustrate', 'indicate', 'reveal', 'display', 'exhibit', 'present', 'depict'],
    'shows': ['demonstrates', 'illustrates', 'indicates', 'reveals', 'displays', 'exhibits', 'presents', 'depicts'],
    'get': ['obtain', 'acquire', 'receive', 'achieve', 'gain', 'attain', 'secure', 'procure'],
    'got': ['obtained', 'acquired', 'received', 'achieved', 'gained', 'attained', 'secured', 'procured'],
    'make': ['create', 'develop', 'produce', 'generate', 'establish', 'construct', 'formulate', 'devise'],
    'made': ['created', 'developed', 'produced', 'generated', 'established', 'constructed', 'formulated', 'devised'],
    'use': ['utilize', 'employ', 'apply', 'implement', 'adopt', 'leverage', 'harness'],
    'used': ['utilized', 'employed', 'applied', 'implemented', 'adopted', 'leveraged', 'harnessed'],
    'help': ['assist', 'support', 'aid', 'facilitate', 'enable', 'contribute to', 'foster'],
    'helps': ['assists', 'supports', 'aids', 'facilitates', 'enables', 'contributes to', 'fosters'],
    'think': ['believe', 'consider', 'argue', 'suggest', 'maintain', 'contend', 'posit', 'hypothesize'],
    'said': ['stated', 'noted', 'argued', 'claimed', 'asserted', 'maintained', 'observed', 'remarked'],
    'says': ['states', 'notes', 'argues', 'claims', 'asserts', 'maintains', 'observes', 'remarks'],
    'look': ['examine', 'analyze', 'investigate', 'explore', 'scrutinize', 'assess', 'evaluate'],
    'looks': ['examines', 'analyzes', 'investigates', 'explores', 'scrutinizes', 'assesses', 'evaluates'],
    'find': ['discover', 'identify', 'determine', 'ascertain', 'establish', 'uncover', 'detect'],
    'found': ['discovered', 'identified', 'determined', 'ascertained', 'established', 'uncovered', 'detected'],
    'give': ['provide', 'offer', 'present', 'deliver', 'supply', 'furnish', 'grant'],
    'gives': ['provides', 'offers', 'presents', 'delivers', 'supplies', 'furnishes', 'grants'],
    'change': ['alter', 'modify', 'transform', 'adjust', 'revise', 'adapt', 'shift'],
    'changed': ['altered', 'modified', 'transformed', 'adjusted', 'revised', 'adapted', 'shifted'],
    'problem': ['issue', 'challenge', 'concern', 'difficulty', 'obstacle', 'complication', 'predicament'],
    'problems': ['issues', 'challenges', 'concerns', 'difficulties', 'obstacles', 'complications', 'predicaments'],
    'part': ['component', 'element', 'aspect', 'portion', 'segment', 'section', 'constituent'],
    'parts': ['components', 'elements', 'aspects', 'portions', 'segments', 'sections', 'constituents'],
    'way': ['method', 'approach', 'manner', 'means', 'technique', 'strategy', 'mechanism'],
    'ways': ['methods', 'approaches', 'manners', 'means', 'techniques', 'strategies', 'mechanisms'],
    'point': ['aspect', 'argument', 'contention', 'observation', 'assertion', 'claim'],
    'idea': ['concept', 'notion', 'theory', 'proposition', 'hypothesis', 'premise'],
    'ideas': ['concepts', 'notions', 'theories', 'propositions', 'hypotheses', 'premises'],
    'really': ['indeed', 'certainly', 'genuinely', 'truly', 'particularly', 'significantly'],
    'a lot': ['considerably', 'significantly', 'substantially', 'extensively', 'markedly'],
    'basically': ['fundamentally', 'essentially', 'primarily', 'principally'],
    'actually': ['in fact', 'indeed', 'essentially', 'in reality'],
    'different': ['distinct', 'diverse', 'varied', 'various', 'disparate', 'dissimilar'],
    'same': ['identical', 'equivalent', 'similar', 'comparable', 'analogous'],
    'new': ['novel', 'innovative', 'recent', 'contemporary', 'modern', 'emerging'],
    'old': ['previous', 'former', 'traditional', 'established', 'longstanding', 'historical'],
    'interesting': ['compelling', 'intriguing', 'noteworthy', 'remarkable', 'significant', 'fascinating'],
    'hard': ['difficult', 'challenging', 'demanding', 'arduous', 'complex', 'rigorous'],
    'easy': ['simple', 'straightforward', 'uncomplicated', 'effortless', 'manageable'],
    'clear': ['evident', 'apparent', 'obvious', 'explicit', 'unambiguous', 'distinct'],
    'fast': ['rapid', 'swift', 'quick', 'expeditious', 'accelerated'],
    'slow': ['gradual', 'measured', 'deliberate', 'unhurried', 'prolonged'],
    'start': ['begin', 'commence', 'initiate', 'launch', 'embark on'],
    'end': ['conclude', 'terminate', 'finish', 'complete', 'cease'],
    'increase': ['rise', 'grow', 'expand', 'escalate', 'surge', 'intensify'],
    'decrease': ['decline', 'diminish', 'reduce', 'drop', 'fall', 'shrink'],
    // Additional academic words
    'study': ['research', 'investigation', 'analysis', 'examination', 'inquiry', 'exploration'],
    'studies': ['research', 'investigations', 'analyses', 'examinations', 'inquiries', 'explorations'],
    'result': ['outcome', 'consequence', 'finding', 'effect', 'conclusion', 'implication'],
    'results': ['outcomes', 'consequences', 'findings', 'effects', 'conclusions', 'implications'],
    'cause': ['lead to', 'result in', 'trigger', 'induce', 'generate', 'produce'],
    'caused': ['led to', 'resulted in', 'triggered', 'induced', 'generated', 'produced'],
    'because': ['since', 'as', 'due to', 'owing to', 'given that', 'considering'],
    'however': ['nevertheless', 'nonetheless', 'yet', 'still', 'conversely', 'on the other hand'],
    'also': ['additionally', 'furthermore', 'moreover', 'likewise', 'similarly', 'in addition'],
    'although': ['though', 'even though', 'despite', 'while', 'whereas', 'notwithstanding'],
    'because of': ['due to', 'owing to', 'as a result of', 'on account of', 'by virtue of'],
    'about': ['concerning', 'regarding', 'relating to', 'pertaining to', 'with respect to'],
    'need': ['require', 'necessitate', 'demand', 'call for', 'warrant'],
    'needs': ['requires', 'necessitates', 'demands', 'calls for', 'warrants'],
    'affect': ['influence', 'impact', 'alter', 'modify', 'shape', 'determine'],
    'affects': ['influences', 'impacts', 'alters', 'modifies', 'shapes', 'determines'],
    'seem': ['appear', 'look', 'suggest', 'indicate', 'imply'],
    'seems': ['appears', 'looks', 'suggests', 'indicates', 'implies'],
    'try': ['attempt', 'endeavor', 'strive', 'seek', 'aim'],
    'tried': ['attempted', 'endeavored', 'strove', 'sought', 'aimed'],
    'keep': ['maintain', 'retain', 'preserve', 'sustain', 'uphold'],
    'kept': ['maintained', 'retained', 'preserved', 'sustained', 'upheld'],
    'tell': ['inform', 'notify', 'advise', 'communicate', 'convey'],
    'told': ['informed', 'notified', 'advised', 'communicated', 'conveyed'],
    'know': ['understand', 'recognize', 'comprehend', 'realize', 'acknowledge'],
    'known': ['understood', 'recognized', 'comprehended', 'realized', 'acknowledged'],
    'believe': ['consider', 'maintain', 'assert', 'contend', 'argue', 'posit'],
    'believed': ['considered', 'maintained', 'asserted', 'contended', 'argued', 'posited'],
    'suggest': ['propose', 'recommend', 'indicate', 'imply', 'advocate', 'put forward'],
    'suggests': ['proposes', 'recommends', 'indicates', 'implies', 'advocates', 'puts forward'],
    'explain': ['clarify', 'elucidate', 'describe', 'illustrate', 'elaborate', 'expound'],
    'explains': ['clarifies', 'elucidates', 'describes', 'illustrates', 'elaborates', 'expounds'],
    'support': ['endorse', 'advocate', 'back', 'uphold', 'substantiate', 'corroborate'],
    'supports': ['endorses', 'advocates', 'backs', 'upholds', 'substantiates', 'corroborates'],
    'develop': ['create', 'establish', 'formulate', 'devise', 'construct', 'cultivate'],
    'developed': ['created', 'established', 'formulated', 'devised', 'constructed', 'cultivated'],
    'provide': ['supply', 'offer', 'furnish', 'deliver', 'present', 'afford'],
    'provides': ['supplies', 'offers', 'furnishes', 'delivers', 'presents', 'affords'],
    'include': ['comprise', 'encompass', 'incorporate', 'contain', 'consist of'],
    'includes': ['comprises', 'encompasses', 'incorporates', 'contains', 'consists of'],
    'focus': ['concentrate', 'center', 'emphasize', 'highlight', 'prioritize'],
    'focused': ['concentrated', 'centered', 'emphasized', 'highlighted', 'prioritized'],
    'describe': ['depict', 'portray', 'characterize', 'outline', 'delineate', 'illustrate'],
    'describes': ['depicts', 'portrays', 'characterizes', 'outlines', 'delineates', 'illustrates'],
    'happen': ['occur', 'take place', 'transpire', 'arise', 'emerge', 'unfold'],
    'happened': ['occurred', 'took place', 'transpired', 'arose', 'emerged', 'unfolded'],
    'improve': ['enhance', 'strengthen', 'refine', 'optimize', 'ameliorate', 'upgrade'],
    'improved': ['enhanced', 'strengthened', 'refined', 'optimized', 'ameliorated', 'upgraded'],
    'create': ['produce', 'generate', 'develop', 'establish', 'formulate', 'construct'],
    'created': ['produced', 'generated', 'developed', 'established', 'formulated', 'constructed'],
    'allow': ['permit', 'enable', 'authorize', 'facilitate', 'empower'],
    'allows': ['permits', 'enables', 'authorizes', 'facilitates', 'empowers'],
    'answer': ['response', 'reply', 'solution', 'resolution', 'explanation'],
    'ask': ['inquire', 'question', 'request', 'query', 'seek'],
    'asked': ['inquired', 'questioned', 'requested', 'queried', 'sought'],
    'build': ['construct', 'develop', 'establish', 'create', 'assemble', 'erect'],
    'built': ['constructed', 'developed', 'established', 'created', 'assembled', 'erected'],
    'carry': ['convey', 'transport', 'bear', 'transmit', 'transfer'],
    'correct': ['accurate', 'right', 'precise', 'exact', 'proper', 'valid'],
    'wrong': ['incorrect', 'inaccurate', 'erroneous', 'mistaken', 'flawed', 'invalid'],
    'main': ['primary', 'principal', 'chief', 'central', 'fundamental', 'key'],
    'type': ['kind', 'category', 'form', 'variety', 'class', 'sort'],
    'types': ['kinds', 'categories', 'forms', 'varieties', 'classes', 'sorts'],
    'group': ['category', 'class', 'cluster', 'collection', 'set', 'cohort'],
    'groups': ['categories', 'classes', 'clusters', 'collections', 'sets', 'cohorts'],
    'area': ['region', 'domain', 'field', 'sector', 'sphere', 'realm'],
    'areas': ['regions', 'domains', 'fields', 'sectors', 'spheres', 'realms'],
    'level': ['degree', 'extent', 'stage', 'grade', 'tier'],
    'levels': ['degrees', 'extents', 'stages', 'grades', 'tiers'],
    'number': ['quantity', 'amount', 'figure', 'total', 'count'],
    'high': ['elevated', 'substantial', 'considerable', 'significant', 'extensive'],
    'low': ['minimal', 'limited', 'reduced', 'diminished', 'modest'],
    'great': ['significant', 'substantial', 'considerable', 'remarkable', 'exceptional'],
    'long': ['extended', 'prolonged', 'lengthy', 'protracted', 'sustained'],
    'short': ['brief', 'concise', 'limited', 'abbreviated', 'condensed'],
    'true': ['accurate', 'correct', 'valid', 'genuine', 'authentic'],
    'false': ['incorrect', 'inaccurate', 'untrue', 'erroneous', 'invalid'],
    'likely': ['probable', 'expected', 'anticipated', 'plausible', 'feasible'],
    'unlikely': ['improbable', 'doubtful', 'questionable', 'uncertain', 'remote'],
    'possible': ['feasible', 'viable', 'potential', 'conceivable', 'achievable'],
    'impossible': ['unfeasible', 'unachievable', 'impractical', 'unattainable'],
    'simple': ['straightforward', 'uncomplicated', 'basic', 'elementary', 'fundamental'],
    'complex': ['complicated', 'intricate', 'elaborate', 'sophisticated', 'multifaceted'],
    'common': ['widespread', 'prevalent', 'frequent', 'typical', 'ordinary'],
    'rare': ['uncommon', 'unusual', 'exceptional', 'scarce', 'infrequent'],
    'strong': ['powerful', 'robust', 'substantial', 'compelling', 'forceful'],
    'weak': ['feeble', 'inadequate', 'insufficient', 'limited', 'tenuous'],
    'major': ['significant', 'substantial', 'principal', 'primary', 'key'],
    'minor': ['insignificant', 'trivial', 'secondary', 'peripheral', 'marginal'],
    'specific': ['particular', 'precise', 'exact', 'definite', 'explicit'],
    'general': ['broad', 'overall', 'comprehensive', 'universal', 'widespread'],
    'recent': ['current', 'contemporary', 'modern', 'latest', 'up-to-date'],
    'early': ['initial', 'preliminary', 'beginning', 'prior', 'preceding'],
    'late': ['delayed', 'belated', 'subsequent', 'later', 'recent'],
    'whole': ['entire', 'complete', 'total', 'full', 'comprehensive'],
    'certain': ['specific', 'particular', 'definite', 'assured', 'confident'],
    'sure': ['certain', 'confident', 'assured', 'convinced', 'positive'],
  };

  const wordyPhraseReplacements: Record<string, string> = {
    'due to the fact that': 'because',
    'in order to': 'to',
    'for the purpose of': 'to / for',
    'in the event that': 'if',
    'at this point in time': 'now / currently',
    'in the near future': 'soon',
    'a large number of': 'many',
    'a majority of': 'most',
    'in spite of the fact that': 'although / despite',
    'on account of': 'because of',
    'with regard to': 'about / regarding',
    'in reference to': 'about',
    'it is important to note that': '[state the point directly]',
    'the reason why is that': 'because',
    'in my opinion': '[often unnecessary]',
    'i believe that': '[often unnecessary]',
    'it should be noted that': '[simplify or remove]',
    'the fact that': 'that',
    'in today\'s society': 'today / currently',
    'each and every': 'each / every',
    'first and foremost': 'first',
    'in conclusion': '[use sparingly]',
    'as a matter of fact': 'in fact / indeed',
    'at the present time': 'now / currently',
    'by means of': 'by / with',
    'for the most part': 'mostly / generally',
    'in a situation in which': 'when / if',
    'in close proximity to': 'near',
    'in the amount of': 'for',
    'in the final analysis': 'finally / ultimately',
    'in the process of': 'while / during',
    'is able to': 'can',
    'it is clear that': '[state directly]',
    'it is evident that': '[state directly]',
    'make a decision': 'decide',
    'make an attempt': 'try / attempt',
    'on a daily basis': 'daily',
    'on the grounds that': 'because',
    'prior to': 'before',
    'subsequent to': 'after',
    'take into consideration': 'consider',
    'the question as to whether': 'whether',
    'with the exception of': 'except / except for',
    'a considerable amount of': 'much / considerable',
    'at all times': 'always',
    'at the same time': 'simultaneously / also',
    'despite the fact that': 'although / despite',
    'during the course of': 'during',
    'for the reason that': 'because',
    'has the ability to': 'can',
    'in light of': 'because / considering',
    'in terms of': 'regarding / for',
    'in the absence of': 'without',
    'in the case of': 'for / regarding',
    'in this day and age': 'today / now',
    'it goes without saying': '[remove - just state it]',
    'make use of': 'use',
    'on the basis of': 'based on / by',
    'owing to the fact that': 'because',
    'until such time as': 'until',
    'a wide variety of': 'various / many',
    'an abundance of': 'many / much',
    'as to whether or not': 'whether',
    'at such time as': 'when',
    'by virtue of the fact that': 'because',
    'come to a conclusion': 'conclude',
    'conduct an investigation': 'investigate',
    'for purposes of': 'for / to',
    'give consideration to': 'consider',
    'have a tendency to': 'tend to',
    'in a timely manner': 'promptly / quickly',
    'in all likelihood': 'likely / probably',
    'in connection with': 'about / regarding',
    'in excess of': 'more than / over',
    'in favor of': 'for',
    'in view of the fact that': 'because / since',
    'is an indication of': 'indicates',
    'is dependent upon': 'depends on',
    'it is my intention to': 'I intend to',
    'it is necessary that': 'must',
    'it is possible that': 'may / might',
    'it is worth noting that': '[state directly]',
    'lacked the ability to': 'could not',
    'make mention of': 'mention',
    'on the occasion of': 'when',
    'perform an analysis': 'analyze',
    'pertaining to': 'about / regarding',
    'reach a conclusion': 'conclude',
    'serve to': '[remove - use direct verb]',
    'take action': 'act',
    'take into account': 'consider',
    'the fact of the matter is': '[state directly]',
    'the manner in which': 'how',
    'there is no doubt that': 'clearly / certainly',
    'with the purpose of': 'to',
    'afford an opportunity': 'allow / let',
    'along the lines of': 'like / similar to',
    'as per': 'according to / per',
    'avail oneself of': 'use',
    'be in a position to': 'can',
    'bring to a close': 'end / conclude',
    'come to terms with': 'accept',
    'draw to a close': 'end',
    'exhibit a tendency': 'tend',
    'feel free to': '[remove]',
    'gain access to': 'access',
    'give rise to': 'cause',
    'have an effect on': 'affect',
    'have an impact on': 'affect / impact',
    'in a manner of speaking': '[remove]',
    'in actual fact': 'actually / in fact',
    'in any case': 'regardless',
    'in regard to': 'about / regarding',
    'in such a manner': 'so',
    'in the vicinity of': 'near',
    'is reflective of': 'reflects',
    'it has been shown that': '[cite and state directly]',
    'make reference to': 'refer to',
    'on behalf of': 'for',
    'on the part of': 'by',
    'put emphasis on': 'emphasize',
    'render assistance': 'help / assist',
    'the vast majority of': 'most',
    'with a view to': 'to',
    'with reference to': 'about / regarding',
  };

  const weakVerbs = ['is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'get', 'got', 'make', 'made'];
  
  const clichePatterns = [
    'at the end of the day',
    'thinking outside the box',
    'it is what it is',
    'low-hanging fruit',
    'move the needle',
    'paradigm shift',
    'synergy',
    'deep dive',
    'circle back',
    'touch base',
    'on the same page',
    'take it to the next level',
    'game changer',
    'best practices',
    'leverage',
    'actionable insights',
    'bandwidth',
    'give 110%',
    'it goes without saying',
    'needless to say',
    'last but not least',
    'all things considered',
    'at this moment in time',
    'going forward',
    'in terms of',
    'with all due respect',
    'easier said than done',
    'the bottom line is',
    'only time will tell',
    'think outside the box',
    'at the end of the day',
    'win-win situation',
    'hit the ground running',
    'push the envelope',
    'raise the bar',
    'cutting edge',
    'state of the art',
    'mission critical',
    'value added',
    'core competency',
    'scalable solution',
    'proactive approach',
    'robust framework',
    'holistic approach',
    'seamless integration',
    'strategic alignment',
    'key takeaways',
    'drill down',
    'boil the ocean',
    'move the goalposts',
    'run it up the flagpole',
    'put a pin in it',
    'take offline',
    'close the loop',
    'open the kimono',
    'skin in the game',
    'boots on the ground',
    'low-hanging fruit',
    'silver bullet',
    'magic bullet',
    'quick win',
    'no-brainer',
    'slam dunk',
    'home run',
    'ballpark figure',
    'back to the drawing board',
    'reinvent the wheel',
    'blue sky thinking',
    'thought leader',
    'disruptive innovation',
    'pivot',
    'ideate',
    'impactful',
  ];

  const hedgingPatterns = [
    'it seems that',
    'it appears that',
    'it could be argued that',
    'it may be possible that',
    'to some extent',
    'in some ways',
    'to a certain degree',
    'somewhat',
    'perhaps',
    'maybe',
    'possibly',
    'probably',
    'might',
    'could',
    'may',
    'it is possible that',
    'it is likely that',
    'there is a possibility that',
    'one could argue',
    'it would seem',
    'tends to',
    'tend to',
    'generally',
    'usually',
    'often',
    'sometimes',
    'occasionally',
    'relatively',
    'apparently',
    'presumably',
    'arguably',
    'seemingly',
    'in general',
    'for the most part',
    'more or less',
    'to some degree',
    'in a sense',
    'in most cases',
    'in many cases',
    'in certain cases',
    'under certain circumstances',
    'it is believed that',
    'it is thought that',
    'it is suggested that',
    'it is assumed that',
    'it can be assumed',
    'one might argue',
    'one might suggest',
    'it is conceivable that',
    'it is plausible that',
    'there is evidence to suggest',
    'the evidence suggests',
    'the data suggests',
    'it would appear',
    'it could be said',
    'it might be said',
    'it remains to be seen',
    'it is uncertain whether',
    'there is some indication',
    'this may indicate',
    'this could suggest',
    'a certain amount of',
    'a kind of',
    'a sort of',
    'more or less',
    'up to a point',
    'quite',
    'rather',
    'fairly',
    'slightly',
  ];

  useEffect(() => {
    if (!text.trim()) {
      setAnalysis(null);
      return;
    }

    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const totalWords = words.length;
    const uniqueWords = new Set(words).size;
    const vocabularyDiversity = totalWords > 0 ? Math.round((uniqueWords / totalWords) * 100) : 0;

    // Sentence variety analysis
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).filter(w => w.length > 0).length);
    const sentenceVariety = {
      short: sentenceLengths.filter(l => l <= 10).length,
      medium: sentenceLengths.filter(l => l > 10 && l <= 20).length,
      long: sentenceLengths.filter(l => l > 20).length
    };
    const avgSentenceLength = sentenceLengths.length > 0 
      ? Math.round(sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length * 10) / 10
      : 0;

    // Find overused words
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      if (!commonWords.has(word) && word.length > 3) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    const overusedWords = Object.entries(wordCounts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({
        word,
        count,
        suggestions: synonymSuggestions[word] || []
      }));

    // Find passive voice
    const passivePatterns = [
      { pattern: /\b(is|are|was|were|been|being)\s+(\w+ed)\b/gi, suggestion: 'Consider active voice' },
      { pattern: /\b(is|are|was|were|been|being)\s+(\w+en)\b/gi, suggestion: 'Consider active voice' },
      { pattern: /\b(has been|have been|had been)\s+(\w+ed)\b/gi, suggestion: 'Consider active voice' },
      { pattern: /\b(will be|would be|could be|should be)\s+(\w+ed)\b/gi, suggestion: 'Consider active voice' },
    ];
    
    const passiveVoiceMatches: { phrase: string; suggestion: string }[] = [];
    passivePatterns.forEach(({ pattern, suggestion }) => {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        if (passiveVoiceMatches.length < 8 && !passiveVoiceMatches.find(p => p.phrase === match![0])) {
          passiveVoiceMatches.push({ phrase: match![0], suggestion });
        }
      }
    });

    // Find wordy phrases
    const foundWordyPhrases: { original: string; suggestion: string }[] = [];
    Object.entries(wordyPhraseReplacements).forEach(([phrase, suggestion]) => {
      if (text.toLowerCase().includes(phrase)) {
        foundWordyPhrases.push({ original: phrase, suggestion });
      }
    });

    // Find weak verbs usage
    const weakVerbCounts: Record<string, number> = {};
    words.forEach(word => {
      if (weakVerbs.includes(word)) {
        weakVerbCounts[word] = (weakVerbCounts[word] || 0) + 1;
      }
    });
    
    const foundWeakVerbs = Object.entries(weakVerbCounts)
      .filter(([_, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([verb, count]) => ({
        verb,
        count,
        alternatives: verb === 'is' || verb === 'are' || verb === 'was' || verb === 'were' 
          ? ['Use action verbs', 'Restructure sentence']
          : ['Consider stronger verbs']
      }));

    // Find cliches
    const foundCliches = clichePatterns.filter(cliche => 
      text.toLowerCase().includes(cliche.toLowerCase())
    ).slice(0, 5);

    // Find hedging language
    const foundHedging = hedgingPatterns.filter(hedge => 
      text.toLowerCase().includes(hedge.toLowerCase())
    ).slice(0, 5);

    setAnalysis({
      overusedWords,
      passiveVoice: passiveVoiceMatches,
      wordyPhrases: foundWordyPhrases,
      weakVerbs: foundWeakVerbs,
      cliches: foundCliches,
      hedgingLanguage: foundHedging,
      totalWords,
      uniqueWords,
      vocabularyDiversity,
      sentenceVariety,
      avgSentenceLength
    });
  }, [text]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="paraphrasing-tips" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-orange-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              Writing Improvement Analyzer
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Identify overused words, passive voice, wordy phrases, clichés, and weak verbs. Get 140+ synonym suggestions and 120+ wordy phrase alternatives to strengthen your writing.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Text Input Area */}
            <div className="lg:col-span-3">
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
                  placeholder="Paste your text here to analyze vocabulary diversity, find overused words, passive voice, wordy phrases, clichés, and more..."
                  className="w-full h-80 p-4 text-gray-700 bg-gray-50 border-0 rounded-xl outline-none resize-none placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
                
                {analysis && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{analysis.totalWords}</div>
                      <div className="text-xs text-gray-500">Words</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{analysis.uniqueWords}</div>
                      <div className="text-xs text-gray-500">Unique</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className={`text-xl font-bold ${analysis.vocabularyDiversity >= 60 ? 'text-green-600' : analysis.vocabularyDiversity >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {analysis.vocabularyDiversity}%
                      </div>
                      <div className="text-xs text-gray-500">Diversity</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-gray-900">{analysis.avgSentenceLength}</div>
                      <div className="text-xs text-gray-500">Avg Length</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Panel */}
            <div className="lg:col-span-2 space-y-4">
              {analysis ? (
                <>
                  {/* Vocabulary Diversity Score */}
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2 opacity-90">Vocabulary Diversity</h3>
                    <div className="text-5xl font-bold mb-2">{analysis.vocabularyDiversity}%</div>
                    <p className="text-sm opacity-80">
                      {analysis.vocabularyDiversity >= 70 ? 'Excellent word variety!' : 
                       analysis.vocabularyDiversity >= 50 ? 'Good, but could improve' : 
                       analysis.vocabularyDiversity >= 35 ? 'Consider varying vocabulary' :
                       'Try using more varied vocabulary'}
                    </p>
                    <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${analysis.vocabularyDiversity}%` }}
                      />
                    </div>
                  </div>

                  {/* Sentence Variety */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3">Sentence Variety</h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">Short (≤10)</span>
                          <span className="font-medium">{analysis.sentenceVariety.short}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2"><div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(100, (analysis.sentenceVariety.short / (analysis.sentenceVariety.short + analysis.sentenceVariety.medium + analysis.sentenceVariety.long)) * 100)}%` }} /></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">Medium</span>
                          <span className="font-medium">{analysis.sentenceVariety.medium}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2"><div className="bg-violet-500 h-full rounded-full" style={{ width: `${Math.min(100, (analysis.sentenceVariety.medium / (analysis.sentenceVariety.short + analysis.sentenceVariety.medium + analysis.sentenceVariety.long)) * 100)}%` }} /></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">Long (20+)</span>
                          <span className="font-medium">{analysis.sentenceVariety.long}</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2"><div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min(100, (analysis.sentenceVariety.long / (analysis.sentenceVariety.short + analysis.sentenceVariety.medium + analysis.sentenceVariety.long)) * 100)}%` }} /></div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Issues Area */}
                  <div className="max-h-[600px] overflow-y-auto space-y-4 pr-1">
                    {/* Overused Words */}
                    {analysis.overusedWords.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          <span>Overused Words</span>
                        </h3>
                        <div className="space-y-3">
                          {analysis.overusedWords.map((item, index) => (
                            <div key={index} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">"{item.word}"</span>
                                <span className="text-sm text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{item.count}×</span>
                              </div>
                              {item.suggestions.length > 0 && (
                                <p className="text-xs text-gray-500">→ {item.suggestions.slice(0, 4).join(', ')}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Passive Voice */}
                    {analysis.passiveVoice.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                          <span>Passive Voice ({analysis.passiveVoice.length})</span>
                        </h3>
                        <div className="space-y-2">
                          {analysis.passiveVoice.map((item, index) => (
                            <div key={index} className="flex items-start space-x-2 text-sm">
                              <span className="text-yellow-500">⚠</span>
                              <span className="text-gray-700">"{item.phrase}"</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Consider rewriting in active voice for clarity</p>
                      </div>
                    )}

                    {/* Wordy Phrases */}
                    {analysis.wordyPhrases.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>Wordy Phrases</span>
                        </h3>
                        <div className="space-y-2">
                          {analysis.wordyPhrases.map((item, index) => (
                            <div key={index} className="text-sm">
                              <div className="text-red-600 line-through">"{item.original}"</div>
                              <div className="text-green-600">→ {item.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clichés */}
                    {analysis.cliches.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          <span>Clichés Found</span>
                        </h3>
                        <div className="space-y-1">
                          {analysis.cliches.map((cliche, index) => (
                            <div key={index} className="text-sm text-violet-700 bg-violet-50 px-2 py-1 rounded">
                              "{cliche}"
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Consider more original phrasing</p>
                      </div>
                    )}

                    {/* Hedging Language */}
                    {analysis.hedgingLanguage.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>Hedging Language</span>
                        </h3>
                        <div className="space-y-1">
                          {analysis.hedgingLanguage.map((hedge, index) => (
                            <div key={index} className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                              "{hedge}"
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Use sparingly in academic writing</p>
                      </div>
                    )}

                    {/* Weak Verbs */}
                    {analysis.weakVerbs.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                          <span>Weak Verbs</span>
                        </h3>
                        <div className="space-y-2">
                          {analysis.weakVerbs.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">"{item.verb}"</span>
                              <span className="text-gray-500">{item.count}× used</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Consider stronger action verbs</p>
                      </div>
                    )}
                  </div>

                  {/* All Clear */}
                  {analysis.overusedWords.length === 0 && 
                   analysis.passiveVoice.length === 0 && 
                   analysis.wordyPhrases.length === 0 &&
                   analysis.cliches.length === 0 &&
                   analysis.hedgingLanguage.length === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-green-800 mb-1">Looking Good!</h3>
                      <p className="text-sm text-green-600">No major issues detected</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter Your Text</h3>
                  <p className="text-gray-500 text-sm">Paste text to analyze vocabulary, find overused words, passive voice, and more</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Effective Paraphrasing Techniques</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Change Sentence Structure</h3>
              <p className="text-gray-600 text-sm">Rearrange clauses, switch from active to passive (or vice versa), or combine/split sentences.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Use Synonyms Carefully</h3>
              <p className="text-gray-600 text-sm">Replace words with synonyms, but ensure the new words fit the context and maintain the original meaning.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Keep the Meaning</h3>
              <p className="text-gray-600 text-sm">Always preserve the original idea. Paraphrasing changes how something is said, not what is said.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Understand First</h3>
              <p className="text-gray-600 text-sm">Read and understand the original text fully before attempting to paraphrase it in your own words.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-fuchsia-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Still Cite Sources</h3>
              <p className="text-gray-600 text-sm">Paraphrased content still requires citation. The ideas belong to the original author.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Compare & Revise</h3>
              <p className="text-gray-600 text-sm">Compare your paraphrase to the original. If they're too similar, revise further.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Want comprehensive writing feedback?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            WriteScholar uses AI to provide detailed analysis of your academic writing, including grammar, structure, clarity, and more.
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

export default ParaphrasingTipsPage;
