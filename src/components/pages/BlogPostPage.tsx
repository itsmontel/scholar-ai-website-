import React, { useEffect, useMemo, useRef, useState } from 'react';
import LoggedInPageShell from '../workspace/LoggedInPageShell';
import Footer from '../common/Footer';
import NewsletterSubscription from '../common/NewsletterSubscription';
import { BLOG_DEFAULT_AUTHOR_BIO, BLOG_DEFAULT_AUTHOR_ROLE, getPostBySlug, getBlogPostsSortedDesc } from '../../data/blogPosts';
import BlogPostContent from './BlogPostContent';
import BlogTocSidebar from '../blog/BlogTocSidebar';
import BlogShareRail from '../blog/BlogShareRail';
import BlogMascot from '../blog/BlogMascot';
import BlogKeyTakeaways from '../blog/BlogKeyTakeaways';
import BlogPostCta from '../blog/BlogPostCta';
import { hasBlogArt, blogHeroSrc, blogOgPath, BLOG_HERO_SIZE } from '../blog/blogImages';
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

    const ogPath = blogOgPath(post.slug);
    const ogImage = ogPath ? `${SITE_ORIGIN}${ogPath}` : ogImageUrlForBlogPost(post.slug);
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

    if (post.slug === 'how-to-write-an-essay-or-assignment') {
      injectJsonLd('blog-post-howto', {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: post.title,
        description: post.description,
        image: ogImage,
        totalTime: 'PT4H',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Decode the assignment brief', text: 'Underline the task verb, the object of the assignment, and the constraints (word count, sources, citation style). Rewrite the prompt as one question you can answer in a sentence.' },
          { '@type': 'HowToStep', position: 2, name: 'Write a thesis someone could disagree with', text: 'Turn the topic into a claim a classmate could reasonably argue against. Match the thesis type to the assignment: argue, analyse, or explain.' },
          { '@type': 'HowToStep', position: 3, name: 'Outline the body first', text: 'Give each body paragraph one job: claim, cited evidence, and a sentence tying the evidence back to the thesis. Skip the introduction until the middle exists.' },
          { '@type': 'HowToStep', position: 4, name: 'Gather evidence you can cite', text: 'Start with assigned readings and course materials. Record citations as you take notes. Do not invent sources.' },
          { '@type': 'HowToStep', position: 5, name: 'Draft the body, then the opening', text: 'Write ugly body paragraphs on purpose. Then write the introduction, conclusion, and title so they match the argument you actually made.' },
          { '@type': 'HowToStep', position: 6, name: 'Cite in one style and revise against the rubric', text: 'Keep in-text citations and the reference list in one style. Fix thesis, evidence, and structure before grammar. Check the draft against the rubric before you submit.' },
        ],
      });
      injectJsonLd('blog-post-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do you write an essay step by step?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Decode the prompt and underline the task verb. Write a one-sentence thesis a classmate could disagree with. Outline body paragraphs with a claim and a source each. Draft the body first, then the introduction and conclusion. Cite in one style. Revise against the rubric before you polish grammar.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do you start an essay or assignment?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Do not start with a dictionary definition or a sweeping history. Start by answering the brief in one sentence, then write the first body paragraph that supports that sentence. Write the opening last, once you know what you actually argued.',
            },
          },
          {
            '@type': 'Question',
            name: 'How is writing an assignment different from writing an essay?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The process is the same: prompt, claim, evidence, constraints. The packaging changes. A lab report uses required sections. A memo leads with a recommendation. A discussion post is a miniature essay. Always follow the format on the brief.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I use ChatGPT or other AI to write my essay in 2026?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'On most campuses, feedback on a draft you wrote is treated differently from generated text. Read your syllabus. Never submit prose you could not explain, and never invent sources.',
            },
          },
        ],
      });
    } else if (post.slug === 'how-to-study-for-finals') {
      injectJsonLd('blog-post-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How early should I start studying for finals?', acceptedAnswer: { '@type': 'Answer', text: 'Two weeks before your first final is ideal for most college courses. That gives you time to rebuild weak topics, then switch to practice testing, and to space your review across several days, which helps you remember more than cramming the same hours into one night.' } },
          { '@type': 'Question', name: 'What is the best way to study for finals?', acceptedAnswer: { '@type': 'Answer', text: 'Test yourself and space it out. Research reviews rate practice testing and distributed practice as the most effective study methods, and rereading and highlighting as among the least. Use past exams, practice problems, flashcards and blank-page recall over several days.' } },
          { '@type': 'Question', name: 'How do I calculate what I need on my final?', acceptedAnswer: { '@type': 'Answer', text: 'Use: needed score = (target grade − current grade × (1 − final weight)) ÷ final weight. For example, with an 82 and a final worth 20%, you need a 72 on the final to finish with an 80.' } },
          { '@type': 'Question', name: 'Is it better to pull an all-nighter or sleep before a final?', acceptedAnswer: { '@type': 'Answer', text: 'Sleep. Your brain consolidates memories during sleep, and going without it slows your thinking and makes mistakes more likely. The CDC recommends at least seven hours a night for adults. If you have to choose, a few hours of sleep beats a few more hours of cramming.' } },
          { '@type': 'Question', name: 'How can I study for finals in one night?', acceptedAnswer: { '@type': 'Answer', text: 'Focus only on the topics most likely to appear, using the study guide or review slides. For each one, read it once, close it, and write down what you remember. Do every practice question you can find, then stop early enough to get at least five or six hours of sleep.' } },
          { '@type': 'Question', name: 'What should I do if I have three finals in one day?', acceptedAnswer: { '@type': 'Answer', text: 'Check your registrar or academic calendar. Many US colleges let students reschedule one exam when they have three or more on the same day, but you usually have to ask before a deadline. Contact your professor or dean of students office early.' } },
        ],
      });
    } else if (post.slug === 'can-professors-tell-if-you-used-chatgpt') {
      injectJsonLd('blog-post-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: "Can professors tell if you used ChatGPT?", acceptedAnswer: { '@type': 'Answer', text: "Often, but rarely from a detector score alone. What gives it away is a voice that does not match your other work, sources or quotes that do not exist, a generic answer to a specific prompt, and not being able to explain the paper when asked." } },
          { '@type': 'Question', name: "Are AI detectors accurate?", acceptedAnswer: { '@type': 'Answer', text: "Not reliably enough to prove anything on their own. They estimate how predictable text is, so formal writing, short answers and writing by non-native English speakers can be flagged wrongly. OpenAI withdrew its own classifier in 2023 over accuracy, and Turnitin says its score should not be the only basis for action." } },
          { '@type': 'Question', name: "Does Turnitin detect ChatGPT?", acceptedAnswer: { '@type': 'Answer', text: "Turnitin has an AI writing indicator that estimates how much of a submission may be machine-generated. It is a signal for a closer look, not a verdict, and most universities ask instructors to consider other evidence too." } },
          { '@type': 'Question', name: "What should I do if I am falsely accused of using AI?", acceptedAnswer: { '@type': 'Answer', text: "Stay calm and respond. Export your document version history, gather your notes, outline and sources, and offer to talk through your argument. Ask whether the concern rests only on a detector score, and use your university's formal process if needed." } },
          { '@type': 'Question', name: "Is using ChatGPT for school cheating?", acceptedAnswer: { '@type': 'Answer', text: "It depends on your course policy. Submitting generated text as your own without permission is usually misconduct, and inventing sources always is. Getting feedback on a draft you wrote is treated very differently. Check the syllabus." } },
          { '@type': 'Question', name: "How can I prove I wrote my essay?", acceptedAnswer: { '@type': 'Answer', text: "Write in Google Docs or Word so version history records the paper being built. Keep your outline, notes, drafts and source PDFs, and be ready to explain your argument in a conversation." } },
        ],
      });
    } else if (post.slug === 'what-does-critically-evaluate-mean') {
      injectJsonLd('blog-post-howto', {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: post.title,
        description: post.description,
        image: ogImage,
        totalTime: 'PT45M',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Name the object and the criteria', text: 'Write down the thing on trial and the tests you will use. If you cannot name the tests in one sentence, you are not ready to judge.' },
          { '@type': 'HowToStep', position: 2, name: 'Write a verdict someone could disagree with', text: 'Turn the topic into a judgement a classmate who did the reading could argue against. Hedge if the evidence is mixed. Do not hide behind advantages and disadvantages.' },
          { '@type': 'HowToStep', position: 3, name: 'Give each body paragraph a mini-verdict', text: 'Start with a judgement, then cited evidence, then a sentence about what that evidence does not prove, then a tie back to the overall claim.' },
          { '@type': 'HowToStep', position: 4, name: 'State the strongest objection fairly', text: 'Give the best case against you a real paragraph. Say whether it limits the verdict or overturns it. If it overturns it, change the verdict.' },
          { '@type': 'HowToStep', position: 5, name: 'Check the verb before you submit', text: 'Underline a verdict in the thesis. Confirm the introduction and conclusion use the same object and tests. Cut paragraphs that only summarise.' },
        ],
      });
      injectJsonLd('blog-post-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What does critically evaluate mean?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'It means judge something against named criteria, using evidence, and end on a verdict a marker can mark. You weigh the strongest case for and against, then decide how far the claim, source, method, or policy holds. A summary plus "I agree" is not it.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do you critically evaluate in an essay?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Name the object and the tests in the introduction, and state the verdict there. Give each body paragraph a mini-judgement, cited evidence, and a sentence about what that evidence does not prove. Include a fair counterargument. Restate the verdict with its limit in the conclusion.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the difference between analyse and critically evaluate?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Analyse shows how the parts work. You can finish an analysis without saying whether the thing succeeds. Critically evaluate starts after that work: given how it works, how well does it do the job you named, and on what evidence?',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I use AI to critically evaluate a source in 2026?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'On most campuses, feedback on a draft you wrote is treated differently from generated text. A chatbot evaluation is easy to spot because it never chooses. Write the judgement yourself, and do not invent studies or critics.',
            },
          },
        ],
      });
    } else if (post.slug === 'how-to-start-an-essay') {
      injectJsonLd('blog-post-howto', {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: post.title,
        description: post.description,
        image: ogImage,
        totalTime: 'PT20M',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Know the claim first', text: 'Read the first sentence of each body paragraph. Those sentences should add up to one claim. Write sentence one so it points at that claim.' },
          { '@type': 'HowToStep', position: 2, name: 'Pick one concrete piece of this paper', text: 'Use a line from the assigned text, the result, the case or policy the prompt named, a sourced number the paper actually uses, or the misconception the course already corrected.' },
          { '@type': 'HowToStep', position: 3, name: 'Write one sentence', text: 'A hook earns the next sentence. If sentence two has to explain or apologise for sentence one, cut it.' },
          { '@type': 'HowToStep', position: 4, name: 'Get to the claim in the same paragraph', text: 'On a short essay the hook does not get its own paragraph. The thesis should appear before the introduction ends.' },
          { '@type': 'HowToStep', position: 5, name: 'Cut anything that could open a different essay', text: 'Delete rhetorical questions, dictionary definitions, historical sweeps, famous quotes you never use, and announcements that the essay will discuss the topic.' },
        ],
      });
      injectJsonLd('blog-post-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do you start an essay?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Start with one sentence that could only belong to this paper: a line from the text, the result, the case, or the misconception the course already corrected. Then get to the claim. If you do not have a claim yet, write the body first.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is a good hook for an essay?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A good hook earns the next sentence and is specific to this assignment. A rhetorical question, an unused famous quote, and "since the dawn of time" do not. The hook is optional. The thesis is not.',
            },
          },
          {
            '@type': 'Question',
            name: 'Should I start an essay with a question?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Usually no. Answer the prompt with a claim instead of asking a question back. A question you never answer is a stall.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I use AI to write my hook in 2026?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'On most campuses, feedback on a sentence you wrote is treated differently from generated text. A chatbot hook is easy to spot because it fits any prompt. Rewrite the line yourself.',
            },
          },
        ],
      });
    } else if (post.slug === 'how-to-write-a-good-introduction') {
      injectJsonLd('blog-post-howto', {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: post.title,
        description: post.description,
        image: ogImage,
        totalTime: 'PT45M',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Put the prompt in one sentence', text: 'Rewrite the brief as the question you are being asked to answer, and underline the task verb.' },
          { '@type': 'HowToStep', position: 2, name: 'Write the thesis the body actually supports', text: 'Read the first sentence of each body paragraph. Those sentences should add up to one claim a classmate could disagree with.' },
          { '@type': 'HowToStep', position: 3, name: 'Add only the context that thesis needs', text: 'Include what a reader who missed lecture would need in order to understand the claim. Cut background that does not change how they read it.' },
          { '@type': 'HowToStep', position: 4, name: 'Put the thesis last in the introduction', text: 'In a short paper the introduction can be one paragraph and the claim is the final sentence. Do not announce that the essay will discuss the topic.' },
          { '@type': 'HowToStep', position: 5, name: 'Read the introduction against the conclusion', text: 'Use the same key terms and the same claim. The conclusion can add a limit or a consequence. It should not introduce a new argument.' },
        ],
      });
      injectJsonLd('blog-post-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How long should an introduction be?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'For a short college essay, usually one paragraph, sometimes two. For a research paper, up to about a page. The introduction is long enough when a stranger knows the question and your claim.',
            },
          },
          {
            '@type': 'Question',
            name: 'Should I write the introduction first?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Write a working thesis if you need a direction, then draft the body. Write the introduction after you know what the body actually argued.',
            },
          },
          {
            '@type': 'Question',
            name: 'Do I need a hook?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. A hook is optional. The thesis is not. Rhetorical questions, famous quotes, and "imagine a world" usually delay the claim.',
            },
          },
          {
            '@type': 'Question',
            name: 'Where does the thesis go in the introduction?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Usually the last sentence of the introduction, after the context that makes the claim intelligible. Do not save the claim for the conclusion.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I use AI to write my introduction in 2026?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'On most campuses, feedback on a paragraph you wrote is treated differently from generated text. A chatbot hook is easy to spot because it fits any prompt. Rewrite the opening yourself.',
            },
          },
        ],
      });
    } else {
      removeJsonLd('blog-post-howto');
      removeJsonLd('blog-post-faq');
    }

    return () => {
      removeJsonLd('blog-post');
      removeJsonLd('blog-post-howto');
      removeJsonLd('blog-post-faq');
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
            className="text-[#A560E8] hover:text-[#7733B5] font-extrabold"
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
  const hasArt = hasBlogArt(post.slug);
  const updatedLabel = new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <LoggedInPageShell user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="blog">
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14">
        {/* Hero. Flex row so the decorative mascot sits top-right in the
            space left over by the max-w-3xl text column, without affecting
            the text measure. `items-start` keeps it level with the
            breadcrumb rather than vertically centred against a tall H1. */}
        <div className="flex items-start justify-between gap-8 mb-10 md:mb-12">
        <header className="max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
              <li>
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('landing');
                  }}
                  className="hover:text-[#A560E8] transition-colors"
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
                  className="hover:text-[#A560E8] transition-colors"
                >
                  Blog
                </a>
              </li>
            </ol>
          </nav>

          <p className="inline-flex items-center rounded-full bg-[#F3EAFF] dark:bg-[#A560E8]/20 text-[#7733B5] dark:text-[#A560E8] border border-[#A560E8]/30 font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 mb-4">
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

          {/* The hero artwork already stars the mascot, and the animated one
              is ~1MB, so it only shows on posts without artwork. */}
          {!hasArt && <BlogMascot slug={post.slug} />}
        </div>

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
              {hasArt && (
                <img
                  src={blogHeroSrc(post.slug)}
                  alt={`Scholar, the WriteScholar mascot, illustrating ${post.title}`}
                  width={BLOG_HERO_SIZE.width}
                  height={BLOG_HERO_SIZE.height}
                  // React 18 drops camelCase fetchPriority; the lowercase attribute reaches the DOM.
                  {...{ fetchpriority: 'high' }}
                  decoding="async"
                  className="w-full h-auto rounded-xl mb-8 bg-[#F3EAFF]"
                />
              )}
              <div className="rounded-xl border-2 border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-800 px-4 py-4 sm:px-5 sm:py-5 mb-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400 mb-2">Written by</p>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-100" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
                  {post.author}
                </p>
                <p className="text-sm font-medium text-[#A560E8] mt-1">{authorRole}</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">{authorBio}</p>
              </div>

              <div
                ref={articleBodyRef}
                id="blog-article-body"
                className="prose prose-stone dark:prose-invert prose-lg max-w-none prose-headings:font-sans prose-a:text-[#A560E8] prose-a:no-underline hover:prose-a:underline prose-p:text-stone-600 dark:prose-p:text-stone-400"
              >
                <BlogPostContent slug={post.slug} onNavigate={onNavigate} />
                <BlogKeyTakeaways bullets={post.keyTakeaways} />
              </div>
            </div>

            <BlogPostCta onNavigate={onNavigate} primaryPage="signup" primaryLabel="Try it for $1 →" />

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
                  className="text-[#A560E8] hover:text-[#7733B5] font-extrabold text-left transition-colors"
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
                  className="text-[#A560E8] hover:text-[#7733B5] font-extrabold sm:text-right transition-colors"
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
                className="inline-flex items-center px-6 py-3 bg-[#A560E8] hover:bg-[#9450D8] text-white font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#7733B5] active:border-b-2 active:translate-y-0.5 transition-all duration-150"
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
