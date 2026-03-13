# WriteScholar: Code Audit + Backlink Outreach Guide

**Date:** March 2026  
**Scope:** Technical SEO, code quality, and prioritized backlink outreach for writescholar.com

---

## Part 1: Deep Code / Technical SEO Audit

### 🔴 Critical Issues (Fix First)

#### 1. Missing `pageMeta` for `/tools/analyze` and `/tools/citations`
**Problem:** When users land on `/tools/analyze` (AI Essay Checker) or `/tools/citations` (Citation Finder), the app falls back to homepage meta. Google and social shares show the wrong title/description.

**Fix:** Add to `pageMeta` in `CompleteAcademicAIApp.tsx` (around line 269):
```js
'analyze': { title: 'AI Essay Checker – Professor-Style Feedback by Grade Level | WriteScholar', description: 'Get AI essay feedback tailored to college, high school, or middle school. Structure, clarity, citations, grammar. Free essay analysis tool for students.' },
'citations': { title: 'Academic Citation Finder – APA, MLA, Chicago Sources | WriteScholar', description: 'Find peer-reviewed academic sources for your research. Search by topic, get APA, MLA, Chicago citations instantly. Free citation finder for students.' },
```

#### 2. Sitemap: Duplicate `/about` URL
**Problem:** `sitemap.xml` lists `/about` twice (lines 7 and 13). Duplicate URLs can dilute crawl budget and confuse Google.

**Fix:** Remove the duplicate entry from `public/sitemap.xml`.

#### 3. Prerender Missing Key SEO Pages
**Problem:** `scripts/prerender.mjs` does NOT prerender:
- `/tools/analyze` (AI Essay Checker – high-value keyword)
- `/tools/citations` (Citation Finder)
- `/tools/interactive-lesson` (AI lesson generator)
- `/tools/lightning-reflex-quiz` (Crater Blast alias)

Crawlers get the SPA shell; if JS is slow, they may not see full content.

**Fix:** Add to `staticRoutes` in `scripts/prerender.mjs`:
```js
'/tools/analyze',
'/tools/citations',
'/tools/interactive-lesson',
'/tools/lightning-reflex-quiz',
```

#### 4. Sitemap Missing Key Pages
**Problem:** Sitemap does not include:
- `/tools/analyze`
- `/tools/citations`
- `/tools/interactive-lesson`
- `/share-friends` (if you want it indexed)

**Fix:** Add these URLs to `public/sitemap.xml` with appropriate priority/ changefreq.

---

### 🟡 Moderate Issues

#### 5. robots.txt Disallows `/analysis` but Not `/tools/analyze`
**Current:** `Disallow: /analysis` (dashboard-style analysis page)  
**Note:** `/tools/analyze` is the public entry point for the Essay Checker. Ensure `/tools/analyze` is **allowed** (it is, via `Allow: /tools/*`). No change needed; just confirming the distinction is correct.

#### 6. index.html Em Dashes in Meta
**Problem:** Homepage title uses `—` (em dash). You removed these from blog copy for "AI slop" feel; consider consistency.

**Optional:** Change `WriteScholar — #1` to `WriteScholar | #1` or `WriteScholar: #1` in `index.html` if you want to align with the blog style.

#### 7. `sameAs` Empty in Organization Schema
**Problem:** `index.html` has `"sameAs": []` in the Organization structured data. Social profiles strengthen E-E-A-T.

**Fix:** Add real URLs when you have them:
```json
"sameAs": [
  "https://twitter.com/writescholar",
  "https://www.linkedin.com/company/writescholar",
  "https://www.instagram.com/writescholar"
]
```

#### 8. AggregateRating in Schema
**Problem:** `aggregateRating` shows `"ratingCount": "1247"` and `"ratingValue": "4.9"`. If these are not verifiable (e.g. from a public review platform), Google may reject the rich result. Fabricated ratings can trigger manual action.

**Action:** Either remove `aggregateRating` or ensure it reflects real, verifiable reviews (e.g. Chrome Web Store, G2, etc.).

---

### 🟢 Minor / Optional

#### 9. Blog Post Canonical URLs
Blog posts use dynamic meta; ensure `link[rel="canonical"]` is set correctly for `/blog/{slug}`. The `useEffect` in `CompleteAcademicAIApp.tsx` sets canonical from `window.location.pathname`; for blog posts this should be correct. Verify in production.

#### 10. Lazy-Loaded Chunks and Crawl Budget
Heavy use of `lazyWithRetry` is good for performance. Prerendering mitigates SEO risk for key pages. Ensure prerender runs on every production deploy (already in build script).

