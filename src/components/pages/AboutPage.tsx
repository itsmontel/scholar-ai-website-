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
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <span className="text-xl font-bold text-gray-900">WriteScholar</span>
              </a>
              
              <div className="hidden md:flex items-center space-x-1">
                <a href="/features" onClick={(e) => { e.preventDefault(); onNavigate('features'); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Features</a>
                <a href="/pricing" onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Pricing</a>
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">Blog</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2 text-sm text-blue-600 font-medium rounded-lg bg-blue-50">About</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors">Log in</a>
                <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
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
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="text-3xl font-bold mb-1">50K+</div>
                  <div className="text-blue-100 text-sm">Documents Analyzed</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold mb-1">95%</div>
                  <div className="text-blue-100 text-sm">Satisfaction Rate</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold mb-1">50+</div>
                  <div className="text-blue-100 text-sm">Countries</div>
                </div>
                <div className="text-center p-4">
                  <div className="text-3xl font-bold mb-1">24/7</div>
                  <div className="text-blue-100 text-sm">Availability</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Our values</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              These principles guide everything we build at WriteScholar
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎯', title: 'Quality', desc: 'Highest standards in AI analysis and feedback' },
              { icon: '🔒', title: 'Privacy', desc: 'Enterprise-grade security for your documents' },
              { icon: '⚡', title: 'Innovation', desc: 'Continuous improvement of our technology' },
              { icon: '🌍', title: 'Accessibility', desc: 'Tools for the global academic community' }
            ].map((value, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">{value.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-500 text-sm">{value.desc}</p>
              </div>
            ))}
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

      {/* CTA Section - Different for logged-in users */}
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
