import Header from '../common/Header';
import Footer from '../common/Footer';

interface AboutPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

const AboutPage = ({ onNavigate, user, onLogout }: AboutPageProps) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Conditional Header */}
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="about" />
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
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Features</a>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Pricing</a>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Blog</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-blue-600 font-medium rounded-lg bg-blue-50">About</a>
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
              About Us
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Empowering academic<br className="hidden sm:block" /> excellence worldwide
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed">
              We're building AI-powered tools to help students and researchers write better, cite accurately, and achieve their scholarly goals.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Our mission</h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                At WriteScholar, we believe exceptional academic writing should be accessible to everyone. Our mission is to democratize high-quality feedback by providing intelligent, AI-powered writing assistance.
              </p>
              <p className="text-gray-500 leading-relaxed mb-6">
                We help students, researchers, and academics improve their work and achieve their scholarly goals—whether they're writing their first essay or publishing groundbreaking research.
              </p>
              <div className="space-y-3">
                {['Instant AI-powered feedback', 'Professional-grade citation tools', 'Continuous improvement through learning'].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1">50K+</div>
                  <div className="text-blue-100">Documents Analyzed</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1">95%</div>
                  <div className="text-blue-100">Satisfaction Rate</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1">50+</div>
                  <div className="text-blue-100">Countries</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-4xl font-bold mb-1">24/7</div>
                  <div className="text-blue-100">Availability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section with Cute Characters */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Our values</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              These principles guide everything we build at WriteScholar
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quality - Professional woman with bun */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <circle cx="32" cy="32" r="32" fill="#DBEAFE"/>
                  <ellipse cx="32" cy="36" rx="14" ry="15" fill="#E8B796"/>
                  {/* Hair with bun */}
                  <path d="M18 30 Q16 18 26 14 Q32 10 38 14 Q48 18 46 30 Q44 22 38 18 Q32 14 26 18 Q20 22 18 30" fill="#5D3A1A"/>
                  <ellipse cx="32" cy="10" rx="8" ry="7" fill="#5D3A1A"/>
                  <path d="M18 30 Q14 36 18 42" fill="#5D3A1A"/>
                  <path d="M46 30 Q50 36 46 42" fill="#5D3A1A"/>
                  {/* Eyes */}
                  <ellipse cx="26" cy="35" rx="2.5" ry="3" fill="#1F2937"/>
                  <ellipse cx="38" cy="35" rx="2.5" ry="3" fill="#1F2937"/>
                  <circle cx="27" cy="34" r="0.8" fill="white"/>
                  <circle cx="39" cy="34" r="0.8" fill="white"/>
                  {/* Confident smile */}
                  <path d="M27 46 Q32 51 37 46" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="21" cy="40" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                  <ellipse cx="43" cy="40" rx="3" ry="2" fill="#FECACA" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quality</h3>
              <p className="text-gray-500 text-sm">Highest standards in AI analysis and feedback</p>
            </div>

            {/* Privacy - Man with beard */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <circle cx="32" cy="32" r="32" fill="#D1FAE5"/>
                  <ellipse cx="32" cy="36" rx="14" ry="15" fill="#D4A574"/>
                  {/* Hair */}
                  <path d="M18 28 Q16 14 28 10 Q32 8 36 10 Q48 14 46 28 Q44 20 38 16 Q32 12 26 16 Q20 20 18 28" fill="#3D2314"/>
                  <path d="M18 28 Q14 34 18 40" fill="#3D2314"/>
                  <path d="M46 28 Q50 34 46 40" fill="#3D2314"/>
                  {/* Beard */}
                  <path d="M20 42 Q22 54 32 56 Q42 54 44 42" fill="#3D2314"/>
                  {/* Eyes */}
                  <ellipse cx="26" cy="34" rx="2.5" ry="3" fill="#1F2937"/>
                  <ellipse cx="38" cy="34" rx="2.5" ry="3" fill="#1F2937"/>
                  <circle cx="27" cy="33" r="0.8" fill="white"/>
                  <circle cx="39" cy="33" r="0.8" fill="white"/>
                  {/* Slight smile in beard */}
                  <path d="M28 46 Q32 49 36 46" stroke="#2D1810" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="21" cy="38" rx="3" ry="2" fill="#E8A090" opacity="0.4"/>
                  <ellipse cx="43" cy="38" rx="3" ry="2" fill="#E8A090" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Privacy</h3>
              <p className="text-gray-500 text-sm">Enterprise-grade security for your documents</p>
            </div>

            {/* Innovation - Young person with modern hair */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <circle cx="32" cy="32" r="32" fill="#F3E8FF"/>
                  <ellipse cx="32" cy="36" rx="14" ry="15" fill="#FCD9B6"/>
                  {/* Modern swooped hair */}
                  <path d="M16 32 Q14 16 28 12 Q40 8 48 16 Q52 22 48 32 Q46 24 40 18 Q32 12 24 18 Q18 24 16 32" fill="#6366F1"/>
                  <path d="M16 32 Q12 38 16 44" fill="#6366F1"/>
                  <path d="M48 26 Q54 20 50 14" fill="#6366F1"/>
                  {/* Eyes - excited */}
                  <ellipse cx="26" cy="35" rx="3" ry="3.5" fill="#1F2937"/>
                  <ellipse cx="38" cy="35" rx="3" ry="3.5" fill="#1F2937"/>
                  <circle cx="27" cy="34" r="1" fill="white"/>
                  <circle cx="39" cy="34" r="1" fill="white"/>
                  {/* Big smile */}
                  <path d="M26 46 Q32 52 38 46" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="20" cy="40" rx="3" ry="2" fill="#FECACA" opacity="0.5"/>
                  <ellipse cx="44" cy="40" rx="3" ry="2" fill="#FECACA" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-500 text-sm">Continuous improvement of our technology</p>
            </div>

            {/* Accessibility - Friendly person with headphones */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4 mx-auto overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-16 h-16">
                  <circle cx="32" cy="32" r="32" fill="#FFEDD5"/>
                  <ellipse cx="32" cy="36" rx="14" ry="15" fill="#8B5A2B"/>
                  {/* Hair - short curly */}
                  <path d="M18 30 Q16 18 26 14 Q32 10 38 14 Q48 18 46 30 Q44 22 38 18 Q32 14 26 18 Q20 22 18 30" fill="#1F2937"/>
                  <ellipse cx="20" cy="28" rx="4" ry="5" fill="#1F2937"/>
                  <ellipse cx="44" cy="28" rx="4" ry="5" fill="#1F2937"/>
                  <ellipse cx="26" cy="16" rx="3" ry="4" fill="#1F2937"/>
                  <ellipse cx="32" cy="12" rx="4" ry="3" fill="#1F2937"/>
                  <ellipse cx="38" cy="16" rx="3" ry="4" fill="#1F2937"/>
                  {/* Eyes */}
                  <ellipse cx="26" cy="35" rx="2.5" ry="3" fill="#1F2937"/>
                  <ellipse cx="38" cy="35" rx="2.5" ry="3" fill="#1F2937"/>
                  <circle cx="27" cy="34" r="0.8" fill="white"/>
                  <circle cx="39" cy="34" r="0.8" fill="white"/>
                  {/* Warm smile */}
                  <path d="M26 46 Q32 52 38 46" stroke="#1F2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <ellipse cx="20" cy="40" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                  <ellipse cx="44" cy="40" rx="3" ry="2" fill="#C9958A" opacity="0.4"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Accessibility</h3>
              <p className="text-gray-500 text-sm">Tools for the global academic community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Our story</h2>
            <div className="text-gray-500 leading-relaxed space-y-4 text-left">
              <p>
                WriteScholar was born from a simple observation: academic writing is one of the most challenging aspects of scholarly work, yet access to quality feedback is often limited by time, cost, and availability of expert reviewers.
              </p>
              <p>
                Our team of researchers, educators, and AI specialists came together with a shared vision: to create a platform that could provide instant, comprehensive feedback on academic writing, helping students and researchers improve their work.
              </p>
              <p>
                Today, WriteScholar serves users worldwide, from undergraduate students working on their first research papers to PhD candidates and established researchers looking to refine their scholarly communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {user ? 'Ready to write your next paper?' : 'Ready to improve your academic writing?'}
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            {user 
              ? 'Head to your dashboard to analyze documents and find citations.'
              : 'Join thousands of students and researchers who trust WriteScholar.'
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
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                >
                  View Features
                </button>
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

export default AboutPage;
