import { useState } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { blogPostList, BlogPostMeta } from '../../data/blogPosts';

interface BlogPageProps {
  onNavigate: (page: string, slug?: string) => void;
  user?: any;
  onLogout?: () => void;
}

const POSTS_PER_PAGE = 6;

const BlogPage = ({ onNavigate, user, onLogout }: BlogPageProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(blogPostList.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = blogPostList.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handlePostClick = (slug: string) => {
    onNavigate('blog-post', slug);
  };

  const getIllustration = (post: BlogPostMeta, index: number) => {
    const colors = [
      { bg: '#F3E8FF', accent: '#8B5CF6', secondary: '#C4B5FD' },
      { bg: '#DBEAFE', accent: '#3B82F6', secondary: '#93C5FD' },
      { bg: '#D1FAE5', accent: '#10B981', secondary: '#6EE7B7' },
      { bg: '#FEE2E2', accent: '#EF4444', secondary: '#FCA5A5' },
      { bg: '#FEF3C7', accent: '#F59E0B', secondary: '#FCD34D' },
      { bg: '#E0E7FF', accent: '#6366F1', secondary: '#A5B4FC' }
    ];
    const color = colors[index % colors.length];

    if (post.slug.includes('thesis') || post.slug.includes('structure')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill={color.bg} />
          <rect x="60" y="30" width="50" height="65" rx="4" fill="white" stroke={color.accent} strokeWidth="2" />
          <line x1="70" y1="45" x2="100" y2="45" stroke={color.secondary} strokeWidth="2" />
          <line x1="70" y1="55" x2="95" y2="55" stroke={color.secondary} strokeWidth="2" />
          <line x1="70" y1="65" x2="100" y2="65" stroke={color.secondary} strokeWidth="2" />
          <line x1="70" y1="75" x2="90" y2="75" stroke={color.secondary} strokeWidth="2" />
          <circle cx="130" cy="50" r="20" fill={color.accent} opacity="0.2" />
          <path d="M130 35 L130 30 M145 50 L150 50 M115 50 L110 50 M142 38 L146 34 M118 38 L114 34" stroke={color.accent} strokeWidth="2" strokeLinecap="round" />
          <path d="M123 55 Q130 40 137 55 L135 65 Q130 68 125 65 Z" fill={color.accent} />
          <rect x="125" y="65" width="10" height="5" rx="1" fill={color.secondary} />
          <rect x="145" y="75" width="35" height="8" rx="2" fill={color.accent} transform="rotate(-45 145 75)" />
          <polygon points="170,100 165,105 162,95" fill={color.secondary} />
        </svg>
      );
    }

    if (post.slug.includes('citation') || post.slug.includes('apa') || post.slug.includes('mla') || post.slug.includes('chicago')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill={color.bg} />
          <rect x="45" y="35" width="45" height="60" rx="3" fill="white" stroke={color.secondary} strokeWidth="2" transform="rotate(-8 45 35)" />
          <rect x="55" y="30" width="45" height="60" rx="3" fill="white" stroke={color.secondary} strokeWidth="2" transform="rotate(-4 55 30)" />
          <rect x="65" y="25" width="45" height="60" rx="3" fill="white" stroke={color.accent} strokeWidth="2" />
          <line x1="72" y1="40" x2="103" y2="40" stroke={color.secondary} strokeWidth="2" />
          <line x1="72" y1="50" x2="98" y2="50" stroke={color.secondary} strokeWidth="2" />
          <line x1="72" y1="60" x2="103" y2="60" stroke={color.secondary} strokeWidth="2" />
          <line x1="72" y1="70" x2="95" y2="70" stroke={color.secondary} strokeWidth="2" />
          <text x="125" y="55" fontSize="50" fontFamily="Georgia" fill={color.accent} opacity="0.8">"</text>
          <text x="155" y="85" fontSize="50" fontFamily="Georgia" fill={color.accent} opacity="0.8">"</text>
          <circle cx="160" cy="110" r="15" fill={color.accent} />
          <path d="M152 110 L158 116 L170 104" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (post.slug.includes('grammar')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill={color.bg} />
          <rect x="50" y="25" width="60" height="80" rx="4" fill="white" stroke={color.accent} strokeWidth="2" />
          <line x1="60" y1="40" x2="100" y2="40" stroke={color.secondary} strokeWidth="2" />
          <line x1="60" y1="52" x2="95" y2="52" stroke={color.secondary} strokeWidth="2" />
          <line x1="60" y1="64" x2="100" y2="64" stroke={color.accent} strokeWidth="2" />
          <line x1="60" y1="76" x2="90" y2="76" stroke={color.secondary} strokeWidth="2" />
          <line x1="60" y1="88" x2="100" y2="88" stroke={color.secondary} strokeWidth="2" />
          <path d="M95 64 L102 57 L109 64" stroke={color.accent} strokeWidth="2" fill="none" />
          <circle cx="145" cy="65" r="22" fill="white" stroke={color.accent} strokeWidth="3" />
          <line x1="160" y1="82" x2="175" y2="97" stroke={color.accent} strokeWidth="4" strokeLinecap="round" />
          <text x="135" y="72" fontSize="20" fontWeight="bold" fill={color.accent}>A</text>
        </svg>
      );
    }

    if (post.slug.includes('free-writing-tools')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill="#E0F2FE" />
          {/* Toolbox */}
          <rect x="60" y="60" width="80" height="50" rx="4" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="2" />
          <rect x="60" y="52" width="80" height="12" rx="2" fill="#93C5FD" stroke="#3B82F6" strokeWidth="2" />
          <rect x="90" y="48" width="20" height="8" rx="2" fill="#3B82F6" />
          {/* Tools popping out */}
          <rect x="70" y="25" width="6" height="30" rx="1" fill="#FCD34D" />
          <rect x="70" y="20" width="6" height="8" rx="1" fill="#F59E0B" />
          <rect x="90" y="18" width="8" height="38" rx="1" fill="#34D399" />
          <circle cx="94" cy="14" r="6" fill="#10B981" />
          <rect x="115" y="28" width="6" height="27" rx="1" fill="#F472B6" />
          <polygon points="118,28 115,20 121,20" fill="#EC4899" />
          {/* Stars/sparkles */}
          <path d="M40 35 L42 40 L47 40 L43 44 L45 49 L40 46 L35 49 L37 44 L33 40 L38 40 Z" fill="#FBBF24" />
          <path d="M160 25 L161 28 L164 28 L162 30 L163 33 L160 31 L157 33 L158 30 L156 28 L159 28 Z" fill="#FBBF24" />
          <circle cx="155" cy="95" r="10" fill="white" stroke="#3B82F6" strokeWidth="2" />
          <text x="152" y="99" fontSize="10" fontWeight="bold" fill="#3B82F6">8</text>
        </svg>
      );
    }

    if (post.slug.includes('tool') || post.slug.includes('ai') || post.slug.includes('assistant')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill={color.bg} />
          <rect x="65" y="35" width="70" height="55" rx="10" fill="white" stroke={color.accent} strokeWidth="2" />
          <circle cx="85" cy="55" r="8" fill={color.accent} />
          <circle cx="115" cy="55" r="8" fill={color.accent} />
          <circle cx="87" cy="53" r="2" fill="white" />
          <circle cx="117" cy="53" r="2" fill="white" />
          <path d="M85 72 Q100 82 115 72" stroke={color.accent} strokeWidth="3" fill="none" strokeLinecap="round" />
          <line x1="100" y1="35" x2="100" y2="22" stroke={color.accent} strokeWidth="2" />
          <circle cx="100" cy="18" r="5" fill={color.accent} />
          <path d="M40 50 L45 55 L40 60 L35 55 Z" fill={color.secondary} />
          <path d="M155 40 L160 45 L155 50 L150 45 Z" fill={color.secondary} />
          <path d="M145 90 L150 95 L145 100 L140 95 Z" fill={color.secondary} />
          <circle cx="50" cy="100" r="12" fill="none" stroke={color.accent} strokeWidth="2" />
          <circle cx="50" cy="100" r="4" fill={color.accent} />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
        <rect width="200" height="140" fill={color.bg} />
        <rect x="55" y="40" width="55" height="70" rx="3" fill="white" stroke={color.secondary} strokeWidth="2" transform="rotate(-5 55 40)" />
        <rect x="60" y="35" width="55" height="70" rx="3" fill="white" stroke={color.accent} strokeWidth="2" />
        <line x1="68" y1="50" x2="107" y2="50" stroke={color.secondary} strokeWidth="2" />
        <line x1="68" y1="60" x2="100" y2="60" stroke={color.secondary} strokeWidth="2" />
        <line x1="68" y1="70" x2="107" y2="70" stroke={color.secondary} strokeWidth="2" />
        <line x1="68" y1="80" x2="95" y2="80" stroke={color.secondary} strokeWidth="2" />
        <line x1="68" y1="90" x2="107" y2="90" stroke={color.secondary} strokeWidth="2" />
        <rect x="130" y="45" width="40" height="10" rx="2" fill={color.accent} transform="rotate(30 130 45)" />
        <polygon points="125,72 120,80 132,77" fill={color.secondary} />
        <rect x="155" y="35" width="10" height="10" rx="1" fill={color.secondary} transform="rotate(30 155 35)" />
        <path d="M155 100 L158 108 L167 108 L160 113 L163 121 L155 116 L147 121 L150 113 L143 108 L152 108 Z" fill={color.accent} />
      </svg>
    );
  };

  const getReadTimeMinutes = (readTime: string): string => {
    const match = readTime.match(/(\d+)/);
    return match ? match[1] : '3';
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages);

    return (
      <nav className="flex items-center justify-center space-x-1 mt-12" aria-label="Pagination">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {pages.map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page as number)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Conditional Header - Show logged-in header if user exists */}
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="blog" />
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
                <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium">Blog</a>
                <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('about'); }} className="px-4 py-2.5 text-base text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">About</a>
              </div>
              
              <div className="flex items-center space-x-3">
                <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('login'); }} className="hidden sm:inline-flex px-4 py-2.5 text-base text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors">Log in</a>
                <a href="/signup" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }} className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-800 transition-colors">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
          <a 
            href="/" 
            onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
            className="hover:text-gray-900 transition-colors"
          >
            Home
          </a>
          <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Blog</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl sm:text-4xl">🧊</span>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Blog
            </h1>
            <span className="text-3xl sm:text-4xl">🧊</span>
          </div>
          <p className="text-lg text-gray-600">
            Tips, guides, and insights for better academic writing
          </p>
        </header>

        {/* Blog Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" aria-label="Blog posts">
          {currentPosts.map((post, idx) => (
            <article
              key={post.slug}
              className="group cursor-pointer"
              onClick={() => handlePostClick(post.slug)}
            >
              {/* Image Container */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-gray-100">
                {getIllustration(post, startIndex + idx)}
              </div>
              
              {/* Content */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 text-base leading-relaxed mb-4 line-clamp-2">
                  {post.description}
                </p>
                
                {/* Read time badge */}
                <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                  {getReadTimeMinutes(post.readTime)} minutes
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* Pagination */}
        {renderPagination()}

        {/* CTA Section - Different for logged-in users */}
        <section className="mt-16 sm:mt-20 bg-gray-900 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            {user ? 'Put these tips into practice' : 'Ready to improve your academic writing?'}
          </h2>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            {user 
              ? 'Head to your dashboard to start writing with AI-powered feedback and citation tools.'
              : 'Get AI-powered feedback on your essays, citations, and more. Start writing better today.'
            }
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  Go to Dashboard
                </button>
                {user.plan === 'Free' && (
                  <button 
                    onClick={() => onNavigate('billing')}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-600 hover:border-gray-500 text-white font-medium rounded-xl transition-colors"
                  >
                    Upgrade Plan
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-colors"
                >
                  Get Started Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="w-full sm:w-auto px-6 py-3 border border-gray-600 hover:border-gray-500 text-white font-medium rounded-xl transition-colors"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default BlogPage;
