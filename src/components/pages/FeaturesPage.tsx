import Header from '../common/Header';
import Footer from '../common/Footer';

interface FeaturesPageProps {
  onNavigate: (page: string) => void;
  user?: { 
    id: string;
    name: string; 
    email: string;
    firstName?: string;
    lastName?: string;
    plan: string;
    subscription_status?: string;
    email_verified?: boolean;
  } | null;
  onLogout: () => void;
}

const FeaturesPage = ({ onNavigate, user, onLogout }: FeaturesPageProps) => {
  const benefits = [
    { label: "Instant Feedback", description: "Get results in seconds, not days" },
    { label: "Multiple Citation Styles", description: "APA, MLA, Chicago, and more" },
    { label: "Unlimited Documents", description: "No restrictions on uploads" },
    { label: "Cloud Storage", description: "Access your work anywhere" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Conditional Header */}
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="features" />
      ) : (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-18 py-4">
              <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">W</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">WriteScholar</span>
              </a>
              
              <div className="hidden md:flex items-center space-x-2">
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2.5 text-base text-blue-600 font-medium rounded-lg bg-blue-50">Features</a>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Pricing</a>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Blog</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">About</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors">Log in</a>
                <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="px-5 py-2.5 bg-gray-900 text-white text-base font-medium rounded-xl hover:bg-gray-800 transition-colors">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Hero Section */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
              Features
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Everything you need for<br className="hidden sm:block" /> academic excellence
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              Powerful AI tools designed specifically for students and researchers. Write better papers, find reliable citations, and improve your academic writing.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid with Cute Characters */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* AI-Powered Analysis - Asian man */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#DBEAFE"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#E8C4A0"/>
                  <path d="M14 26 Q12 16 20 12 Q28 8 36 12 Q44 16 42 26 Q40 20 34 16 Q28 12 22 16 Q16 20 14 26" fill="#1F2937"/>
                  <path d="M14 26 Q10 30 14 36" fill="#1F2937"/>
                  <path d="M42 26 Q46 30 42 36" fill="#1F2937"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M24 40 Q28 45 32 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="18" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                  <ellipse cx="38" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">AI-Powered Analysis</h3>
              <p className="text-base text-gray-600 leading-relaxed">Advanced natural language processing provides detailed feedback on your academic writing, identifying strengths and areas for improvement.</p>
            </div>
            
            {/* Citation Generator - Black woman */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#D1FAE5"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#8B5A2B"/>
                  <path d="M14 28 Q12 18 20 14 Q28 10 36 14 Q44 18 42 28 Q40 22 34 18 Q28 14 22 18 Q16 22 14 28" fill="#1F2937"/>
                  <ellipse cx="16" cy="30" rx="5" ry="7" fill="#1F2937"/>
                  <ellipse cx="40" cy="30" rx="5" ry="7" fill="#1F2937"/>
                  <ellipse cx="20" cy="18" rx="4" ry="5" fill="#1F2937"/>
                  <ellipse cx="28" cy="14" rx="5" ry="4" fill="#1F2937"/>
                  <ellipse cx="36" cy="18" rx="4" ry="5" fill="#1F2937"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M24 40 Q28 46 32 40" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="18" cy="35" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                  <ellipse cx="38" cy="35" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Citation Generator</h3>
              <p className="text-base text-gray-600 leading-relaxed">Instantly find and format academic citations in APA, MLA, Chicago, Harvard, IEEE, and Vancouver styles.</p>
            </div>
            
            {/* Grammar & Style Check - White man with glasses */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#F3E8FF"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#FCD9B6"/>
                  <path d="M14 24 Q12 12 22 10 Q28 8 34 10 Q44 12 42 24 Q40 18 34 14 Q28 10 22 14 Q16 18 14 24" fill="#8B6914"/>
                  <path d="M14 24 Q10 28 14 34" fill="#8B6914"/>
                  <path d="M42 24 Q46 28 42 34" fill="#8B6914"/>
                  <ellipse cx="21" cy="30" rx="6" ry="5" fill="none" stroke="#374151" strokeWidth="2"/>
                  <ellipse cx="35" cy="30" rx="6" ry="5" fill="none" stroke="#374151" strokeWidth="2"/>
                  <path d="M27 30 L29 30" stroke="#374151" strokeWidth="2"/>
                  <path d="M15 28 L12 26" stroke="#374151" strokeWidth="2"/>
                  <path d="M41 28 L44 26" stroke="#374151" strokeWidth="2"/>
                  <ellipse cx="21" cy="31" rx="2.5" ry="3" fill="#1F2937"/>
                  <ellipse cx="35" cy="31" rx="2.5" ry="3" fill="#1F2937"/>
                  <circle cx="22" cy="30" r="0.8" fill="white"/>
                  <circle cx="36" cy="30" r="0.8" fill="white"/>
                  <path d="M24 42 Q28 47 32 42" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="17" cy="36" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                  <ellipse cx="39" cy="36" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Grammar & Style Check</h3>
              <p className="text-base text-gray-600 leading-relaxed">Comprehensive grammar checking, style suggestions, and readability improvements to enhance your writing quality.</p>
            </div>
            
            {/* Document Library - Hispanic woman */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#FFEDD5"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#D4A574"/>
                  <path d="M12 26 Q10 14 20 10 Q28 6 36 10 Q46 14 44 26 Q42 18 34 14 Q28 10 22 14 Q16 18 12 26" fill="#3D2314"/>
                  <path d="M12 26 Q6 40 16 48" fill="#3D2314"/>
                  <path d="M44 26 Q50 40 40 48" fill="#3D2314"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M17 24 Q22 20 27 24" stroke="#3D2314" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M29 24 Q34 20 39 24" stroke="#3D2314" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <path d="M24 41 Q28 46 32 41" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="17" cy="35" rx="3" ry="2" fill="#E8A090" opacity="0.5"/>
                  <ellipse cx="39" cy="35" rx="3" ry="2" fill="#E8A090" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Document Library</h3>
              <p className="text-base text-gray-600 leading-relaxed">Organize and manage your academic documents with our intuitive library system and cloud storage.</p>
            </div>
            
            {/* Structure Analysis - South Asian man */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#FCE7F3"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#C68642"/>
                  <path d="M14 24 Q12 12 22 10 Q28 8 34 10 Q44 12 42 24 Q40 18 34 14 Q28 10 22 14 Q16 18 14 24" fill="#1A1A1A"/>
                  <path d="M14 24 Q10 28 14 34" fill="#1A1A1A"/>
                  <path d="M42 24 Q46 28 42 34" fill="#1A1A1A"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M16 24 Q22 20 28 24" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M28 24 Q34 20 40 24" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M24 41 Q28 46 32 41" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="17" cy="35" rx="3" ry="2" fill="#D4A07A" opacity="0.5"/>
                  <ellipse cx="39" cy="35" rx="3" ry="2" fill="#D4A07A" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Structure Analysis</h3>
              <p className="text-base text-gray-600 leading-relaxed">Get detailed feedback on your essay structure including introduction, body paragraphs, and conclusion.</p>
            </div>
            
            {/* Academic Vocabulary - East Asian woman */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4 overflow-hidden">
                <svg viewBox="0 0 56 56" fill="none" className="w-14 h-14">
                  <circle cx="28" cy="28" r="28" fill="#E0E7FF"/>
                  <ellipse cx="28" cy="30" rx="14" ry="15" fill="#F5DEB3"/>
                  <path d="M12 26 Q10 14 20 10 Q28 6 36 10 Q46 14 44 26 Q42 18 34 14 Q28 10 22 14 Q16 18 12 26" fill="#1A1A1A"/>
                  <path d="M12 26 Q6 40 16 50" fill="#1A1A1A"/>
                  <path d="M44 26 Q50 40 40 50" fill="#1A1A1A"/>
                  <ellipse cx="22" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="34" cy="30" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="23" cy="29" r="1" fill="white"/>
                  <circle cx="35" cy="29" r="1" fill="white"/>
                  <path d="M24 41 Q28 46 32 41" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="17" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                  <ellipse cx="39" cy="35" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">Academic Vocabulary</h3>
              <p className="text-base text-gray-600 leading-relaxed">Enhance your writing with suggestions for more formal, academic-appropriate language and terminology.</p>
            </div>

            {/* AI Humanizer - Premium */}
            <button onClick={() => onNavigate('humanizer')} className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6 hover:shadow-xl hover:border-violet-400 transition-all text-left relative group">
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-violet-600 text-white text-[10px] font-bold rounded-full">PRO</div>
              <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">AI Text Humanizer</h3>
              <p className="text-base text-gray-600 leading-relaxed">Transform AI-generated text into natural, human-sounding writing with multiple modes and intensity levels.</p>
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload or paste</h3>
              <p className="text-gray-500">Upload your document or paste your text directly into the editor</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI analyzes</h3>
              <p className="text-gray-500">Our AI reviews grammar, structure, citations, and academic style</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get feedback</h3>
              <p className="text-gray-500">Receive detailed suggestions to improve your academic writing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Why choose WriteScholar?</h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{benefit.label}</span>
                      <span className="text-gray-500"> — {benefit.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1">24/7</div>
                  <div className="text-blue-100">Always Available</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1">99.9%</div>
                  <div className="text-blue-100">Uptime</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1">50K+</div>
                  <div className="text-blue-100">Students</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1">6</div>
                  <div className="text-blue-100">Citation Styles</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {user ? 'Start improving your writing today' : 'Ready to transform your academic writing?'}
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            {user 
              ? 'Head to your dashboard to analyze your documents, find citations, and get AI-powered feedback.'
              : 'Join thousands of students and researchers who trust WriteScholar for academic excellence.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Go to Dashboard
                </button>
                {user.plan === 'Free' && (
                  <button 
                    onClick={() => onNavigate('billing')}
                    className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                  >
                    Upgrade Plan
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Get Started Free
                </button>
                <button 
                  onClick={() => onNavigate('pricing')}
                  className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                >
                  View Pricing
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

export default FeaturesPage;
