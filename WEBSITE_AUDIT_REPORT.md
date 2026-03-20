# WriteScholar Website Audit Report

**Date:** March 17, 2026  
**Scope:** Design/development cost estimate, H1/H2 SEO audit, SEO strategy, backlink plan

---

## Part 1: Design & Development Cost Estimate

### Scope of the Build

| Layer | Size | Tech |
|-------|------|------|
| **Frontend** | ~61,500 lines (TS/TSX) | React 18, TypeScript, Vite 5, Tailwind CSS |
| **Backend** | ~19,100 lines (JS) | Node.js, Express 4 |
| **Chrome Extension** | ~2,450 lines | Manifest v3, declarativeNetRequest, API sync |
| **Total** | ~83,000+ lines | |

### Features Built

- **Auth:** JWT, refresh tokens, Passport (Google OAuth), email verification
- **Essay Analyzer:** AI feedback, document upload (PDF/DOCX), grade-level rubrics, inline annotations
- **Citation Search:** AI-powered search, history, APA/MLA/Chicago/Harvard/IEEE/Vancouver
- **Study Tools:** Quiz generator, flashcards, crossword, interactive lessons, Crater Blast game
- **Focus Mode:** Site blocking, unlock flow (quiz or puzzle), Chrome extension
- **Puzzles:** Sudoku 6×6, Memory Match, Pattern Match
- **Billing:** Stripe Checkout, subscriptions, webhooks, promo codes
- **Blog:** 15+ SEO-optimized posts with structured content
- **Social:** Friends system, achievements/badges, streaks
- **Integrations:** OpenAI, Supabase (PostgreSQL), AWS S3 (or Supabase Storage), Netlify

### Pages & Routes

- **50+ routes** (landing, pricing, features, 20+ tools, 15+ blog posts, auth, protected)
- Custom client-side routing (no React Router)
- Prerendering (Puppeteer) for SEO-critical routes

### Cost Estimate (USD)

If built from scratch by a contractor or agency today:

| Scenario | Low | Mid | High |
|----------|-----|-----|------|
| **Solo freelancer** (6–12 months) | $40,000 | $70,000 | $120,000 |
| **Small agency** (3–6 months) | $80,000 | $140,000 | $200,000+ |
| **Senior dev + designer** (4–8 months) | $60,000 | $100,000 | $160,000 |

**Rough midpoint:** **$80,000–$120,000** for a complete, production-ready build including:
- Design system and UI
- Auth, billing, database schema
- AI integrations and tool logic
- Chrome extension
- Blog and SEO setup

**Caveats:** Assumes you own the design direction, content, and product logic. Add 15–30% if starting from scratch with no wireframes or copy.

---

## Part 2: H1 & H2 SEO Audit

### Overall Assessment: **Good with a few fixes**

### H1 Usage

| Page | Current H1 | Assessment |
|------|------------|------------|
| **Landing** | "Check my essay with AI, get professor-style feedback in seconds" | ✅ Strong, matches title tag |
| **Focus Mode** | "Earn Your Free Time" (hero) | ✅ Clear value prop |
| **Features** | "AI essay feedback, study packs & focus mode" | ✅ Good, keyword-rich |
| **Blog post** | Post title (e.g. "Check Your Essay with AI: Professor-Style Feedback in Seconds") | ✅ Correct |
| **Tools (e.g. quiz-gen)** | "Quiz Generator" / tool name | ✅ Appropriate |
| **UnlockQuizPage** | Multiple H1s in different phases | ⚠️ Use one primary H1 per view |

**Rules followed:**
- One primary H1 per page
- H1 aligns with page purpose and main keyword

### H2 Structure in Blog Posts

**Essay analysis post** (`check-essay-with-ai-professor-style-feedback`):
- What makes essay feedback useful
- Inline annotations instead of vague notes
- Grade-level rubrics that match your assignment
- Professor-style feedback in under a minute
- Designed for students at every level
- What the analysis covers
- Rubric alignment with your assignment
- Frequently asked questions
- Try it before you submit

✅ **Verdict:** Logical hierarchy, good keywords, FAQ section supports featured snippets.

### Recommended H1/H2 Fixes

1. **UnlockQuizPage** – Consolidate to one main H1 per phase; use H2 for subheads.
2. **Focus Mode “Coming Soon” variant** – H1 "Focus Mode is on its way" is fine, but the live hero H1 "Earn Your Free Time" could optionally add the phrase "Block Sites Until You Study" for SEO (e.g. subheading).
3. **Tool pages** – Confirm each tool page has a unique H1 that includes the primary keyword (e.g. "Free Quiz Generator" vs. "Quiz Generator").

### Title / Meta Consistency

- Landing: title ≈ H1 ✅  
- Most tool pages have meta in `pageMeta` ✅  
- Blog posts: `document.title = post.title | WriteScholar` ✅

---

## Part 3: SEO Strategy & Next Steps

### Current Setup (What’s Working)

- Meta titles and descriptions per page
- Prerendering for important routes
- Sitemap (`/sitemap.xml`)
- `robots.txt` (blocks auth/account paths)
- 15+ blog posts with internal links
- Tool pages as SEO entry points
- Structured data (FAQ schema) on key pages

