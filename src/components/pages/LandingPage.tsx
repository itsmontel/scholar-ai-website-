import React, { useState } from 'react';
import Footer from '../common/Footer';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const LandingPage = ({ onNavigate }: LandingPageProps) => {
  const [inputText, setInputText] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<any>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const placeholders = [
    "Enhance your academic writing with a simple paste and click.",
    "Get instant feedback on your essay or thesis.",
    "Turn good writing into great writing with WriteScholar."
  ];

  const reviews = [
    {
      text: "WriteScholar has revolutionized my research writing process. The AI feedback is incredibly detailed and helped me improve my argumentation and academic style significantly."
    },
    {
      text: "WriteScholar's annotation system is exactly what I needed for my thesis. The color-coded feedback makes it easy to prioritize improvements and track my progress over time."
    },
    {
      text: "As a professor, I recommend WriteScholar to all my students. It provides the kind of detailed feedback that would normally take hours of manual review. A game-changer for academic writing."
    }
  ];

  const examplePapers = [
    {
      title: "Climate Change Research Paper",
      subtitle: "Environmental Science Study • Analyzed 2 hours ago",
      content: [
        {
          text: "Climate change represents one of the most pressing challenges of our time, affecting ecosystems, economies, and societies worldwide. This study examines the multifaceted impacts of global warming on biodiversity and ecosystem services across multiple biomes and temporal scales, with particular focus on the period 2010-2023.",
          annotations: [
            {
              type: "green",
              text: "Climate change represents one of the most pressing challenges of our time",
              tooltip: "Excellent opening statement that immediately establishes the significance and urgency of your research topic."
            }
          ]
        },
        {
          text: "Our comprehensive analysis reveals significant temperature increases across all studied regions, with particular emphasis on polar and tropical ecosystems. The data shows a clear correlation between rising temperatures and species migration patterns, with documented shifts in habitat ranges exceeding 100 kilometers in some cases. These findings are consistent with previous studies by Smith et al. (2021) and Johnson (2022).",
          annotations: [
            {
              type: "green",
              text: "comprehensive analysis reveals significant temperature increases",
              tooltip: "Strong methodology with clear presentation of quantitative findings and specific data points."
            }
          ]
        },
        {
          text: "The research methodology employed a comprehensive analysis of temperature data from 2000-2023, though the sample size could be expanded to include more diverse geographical regions. Statistical models were applied to assess correlation patterns between climate variables and ecosystem responses, utilizing both linear regression and machine learning approaches.",
          annotations: [
            {
              type: "amber",
              text: "though the sample size could be expanded",
              tooltip: "Good methodology description, but consider adding more detail about sample selection criteria and geographical coverage to strengthen generalizability."
            }
          ]
        },
        {
          text: "Economic implications of these ecological changes are substantial, with estimated costs to agricultural productivity reaching $50 billion annually in affected regions. The cascading effects on food security and rural livelihoods require immediate attention from policymakers and international organizations, particularly in developing nations where adaptation resources are limited.",
          annotations: [
            {
              type: "green",
              text: "Economic implications of these ecological changes are substantial",
              tooltip: "Excellent integration of environmental and economic analysis with specific quantitative estimates and policy relevance."
            }
          ]
        },
        {
          text: "The conclusion section lacks sufficient discussion of policy implications and fails to address the limitations of the current research methodology. Future studies should consider longitudinal data collection and more comprehensive stakeholder engagement to ensure practical applicability of findings.",
          annotations: [
            {
              type: "red",
              text: "lacks sufficient discussion of policy implications",
              tooltip: "Critical issue: Your conclusion needs to address practical applications and policy recommendations to strengthen the paper's impact and real-world relevance."
            }
          ]
        }
      ],
      feature: "Real-time Analysis",
      description: "Instant feedback with detailed annotations highlighting strengths and improvement areas.",
      summary: {
        general: "This climate change research demonstrates strong scientific methodology with comprehensive data analysis, though it needs better policy integration and clearer practical applications.",
        goods: [
          "Excellent opening that immediately establishes research significance and urgency",
          "Strong quantitative analysis with specific data points and clear methodology",
          "Good integration of economic and environmental perspectives with concrete estimates",
          "Comprehensive temporal scope (2000-2023) with clear correlation patterns"
        ],
        improvements: [
          "Expand sample size to include more diverse geographical regions for better generalizability",
          "Add more specific examples and research citations to strengthen claims",
          "Include discussion of practical applications and implementation strategies"
        ],
        concerns: [
          "Critical gap: Conclusion lacks sufficient policy implications and practical recommendations",
          "Missing discussion of research limitations and methodological constraints",
          "Need for more comprehensive stakeholder engagement and real-world applicability"
        ]
      }
    },
    {
      title: "Economics Thesis Draft",
      subtitle: "Macroeconomic Analysis • Analyzed 1 day ago",
      content: [
        {
          text: "The relationship between monetary policy and economic growth has been extensively studied, yet recent developments in digital currencies present new challenges for traditional economic models. This research examines the evolving landscape of central banking and its implications for macroeconomic stability across both developed and emerging markets.",
          annotations: [
            {
              type: "green",
              text: "extensively studied, yet recent developments in digital currencies present new challenges",
              tooltip: "Strong literature review that acknowledges existing research while identifying a current gap in the field."
            }
          ]
        },
        {
          text: "Our econometric analysis reveals significant correlations between interest rates and GDP growth across 45 countries over a 15-year period (2008-2023). The findings demonstrate that a 1% increase in policy rates typically corresponds to a 0.3% decrease in GDP growth within 12 months, with stronger effects observed in emerging markets.",
          annotations: [
            {
              type: "green",
              text: "significant correlations between interest rates and GDP growth across 45 countries",
              tooltip: "Excellent use of specific data with clear timeframes and comprehensive country coverage that strengthens your argument."
            }
          ]
        },
        {
          text: "The model's R-squared value of 0.67 indicates moderate explanatory power, though the R-squared value suggests room for additional explanatory variables such as inflation expectations, exchange rate volatility, and financial market conditions. Including these factors could improve model fit and provide more nuanced insights.",
          annotations: [
            {
              type: "amber",
              text: "though the R-squared value suggests room for additional explanatory variables",
              tooltip: "Good statistical analysis, but consider adding more variables or discussing model limitations in greater detail to enhance robustness."
            }
          ]
        },
        {
          text: "Cross-country analysis reveals substantial heterogeneity in policy transmission mechanisms, with emerging markets showing greater sensitivity to interest rate changes compared to advanced economies. This finding has important implications for global monetary policy coordination and suggests the need for differentiated policy approaches.",
          annotations: [
            {
              type: "green",
              text: "Cross-country analysis reveals substantial heterogeneity in policy transmission mechanisms",
              tooltip: "Strong comparative analysis with clear policy implications and practical applications for central banking."
            }
          ]
        },
        {
          text: "The data collection process was flawed due to inconsistent reporting standards across different countries, which may compromise the validity of our findings. Additionally, the exclusion of recent financial crises may limit the generalizability of our conclusions and requires careful consideration in future research.",
          annotations: [
            {
              type: "red",
              text: "The data collection process was flawed",
              tooltip: "Major concern: Data quality issues need to be addressed before drawing conclusions. Consider alternative data sources or methodology to ensure reliability."
            }
          ]
        }
      ],
      feature: "Citation Enhancement",
      description: "AI-powered suggestions for better source integration and citation formatting.",
      summary: {
        general: "This economics thesis shows strong analytical foundations with comprehensive cross-country data, but requires better data quality controls and methodological robustness.",
        goods: [
          "Strong literature review that identifies current research gaps in digital currency impacts",
          "Excellent quantitative analysis with specific correlations and clear timeframes (2008-2023)",
          "Comprehensive cross-country analysis with 45 countries providing robust sample",
          "Clear policy implications with practical applications for central banking"
        ],
        improvements: [
          "Include additional explanatory variables (inflation expectations, exchange rates) to improve model fit",
          "Expand discussion of model limitations and statistical robustness",
          "Add more specific data points and statistical measures in methodology section"
        ],
        concerns: [
          "Critical data quality issues: Inconsistent reporting standards across countries compromise validity",
          "Missing consideration of recent financial crises limits generalizability of conclusions",
          "Need for alternative data sources or methodology to ensure reliability and accuracy"
        ]
      }
    },
    {
      title: "Psychology Research Study",
      subtitle: "Behavioral Analysis • Analyzed 3 hours ago",
      content: [
        {
          text: "Social media usage patterns among adolescents have shown remarkable consistency across demographic groups, with average daily usage exceeding 6 hours per day. This study examines the psychological and behavioral implications of digital engagement among 12-18 year olds across diverse socioeconomic backgrounds, utilizing both quantitative and qualitative methodologies.",
          annotations: [
            {
              type: "green",
              text: "remarkable consistency across demographic groups",
              tooltip: "Excellent use of specific data and clear demographic analysis that strengthens your argument with concrete statistics."
            }
          ]
        },
        {
          text: "Longitudinal data collected over 18 months reveals significant correlations between social media consumption and sleep quality, with participants reporting 23% more sleep disturbances compared to control groups. The findings suggest that digital engagement patterns directly impact circadian rhythms and overall well-being, with particular effects observed in evening usage patterns.",
          annotations: [
            {
              type: "green",
              text: "Longitudinal data collected over 18 months reveals significant correlations",
              tooltip: "Strong research design with longitudinal methodology and specific quantitative findings that demonstrate causality."
            }
          ]
        },
        {
          text: "The psychological impact of prolonged social media exposure appears to correlate with increased anxiety levels, although the causal relationship requires further investigation. Additional factors such as pre-existing mental health conditions and family dynamics may confound these associations and should be controlled for in future studies.",
          annotations: [
            {
              type: "amber",
              text: "although the causal relationship requires further investigation",
              tooltip: "Good acknowledgment of limitations, but consider discussing potential confounding variables and study design improvements to strengthen causal claims."
            }
          ]
        },
        {
          text: "Qualitative interviews with 25 participants revealed nuanced insights into social media's role in identity formation and peer relationships. Many adolescents described using platforms for creative expression and community building, challenging purely negative narratives about digital engagement and highlighting the complexity of social media effects.",
          annotations: [
            {
              type: "green",
              text: "Qualitative interviews with 25 participants revealed nuanced insights",
              tooltip: "Excellent mixed-methods approach that provides depth and context to quantitative findings, offering balanced perspective."
            }
          ]
        },
        {
          text: "Our sample size of 50 participants is insufficient for drawing meaningful conclusions about population-wide trends in social media behavior. The limited geographical scope and lack of diversity in participant selection further constrain the generalizability of our findings and require careful consideration in interpreting results.",
          annotations: [
            {
              type: "red",
              text: "sample size of 50 participants is insufficient",
              tooltip: "Critical limitation: Small sample size significantly weakens your study's external validity. Consider power analysis and sample size justification for stronger conclusions."
            }
          ]
        }
      ],
      feature: "Structure Optimization",
      description: "AI suggestions for better paper organization, logical flow, and clarity.",
      summary: {
        general: "This psychology study demonstrates strong mixed-methods design with valuable insights, but is significantly limited by sample size and geographical scope affecting generalizability.",
        goods: [
          "Excellent mixed-methods approach combining quantitative and qualitative data collection",
          "Strong longitudinal design (18 months) with specific quantitative findings (23% sleep disturbance increase)",
          "Comprehensive demographic analysis with concrete statistics (6+ hours daily usage)",
          "Balanced perspective challenging negative narratives about social media effects"
        ],
        improvements: [
          "Expand discussion of potential confounding variables and study design improvements",
          "Add more specific examples and research citations to strengthen causal claims",
          "Include detailed discussion of practical applications and intervention strategies"
        ],
        concerns: [
          "Critical limitation: Sample size of 50 participants insufficient for population-wide conclusions",
          "Limited geographical scope and lack of diversity constrains generalizability",
          "Need for power analysis and sample size justification to strengthen external validity"
        ]
      }
    }
  ];

  const faqs = [
    {
      question: "How does WriteScholar's AI analysis work?",
      answer: "WriteScholar uses advanced natural language processing to analyze your academic writing for structure, clarity, grammar, citations, and academic rigor. Our AI provides detailed feedback similar to what you'd receive from a professor or writing tutor."
    },
    {
      question: "Is my document content secure and private?",
      answer: "Yes, absolutely. We use enterprise-grade encryption to protect your documents. Your content is never shared with third parties, and you can delete your documents at any time. We're SOC 2 Type II compliant."
    },
    {
      question: "What file formats does WriteScholar support?",
      answer: "WriteScholar supports PDF, Word documents (.docx), and plain text. You can also paste text directly into our editor. We're working on adding support for LaTeX and other academic formats."
    },
    {
      question: "Can I use WriteScholar for different citation styles?",
      answer: "Yes! WriteScholar supports APA, MLA, Chicago, Harvard, and many other citation styles. You can specify your preferred style, and our AI will check your citations accordingly."
    },
    {
      question: "How accurate is the AI feedback?",
      answer: "Our AI has been trained on thousands of academic papers and provides feedback comparable to human reviewers. While it's highly accurate, we recommend using it as a supplement to, not a replacement for, human review."
    }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!isFocused) {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isFocused, placeholders.length]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [reviews.length]);


  const handleSubmit = () => {
    onNavigate('signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100/20 via-transparent to-transparent"></div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 md:px-16 py-4 sm:py-6 backdrop-blur-sm bg-white/80 border-b border-white/20">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl sm:text-2xl">W</span>
          </div>
          <span className="text-lg sm:text-2xl font-bold text-gray-900">WriteScholar</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => onNavigate('features')}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            Features
          </button>
          <button 
            onClick={() => {
              const pricingSection = document.getElementById('pricing');
              if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            Pricing
          </button>
          <button 
            onClick={() => onNavigate('about')}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            About
          </button>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button 
            onClick={() => onNavigate('login')}
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100/50 text-sm sm:text-base"
          >
            Login
          </button>
          <button 
            onClick={() => onNavigate('signup')}
            className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-8xl mx-auto px-4 sm:px-8 md:px-16 py-12 sm:py-16 md:py-24">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight tracking-tight">
            Enhance your academic<br className="hidden sm:block" /><span className="sm:hidden"> </span>writing with <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">WriteScholar</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-12 sm:mb-16 max-w-3xl mx-auto leading-relaxed font-light px-4">
            Get detailed feedback on your research papers, essays, and academic work with AI-powered analysis that helps you write like a scholar.
          </p>
          
          {/* Interactive Text Input */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12 px-4">
            <div className="relative">
              {/* Shadow gradient behind the input */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl sm:rounded-3xl blur-sm"></div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 p-4 sm:p-6 md:p-8 hover:shadow-3xl transition-all duration-500">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={isFocused ? "" : placeholders[placeholderIndex]}
                  className="w-full min-h-20 sm:min-h-24 max-h-48 pb-6 pl-2 sm:pl-4 md:pl-6 pr-14 sm:pr-20 text-gray-700 border-none outline-none resize-none placeholder-gray-400 bg-transparent text-sm sm:text-base md:text-lg font-light transition-all duration-300 overflow-y-auto leading-relaxed"
                  style={{ 
                    height: 'auto', 
                    lineHeight: '1.6',
                    paddingTop: '0px',
                    marginTop: '0px'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 192) + 'px'; // 192px = max-h-48
                  }}
                />
                <button
                  onClick={handleSubmit}
                  className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl hover:shadow-lg transform hover:scale-110 transition-all duration-300 flex items-center justify-center group z-10"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Suggested Categories */}
            <div className="mt-8 text-center">
              <div className="flex flex-wrap justify-center gap-3">
                <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                  Research Paper
                </button>
                <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                  Thesis Draft
                </button>
                <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                  Essay Analysis
                </button>
                <button className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200">
                  Literature Review
                </button>
              </div>
            </div>
          </div>
        </div>

         {/* Trusted By Section */}
         <div className="text-center mb-12 sm:mb-16 px-4 sm:px-8 md:px-16">
           <div className="max-w-6xl mx-auto">
             <div className="flex items-center justify-center space-x-4">
               <div className="flex -space-x-2">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-2 border-white">
                   <span className="text-white font-semibold text-sm">A</span>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg border-2 border-white">
                   <span className="text-white font-semibold text-sm">S</span>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg border-2 border-white">
                   <span className="text-white font-semibold text-sm">M</span>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg border-2 border-white">
                   <span className="text-white font-semibold text-sm">J</span>
                 </div>
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg border-2 border-white">
                   <span className="text-white font-semibold text-sm">L</span>
                 </div>
               </div>
               <div className="ml-4">
                 <p className="text-gray-600 font-medium">Trusted by many users</p>
               </div>
             </div>
           </div>
         </div>

         {/* Interactive Annotation Examples */}
         <div className="max-w-full mx-auto mb-16 sm:mb-24 md:mb-32 px-4 sm:px-8 md:px-12 lg:px-20">
           <div className="text-center mb-12 sm:mb-16 md:mb-20">
             <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight">See WriteScholar in Action</h2>
             <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light max-w-4xl mx-auto leading-relaxed px-4">Real examples of how our AI analyzes and improves academic writing</p>
             </div>
           
           {/* Three Separate Papers */}
           <div className="space-y-12 sm:space-y-16 md:space-y-20">
             {examplePapers.map((paper, paperIndex) => (
               <div key={paperIndex} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 md:gap-16 items-start">
                 {/* Document Display */}
                 <div className="relative group lg:col-span-2">
                   <div className="absolute -inset-1 bg-gradient-to-r from-green-400/30 to-amber-400/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                   <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 hover:shadow-3xl transition-all duration-700 overflow-hidden">
                     <div className="p-6 border-b border-gray-100">
                       <h3 className="text-xl font-semibold text-gray-900 mb-1">{paper.title}</h3>
                       <p className="text-sm text-gray-500 font-medium">{paper.subtitle}</p>
                     </div>
                     
                     <div className="p-6">
                       <div className="prose max-w-none">
                         {paper.content.map((paragraph, pIndex) => (
                           <p key={pIndex} className="text-gray-700 leading-relaxed mb-4">
                             {paragraph.annotations.length > 0 ? (
                               paragraph.text.split(paragraph.annotations[0].text).map((part, partIndex) => (
                                 <React.Fragment key={partIndex}>
                                   {part}
                                   {partIndex < paragraph.text.split(paragraph.annotations[0].text).length - 1 && (
                                     <span 
                                       className={`px-2 py-1 rounded border-l-4 cursor-pointer transition-all duration-200 ${
                                         paragraph.annotations[0].type === 'green' 
                                           ? 'bg-green-100 border-green-500 hover:bg-green-200' 
                                           : paragraph.annotations[0].type === 'amber'
                                           ? 'bg-amber-100 border-amber-500 hover:bg-amber-200'
                                           : 'bg-red-100 border-red-500 hover:bg-red-200'
                                       }`}
                                       onMouseEnter={() => setHoveredAnnotation(paragraph.annotations[0])}
                                       onMouseLeave={() => setHoveredAnnotation(null)}
                                     >
                                       {paragraph.annotations[0].text}
                                     </span>
                                   )}
                                 </React.Fragment>
                               ))
                             ) : (
                               paragraph.text
                             )}
                           </p>
                         ))}
            </div>
                       
                       {/* Annotation Legend */}
                       <div className="mt-6 pt-4 border-t border-gray-100">
                         <div className="flex flex-wrap gap-4">
                           <div className="flex items-center space-x-2">
                             <div className="w-3 h-3 bg-green-500 rounded border-l-2 border-green-600 shadow-sm"></div>
                             <span className="text-xs font-medium text-gray-700">Strong sections</span>
                </div>
                           <div className="flex items-center space-x-2">
                             <div className="w-3 h-3 bg-amber-500 rounded border-l-2 border-amber-600 shadow-sm"></div>
                             <span className="text-xs font-medium text-gray-700">Needs improvement</span>
              </div>
                           <div className="flex items-center space-x-2">
                             <div className="w-3 h-3 bg-red-500 rounded border-l-2 border-red-600 shadow-sm"></div>
                             <span className="text-xs font-medium text-gray-700">Needs revision</span>
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>

                 {/* Annotations Panel */}
                 <div className="lg:col-span-1">
                   <div className="relative">
                     <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-3xl blur-sm"></div>
                     <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-6 max-h-fit">
                       <h3 className="text-2xl font-bold text-gray-900 mb-6">
                         Annotations
                       </h3>
                       
                       
                       {/* Goods */}
                       <div className="mb-4">
                         <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                           <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
                             <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                             </svg>
                           </div>
                           Strong Points
                         </h4>
                         <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
                           <ul className="space-y-2">
                             {paper.summary.goods.map((item, index) => (
                               <li key={index} className="flex items-start space-x-2">
                                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                 <span className="text-gray-700 text-sm">{item}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                       </div>
                       
                       {/* Improvements */}
                       <div className="mb-4">
                         <h4 className="text-lg font-semibold text-amber-700 mb-3 flex items-center">
                           <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mr-2">
                             <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                             </svg>
                           </div>
                           Areas to Improve
                         </h4>
                         <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4">
                           <ul className="space-y-2">
                             {paper.summary.improvements.map((item, index) => (
                               <li key={index} className="flex items-start space-x-2">
                                 <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                 <span className="text-gray-700 text-sm">{item}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                       </div>
                       
                       {/* Concerns */}
            <div className="mb-4">
                         <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                           <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-2">
                             <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                             </svg>
                           </div>
                           Serious Concerns
                         </h4>
                         <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                           <ul className="space-y-2">
                             {paper.summary.concerns.map((item, index) => (
                               <li key={index} className="flex items-start space-x-2">
                                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                 <span className="text-gray-700 text-sm">{item}</span>
                               </li>
                             ))}
                           </ul>
                         </div>
                       </div>
                     </div>
            </div>
                </div>
   
              </div>
             ))}
           </div>

          {/* Tooltip */}
          {hoveredAnnotation && (
            <div className="fixed z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm max-w-xs pointer-events-none"
                 style={{
                   left: '50%',
                   top: '50%',
                   transform: 'translate(-50%, -50%)'
                 }}>
              {hoveredAnnotation.tooltip}
            </div>
          )}
                </div>

        {/* Reviews Section */}
        <div className="text-center mb-16 sm:mb-20 md:mb-24 px-4 sm:px-8 md:px-16">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                    </svg>
                  </div>
                </div>
                <blockquote className="text-base sm:text-lg md:text-xl text-gray-900 mb-6 sm:mb-8 leading-relaxed font-light transition-all duration-500 px-4">
                  "{reviews[reviewIndex].text}"
                </blockquote>
                <div className="flex justify-center mt-6 space-x-3">
                  {reviews.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === reviewIndex 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    ></div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-5xl mx-auto mb-16 sm:mb-24 md:mb-32 px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight">FAQs</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 font-light">Common questions about WriteScholar</p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 overflow-hidden hover:shadow-2xl transition-all duration-500">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-10 py-8 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 pr-6">{faq.question}</h3>
                    <div className={`w-8 h-8 flex items-center justify-center transition-transform duration-300 ${
                      openFAQ === index ? 'rotate-45' : ''
                    }`}>
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </button>
                  {openFAQ === index && (
                    <div className="px-10 pb-8">
                      <div className="border-t border-gray-100 pt-6">
                        <p className="text-gray-600 leading-relaxed text-lg">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16 sm:mb-24 md:mb-32 px-4 sm:px-6 md:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight">How it works</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-12 sm:mb-16 md:mb-24 font-light max-w-4xl mx-auto leading-relaxed">Transform your academic writing into polished, professional work in just a few simple steps.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
            <div className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-blue-600/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-500">
                    <span className="text-white font-bold text-2xl sm:text-3xl">1</span>
                  </div>
              </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Upload Your Paper</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">Upload your academic document in PDF, Word, or paste your text directly into our secure platform.</p>
            </div>
            <div className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-purple-600/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-500">
                    <span className="text-white font-bold text-2xl sm:text-3xl">2</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">AI Analysis</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">Our advanced AI analyzes your writing for structure, clarity, grammar, citation style, and academic rigor.</p>
              </div>
              <div className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/30 to-green-600/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-500">
                    <span className="text-white font-bold text-2xl sm:text-3xl">3</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Review Feedback</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">Get detailed, professor-style annotations and suggestions with explanations for every recommendation.</p>
            </div>
            <div className="text-center group">
                <div className="relative mb-6 sm:mb-8">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-indigo-600/30 rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition duration-700"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-all duration-500">
                    <span className="text-white font-bold text-2xl sm:text-3xl">4</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Improve & Iterate</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">Apply suggestions and re-analyze to continuously enhance your academic writing skills and quality.</p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="max-w-6xl mx-auto mb-16 sm:mb-24 md:mb-32 px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Simple and transparent pricing
            </h2>
            
            {/* Key Benefits */}
            <div className="flex justify-center items-center space-x-12 mb-10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm font-medium">A fraction of traditional editing costs</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm font-medium">Used by thousands of researchers</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h3>
              <p className="text-gray-600 mb-6">Select the plan that fits your needs.</p>
              
              {/* Billing Toggle */}
              <div className="flex items-center justify-center space-x-4">
                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
                  Annual
                </span>
                {billingCycle === 'annual' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                    Save 17%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-md hover:shadow-xl hover:border-gray-300/60 transition-all duration-300">
              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <p className="text-gray-600 mb-6">Perfect for getting started</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      $0
                    </span>
                    <span className="text-gray-600 ml-2">
                      /month
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">1MB total upload limit</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">3 document uploads per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">3 AI analyses per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">50% document annotation only</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Basic support</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate('signup')}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Starter Plan */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-blue-500/60 shadow-lg transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl text-center font-bold text-sm shadow-lg">
                  Most Popular
                </div>
              </div>

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                  <p className="text-gray-600 mb-6">Most popular for students</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {billingCycle === 'monthly' ? '$19.99' : '$199.99'}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                    {billingCycle === 'annual' && (
                      <div className="text-sm text-gray-500 mt-1">
                        $16.67/month billed annually
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Unlimited document uploads</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">999 AI analyses per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">All citation styles</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Grammar and style checks</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate('signup')}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-md hover:shadow-xl hover:border-gray-300/60 transition-all duration-300">
              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                  <p className="text-gray-600 mb-6">For researchers and institutions</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {billingCycle === 'monthly' ? '$39.99' : '$399.99'}
                    </span>
                    <span className="text-gray-600 ml-2">
                      {billingCycle === 'monthly' ? '/month' : '/year'}
                    </span>
                    {billingCycle === 'annual' && (
                      <div className="text-sm text-gray-500 mt-1">
                        $33.33/month billed annually
                      </div>
                    )}
                    {billingCycle === 'annual' && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                          Save 17%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Everything in Starter</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">999 AI analyses per month</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Advanced AI analysis</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Advanced grammar and style checking</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 text-sm">Priority support</span>
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate('signup')}
                  className="w-full py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 bg-gray-900 text-white hover:bg-gray-800"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>

          {/* Annual Pricing Note */}
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm">
              Annual plans available with 2 months free. 
              <button 
                onClick={() => onNavigate('pricing')}
                className="text-blue-600 hover:text-blue-700 font-medium ml-1"
              >
                View all pricing options →
              </button>
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative mb-16 sm:mb-24 md:mb-32 px-4 sm:px-8 md:px-16">
          <div className="max-w-8xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-indigo-600/30 rounded-2xl sm:rounded-3xl blur-sm"></div>
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 lg:p-20 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 tracking-tight">Ready to enhance your academic writing?</h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-10 sm:mb-12 md:mb-16 max-w-3xl mx-auto font-light leading-relaxed px-4">Join thousands of students and researchers who trust WriteScholar for their writing success.</p>
            <button 
              onClick={() => onNavigate('signup')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 sm:px-12 md:px-16 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 inline-flex items-center space-x-2 sm:space-x-3"
            >
              <span>Get Started Free</span>
              <span className="text-xl sm:text-2xl">→</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default LandingPage;