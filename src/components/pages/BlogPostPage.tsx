import React, { useEffect } from 'react';
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
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const slug = pathname.startsWith('/blog/') ? pathname.replace('/blog/', '').split('/')[0] : '';
  const post = slug ? getPostBySlug(slug) : null;

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

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />
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

  const currentIndex = blogPostList.findIndex(p => p.slug === slug);
  const prevPost = currentIndex > 0 ? blogPostList[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < blogPostList.length - 1 ? blogPostList[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} />

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
            <BlogPostContent slug={post.slug} />
          </div>
        </article>

        <nav className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-4" aria-label="Previous and next posts">
          {prevPost ? (
            <a
              href={`/blog/${prevPost.slug}`}
              onClick={(e) => { e.preventDefault(); onNavigate('blog-post', prevPost.slug); }}
              className="text-blue-600 hover:underline font-medium"
            >
              ← {prevPost.title}
            </a>
          ) : <span />}
          {nextPost ? (
            <a
              href={`/blog/${nextPost.slug}`}
              onClick={(e) => { e.preventDefault(); onNavigate('blog-post', nextPost.slug); }}
              className="text-blue-600 hover:underline font-medium sm:text-right"
            >
              {nextPost.title} →
            </a>
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
