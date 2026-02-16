import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { blogPostList } from '../../data/blogPosts';

interface BlogPageProps {
  onNavigate: (page: string, slug?: string) => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

const BlogPage: React.FC<BlogPageProps> = ({ onNavigate, user, onLogout }) => {
  const handlePostClick = (slug: string) => {
    onNavigate('blog-post', slug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="blog" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <header className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
            Blog
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Academic Writing Tips &amp; Guides
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Citation styles, grammar for academic writing, research paper structure, and how to use AI writing tools effectively.
          </p>
        </header>

        <section className="space-y-8" aria-label="Blog posts">
          {blogPostList.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <a
                href={`/blog/${post.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  handlePostClick(post.slug);
                }}
                className="block p-6 sm:p-8"
              >
                <time dateTime={post.date} className="text-sm text-gray-500 font-medium">
                  {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 mb-3 hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {post.description}
                </p>
                <span className="text-sm text-gray-500">
                  {post.readTime} · {post.author}
                </span>
              </a>
            </article>
          ))}
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default BlogPage;
