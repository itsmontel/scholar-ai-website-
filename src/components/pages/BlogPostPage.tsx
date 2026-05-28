import React, { useEffect, useMemo, useRef, useState } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import NewsletterSubscription from '../common/NewsletterSubscription';
import { BLOG_DEFAULT_AUTHOR_BIO, BLOG_DEFAULT_AUTHOR_ROLE, getPostBySlug, getBlogPostsSortedDesc } from '../../data/blogPosts';
import BlogPostContent from './BlogPostContent';
import BlogTocSidebar from '../blog/BlogTocSidebar';
import BlogShareRail from '../blog/BlogShareRail';
import BlogKeyTakeaways from '../blog/BlogKeyTakeaways';
import BlogPostCta from '../blog/BlogPostCta';
import { useBlogArticleToc } from '../../hooks/useBlogArticleToc';
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

  const articleBodyRef = useRef<HTMLDivElement>(null);
  const { items: tocItems, activeId } = useBlogArticleToc(articleBodyRef, currentSlug);

  const [shareUrl, setShareUrl] = useState(() =>
    post ? `${SITE_ORIGIN.replace(/\/$/, '')}/blog/${post.slug}` : SITE_ORIGIN
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !post) return;
    setShareUrl(`${window.location.origin}/blog/${post.slug}`);
  }, [post?.slug]);

  useEffect(() => {
    const updateSlug = () => {
      const pathname = window.location.pathname;
      const newSlug = pathname.startsWith('/blog/') ? pathname.replace(/^\/blog\/?/, '').split('/')[0]?.trim() ?? '' : '';
      if (newSlug !== currentSlug) {
        setCurrentSlug(newSlug);
      }
    };

    updateSlug();

    window.addEventListener('popstate', updateSlug);
    return () => window.removeEventListener('popstate', updateSlug);
  }, [currentSlug]);

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

  const handleNavigateToPost = (newSlug: string) => {
    setCurrentSlug(newSlug);
    window.history.pushState({}, '', `/blog/${newSlug}`);
    window.scrollTo(0, 0);
  };

  if (!post) {
    if (!currentSlug) {
      return null;
    }
    return (
    <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="blog">
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100 mb-4">Post not found</h1>
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('blog');
            }}
            className="text-[#1CB0F6] hover:text-[#1899D6] font-extrabold"
          >
            ← Back to blog
          </a>
        </main>
        <Footer onNavigate={onNavigate} />
      </LoggedInPageShell>
    );
  }

  const currentIndex = sortedPosts.findIndex((p) => p.slug === currentSlug);
  const prevPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  const category = post.category ?? 'Tips';
  const authorRole = post.authorRole ?? BLOG_DEFAULT_AUTHOR_ROLE;
  const authorBio = post.authorBio ?? BLOG_DEFAULT_AUTHOR_BIO;
  const updatedLabel = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="blog">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14">
        {/* Hero */}
        <header className="max-w-3xl mb-10 md:mb-12">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
              <li>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('landing');
                  }}
                  className="hover:text-[#1CB0F6] transition-colors"
                >
                  Home
                </a>
              </li>
              <li aria-hidden className="text-stone-300 dark:text-stone-600">
                /
              </li>
              <li>
                <a
                  href="/blog"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('blog');
                  }}
                  className="hover:text-[#1CB0F6] transition-colors"
                >
                  Blog
                </a>
              </li>
            </ol>
          </nav>

          <p className="inline-flex items-center rounded-full bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 text-[#1899D6] dark:text-[#1CB0F6] border border-[#1CB0F6]/30 font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 mb-4">
            {category}
          </p>

          <h1
            className="text-3xl sm:text-4xl lg:text-[2.35rem] font-extrabold text-stone-900 dark:text-stone-100 leading-tight mb-4"
            style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}
          >
            {post.title}
          </h1>
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-400 leading-relaxed mb-3">{post.description}</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Updated <time dateTime={post.date}>{updatedLabel}</time>
            <span className="mx-2 text-stone-300 dark:text-stone-600">·</span>
            {post.readTime}
          </p>
        </header>

        {/* Three-column layout (desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,56px)] xl:grid-cols-[minmax(0,220px)_minmax(0,680px)_minmax(0,64px)] gap-8 lg:gap-10 xl:gap-12 items-start">
          {/* Mobile TOC */}
          {tocItems.length > 0 ? (
            <details className="lg:hidden rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-stone-700 dark:text-stone-200">On this page</summary>
              <div className="mt-3 max-h-[50vh] overflow-y-auto pr-1">
                <BlogTocSidebar items={tocItems} activeId={activeId} />
              </div>
            </details>
          ) : null}

          {/* Left: TOC — sticky below site header (parent uses overflow-x-clip, not hidden, so position:sticky works) */}
          <aside className="hidden lg:block lg:sticky lg:top-28 lg:z-[5] lg:self-start w-full max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain pr-1">
            <BlogTocSidebar items={tocItems} activeId={activeId} />
          </aside>

          {/* Center: article */}
          <div className="min-w-0">
            <div className="rounded-2xl border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:p-7 md:p-9 mb-6">
              <div className="rounded-xl border-2 border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 px-4 py-4 sm:px-5 sm:py-5 mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 mb-2">Written by</p>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {post.author}
                </p>
                <p className="text-sm font-medium text-[#58CC02] mt-1">{authorRole}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">{authorBio}</p>
              </div>

              <div
                ref={articleBodyRef}
                id="blog-article-body"
                className="prose prose-stone dark:prose-invert prose-lg max-w-none prose-headings:font-sans prose-a:text-[#1CB0F6] prose-a:no-underline hover:prose-a:underline prose-p:text-stone-600 dark:prose-p:text-stone-400"
              >
                <BlogPostContent slug={post.slug} onNavigate={onNavigate} />
                <BlogKeyTakeaways bullets={post.keyTakeaways} />
              </div>
            </div>

            <BlogPostCta onNavigate={onNavigate} primaryPage="signup" primaryLabel="Get started free →" />

            <div className="mt-10">
              <NewsletterSubscription variant="blog" />
            </div>

            <div className="mt-10 pt-8 border-t border-stone-200 dark:border-stone-700 lg:hidden">
              <BlogShareRail title={post.title} url={shareUrl} layout="horizontal" />
            </div>

            <nav
              className="mt-10 pt-8 border-t border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row justify-between gap-4"
              aria-label="Previous and next posts"
            >
              {prevPost ? (
                <button
                  type="button"
                  onClick={() => handleNavigateToPost(prevPost.slug)}
                  className="text-[#1CB0F6] hover:text-[#1899D6] font-extrabold text-left transition-colors"
                >
                  ← {prevPost.title}
                </button>
              ) : (
                <span />
              )}
              {nextPost ? (
                <button
                  type="button"
                  onClick={() => handleNavigateToPost(nextPost.slug)}
                  className="text-[#1CB0F6] hover:text-[#1899D6] font-extrabold sm:text-right transition-colors"
                >
                  {nextPost.title} →
                </button>
              ) : null}
            </nav>

            <div className="mt-10 text-center">
              <a
                href="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('blog');
                }}
                className="inline-flex items-center px-6 py-3 bg-[#58CC02] hover:bg-[#4CAF00] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all duration-150"
              >
                All posts
              </a>
            </div>
          </div>

          {/* Right: share rail */}
          <aside className="hidden lg:flex lg:flex-col lg:items-center lg:sticky lg:top-28 lg:z-[5] lg:self-start w-full max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain">
            <BlogShareRail title={post.title} url={shareUrl} layout="vertical" />
          </aside>
        </div>

        {/* Bottom share strip (desktop) */}
        <div className="hidden lg:block max-w-3xl mx-auto mt-14 pt-10 border-t border-stone-200 dark:border-stone-700">
          <BlogShareRail title={post.title} url={shareUrl} layout="horizontal" />
        </div>
      </main>

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default BlogPostPage;
