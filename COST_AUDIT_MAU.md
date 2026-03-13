# WriteScholar Cost Audit — Maxed-Out Usage (10,000 MAU)

**Scenario:** 10,000 monthly active users  
- 8,000 Free  
- 1,500 Pro  
- 500 Premium  

**Assumption:** Every user maxes out their plan limits each month.

---

## Plan Limits Summary (from subscriptionService.js)

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Document analyses | 3 | 99 | 199 |
| Citation searches | 2 | 99 | 199 |
| Humanize words | 5,000 | 99,999 | 999,999 |
| Summarize words | 5,000 | 99,999 | 999,999 |
| Quiz generations | 3 | 99 | 199 |
| Quiz max words/gen | 5,000 | 15,000 | 15,000 |
| Lesson generations | 3 | 99 | 199 |
| Lesson max words/gen | 5,000 | 10,000 | 10,000 |

---

## OpenAI Models Used

| Feature | Model | Input $/1M | Output $/1M |
|---------|-------|-----------|-------------|
| Humanize, Summarize, Quiz, Flashcards, Lesson, Crossword, Crater Blast | gpt-4.1-nano | ~$0.10 | ~$0.40 |
| Essay analysis (Free/Pro) | gpt-4o-mini | ~$0.15 | ~$0.60 |
| Essay analysis (Premium) | gpt-5-mini | ~$0.25 | ~$2.00 |
| Citation search | gpt-4.1-mini / gpt-4o-mini | ~$0.15 | ~$0.60 |

*Prices approximate; check openai.com/api/pricing for current rates.*

---

## Token Estimates Per Operation

| Operation | Est. Input Tokens | Est. Output Tokens |
|-----------|-------------------|--------------------|
| Humanize (1k words) | ~2,500 | ~1,300 |
| Summarize (1k words) | ~2,500 | ~500 |
| Quiz (5k words) | ~7,500 | ~2,500 |
| Flashcards (5k words) | ~7,500 | ~2,000 |
| Lesson (5k words) | ~7,500 | ~4,000 |
| Document analysis (2k words) | ~4,000 | ~2,500 |
| Citation search | ~2,000 | ~2,000 |

---

## Monthly Cost by User Type (Maxed-Out)

### FREE USERS (8,000 users)

| Feature | Usage | Est. Tokens (in/out) | Cost @ nano |
|---------|-------|----------------------|-------------|
| Analyses | 3 × 8,000 = 24,000 | ~96M in, ~60M out | Uses gpt-4o-mini: ~$24 |
| Citation searches | 2 × 8,000 = 16,000 | ~32M in, ~32M out | gpt-4o-mini: ~$25 |
| Humanize | 5,000 words × 8,000 | ~100M in, ~52M out | nano: ~$15 |
| Summarize | 5,000 words × 8,000 | ~100M in, ~20M out | nano: ~$18 |
| Quiz | 3 × 8,000 (5k words) | ~180M in, ~60M out | nano: ~$42 |
| Lesson | 3 × 8,000 (5k words) | ~180M in, ~96M out | nano: ~$46 |

**Free total (rough):** ~$210/month (OpenAI only)

---

### PRO USERS (1,500 users)

| Feature | Usage | Est. Tokens | Cost |
|---------|-------|-------------|------|
| Analyses | 99 × 1,500 = 148,500 | ~594M in, ~371M out | gpt-4o-mini: ~$208 |
| Citation searches | 99 × 1,500 = 148,500 | ~297M in, ~297M out | gpt-4o-mini: ~$133 |
| Humanize | ~999k words × 1,500 | ~3.75B in, ~1.95B out | nano: ~$1,162 |
| Summarize | ~999k words × 1,500 | ~3.75B in, ~750M out | nano: ~$1,312 |
| Quiz | 99 × 1,500 (15k words) | ~11.1B in, ~3.7B out | nano: ~$2,590 |
| Lesson | 99 × 1,500 (10k words) | ~11.1B in, ~5.9B out | nano: ~$3,524 |

**Pro total (rough):** ~$8,929/month (OpenAI only)

---

### PREMIUM USERS (500 users)

| Feature | Usage | Est. Tokens | Cost |
|---------|-------|-------------|------|
| Analyses | 199 × 500 = 99,500 | ~398M in, ~249M out | gpt-5-mini: ~$574 |
| Citation searches | 199 × 500 = 99,500 | ~199M in, ~199M out | gpt-4o-mini: ~$89 |
| Humanize | ~999k words × 500 | ~1.25B in, ~650M out | nano: ~$387 |
| Summarize | ~999k words × 500 | ~1.25B in, ~250M out | nano: ~$437 |
| Quiz | 199 × 500 (15k words) | ~2.98B in, ~1B out | nano: ~$698 |
| Lesson | 199 × 500 (10k words) | ~2.98B in, ~1.59B out | nano: ~$1,174 |

**Premium total (rough):** ~$3,359/month (OpenAI only)

---

## Total OpenAI Cost (Maxed-Out Scenario)

| Segment | Monthly cost (OpenAI) |
|---------|----------------------|
| Free (8,000) | ~$210 |
| Pro (1,500) | ~$8,929 |
| Premium (500) | ~$3,359 |
| **Total** | **~$12,498/month** |

---

## Revenue (for context)

| Segment | Users | Price | Monthly revenue |
|---------|-------|-------|------------------|
| Pro | 1,500 | $19.99 | $29,985 |
| Premium | 500 | $39.99 | $19,995 |
| **Total** | | | **$49,980** |

---

## Other Costs (estimate)

| Service | Est. monthly |
|---------|--------------|
| Supabase (DB, storage, auth) | $25–200 |
| Hosting (Vercel/Railway/etc.) | $20–100 |
| Stripe fees (2.9% + 30¢) | ~$1,500 |
| Email (SendGrid, etc.) | $20–50 |

---

## Summary

| Metric | Value |
|--------|-------|
| OpenAI (maxed-out) | ~$12,500/month |
| Revenue | ~$50,000/month |
| Gross margin | ~75% (before infra) |
| Break-even | Far below max usage |

**Notes:**
- Real usage is usually far below limits. 10–30% of users maxing out would imply ~$1,250–$3,750/month in AI cost.
- Pro users at full limits dominate cost because of unlimited humanize/summarize/quiz/lesson words and high generation counts.
- Free users are cheap because limits are low.
- Consider rate limits or caps on highest-cost features (humanize, summarizer, quiz) if costs spike.
