/**
 * Demo analysis data for the landing page interactive document preview.
 * Matches the real WriteScholar analysis format.
 */

export interface DemoAnnotation {
  id: string;
  type: 'strong' | 'improve' | 'concern';
  /** Exact text span to highlight in the document */
  text: string;
  comment: string;
  suggestion: string;
  /**
   * Landing / interactive demo only: replacement text when the user clicks
   * “Apply WriteScholar revision” (matches the real analysis page behavior).
   */
  demoRevisedText?: string;
}

export interface DemoRubricCategory {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export const DEMO_ESSAY_TITLE = 'Justice and Happiness: Evaluating Socrates\' Argument through The Dark Knight';

export const DEMO_ESSAY_CONTENT = `Justice and Happiness: Evaluating Socrates' Argument through The Dark Knight

In The Republic, both Glaucon and Socrates have different views on justice and injustice. In Book II of The Republic, Glaucon uses the ring of Gyges to explain his own view of justice. Glaucon uses the story to explain to Socrates that if we could do unjust things without consequence we would always make decisions that are unjust. Socrates however uses the image of the tyrant to show how Glaucon's conclusion is mistaken. Socrates claims that a tyrannical character who manages to become a tyrant is the most wretched and miserable person possible, and that justice is part of human happiness.In Book XI of The Republic, Socrates uses a formula to come to the belief that being a just king you'll live 729 times more pleasantly, to that of the unjust tyrant who will live 729 times more painfully. To help me evaluate Socrates argument I will use The Dark Knight to help illustrate his position. Then once I have introduced the controversy and explained Socrates' argument, I will find a possible objection to it, then discuss how someone who agrees with Socrates could respond to the objection.

In The Dark Knight, Harvey Dent was initially introduced to us as a good citizen.He was District Attorney for Gotham City and would go about his day to day life following the law he lived by the quote "It's not about what I want it's about what's fair". However, this all drastically changed when the Joker kidnapped him and Rachel Dawes resulting in the Death of Rachel and Harvey barely surviving the explosion.This made one side of his face burn, leaving him with physical and mental scars all because of Joker.Harvey Dent goes against Socrates claim that being a tyrant is the most miserable person when he quotes: "You either die a hero, or you live long enough to see yourself become the villain". This quote in The Dark Knight by Harvey dent was used to show the ideology that in life no matter how good you want and try to be, in the end you will end up being as just as you are unjust. This quote by Harvey Dent agrees with Glaucon's point as Harvey states that being the just hero only leads to a short life to that of being the unjust villain who reap all of life's benefits and live longer.

However, that is not always the case as in The Dark Knight, we see the Joker living a selfish life to that similar of a tyrant.The Joker gains happiness seeing others in pain and seeing their misfortune. From watching the movie, you could consider the Joker as someone that is a happy tyrant and not a miserable person because we never see scenes where he is sad, only times that he's laughing at the expense of others. But you can say the joker plays perfectly into Socrates claim that he is the most wretched and miserable person there is, as the Joker has no friends and in terms of happiness he isn't truly happy. This is because if he has to do all these treacherous things just to make himself happy then deep inside he's sad and by hurting others so that they are in a worse state than him makes him feel slighter better about himself.

Overall both Socrates and Glaucon both make great arguments to if an unjust person can lead a life in true happiness. I think the word unjust has a spectrum and the worst type of unjust I don't think they can be truly happy (killing mass amount of people) but something that is small in terms of unjust (taking one extra candy than what is allowed) l I believe such a happiness can still be obtained.

Bibliography

Nolan, Christopher, director. The Dark Knight. Warner Bros. Pictures, 2008.

PLATO, & REEVE, C. D. C. (2004). Republic. Indianapolis, Hackett Pub. Co.`;

export const DEMO_ANNOTATIONS: DemoAnnotation[] = [
  // Strong (Green)
  {
    id: 'strong-1',
    type: 'strong',
    text: 'In The Dark Knight, Harvey Dent was initially introduced to us as a good citizen.',
    comment: 'This sentence effectively sets the stage for the discussion of Harvey Dent\'s character and his moral journey.',
    suggestion: 'Continue to provide clear character introductions to maintain clarity.',
  },
  {
    id: 'strong-2',
    type: 'strong',
    text: 'he lived by the quote "It\'s not about what I want it\'s about what\'s fair"',
    comment: 'Effective use of textual evidence from the film to ground the argument in a concrete character moment.',
    suggestion: 'Continue to anchor key claims with specific quotes and evidence.',
  },
  {
    id: 'strong-3',
    type: 'strong',
    text: 'To help me evaluate Socrates argument I will use The Dark Knight to help illustrate his position.',
    comment: 'Clear thesis roadmap that establishes the essay\'s structure and methodology upfront.',
    suggestion: 'Continue to provide explicit signposting for your reader.',
  },
  {
    id: 'strong-4',
    type: 'strong',
    text: 'the worst type of unjust I don\'t think they can be truly happy (killing mass amount of people) but something that is small in terms of unjust (taking one extra candy than what is allowed)',
    comment: 'Thoughtful nuance in distinguishing degrees of injustice, with concrete examples that strengthen the argument.',
    suggestion: 'Consider developing this spectrum further in your conclusion.',
  },
  // Areas to Improve (Amber/Yellow) - replaced per image design
  {
    id: 'improve-1',
    type: 'improve',
    text: 'In The Republic, both Glaucon and Socrates have different views on justice and injustice.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'For instance, Glaucon\'s ring of Gyges illustrates how power corrupts when accountability is removed.\'',
  },
  {
    id: 'improve-2',
    type: 'concern',
    text: 'Glaucon uses the story to explain to Socrates that if we could do unjust things without consequence we would always make decisions that are unjust.',
    comment: 'This section may need attention to strengthen the argument and provide clearer explanations.',
    suggestion: 'Revise to: \'Glaucon\'s thought experiment suggests that without consequences, self-interest would dominate—a claim Socrates challenges through the tyrant\'s misery.\'',
  },
  {
    id: 'improve-3',
    type: 'improve',
    text: 'Socrates however uses the image of the tyrant to show how Glaucon\'s conclusion is mistaken.',
    comment: 'This transition could be strengthened with more explicit connection to the previous argument.',
    suggestion: 'Add a connecting phrase: e.g. "This demonstrates that [X], which matters because [Y]." — make the link explicit.',
  },
  {
    id: 'improve-4',
    type: 'improve',
    text: 'Socrates claims that a tyrannical character who manages to become a tyrant is',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'For example, Socrates\' tyrant lacks genuine friendship and inner peace, unlike the just individual.\'',
  },
  {
    id: 'improve-7',
    type: 'improve',
    text: 'He was District Attorney for Gotham City and would go about his day to day life following the law',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'The film\'s portrayal of Harvey Dent\'s fall illustrates this tension between justice and temptation.\'',
  },
  {
    id: 'improve-8',
    type: 'improve',
    text: 'However, this all drastically changed when the Joker kidnapped him and Rachel Dawes resulting in the Death of Rachel and Harvey barely surviving the explosion.',
    comment: 'This sentence is too long and contains grammatical errors.',
    suggestion: 'Revise to: \'However, this changed drastically when the Joker kidnapped him and Rachel Dawes. Rachel died in the explosion, but Harvey barely survived, leaving him with physical and mental scars.\'',
    demoRevisedText:
      'However, this changed drastically when the Joker kidnapped him and Rachel Dawes. Rachel died in the explosion, but Harvey barely survived, leaving him with physical and mental scars.',
  },
  {
    id: 'improve-9',
    type: 'improve',
    text: 'This made one side of his face burn, leaving him with physical and mental scars all because of Joker.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Revise to: \'This left one side of his face burned, resulting in both physical and mental scars due to the Joker\'s actions.\'',
    demoRevisedText:
      'This left one side of his face burned, resulting in both physical and mental scars due to the Joker\'s actions.',
  },
  {
    id: 'improve-10',
    type: 'improve',
    text: 'Harvey Dent goes against Socrates claim that being a tyrant is the most miserable person when he quotes: "You either die a hero, or you live long enough to see yourself become the villain".',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'This quote connects Glaucon\'s skepticism to the film\'s exploration of moral decay.\'',
  },
  {
    id: 'improve-11',
    type: 'improve',
    text: 'This quote by Harvey Dent agrees with Glaucon\'s point as Harvey states that being the just hero only leads to a short life to that of being the unjust villain who reap all of life\'s benefits and live longer.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'The Joker\'s laughter at others\' suffering exemplifies this—his "happiness" is hollow and dependent on cruelty.\'',
  },
  {
    id: 'improve-12',
    type: 'improve',
    text: 'The Joker gains happiness seeing others in pain and seeing their misfortune.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'The Joker\'s laughter at others\' suffering exemplifies this—his "happiness" is hollow and dependent on cruelty.\'',
  },
  {
    id: 'improve-13',
    type: 'improve',
    text: 'This is because if he has to do all these treacherous things just to make himself happy then deep inside he\'s sad and by hurting others so that they are in a worse state than him makes him feel slighter better about himself.',
    comment: 'This sentence is convoluted and could be broken down for clarity.',
    suggestion: 'Split into two sentences for improved readability and flow.',
  },
  // Serious Concerns (Red) - replaced per image design
  {
    id: 'concern-1',
    type: 'concern',
    text: 'In Book II of The Republic, Glaucon uses the ring of Gyges to explain his own view of justice.',
    comment: 'This section may need attention to strengthen the argument and provide clearer explanations.',
    suggestion: 'Revise to: \'Glaucon\'s ring of Gyges illustrates his view that justice is merely a social contract when consequences are removed.\'',
    demoRevisedText:
      'Glaucon\'s ring of Gyges illustrates his view that justice is merely a social contract when consequences are removed.',
  },
  {
    id: 'concern-2',
    type: 'concern',
    text: 'the most wretched and miserable person possible, and that justice is part of human happiness.',
    comment: 'This section may need attention to strengthen the argument and provide clearer explanations.',
    suggestion: 'Revise to: \'the most wretched and miserable individual, emphasizing that justice contributes to human happiness.\'',
  },
  {
    id: 'concern-4',
    type: 'concern',
    text: 'This quote in The Dark Knight by Harvey dent was used to show the ideology that in life no matter how good you want and try to be, in the end you will end up being as just as you are unjust.',
    comment: 'This section may need attention to strengthen the argument and provide clearer explanations.',
    suggestion: 'Revise to: \'Harvey Dent\'s quote suggests that in life, the "just" path leads to martyrdom while the "unjust" path offers longer survival—a tension the film explores.\'',
  },
  {
    id: 'concern-5',
    type: 'concern',
    text: 'However, that is not always the case as in The Dark Knight, we see the Joker living a selfish life to that similar of a tyrant.',
    comment: 'This section may need attention to strengthen the argument and provide clearer explanations.',
    suggestion: 'Revise to: \'However, this is not always the case; in The Dark Knight, the Joker embodies a selfish existence akin to that of a tyrant.\'',
  },
  {
    id: 'concern-7',
    type: 'concern',
    text: 'But you can say the joker plays perfectly into Socrates claim that he is the most wretched and miserable person there is, as the Joker has no friends and in terms of happiness he isn\'t truly happy.',
    comment: 'This section may need attention to strengthen the argument and provide clearer explanations.',
    suggestion: 'Revise to: \'The Joker\'s isolation and dependence on others\' pain suggest he embodies Socrates\' claim that the tyrant is the most miserable.\'',
  },
  {
    id: 'concern-8',
    type: 'concern',
    text: 'Overall both Socrates and Glaucon both make great arguments to if an unjust person can lead a life in true happiness.',
    comment: 'This section may need attention to strengthen the argument and provide clearer explanations.',
    suggestion: 'Revise to: \'Overall, both Socrates and Glaucon present compelling arguments regarding whether an unjust person can lead a truly happy life.\'',
  },
  {
    id: 'concern-9',
    type: 'concern',
    text: 'I think the word unjust has a spectrum',
    comment: 'This section may need attention to strengthen the argument and provide clearer explanations.',
    suggestion: 'Revise to: \'The term unjust encompasses a spectrum; the most extreme forms of injustice, such as mass murder, likely preclude true happiness.\'',
  },
];

export const DEMO_RUBRIC: DemoRubricCategory[] = [
  { name: 'Thesis And Argument', score: 15, maxScore: 20, feedback: 'The thesis is present but lacks clarity and depth in the argumentation.' },
  { name: 'Response To Question', score: 16, maxScore: 20, feedback: 'The essay addresses the question but could benefit from clearer connections between the arguments presented.' },
  { name: 'Organization And Structure', score: 13, maxScore: 15, feedback: 'The essay has a basic structure but lacks clear transitions and logical flow between points.' },
  { name: 'Writing Quality And Clarity', score: 8, maxScore: 10, feedback: 'There are several grammatical errors and awkward phrasings that detract from the overall clarity.' },
  { name: 'Analysis And Critical Thinking', score: 15, maxScore: 20, feedback: 'The analysis shows some critical thinking but lacks depth and could explore the implications of the arguments further.' },
  { name: 'Use Of Evidence And Textual Support', score: 11, maxScore: 15, feedback: 'The use of examples from The Dark Knight is relevant but could be more effectively integrated into the argument.' },
];

export const DEMO_OVERALL_SCORE = 78;
export const DEMO_GRADE = 'C (70-79%)';
export const DEMO_WORD_COUNT = 648;

export const DEMO_COMPREHENSIVE_ANALYSIS = {
  overallSummary: 'The essay demonstrates a solid attempt to connect Plato\'s Republic with The Dark Knight, showing engagement with philosophical concepts. However, the analysis could be strengthened through improved coherence, clearer structure, and more precise language when connecting arguments to examples.',
  clarityRating: 'Needs Work',
  topSuggestions: [
    'Improve clarity by breaking down long sentences and using more precise academic language.',
    'Strengthen the connection between your arguments and the examples from The Dark Knight.',
    'Revise awkward phrasings such as "to that similar of a tyrant" and "I think the word unjust has a spectrum."',
  ],
  categories: [
    {
      name: 'Academic Writing Quality',
      summary: 'The essay shows potential but would benefit from more polished academic prose.',
      strengths: [
        { quote: '"In The Dark Knight, Harvey Dent was initially introduced to us as a good citizen."', feedback: 'Effective character introduction that sets up the moral discussion.' },
      ],
      areasForImprovement: [
        { quote: '"This made one side of his face burn, leaving him with physical and mental scars all because of Joker."', suggestion: 'Revise to: "This left one side of his face burned, resulting in both physical and mental scars due to the Joker\'s actions."' },
      ],
      seriousConcerns: [
        { quote: '"I think the word unjust has a spectrum"', suggestion: 'Revise to: "The term unjust encompasses a spectrum; the most extreme forms of injustice likely preclude true happiness."' },
      ],
    },
    {
      name: 'Citation Referencing',
      summary: 'Citations were not required for this assignment.',
    },
    {
      name: 'Argument Structure',
      summary: 'The essay has a basic structure but could improve transitions and logical flow.',
      areasForImprovement: [
        { quote: '"Socrates however uses the image of the tyrant to show how Glaucon\'s conclusion is mistaken."', suggestion: 'Add a connecting phrase to make the link explicit: "This demonstrates that [X], which matters because [Y]."' },
      ],
      seriousConcerns: [
        { quote: '"Overall both Socrates and Glaucon both make great arguments to if an unjust person can lead a life in true happiness."', suggestion: 'Revise to: "Overall, both Socrates and Glaucon present compelling arguments regarding whether an unjust person can lead a truly happy life."' },
      ],
    },
    {
      name: 'Grammar Style',
      summary: 'Several grammatical errors and awkward phrasings detract from clarity.',
      areasForImprovement: [
        { quote: '"However, this all drastically changed when the Joker kidnapped him and Rachel Dawes resulting in the Death of Rachel and Harvey barely surviving the explosion."', suggestion: 'Try: "However, this changed drastically when the Joker kidnapped him and Rachel Dawes. Rachel died in the explosion, but Harvey barely survived, leaving him with physical and mental scars."' },
      ],
      seriousConcerns: [
        { quote: '"However, that is not always the case as in The Dark Knight, we see the Joker living a selfish life to that similar of a tyrant."', suggestion: 'Revise to: "However, this is not always the case; in The Dark Knight, the Joker embodies a selfish existence akin to that of a tyrant."' },
      ],
    },
    {
      name: 'Content Depth',
      summary: 'The analysis shows critical thinking but could explore implications further.',
      strengths: [
        { quote: '"the worst type of unjust I don\'t think they can be truly happy (killing mass amount of people) but something that is small in terms of unjust (taking one extra candy than what is allowed)"', feedback: 'Thoughtful nuance in distinguishing degrees of injustice with concrete examples.' },
      ],
      areasForImprovement: [
        { quote: '"In The Republic, both Glaucon and Socrates have different views on justice and injustice."', suggestion: 'Add: \'For instance, Glaucon\'s ring of Gyges illustrates how power corrupts when accountability is removed.\'' },
      ],
    },
  ],
  priorityRecommendations: [
    'Focus on sentence-level clarity: break up long sentences and replace vague phrases with precise academic language.',
    'Strengthen the thesis and ensure each paragraph clearly connects back to your main argument.',
    'Revise subjective language ("I think") and awkward constructions to maintain an academic tone.',
  ],
};

// ============ B GRADE DEMO (82/100) ============
export const DEMO_B_ESSAY_TITLE = 'Is there a way Out: How Race is represented in the movie Get Out';

export const DEMO_B_ESSAY_CONTENT = `Is there a way Out: How Race is represented in the movie Get Out

Directed by Jordan Peele, Get Out reached the viewers eyes on February 2017. The movie starts with Chris deciding to go with his girlfriend Rose to meet her parents for a weekend for the first time. Her parents are unware that Chris is a black man to which Chris acknowledges their excessively friendly behavior as a defense mechanism to withhold their frustration with their daughter dating a black man. However, as they progress throughout the week Chris realizes that their frustration is a lot more than he imagined, and goes through a series of events he'll never forget. This paper will look at how race is represented in the movie Get Out and discuss several different theories and beliefs regarding race. In today's society, the problem of racism has improved (compared to the past), but it still exists. The film Get Out works to critique the state of race relations by showing both the covert and overt ways that white supremacy maintains its subjugating power. This is an important issue because in a world that tries to promote equality of race, they are still a long way away from achieving this.

In the movie Get Out, race relations are influenced heavily by hegemony. Lull defines hegemony being "The power or dominance that one social group hold over others. This can refer to the economic-cultural relations between and among social classes within a nation (1995, p.25)". In society, we refer to the hegemony race being that of the white person. This is because, they are the top of the hierarchy in our society and we see them in much of the high-power jobs and organizations, this is not just in America but the world as a whole. In Get Out, this was shown through both Georgina and Walter who were black people that are working for the white people that oppress them at the home making the white people have full dominance over them. On top of that, the scene where Chris is being bid on at the bingo auction (which can be compared to when slaves were being bid on/bought/sold) relates to white people having the hegemony. One reason for this is the on all the white people's bingo cards they all won the game of bingo, which corresponds to the fact that in society if you're white your seen as a winner in society.

Race was also shown through the use gender roles. In Multicultural Film: An Anthology, Schrock and Schwalbe discuss masculinity and the difference roles that society put on gender by quoting: "Children are born into a world in which males/boys/men are differentiated from females/girls/women. They must learn and master "identity codes" that symbolizes their particular gender role" (2009, p.151). An example of this from the movie was with both the black servants Walter and Georgina being used by the Armitage family (the white family in the movie) differently due to gender, as Walter the black man had a more "masculine" job of working on the farm and doing the heavy lifting to that of Georgina who was cooking, cleaning and doing what's seen as more "feminine" work. This shows one of the overt ways in which white supremacy maintains its power by having black people work for them being there servants with no opportunity of them ever having the chance to have a job role of any significance.

Even though they might look slightly different from the past, racist traditions of white supremacy are constantly being upheld for the purpose of maintaining power. In Get Out, the Sunken Place is a metaphor for the state of mind of minorities who have been brainwashed by white supremacy. They are being controlled by the hegemonic powers already in place. The scene where Missy Armitage hits the teacup with the silver spoon hypnotizing Chris is an example of this. What makes the teacup symbolic, is that during the slavery days in America, white wives of the slave owners would strike the teacup as a way of activating the slaves and using their hegemonic powers to control the black people. Andre talks about stereotypes in the fact they tend to ignore, or falsify or oversimply the causes of a certain behavior. She goes on to talk about stereotypes and that they suggest the behavior is something that is inevitable and this causes a distorted reality (2016 p.63). Stereotypes are one of the covert ways that the Armitage family In Get Out use as an excuse for why it's acceptable for them to have power over the black race. The Armitage family say that black men are naturally much stronger than the other races so they should be in jobs that utilizes their strength, to which are covertly the jobs that involve the black man doing all the slave work for the white people. White privilege is something that society constantly tries to disregard as they try to maintain the belief that we live in an equal world, however whether we like it or not white privilege is constantly happening in our day to day life and on many occasions, it's subconscious without the individual even knowing of their privilege. McIntosh refers to the while privilege as "an invisible package of unearned assets which I can count on cashing in each day, but about which I was meant to remain oblivious". The silver spoon that Missy Armitage constantly used throughout the movie was meant to be a symbol of white privilege as throughout generations the white race would be born into society with a "silver spoon" just due to the mere fact they are white and maintain its subjugating power over other races.

One form of racism that is often overlooked in the modern society is micro-aggressions. The main reason for this is they are subtle and not overly obvious when done, however they can obviously be very telling about the deeply rooted racist mentalities that oppressors hold. Microaggressions is something that is happening in a lot of conversations throughout our daily activities, with some of the time without us noticing. Sue et al puts microaggressions into three categories which are: microinsult (characterized by communications that convey rudeness to a person's race), microassault (racial derogation through verbal or nonverbal attack that's meant to hurt victim like name calling) and microinvalidation (communications that exclude, negate or nullify the feelings or experiential reality of a person of color (209, p.202-203)). One of the most common type of racial microaggressions heavily used in society is the phrase "I'm not a racist. I have several Black friends." This is people's belief that because they have a friend of that race that automatically makes them immune to racism. A supporting scene of microaggressions was shown in Get Out when Dean Armitage (Rose's father) was generalizing black people in his comments towards Chris by saying "If I could, I would have voted for Obama for a third term". This comment he made was unnecessary and was only used due to the fact Chris is black and deep down trying to hide the fact that he is racist. However, is there a way we can prove what he was saying was used in a racist way? This is one thing Sue et al states are the greatest challenges us as a society and mental health professions face is trying to make the "invisible" "visible". Which may only be possible once our society is honest about race and racism and we openly have discussions about this matter, but with this potentially resulting in the dominant white race losing a slight sense of power why would they engage (p.212).

In conclusion, when people watch the movie Get Out, there is always a different reaction from one person watching it to another, with a person's race being one of the huge factors on how they perceive the movie. The main reason for this is because some people still don't understand race relations, due to the fact they don't experience it, and things you can't experience you have a much harder time noticing it's happening. In today's society, the problem of racism has improved (compared to the past), but we have seen through-out this movie it still exists in many different shapes and forms. The film Get Out works to critique the state of race relations by showing both the covert and overt ways that white supremacy maintains its subjugating power in society. Overall the movie Get Out was a good starting point to talk about the issues of racism in society. I think that in society now, racism is more covert racism to that of the past that was heavily overt, as now racism is heavily frowned upon. However, with these issues still being a huge problem, eliminating racism might be a task that we as society are way far from tackling and may never be able to tackle.

Bibliography:

Andre, Judith. "Stereotypes: Conceptual and Normative Considerations." Multicultural Film: An Anthology. Fall 2016/Spring-Summer 2017. Eds. Kathryn Karrh Cashin and Lauren Martilli. Boston, MA: Pearson, 2016. Book.

Get Out. Dir. Jordan Peele. Perf. Daniel Kaluuya, Allison Williams, and Catherine Keener. Universal Pictures, 2017. DVD.

Lull, James. "Hegemony." Media, Communication, Culture: A Global Approach. New York: Columbia University Press, 1995.

McIntosh, Peggy. "White Privilege: Unpacking the Invisible Knapsack." Peace and Freedom July/August (1989): 10-12.

Schrock, Douglas and Michael Schwalbe. "Men, Masculinity, and Manhood Acts" Multicultural Film: An Anthology. Fall 2016/Spring-Summer 2017. Eds. Kathryn Karrh Cashin and Lauren Martilli. Boston, MA: Pearson, 2016. Book.

Sue, Derald Wing, Christina M. Capodilupo, Gina C. Torino, Jennifer M. Bucceri, Aisha M. B. Holder, Kevin L. Nadal. And Marta Esqulin. "Racial Microaggressions in Everyday Life: Implications for Clinical Practice." American Psychologist 62.4 (2009): 271-86`;

export const DEMO_B_ANNOTATIONS: DemoAnnotation[] = [
  // Strong (Green) - per image mapping
  {
    id: 'b-strong-1',
    type: 'strong',
    text: 'The film Get Out works to critique the state of race relations by showing both the covert and overt ways that white supremacy maintains its subjugating power.',
    comment: 'Strong thesis that clearly establishes the essay\'s analytical framework and scope.',
    suggestion: 'Continue to anchor your analysis in clear, arguable claims.',
  },
  {
    id: 'b-strong-2',
    type: 'strong',
    text: 'and that they suggest the behavior is something that is inevitable and this causes a distorted reality (2016 p.63).',
    comment: 'Effective integration of academic source to support your analysis.',
    suggestion: 'Continue to cite sources when introducing key concepts.',
  },
  {
    id: 'b-strong-3',
    type: 'strong',
    text: 'White privilege is something that society constantly tries to disregard as they try to maintain the belief that we live in an equal world, however whether we like it or not white privilege is constantly happening in our day to day life and on many occasions, it\'s subconscious without the individual even knowing of their privilege.',
    comment: 'This section demonstrates clear academic writing with appropriate structure and vocabulary.',
    suggestion: 'Continue using this approach throughout your paper.',
  },
  {
    id: 'b-strong-4',
    type: 'strong',
    text: 'One of the most common type of racial microaggressions heavily used in society is the phrase "I\'m not a racist. I have several Black friends."',
    comment: 'Effective use of a common phrase to illustrate the concept of microaggressions.',
    suggestion: 'Continue to use concrete examples to ground abstract concepts.',
  },
  {
    id: 'b-strong-5',
    type: 'strong',
    text: 'However, is there a way we can prove what he was saying was used in a racist way?',
    comment: 'Thoughtful critical question that advances the analysis.',
    suggestion: 'This kind of reflection strengthens the overall coherence of your paper.',
  },
  {
    id: 'b-strong-6',
    type: 'strong',
    text: 'The main reason for this is because some people still don\'t understand race relations, due to the fact they don\'t experience it, and things you can\'t experience you have a much harder time noticing it\'s happening.',
    comment: 'Strong conclusion that synthesizes the essay\'s main argument about perspective.',
    suggestion: 'This kind of synthesis elevates the analysis.',
  },
  {
    id: 'b-strong-7',
    type: 'strong',
    text: 'Kathryn Karrh Cashin and Lauren Martilli',
    comment: 'Proper MLA formatting for editors in the bibliography.',
    suggestion: 'Continue to use consistent citation format throughout.',
  },
  // Areas to Improve (Amber/Yellow) - replaced per image design
  {
    id: 'b-improve-3',
    type: 'improve',
    text: 'Her parents are unware that Chris is a black man to which Chris acknowledges their excessively friendly behavior as a defense mechanism to withhold their frustration with their daughter dating a black man.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Revise to: \'Chris notes that their exaggerated friendliness masks discomfort with his presence, revealing how race shapes social interactions even in supposedly progressive spaces.\'',
    demoRevisedText:
      'Chris notes that their exaggerated friendliness masks discomfort with his presence, revealing how race shapes social interactions even in supposedly progressive spaces.',
  },
  {
    id: 'b-improve-4',
    type: 'improve',
    text: 'However, as they progress throughout the week Chris realizes that their frustration is a lot more than he imagined, and goes through a series of events he\'ll never forget.',
    comment: 'This transition could be strengthened with more explicit connection to the previous argument.',
    suggestion: 'Add a connecting phrase: e.g. "This demonstrates that [X], which matters because [Y]." — make the link explicit.',
  },
  {
    id: 'b-improve-5',
    type: 'improve',
    text: 'In today\'s society, the problem of racism has improved (compared to the past), but it still exists.',
    comment: 'This sentence is vague and could be more assertive in its stance on racism.',
    suggestion: 'Try: \'While racism has evolved since the past, it remains a pervasive issue in contemporary society.\'',
    demoRevisedText: 'While racism has evolved since the past, it remains a pervasive issue in contemporary society.',
  },
  {
    id: 'b-improve-6',
    type: 'improve',
    text: 'This is an important issue because in a world that tries to promote equality of race, they are still a long way away from achieving this.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Revise to: \'Despite rhetoric of equality, institutional barriers remain—as the Armitage family\'s superficially welcoming yet deeply exploitative behavior demonstrates.\'',
  },
  {
    id: 'b-improve-7',
    type: 'improve',
    text: 'In the movie Get Out, race relations are influenced heavily by hegemony.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'The film illustrates this through the Armitage estate, where Walter and Georgina\'s labor literally serves white authority.\'',
    demoRevisedText:
      'In Get Out, race relations are shaped by hegemony: the Armitage estate literalizes this, as Walter and Georgina\'s labor serves white authority.',
  },
  {
    id: 'b-improve-8',
    type: 'improve',
    text: 'In society, we refer to the hegemony race being that of the white person.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'Lull\'s framework helps explain why the auction scene positions white bidders as the default holders of power.\'',
  },
  {
    id: 'b-improve-9',
    type: 'improve',
    text: 'This is because, they are the top of the hierarchy in our society and we see them in much of the high-power jobs and organizations, this is not just in America but the world as a whole.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'The film\'s spatial hierarchy—white hosts in the house, Black workers on the grounds—mirrors this structure.\'',
  },
  {
    id: 'b-improve-10',
    type: 'improve',
    text: 'In Get Out, this was shown through both Georgina and Walter who were black people that are working for the white people that oppress them at the home making the white people have full dominance over them.',
    comment: 'This sentence is too long and contains grammatical errors.',
    suggestion: 'Revise to: \'This is illustrated by Georgina and Walter, who are Black individuals working for the white Armitage family, thus reinforcing the dominance of their oppressors.\'',
  },
  {
    id: 'b-improve-11',
    type: 'improve',
    text: 'Race was also shown through the use gender roles.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'Walter performs manual labor while Georgina serves domestically, mirroring gendered racial stereotypes.\'',
  },
  {
    id: 'b-improve-12',
    type: 'improve',
    text: 'In Multicultural Film: An Anthology, Schrock and Schwalbe discuss masculinity and the difference roles that society put on gender by quoting: "Children are born into a world in which males/boys/men are differentiated from females/girls/women.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'The film literalizes this when Walter\'s "masculine" farm work contrasts with Georgina\'s "feminine" domestic service.\'',
  },
  {
    id: 'b-improve-13',
    type: 'improve',
    text: 'An example of this from the movie was with both the black servants Walter and Georgina being used by the Armitage family (the white family in the movie) differently due to gender, as Walter the black man had a more "masculine" job of working on the farm and doing the heavy lifting to that of Georgina who was cooking, cleaning and doing what\'s seen as more "feminine" work.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Expand: \'This division mirrors historical stereotypes that assigned Black men to physical labor and Black women to domestic service.\'',
  },
  {
    id: 'b-improve-14',
    type: 'improve',
    text: 'This shows one of the overt ways in which white supremacy maintains its power by having black people work for them being there servants with no opportunity of them ever having the chance to have a job role of any significance.',
    comment: 'This sentence is convoluted and could be broken down for clarity.',
    suggestion: 'Split into two sentences: \'This illustrates one overt way white supremacy maintains its power. Black individuals are relegated to servitude, denying them opportunities for significant employment.\'',
  },
  {
    id: 'b-improve-15',
    type: 'improve',
    text: 'In Get Out, the Sunken Place is a metaphor for the state of mind of minorities who have been brainwashed by white supremacy.',
    comment: 'This section could be enhanced with more specific detail or clearer development.',
    suggestion: 'Add: \'When Chris is hypnotized, he descends into a void where he can see and hear but cannot speak—a powerful metaphor for the silencing of Black voices.\'',
  },
  {
    id: 'b-improve-16',
    type: 'improve',
    text: 'One form of racism that is often overlooked in the modern society is micro-aggressions.',
    comment: 'This statement introduces an important concept but lacks depth.',
    suggestion: 'Expand by adding: \'Micro-aggressions, subtle yet pervasive, reveal the insidious nature of racism in everyday interactions, often going unnoticed by those who perpetuate them.\'',
  },
  // Serious Concerns (Red) - replaced per image design
  {
    id: 'b-concern-1',
    type: 'concern',
    text: 'The movie starts with Chris deciding to go with his girlfriend Rose to meet her parents for a weekend for the first time.',
    comment: 'This is plot summary rather than analysis. Focus on what the scene reveals about race.',
    suggestion: 'Revise to: \'The opening establishes racial anxiety through the couple\'s interracial relationship and the Armitage family\'s performative hospitality, which masks a far darker agenda.\'',
    demoRevisedText:
      'The opening establishes racial anxiety through the couple\'s interracial relationship and the Armitage family\'s performative hospitality, which masks a far darker agenda.',
  },
  {
    id: 'b-concern-2',
    type: 'concern',
    text: 'This paper will look at how race is represented in the movie Get Out and discuss several different theories and beliefs regarding race.',
    comment: 'This reads as a vague roadmap. State a specific, arguable thesis instead.',
    suggestion: 'Revise to: \'This essay argues that Get Out exposes how white supremacy maintains power through both overt violence and covert mechanisms like microaggressions and the commodification of Black bodies.\'',
  },
  {
    id: 'b-concern-3',
    type: 'concern',
    text: 'Lull defines hegemony being "The power or dominance that one social group hold over others. This can refer to the economic-cultural relations between and among social classes within a nation (1995, p.25)".',
    comment: 'The citation lacks proper MLA formatting and contains grammatical errors ("hold" should be "holds," "being" is awkward).',
    suggestion: 'Revise to: \'Lull defines hegemony as "the power or dominance that one social group holds over others," including the economic-cultural relations between social classes within a nation (25).\'',
  },
  {
    id: 'b-concern-5',
    type: 'concern',
    text: 'On top of that, the scene where Chris is being bid on at the bingo auction (which can be compared to when slaves were being bid on/bought/sold) relates to white people having the hegemony.',
    comment: '"Having the hegemony" is awkward. Use more precise academic language.',
    suggestion: 'Revise to: \'The auction scene echoes slave auctions, with the silver spoon\'s chime symbolizing the activation of Black bodies for white consumption—illustrating how hegemony operates through both economic and symbolic power.\'',
  },
  {
    id: 'b-concern-6',
    type: 'concern',
    text: 'One reason for this is the on all the white people\'s bingo cards they all won the game of bingo, which corresponds to the fact that in society if you\'re white your seen as a winner in society.',
    comment: 'This sentence is confusing and contains grammatical errors.',
    suggestion: 'Revise to: \'On all the white participants\' bingo cards, they won the game, symbolizing how society often views whiteness as synonymous with success.\'',
  },
  {
    id: 'b-concern-7',
    type: 'concern',
    text: 'They must learn and master "identity codes" that symbolizes their particular gender role" (2009, p.151).',
    comment: 'Subject-verb agreement: "that symbolizes" should be "that symbolize" (plural "codes").',
    suggestion: 'Revise to: \'The film shows how Walter and Georgina embody these codes—Walter\'s stoicism and Georgina\'s servility both perform for white comfort.\'',
  },
  {
    id: 'b-concern-8',
    type: 'concern',
    text: 'Even though they might look slightly different from the past, racist traditions of white supremacy are constantly being upheld for the purpose of maintaining power.',
    comment: 'The phrase \'might look slightly different\' is vague and undermines the argument.',
    suggestion: 'Revise to: \'Although the manifestations of racism may have evolved, the underlying traditions of white supremacy persist to maintain power.\'',
  },
  {
    id: 'b-concern-9',
    type: 'concern',
    text: 'They are being controlled by the hegemonic powers already in place.',
    comment: 'The pronoun "They" is ambiguous. Specify the referent.',
    suggestion: 'Revise to: \'The hypnotized Black characters in the Sunken Place are controlled by the hegemonic powers the Armitage family wields.\'',
  },
];

export const DEMO_B_RUBRIC: DemoRubricCategory[] = [
  { name: 'Thesis And Argument', score: 15, maxScore: 20, feedback: 'The thesis presents a clear argument but lacks depth and specificity in some areas.' },
  { name: 'Response To Question', score: 17, maxScore: 20, feedback: 'The essay addresses the prompt effectively but could improve in clarity and focus.' },
  { name: 'Organization And Structure', score: 13, maxScore: 15, feedback: 'The structure is somewhat disorganized, affecting the flow of arguments.' },
  { name: 'Writing Quality And Clarity', score: 9, maxScore: 10, feedback: 'Numerous grammatical errors and awkward phrasing hinder clarity.' },
  { name: 'Analysis And Critical Thinking', score: 15, maxScore: 20, feedback: 'The analysis is insightful but could benefit from deeper exploration of key concepts.' },
  { name: 'Use Of Evidence And Textual Support', score: 13, maxScore: 15, feedback: 'Evidence is used but lacks consistency in citation format and depth of analysis.' },
];

export const DEMO_B_OVERALL_SCORE = 82;
export const DEMO_B_GRADE = 'B (80-89%)';
export const DEMO_B_WORD_COUNT = 1619;

export const DEMO_B_COMPREHENSIVE_ANALYSIS = {
  overallSummary: 'The essay offers a thoughtful analysis of race representation in Get Out, effectively connecting the film to concepts of white privilege and microaggressions. The use of academic sources strengthens the argument. However, structural inconsistencies and some grammatical issues prevent the analysis from reaching its full potential.',
  clarityRating: 'Needs Work',
  topSuggestions: [
    'Revise the thesis statement to be more specific about the film\'s argument and your analytical approach.',
    'Ensure consistent MLA formatting for in-text citations and the bibliography.',
    'Proofread for grammar and phrasing, particularly in transitions between paragraphs.',
  ],
  categories: [
    {
      name: 'Academic Writing Quality',
      summary: 'The essay demonstrates solid understanding of themes but could improve the clarity of argumentation.',
      strengths: [
        { quote: '"The film Get Out works to critique the state of race relations by showing both the covert and overt ways that white supremacy maintains its subjugating power."', feedback: 'Strong opening thesis that establishes a clear analytical framework.' },
      ],
      areasForImprovement: [
        { quote: '"there servants"', suggestion: 'Correct to "their servants" for proper grammar.' },
      ],
      seriousConcerns: [],
    },
    {
      name: 'Citation Referencing',
      summary: 'Citations are present but lack consistency in MLA formatting.',
      strengths: [],
      areasForImprovement: [
        { quote: 'In-text citations', suggestion: 'Ensure all paraphrased material includes author and page number in MLA format.' },
      ],
      seriousConcerns: [],
    },
    {
      name: 'Argument Structure',
      summary: 'The essay struggles with transitions between ideas in places.',
      strengths: [
        { quote: 'The Sunken Place metaphor', feedback: 'Effective use of a key scene to support the argument about silencing.' },
      ],
      areasForImprovement: [
        { quote: 'Transition into microaggressions paragraph', suggestion: 'Add a sentence linking white privilege to the concept of microaggressions.' },
      ],
      seriousConcerns: [],
    },
    {
      name: 'Grammar Style',
      summary: 'Several grammatical errors and awkward phrasings detract from clarity.',
      strengths: [],
      areasForImprovement: [
        { quote: 'Run-on sentences in the white privilege paragraph', suggestion: 'Break into shorter sentences for readability.' },
      ],
      seriousConcerns: [
        { quote: '"the on all the white people\'s bingo cards"', suggestion: 'Correct to "that on" and "you\'re" for proper grammar.' },
      ],
    },
    {
      name: 'Content Depth',
      summary: 'The analysis shows good critical thinking but could explore concepts like microaggressions in more depth.',
      strengths: [
        { quote: 'Integration of Sue et al. definition', feedback: 'Effective use of academic source to ground the film analysis.' },
      ],
      areasForImprovement: [
        { quote: 'Microaggression categories', suggestion: 'Consider briefly explaining microinsult, microassault, and microinvalidation to strengthen the analysis.' },
      ],
      seriousConcerns: [],
    },
  ],
  priorityRecommendations: [
    'Revise the thesis statement to be more specific and arguable.',
    'Ensure consistent MLA formatting throughout the essay.',
    'Proofread carefully for grammar and awkward phrasing.',
  ],
};

/** Unified demo type for switching between papers */
export interface DemoPaper {
  id: string;
  label: string;
  title: string;
  content: string;
  annotations: DemoAnnotation[];
  rubric: DemoRubricCategory[];
  overallScore: number;
  grade: string;
  wordCount: number;
  comprehensiveAnalysis: typeof DEMO_COMPREHENSIVE_ANALYSIS;
}

/** Short excerpt for landing hero “After” mock-up (revised draft, ~A range) — same topic as B demo */
export const DEMO_HERO_AFTER_TITLE = 'Is There a Way Out? Race, Control, and Illusion in Jordan Peele\'s Get Out';

export const DEMO_HERO_AFTER_CONTENT = `Is There a Way Out? Race, Control, and Illusion in Jordan Peele's Get Out

Jordan Peele's Get Out (2017) examines how liberal racism and bodily coercion sustain white supremacy. Rather than portraying racism as overt hostility alone, Peele exposes its subtler forms—embedded within liberal discourse and social interaction.

The film critiques race relations by showing both covert and overt ways white supremacy maintains power. This idea resonates with Bonilla-Silva's argument that modern racism lives in everyday systems rather than only as slurs or open hostility (3). Peele's ending—in which Chris is arrested—underscores that the horror lies not only in the act but in its familiarity.`;

export const DEMO_HERO_AFTER_ANNOTATIONS: DemoAnnotation[] = [
  {
    id: 'ha-1',
    type: 'strong',
    text: 'Rather than portraying racism as overt hostility alone, Peele exposes its subtler forms—embedded within liberal discourse and social interaction.',
    comment: 'Clear analytical claim: you name what the film does (expose) and where it operates (discourse and interaction).',
    suggestion: 'Use this pattern in each body paragraph: one claim + where it shows up in the film.',
  },
  {
    id: 'ha-2',
    type: 'strong',
    text: 'The film critiques race relations by showing both covert and overt ways white supremacy maintains power.',
    comment: 'Strong thesis-adjacent sentence: covert/overt maps cleanly onto Peele’s plot and imagery.',
    suggestion: 'Mirror this structure in topic sentences so each paragraph advances the same analytical frame.',
  },
  {
    id: 'ha-3',
    type: 'strong',
    text: 'This idea resonates with Bonilla-Silva\'s argument that modern racism lives in everyday systems rather than only as slurs or open hostility (3).',
    comment: 'Effective synthesis: you connect the film to scholarship and MLA in-text citation is in place.',
    suggestion: 'Keep pairing one scene with one theoretical anchor per section.',
  },
  {
    id: 'ha-4',
    type: 'strong',
    text: 'Peele\'s ending—in which Chris is arrested—underscores that the horror lies not only in the act but in its familiarity.',
    comment: 'Strong close: you connect plot to theme—the horror is systemic, not only visceral.',
    suggestion: 'Optional trim: "Peele\'s ending, with Chris arrested, underscores that the horror lies in the act and in its familiarity."',
  },
];

/** Landing hero only — not listed in interactive demo switcher */
export const DEMO_HERO_AFTER_PAPER: DemoPaper = {
  id: 'hero-after',
  label: 'After · revised draft',
  title: DEMO_HERO_AFTER_TITLE,
  content: DEMO_HERO_AFTER_CONTENT,
  annotations: DEMO_HERO_AFTER_ANNOTATIONS,
  rubric: DEMO_B_RUBRIC,
  overallScore: 90,
  grade: 'A (90%+)',
  wordCount: 420,
  comprehensiveAnalysis: DEMO_B_COMPREHENSIVE_ANALYSIS,
};

export const DEMO_PAPERS: DemoPaper[] = [
  {
    id: 'c',
    label: 'C grade sample',
    title: DEMO_ESSAY_TITLE,
    content: DEMO_ESSAY_CONTENT,
    annotations: DEMO_ANNOTATIONS,
    rubric: DEMO_RUBRIC,
    overallScore: DEMO_OVERALL_SCORE,
    grade: DEMO_GRADE,
    wordCount: DEMO_WORD_COUNT,
    comprehensiveAnalysis: DEMO_COMPREHENSIVE_ANALYSIS,
  },
  {
    id: 'b',
    label: 'B grade sample',
    title: DEMO_B_ESSAY_TITLE,
    content: DEMO_B_ESSAY_CONTENT,
    annotations: DEMO_B_ANNOTATIONS,
    rubric: DEMO_B_RUBRIC,
    overallScore: DEMO_B_OVERALL_SCORE,
    grade: DEMO_B_GRADE,
    wordCount: DEMO_B_WORD_COUNT,
    comprehensiveAnalysis: DEMO_B_COMPREHENSIVE_ANALYSIS,
  },
];

/** Dashboard analyze previews: mostly amber + rose (no strong/green in excerpt) */
export const DEMO_DASHBOARD_BEFORE_PAPER: DemoPaper = {
  ...DEMO_PAPERS[0],
  id: 'dashboard-before',
  label: 'Before · draft',
  annotations: DEMO_ANNOTATIONS.filter((a) => a.type === 'improve' || a.type === 'concern'),
};

/** Dashboard: same “after” excerpt, all highlights read as strong (green) in the mock-up */
export const DEMO_DASHBOARD_AFTER_PAPER: DemoPaper = {
  ...DEMO_HERO_AFTER_PAPER,
  id: 'dashboard-after',
  label: 'After · revised',
};