### Critical Fix: Add New Blog Post to Sitemap

**Issue:** The post `check-essay-with-ai-professor-style-feedback` is **not** in `sitemap.xml`.

**Action:** Add:

```xml
<url><loc>https://writescholar.com/blog/check-essay-with-ai-professor-style-feedback</loc><lastmod>2026-03-17</lastmod><priority>0.7</priority><changefreq>monthly</changefreq></url>
```

### Timing: After Your New Blog Post

**Do now:**
1. Add the new blog post to the sitemap (above).
2. In Google Search Console, use “Request indexing” for the new post URL.
3. Let it index (usually 1–7 days) before heavy promotion.

**Next 2–4 weeks:**
- Don’t rush another blog post. Google needs time to recrawl and index.
- Focus on internal links (you’ve already added some in the essay post).
- Share the post where it fits (Reddit, relevant communities) without spamming.

**Next 4–8 weeks:**
- Plan 1–2 more posts around high-intent keywords (e.g. “essay checker,” “professor feedback,” “quiz generator for students”).
- Continue internal linking from new posts to tools and other articles.

---

## Part 4: Backlink Strategy

### Current State

- Backlinks from your own sites: Mosaic, VirtualPaint, Year Enhanced Pro
- These are low authority and not strong SEO signals
- Need links from relevant, trusted domains

### Why Strong Backlinks Matter

- Domain Authority (DA) and relevance signal trust to Google
- Your own sites are seen as self-referential
- EdTech, student, and academic sites are most valuable

### Action Plan: Backlinks That Can Move Rankings

#### 1. Directory & AI Tool Listings (Low effort, medium impact)

You already have `public/backlink-opportunities-guide.html`. Prioritize:

- **There’s An AI For That** – theresanaiforthat.com/submit
- **Toolify** – toolify.ai/submit
- **Futurepedia** – futurepedia.io/submit-tool
- **TopAI.tools** – topai.tools/submit
- **Product Hunt** – producthunt.com (launch)

**Timeline:** 1–2 weeks. Many are free to submit.

#### 2. EdTech Directories (Higher relevance)

- **EdTech Listed** – edtechlisted.com/submit
- **Educational App Store** – educationalappstore.com
- **Capterra / G2** – create vendor profiles and ask for reviews

#### 3. Outreach for Guest Posts & Resource Links

Find pages that list “best essay tools,” “study tools for students,” etc., and propose:

- A short guest post with one contextual link
- Or inclusion in their resource list in exchange for a brief, honest review

**Example targets** (check if they accept submissions/guest posts):

- IvyPanda (they have a blog)
- WholeSyllabus
- SciJournal
- CognitiveFuture.ai
- University/college study skills pages
- Student newspaper blogs

**Email template (short):**

> Subject: Suggestion for your [resource name] list  
>  
> Hi [Name],  
>  
> I noticed your list of [topic]. We built WriteScholar — an essay checker with professor-style feedback plus study tools (quizzes, flashcards, Focus Mode). We’re not asking for a paid placement, just consideration for your next update. Happy to send a short blurb or answer any questions.  
>  
> [Your name]

#### 4. Content That Attracts Links

- **Study guides** – e.g. “Ultimate Study Tips Guide” (you have this)  
  - Promote it to students and educators; useful, original content gets linked.
- **Comparison pages** – “WriteScholar vs Quizlet” (you have vs-quizlet-knowt)  
  - These can earn links when people compare tools.
- **Focused blog posts** – e.g. “How to Avoid Plagiarism,” “How to Write a Thesis Statement”  
  - Optimize for search and share; good posts get cited.

#### 5. What to Avoid

- Buying links or using link farms
- Massive link exchange schemes
- Irrelevant directories (gambling, adult, etc.)
- Spamming forums or Reddit for links

### Expected Timeline

| Phase | Timeframe | Actions |
|-------|-----------|---------|
| **Immediate** | Week 1 | Add new post to sitemap, submit to 3–5 AI/EdTech directories |
| **Short-term** | 2–4 weeks | Product Hunt (if ready), 5–10 more directory submissions |
| **Medium-term** | 1–3 months | 10–20 outreach emails for listings/guest posts |
| **Ongoing** | 3+ months | New blog content, promotion, more outreach |

### Realistic Expectations

- Strong backlinks take months, not weeks
- 5–10 quality backlinks (DA 30+) can move rankings more than 50 weak ones
- Focus on relevance (EdTech, education, student tools) over volume

---

## Summary Checklist

- [ ] Add `check-essay-with-ai-professor-style-feedback` to sitemap.xml
- [ ] Request indexing in Google Search Console for the new post
- [ ] Submit to 3–5 AI/EdTech directories (from your backlink guide)
- [ ] Fix UnlockQuizPage H1 usage (one primary H1 per phase)
- [ ] Plan next 1–2 blog posts for high-intent keywords
- [ ] Start outreach list for guest posts and resource page inclusions
- [ ] Consider Product Hunt launch when ready

---

*Report generated from codebase and SEO structure analysis.*
