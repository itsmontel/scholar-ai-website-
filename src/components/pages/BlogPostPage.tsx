import React, { useEffect, useState } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { getPostBySlug, blogPostList } from '../../data/blogPosts';
import BlogPostContent from './BlogPostContent';

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
    if (post) {
      document.title = `${post.title} | WriteScholar Blog`;
      let desc = document.querySelector('meta[name="description"]');
      const content = post.description;
      if (desc) desc.setAttribute('content', content);
      else {
        desc = document.createElement('meta');
        desc.setAttribute('name', 'description');
        desc.setAttribute('content', content);
        document.head.appendChild(desc);
      }
    }
  }, [post]);

  // Handle navigation to a different blog post
  const handleNavigateToPost = (newSlug: string) => {
    setCurrentSlug(newSlug);
    window.history.pushState({}, '', `/blog/${newSlug}`);
    window.scrollTo(0, 0);
  };

  // Conditional header component for logged-out users
  const PublicNav = () => (
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
            <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="px-4 py-2.5 text-base text-blue-600 font-medium rounded-lg bg-blue-50">Blog</a>
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
  );

  if (!post) {
    // Redirect to blog listing if slug is empty (e.g. /blog/); otherwise show not found
    if (!currentSlug) {
      return null; // useEffect will redirect to /blog
    }
    return (
      <div className="min-h-screen bg-gray-50">
        {user ? (
          <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="blog" />
        ) : (
          <PublicNav />
        )}
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
          <a href="/blog" onClick={(e) => { e.preventDefault(); onNavigate('blog'); }} className="text-blue-600 hover:underline">
            ← Back to blog
          </a>
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  const currentIndex = blogPostList.findIndex(p => p.slug === currentSlug);
  const prevPost = currentIndex > 0 ? blogPostList[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < blogPostList.length - 1 ? blogPostList[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {user ? (
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="blog" />
      ) : (
        <PublicNav />
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <a
            href="/blog"
            onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            ← Blog
          </a>
        </nav>

        <article>
          <header className="mb-8">
            <time dateTime={post.date} className="text-sm text-gray-500 font-medium">
              {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-gray-600">
              {post.author} · {post.readTime}
            </p>
          </header>

          <div className="prose prose-lg max-w-none text-gray-700">
            <BlogPostContent slug={post.slug} onNavigate={onNavigate} />
          </div>
        </article>

        <nav className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4" aria-label="Previous and next posts">
          {prevPost ? (
            <button
              onClick={() => handleNavigateToPost(prevPost.slug)}
              className="text-blue-600 hover:underline font-medium text-left"
            >
              ← {prevPost.title}
            </button>
          ) : <span />}
          {nextPost ? (
            <button
              onClick={() => handleNavigateToPost(nextPost.slug)}
              className="text-blue-600 hover:underline font-medium sm:text-right"
            >
              {nextPost.title} →
            </button>
          ) : null}
        </nav>

        <div className="mt-12 text-center">
          <a
            href="/blog"
            onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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
