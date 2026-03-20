# Stripe Product Descriptions

Copy these descriptions into your Stripe Dashboard (**Products** → select product → **Description**).

---

## Pro Plan ($19.99/month or $199.99/year)

**Description to paste into Stripe:**

```
AI-powered academic writing assistant for students. Includes: unlimited documents; 99 combined analyses, study packs & citations per month; 99,999 words for the Paper Summarizer; all citation styles; PDF/Word export; Focus Mode (20 sites); quiz, flashcards, crossword & Crater Blast; long-document summarization. Ideal for students who need robust writing support.
```

**Feature list (for Stripe product metadata or marketing copy):**
- Unlimited documents
- 99 combined analyses, study packs & citations/mo
- 99,999 words Paper Summarizer
- All citation styles, PDF/Word export
- Focus Mode (20 sites)
- Quiz, flashcards, crossword & Crater Blast
- Summarizer (all lengths & styles)

---

## Premium Plan ($39.99/month or $399.99/year)

**Description to paste into Stripe:**

```
Advanced AI-powered academic writing assistant for researchers and institutions. Everything in Pro, plus 10× usage: 999 combined analyses, study packs & citations per month; 999,999 words for the Paper Summarizer; premium AI model & advanced essay analysis; priority support; Focus Mode (unlimited sites); larger document uploads (up to 1GB). Perfect for power users who need the highest capacity.
```

**Feature list (for Stripe product metadata or marketing copy):**
- Everything in Pro • 10× usage
- 999 combined analyses, study packs & citations/mo
- 999,999 words Paper Summarizer
- Premium AI model, advanced essay analysis
- Priority support
- Focus Mode (unlimited sites)
- Larger document uploads (up to 1GB)

---

## Focus Plan ($9.99/month, monthly only)

**Description to paste into Stripe:**

```
Unlimited Focus Mode only. Block distracting sites (YouTube, TikTok, Instagram, etc.) until you pass a study quiz. Includes Chrome extension. No documents, essay analysis, summarizer, citations, or study tools—pure focus mode. Perfect for students who only need website blocking.
```

**Feature list:**
- Unlimited sites in Focus Mode
- Chrome extension included
- Block sites until you pass quiz
- No documents, analyses, summarizer, citations, or study tools

**Setup:** Create a product "Focus" in Stripe, add a recurring monthly price of $9.99. Copy the Price ID and set `STRIPE_FOCUS_MONTHLY_PRICE_ID` in your environment.

---

## How to Update in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Click your **Pro** product → **Edit** → paste the Pro description above into the **Description** field
3. Click your **Premium** product → **Edit** → paste the Premium description above into the **Description** field
4. Click **Save** for each product
