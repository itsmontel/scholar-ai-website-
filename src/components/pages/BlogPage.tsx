import { useState, useMemo, useEffect } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import LandingSectionLayers from '../common/LandingSectionLayers';
import NewsletterSubscription from '../common/NewsletterSubscription';
import { getBlogPostsSortedDesc, BlogPostMeta } from '../../data/blogPosts';
import { SITE_ORIGIN, injectJsonLd, removeJsonLd } from '../../utils/seo';

interface BlogPageProps {
  onNavigate: (page: string, slug?: string) => void;
  user?: any;
  onLogout?: () => void;
}

const POSTS_PER_PAGE = 6;

const BlogPage = ({ onNavigate, user, onLogout }: BlogPageProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedPosts = useMemo(() => getBlogPostsSortedDesc(), []);

  useEffect(() => {
    injectJsonLd('blog-index', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: sortedPosts.length,
      itemListElement: sortedPosts.map((post, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: post.title,
        url: `${SITE_ORIGIN}/blog/${post.slug}`,
      })),
    });
    return () => removeJsonLd('blog-index');
  }, [sortedPosts]);

  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const currentPosts = sortedPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

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

    if (post.slug.includes('check-essay') || post.slug.includes('professor-style')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill="#F3E8FF" />
          <rect x="50" y="30" width="55" height="75" rx="4" fill="white" stroke="#8B5CF6" strokeWidth="2" />
          <line x1="58" y1="45" x2="95" y2="45" stroke="#C4B5FD" strokeWidth="2" />
          <line x1="58" y1="58" x2="100" y2="58" stroke="#10B981" strokeWidth="2" />
          <line x1="58" y1="71" x2="92" y2="71" stroke="#C4B5FD" strokeWidth="2" />
          <line x1="58" y1="84" x2="85" y2="84" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="135" cy="60" r="18" fill="#8B5CF6" />
          <path d="M128 60 L132 64 L144 52" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="120" y="95" width="55" height="28" rx="4" fill="white" stroke="#7C3AED" strokeWidth="2" />
          <text x="147" y="112" textAnchor="middle" fontSize="10" fill="#6D28D9" fontWeight="bold">Rubric</text>
        </svg>
      );
    }

    if (post.slug.includes('thesis') || post.slug.includes('structure')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill="#FEE2E2" />
          <rect x="60" y="30" width="50" height="65" rx="4" fill="white" stroke="#EF4444" strokeWidth="2" />
          <line x1="70" y1="45" x2="100" y2="45" stroke="#FCA5A5" strokeWidth="2" />
          <line x1="70" y1="55" x2="95" y2="55" stroke="#FCA5A5" strokeWidth="2" />
          <line x1="70" y1="65" x2="100" y2="65" stroke="#FCA5A5" strokeWidth="2" />
          <line x1="70" y1="75" x2="90" y2="75" stroke="#FCA5A5" strokeWidth="2" />
          <circle cx="130" cy="50" r="20" fill="#EF4444" opacity="0.2" />
          <path d="M130 35 L130 30 M145 50 L150 50 M115 50 L110 50 M142 38 L146 34 M118 38 L114 34" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          <path d="M123 55 Q130 40 137 55 L135 65 Q130 68 125 65 Z" fill="#EF4444" />
          <rect x="125" y="65" width="10" height="5" rx="1" fill="#FCA5A5" />
          <rect x="145" y="75" width="35" height="8" rx="2" fill="#EF4444" transform="rotate(-45 145 75)" />
          <polygon points="170,100 165,105 162,95" fill="#FCA5A5" />
        </svg>
      );
    }

    if (post.slug === 'students-who-get-as-dont-work-harder') {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill="#FEF3C7" />
          <rect x="55" y="40" width="55" height="70" rx="3" fill="white" stroke="#F59E0B" strokeWidth="2" transform="rotate(-5 55 40)" />
          <rect x="60" y="35" width="55" height="70" rx="3" fill="white" stroke="#F59E0B" strokeWidth="2" />
          <line x1="68" y1="50" x2="107" y2="50" stroke="#FCD34D" strokeWidth="2" />
          <line x1="68" y1="60" x2="100" y2="60" stroke="#FCD34D" strokeWidth="2" />
          <line x1="68" y1="70" x2="107" y2="70" stroke="#FCD34D" strokeWidth="2" />
          <line x1="68" y1="80" x2="95" y2="80" stroke="#FCD34D" strokeWidth="2" />
          <line x1="68" y1="90" x2="107" y2="90" stroke="#FCD34D" strokeWidth="2" />
          <rect x="130" y="45" width="40" height="10" rx="2" fill="#F59E0B" transform="rotate(30 130 45)" />
          <polygon points="125,72 120,80 132,77" fill="#FCD34D" />
          <rect x="155" y="35" width="10" height="10" rx="1" fill="#FCD34D" transform="rotate(30 155 35)" />
          <path d="M155 100 L158 108 L167 108 L160 113 L163 121 L155 116 L147 121 L150 113 L143 108 L152 108 Z" fill="#F59E0B" />
        </svg>
      );
    }

    if (post.slug.includes('plagiarism')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill="#ECFDF5" />
          <rect x="55" y="35" width="55" height="75" rx="4" fill="white" stroke="#10B981" strokeWidth="2" />
          <line x1="65" y1="50" x2="100" y2="50" stroke="#D1FAE5" strokeWidth="2" />
          <line x1="65" y1="62" x2="95" y2="62" stroke="#D1FAE5" strokeWidth="2" />
          <line x1="65" y1="74" x2="102" y2="74" stroke="#D1FAE5" strokeWidth="2" />
          <circle cx="135" cy="75" r="22" fill="#10B981" />
          <path d="M125 75 L131 81 L146 64" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M155 45 L175 60 L175 95 Q165 110 155 120 Q145 110 135 95 L135 60 Z" fill="#D1FAE5" stroke="#10B981" strokeWidth="2" />
          <path d="M150 78 L157 85 L172 68" stroke="#10B981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
          <rect width="200" height="140" fill="#D1FAE5" />
          {/* Toolbox */}
          <rect x="60" y="60" width="80" height="50" rx="4" fill="#A7F3D0" stroke="#10B981" strokeWidth="2" />
          <rect x="60" y="52" width="80" height="12" rx="2" fill="#6EE7B7" stroke="#10B981" strokeWidth="2" />
          <rect x="90" y="48" width="20" height="8" rx="2" fill="#10B981" />
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
          <circle cx="155" cy="95" r="10" fill="white" stroke="#10B981" strokeWidth="2" />
          <text x="152" y="99" fontSize="10" fontWeight="bold" fill="#10B981">8</text>
        </svg>
      );
    }

    if (post.slug === 'how-to-study-effectively-complete-guide') {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill="#DBEAFE" />
          <circle cx="100" cy="55" r="22" fill="white" stroke="#3B82F6" strokeWidth="2" />
          <path d="M92 55 L97 60 L108 49" stroke="#3B82F6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="55" y="88" width="90" height="35" rx="4" fill="white" stroke="#2563EB" strokeWidth="2" />
          <line x1="65" y1="98" x2="135" y2="98" stroke="#93C5FD" strokeWidth="2" />
          <line x1="65" y1="108" x2="120" y2="108" stroke="#93C5FD" strokeWidth="2" />
          <line x1="65" y1="118" x2="130" y2="118" stroke="#93C5FD" strokeWidth="2" />
          <circle cx="165" cy="50" r="18" fill="white" stroke="#F59E0B" strokeWidth="2" />
          <path d="M165 38 L165 50 L172 56" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="35" y="45" width="25" height="32" rx="2" fill="white" stroke="#3B82F6" strokeWidth="2" transform="rotate(-15 35 45)" />
          <line x1="40" y1="55" x2="55" y2="55" stroke="#93C5FD" strokeWidth="1" transform="rotate(-15 40 55)" />
          <line x1="40" y1="62" x2="52" y2="62" stroke="#93C5FD" strokeWidth="1" transform="rotate(-15 40 62)" />
          <circle cx="50" cy="95" r="6" fill="#3B82F6" opacity="0.3" />
          <circle cx="155" cy="95" r="5" fill="#F59E0B" opacity="0.3" />
        </svg>
      );
    }

    if (post.slug.includes('study-tools')) {
      return (
        <svg viewBox="0 0 200 140" fill="none" className="w-full h-full">
          <rect width="200" height="140" fill="#F3E8FF" />
          <circle cx="100" cy="70" r="28" fill="white" stroke="#8B5CF6" strokeWidth="2" />
          <path d="M88 70 Q92 58 100 62 Q108 58 112 70 Q115 82 100 86 Q85 82 88 70" fill="#8B5CF6" />
          <circle cx="95" cy="68" r="2" fill="white" />
          <circle cx="105" cy="68" r="2" fill="white" />
          <rect x="45" y="45" width="35" height="25" rx="3" fill="white" stroke="#7C3AED" strokeWidth="2" />
          <text x="62" y="62" textAnchor="middle" fontSize="12" fill="#7C3AED" fontWeight="bold">?</text>
          <rect x="120" y="42" width="35" height="28" rx="3" fill="white" stroke="#6D28D9" strokeWidth="2" />
          <circle cx="132" cy="52" r="4" fill="#C4B5FD" />
          <line x1="140" y1="52" x2="148" y2="52" stroke="#E5E7EB" strokeWidth="2" />
          <circle cx="132" cy="64" r="4" fill="#C4B5FD" />
          <line x1="140" y1="64" x2="148" y2="64" stroke="#E5E7EB" strokeWidth="2" />
          <rect x="82" y="105" width="36" height="22" rx="2" fill="white" stroke="#7C3AED" strokeWidth="2" />
          <line x1="92" y1="105" x2="92" y2="127" stroke="#C4B5FD" strokeWidth="1" />
          <line x1="108" y1="105" x2="108" y2="127" stroke="#C4B5FD" strokeWidth="1" />
          <line x1="82" y1="116" x2="118" y2="116" stroke="#C4B5FD" strokeWidth="1" />
          <circle cx="165" cy="45" r="5" fill="#C4B5FD" />
          <circle cx="50" cy="100" r="4" fill="#10B981" />
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
          className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {pages.map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-stone-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page as number)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="blog" />

      <main>
        <section
          className="relative overflow-hidden border-b border-stone-200/90 dark:border-stone-800"
          aria-labelledby="blog-page-heading"
        >
          <LandingSectionLayers />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <nav className="flex items-center text-sm text-stone-500 dark:text-stone-400 mb-8" aria-label="Breadcrumb">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('landing');
                }}
                className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Home
              </a>
              <svg className="w-4 h-4 mx-2 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-stone-900 dark:text-stone-100 font-semibold">Blog</span>
            </nav>

            <header className="text-center max-w-2xl mx-auto">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
                Tips &amp; guides
              </p>
              <div className="mx-auto mb-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
              <h1
                id="blog-page-heading"
                className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-100 mb-4 tracking-tight leading-tight"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                Blog
              </h1>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed">
                Tips, guides, and insights for better academic writing
              </p>
            </header>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-stone-200/90 dark:border-stone-800 py-12 sm:py-16">
          <LandingSectionLayers variant="faq" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" aria-label="Blog posts">
          {currentPosts.map((post, idx) => (
            <article
              key={post.slug}
              className="group cursor-pointer rounded-2xl overflow-hidden border border-stone-200/90 dark:border-stone-700/90 bg-white/80 dark:bg-stone-900/50 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.1)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] ring-1 ring-white/50 dark:ring-white/5 hover:shadow-[0_20px_50px_-20px_rgba(91,33,182,0.15)] dark:hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)] hover:border-violet-300/70 dark:hover:border-violet-600/50 transition-all duration-300"
              onClick={() => handlePostClick(post.slug)}
            >
              {/* Image Container */}
              <div className="aspect-[4/3] overflow-hidden bg-stone-100 dark:bg-stone-800/50">
                <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-300">
                  {getIllustration(post, startIndex + idx)}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5 sm:p-6">
                <h2
                  className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug line-clamp-2"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                >
                  {post.title}
                </h2>
                <p className="text-stone-600 dark:text-stone-400 text-base leading-relaxed mb-4 line-clamp-2">
                  {post.description}
                </p>
                
                {/* Read time badge */}
                <span className="inline-block px-3 py-1.5 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-sm font-medium rounded-xl">
                  {getReadTimeMinutes(post.readTime)} min read
                </span>
              </div>
            </article>
          ))}
            </div>

            {renderPagination()}
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-stone-200/90 dark:border-stone-800 py-12 sm:py-16">
          <LandingSectionLayers />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <NewsletterSubscription variant="blog" />
          </div>
        </section>

        <section className="relative py-16 sm:py-24 overflow-hidden border-t border-stone-200/90 dark:border-stone-800">
          <LandingSectionLayers variant="cta" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center rounded-2xl border border-stone-200/90 dark:border-stone-800/90 bg-white/75 dark:bg-stone-900/45 px-6 py-10 sm:px-10 sm:py-12 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.12)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-[8px] ring-1 ring-white/50 dark:ring-white/5">
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-violet-800/90 dark:text-violet-300/95 mb-3">
                Get started
              </p>
              <div className="mx-auto mb-5 h-0.5 w-16 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 opacity-90 dark:opacity-85" aria-hidden />
              <h2
                className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold text-stone-900 dark:text-stone-50 mb-4 tracking-tight leading-[1.15]"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                {user ? 'Put these tips into practice' : 'Ready to improve your academic writing?'}
              </h2>
              <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 mb-8 max-w-xl mx-auto leading-relaxed">
                {user
                  ? 'Head to your dashboard to start writing with AI-powered feedback and citation tools.'
                  : 'Get AI-powered feedback on your essays, citations, and more. Start writing better today.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigate('dashboard')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg"
                    >
                      Go to dashboard
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    {user.plan === 'Free' && (
                      <button
                        type="button"
                        onClick={() => onNavigate('billing')}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 border border-stone-300/95 dark:border-stone-600 bg-white/90 dark:bg-stone-900/50 text-stone-800 dark:text-stone-200 font-medium rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm"
                      >
                        Upgrade plan
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigate('signup')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-semibold rounded-xl shadow-md shadow-violet-900/15 dark:shadow-violet-950/40 ring-1 ring-violet-900/10 dark:ring-white/10 transition-all duration-200 hover:shadow-lg"
                    >
                      Try free
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('features')}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 border border-stone-300/95 dark:border-stone-600 bg-white/90 dark:bg-stone-900/50 text-stone-800 dark:text-stone-200 font-medium rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-sm"
                    >
                      Learn more
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default BlogPage;