---

## Part 2: Best Backlinks to Reach Out To

Prioritized by effort vs. impact. Focus on sites that:
- Link to student/study tools
- Have topical relevance
- Accept free listings or guest posts

---

### Tier 1: Easiest Wins (Do First)

| Site | Why | Action |
|------|-----|--------|
| **AlternativeTo.net** | Lists alternatives to Quizlet, Quillbot, Grammarly. High DA, editorial. | Submit WriteScholar as alternative to Quizlet, Quillbot, Grammarly. One form per product. |
| **Product Hunt** | Drives traffic + backlinks. Fits "AI study tools" launch. | Launch WriteScholar. Prep tagline, 5 bullets, 3–5 images, demo video. |
| **G2.com** | High DA. Free vendor listing. | Create G2 vendor profile, add products (Humanizer, Quiz Generator, etc.). |
| **Capterra** | Same as G2. | Create Capterra listing for "Study Tools" / "Academic Writing Software." |
| **Tool directories** (toolpilot.ai, futurepedia.io, theresanaiforthat.com, aitoolhunt.com, topai.tools) | AI tool roundups. Often free. | Submit WriteScholar with short description + URL. |

---

### Tier 2: Medium Effort, Strong Links

| Site / Type | Why | Action |
|-------------|-----|--------|
| **Student / college subreddits** (r/college, r/StudentLife, r/GetStudying) | Large student audience. | Share useful content (e.g. "How to study effectively" post). Soft mention of tools in comments when relevant. No spam. |
| **University writing centers** | .edu links. Topical fit. | Email writing center directors: offer free tool demo or guest article (e.g. "5 free tools that help with citations"). |
| **Education / EdTech blogs** (educba.com, similar) | Guest posting. | Pitch: "5 AI Tools That Help Students Study (Without Cheating)" or "Best Free Citation Tools for College Papers." |
| **HARO (Help a Reporter Out)** | Journalist queries → high-DA links. | Sign up, respond to queries on "AI in education," "study tools," "academic writing." |

---

### Tier 3: Higher Effort, Highest Value

| Opportunity | Why | Action |
|-------------|-----|--------|
| **.edu resource pages** | .edu links carry strong weight. | Find university "student resources" or "writing tools" pages. Propose adding WriteScholar as a free tool. |
| **YouTube tutorials** | Videos rank and attract links. | Create short tutorials (e.g. "Turn notes into a quiz in 30 seconds"). Link to WriteScholar in description. |
| **"Best AI tools for students" roundups** | Many sites run these. | Find posts that list Quillbot, Quizlet, etc. Email: "You might want to add WriteScholar; it does X, Y, Z." |

---

## Outreach Email Template (Adapt as Needed)

**Subject:** Free tool for your [resource page / students / roundup]

**Body:**
> Hi [Name],
>
> I noticed [specific page/post] and thought WriteScholar might be a fit. It's a free AI study platform students use for quizzes, flashcards, essay feedback, and citations. No signup for most tools.
>
> If you're curating resources for students or updating a tools roundup, I'd be happy to provide a short description and any assets you need.
>
> Best,  
> [Your name]

---

## Summary Checklist

### Code Fixes
- [ ] Add `pageMeta` for `analyze` and `citations`
- [ ] Remove duplicate `/about` from sitemap
- [ ] Add `/tools/analyze`, `/tools/citations`, `/tools/interactive-lesson`, `/tools/lightning-reflex-quiz` to prerender
- [ ] Add same pages to sitemap
- [ ] Consider: em dashes in index.html, `sameAs`, `aggregateRating`

### Backlinks (Start This Week)
1. [ ] Submit to AlternativeTo (Quizlet, Quillbot, Grammarly alternatives)
2. [ ] Submit to 3–5 AI tool directories
3. [ ] Create G2 + Capterra listings
4. [ ] Prepare Product Hunt launch

### Backlinks (Next 2–4 Weeks)
5. [ ] HARO signup + first responses
6. [ ] Reddit value posts (no spam)
7. [ ] Outreach to 5–10 education blogs for guest posts

---

## Part 3: Deep Niche Backlink Directory List

Directories and sites identified from web research. Submission URLs and niche fit included.

### AI Tool Directories (Free or Low-Cost)

