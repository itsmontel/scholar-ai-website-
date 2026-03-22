import React, { useEffect, useState, useMemo } from 'react';
import Header from '../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../common/WriteScholarEditorialBackground';
import Footer from '../common/Footer';
import { getPostBySlug, getBlogPostsSortedDesc } from '../../data/blogPosts';
import BlogPostContent from './BlogPostContent';
import {
  SITE_ORIGIN,
  absoluteCanonicalUrl,
  applyPageSeoTags,
  injectJsonLd,
  removeJsonLd,
} from '../../utils/seo';
import { ogImageUrlForBlogPost } from '../../utils/ogImageUrls';

interface BlogPostPageProps {
  onNavigate: (page: string, slug?: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ onNavigate, user, onLogout }) => {
  const [currentSlug, setCurrentSlug] = useState(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    return pathname.startsWith('/blog/') ? pathname.replace(/^\/blog\/?/, '').split('/')[0]?.trim() ?? '' : '';
  });
  
  const post = currentSlug ? getPostBySlug(currentSlug) : null;
  const sortedPosts = useMemo(() => getBlogPostsSortedDesc(), []);

  // Update slug when URL changes (for prev/next navigation)
  useEffect(() => {
    const updateSlug = () => {
      const pathname = window.location.pathname;
      const newSlug = pathname.startsWith('/blog/') ? pathname.replace(/^\/blog\/?/, '').split('/')[0]?.trim() ?? '' : '';
      if (newSlug !== currentSlug) {
        setCurrentSlug(newSlug);
      }
    };

    // Check immediately
    updateSlug();
    
    // Also listen for popstate events (browser back/forward)
    window.addEventListener('popstate', updateSlug);
    return () => window.removeEventListener('popstate', updateSlug);
  }, [currentSlug]);

  // Empty slug (e.g. /blog/) → redirect to blog listing
  useEffect(() => {
    const pathname = window.location.pathname;
    if (!currentSlug && pathname.startsWith('/blog')) {
      onNavigate('blog');
      window.history.replaceState(null, '', '/blog');
    }
  }, [currentSlug, onNavigate]);

  useEffect(() => {
    if (!post) {
      removeJsonLd('blog-post');
      return;
    }

    const canonicalPath = `/blog/${post.slug}`;
    const canonicalUrl = absoluteCanonicalUrl(canonicalPath);
    const title = `${post.title} | WriteScholar`;

    const ogImage = ogImageUrlForBlogPost(post.slug);
    applyPageSeoTags({
      title,
      description: post.description,
      canonicalUrl,
      ogImage,
      ogImageAlt: `${post.title} — WriteScholar blog`,
    });

    const isoDate = `${post.date}T12:00:00.000Z`;
    injectJsonLd('blog-post', {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: ogImage,
      datePublished: isoDate,
      dateModified: isoDate,
      author: {
        '@type': 'Organization',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'WriteScholar',
        url: SITE_ORIGIN,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_ORIGIN}/og-image.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
      url: canonicalUrl,
    });

    return () => {
      removeJsonLd('blog-post');
    };
  }, [post]);

  // Handle navigation to a different blog post
  const handleNavigateToPost = (newSlug: string) => {
    setCurrentSlug(newSlug);
    window.history.pushState({}, '', `/blog/${newSlug}`);
    window.scrollTo(0, 0);
  };

  if (!post) {
    // Redirect to blog listing if slug is empty (e.g. /blog/); otherwise show not found
    if (!currentSlug) {
      return null; // useEffect will redirect to /blog
    }
    return (
      <div className="relative min-h-screen overflow-x-hidden">
        <WriteScholarEditorialBackgroundLayers position="fixed" />
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="blog" />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">Post not found</h1>
          <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
            ← Back to blog
          </a>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const currentIndex = sortedPosts.findIndex(p => p.slug === currentSlug);
  const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="blog" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <a
            href="/blog"
            onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}
            className="text-stone-500 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition-colors inline-flex items-center gap-1"
          >
            ← Blog
          </a>
        </nav>

        <article className="bg-white dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm">
          <header className="mb-8">
            <time dateTime={post.date} className="text-sm text-stone-500 dark:text-stone-400 font-medium">
              {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mt-2 mb-4 leading-tight">
              {post.title}
            </h1>
            <p className="text-stone-600 dark:text-stone-400">
              {post.author} · {post.readTime}
            </p>
          </header>

          <div className="prose pviolet-lg max-w-none pviolet-stone dark:pviolet-invert pviolet-headings:text-stone-800 dark:pviolet-headings:text-stone-100 pviolet-a:text-violet-600 dark:pviolet-a:text-violet-400 pviolet-a:no-underline hover:pviolet-a:underline">
            <BlogPostContent slug={post.slug} onNavigate={onNavigate} />
          </div>
        </article>

        <nav className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row justify-between gap-4" aria-label="Previous and next posts">
          {prevPost ? (
            <button
              onClick={() => handleNavigateToPost(prevPost.slug)}
              className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium text-left transition-colors"
            >
              ← {prevPost.title}
            </button>
          ) : <span />}
          {nextPost ? (
            <button
              onClick={() => handleNavigateToPost(nextPost.slug)}
              className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium sm:text-right transition-colors"
            >
              {nextPost.title} →
            </button>
          ) : null}
        </nav>

        <div className="mt-12 text-center">
          <a
            href="/blog"
            onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}
            className="inline-flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            All posts
          </a>
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default BlogPostPage;