| Site | Submit URL | Niche fit | Cost |
|------|------------|-----------|------|
| **There's An AI For That** | [theresanaiforthat.com/submit](https://theresanaiforthat.com/submit/) | 46k+ tools, 80M+ users, 4M+ monthly visitors | Free |
| **Futurepedia** | [futurepedia.io/submit-tool](https://www.futurepedia.io/submit-tool) | 2,625+ tools, 350k+ users | $247–497 (tiers) |
| **TopAI.tools** | [topai.tools/submit](https://topai.tools/submit) | 2.25M monthly visitors, 21k+ tools | $47 (fast) / $229 (premium) |
| **Toolify.ai** | [toolsify.ai/submit](https://www.toolify.ai/submit) | 25k+ tools, free submissions | Free |
| **AI Exchange** | [aiexchange.tech/submit-tool](https://www.aiexchange.tech/submit-tool) | AI marketplace, auto-extracts info | Free |
| **AI Tools Directory** | [ai-toolsdirectory.com/submit-new-listing](https://ai-toolsdirectory.com/submit-new-listing/) | General AI directory | Varies |
| **RETRIEVE** | [retrieve.tools](https://retrieve.tools/education) | 3,152+ tools, education category | Free |
| **Toolsland.ai** | [toolsland.ai/submit-ai-tool-free](https://www.toolsland.ai/submit-ai-tool-free) | Submit AI tool free | Free |
| **EliteAI.tools** | [eliteai.tools/tool/submit-new-tool](https://eliteai.tools/tool/submit-new-tool) | AI directory | Free |

### EdTech / Education Directories

| Site | Submit URL | Niche fit | Cost |
|------|------------|-----------|------|
| **EdTech Listed** | [edtechlisted.com/submit](https://edtechlisted.com/submit/) | EdTech-only, awards program | $99–189/year |
| **Educational App Store** | [educationalappstore.com](https://www.educationalappstore.com/blog/how-to-submit-ai-tool-to-educational-app-store) | EAS certification, school outreach | Review process |
| **Curaited** | [curaited.io/ai-tools-directory](https://curaited.io/ai-tools-directory/) | Educators, students, parents | Contact |
| **AI Apps** | [aiapps.com](https://www.aiapps.com/) | 1,000+ tools, education filters | Contact |

### Alternative / Comparison Directories

| Site | Submit URL | Niche fit | Cost |
|------|------------|-----------|------|
| **AlternativeTo** | alternativeto.net → Suggest Alternatives | Quizlet, Quillbot, Grammarly alternatives | Free |
| **Softwaresuggest** | [softwaresuggest.com/quillbot/alternatives](https://www.softwaresuggest.com/quillbot/alternatives) | Quillbot alternatives listed | Contact for listing |
| **Softstribe** | [softstribe.com/alternatives/quizlet-alternatives](https://softstribe.com/alternatives/quizlet-alternatives/) | Quizlet alternatives roundup | Outreach for inclusion |
| **Cramberry** | [cramberry.study/blog/quizlet-alternatives-2026](https://www.cramberry.study/blog/quizlet-alternatives-2026) | Quizlet alternatives review | Outreach for inclusion |
| **Studyx.ai** | [studyx.ai/blog/best-quizlet-alternatives-2026](https://studyx.ai/blog/best-quizlet-alternatives-2026) | Study tools roundup | Outreach for inclusion |
| **Flashcardmaker.me** | [flashcardmaker.me/alternatives/quizlet-alternatives](https://flashcardmaker.me/alternatives/quizlet-alternatives) | Flashcard tool comparisons | Outreach for inclusion |

### Student / Academic Resource Sites

| Site | Submit URL / Contact | Niche fit | Cost |
|------|----------------------|-----------|------|
| **IvyPanda** | [ivypanda.com/blog/best-writing-tools-and-resources](https://ivypanda.com/blog/best-writing-tools-and-resources) | 189+ writing tools listed; outreach for inclusion | Free (editorial) |
| **WholeSyllabus** | [wholesyllabus.com](https://wholesyllabus.com/free-study-tools-for-students-in-websites-resources/) | Free study tools roundup | Outreach |
| **Nextoolbox** | [nextoolbox.com/free-study-tools-2025](https://nextoolbox.com/free-study-tools-2025/) | Free study tools 2025 | Outreach |
| **Bring Tools** | [bringtools.com/35-useful-tools-for-students](https://bringtools.com/35-useful-tools-for-students-and-researchers-2025-edition/) | Students & researchers tools | Outreach |
| **Online Student Life** | [onlinestudentlife.com/free-online-study-tools](https://onlinestudentlife.com/free-online-study-tools/) | Free study apps list | Outreach |
| **ToolGuideHQ** | [toolguidehq.com/best-ai-tools-for-students](https://toolguidehq.com/best-ai-tools-for-students-reviewed/) | AI tools for college students | Outreach |
| **Browse-AI** | [browse-ai.tools/blog/best-ai-tools-for-students-2025](https://www.browse-ai.tools/blog/best-ai-tools-for-students-2025) | AI tools for students roundup | Outreach |
| **Techraisal** | [techraisal.com/blog/21-best-ai-tools-for-students](https://www.techraisal.com/blog/21-best-ai-tools-for-students-in-2025/) | AI for students list | Outreach |
| **CognitiveFuture** | [cognitivefuture.ai/best-ai-tools-for-academic-writing](https://cognitivefuture.ai/best-ai-tools-for-academic-writing/) | Academic writing AI tools | Outreach |
| **SciJournal** | [scijournal.org/articles/best-academic-writing-tools](https://www.scijournal.org/articles/best-academic-writing-tools) | Academic writing tools for researchers | Outreach |
| **PureWrite** | [purewrite.io/blog/best-academic-writing-software](https://purewrite.io/blog/best-academic-writing-software) | Academic writing software | Outreach |
| **AIToolVS** | [aitoolvs.com/best-ai-grammar-checkers-2026](https://aitoolvs.com/best-ai-grammar-checkers-2026/) | AI grammar checkers | Outreach |

### SaaS / Launch Directories

| Site | Submit URL | Niche fit | Cost |
|------|------------|-----------|------|
| **Product Hunt** | [producthunt.com](https://www.producthunt.com/) | Launch page, drives traffic + links | Free |
| **SaaSBison** | [launchdirectories.com](https://launchdirectories.com/directory/saasbison) | Free, dofollow, education tag | Free |
| **Top SaaS Directories** | [topsaasdirectories.com/tag/education](https://www.topsaasdirectories.com/tag/education) | Education category | Varies |

### Niche: AI Humanizer / Undetectable AI

| Site | Submit URL | Niche fit | Cost |
|------|------------|-----------|------|
| **Toolify** (humanizer category) | [toolify.ai](https://www.toolify.ai/) | Lists humanizer tools, 509k monthly to humanizer.org | Free submission |
| **AI humanizer roundups** | Search "best AI humanizer 2025" | Many list competitors | Outreach to be added |

### Reddit (Value, Not Spam)

| Subreddit | Strategy |
|-----------|----------|
| r/college | Answer questions about studying, citations, essay writing. Mention WriteScholar only when it directly answers the question. |
| r/GetStudying | Share study tips, Pomodoro, flashcards. Soft CTA. |
| r/StudentLife | Same as above. |
| r/ApplyingToCollege | Citation tools, essay feedback for applications. |
| r/homeworkhelp | Only when someone asks "what tool can I use for X." |

### Guest Post / Outreach Targets

| Site Type | Example | Pitch |
|-----------|---------|-------|
| Education blogs | educba.com, serpzilla.com (170+ education guest post sites) | "5 AI tools for students that don't replace learning" |
| Writing / citation blogs | Caltech Writing, Purdue OWL resource pages | "Free citation + essay tools for students" |
| Study tips blogs | CareerFlyes, TheMindAndMuscle | "Study tools 2025" roundup inclusion |
| AI tool blogs | AIToolDiscovery | "Best AI study tools: Reddit student reviews" style post |

---

## Quick Start: Do These 10 First

1. **AlternativeTo** — Add WriteScholar as alternative to Quizlet, Quillbot, Grammarly  
2. **There's An AI For That** — [theresanaiforthat.com/submit](https://theresanaiforthat.com/submit/)  
3. **Toolify.ai** — Free, [toolsify.ai/submit](https://www.toolify.ai/submit)  
4. **TopAI.tools** — [topai.tools/submit](https://topai.tools/submit) (paid but high traffic)  
5. **G2 + Capterra** — Free vendor listings  
6. **Product Hunt** — Launch WriteScholar  
7. **EdTech Listed** — [edtechlisted.com/submit](https://edtechlisted.com/submit/) (paid)  
8. **Futurepedia** — [futurepedia.io/submit-tool](https://www.futurepedia.io/submit-tool)  
9. **Outreach** — Email IvyPanda, WholeSyllabus, SciJournal for inclusion in roundups  
10. **HARO** — [helpareporter.com](https://www.helpareporter.com/) — Sign up, respond to education/AI queries
