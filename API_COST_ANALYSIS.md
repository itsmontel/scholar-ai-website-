# WriteScholar API Cost & Profit Margin Analysis

**Assumption:** User hits 100% of their limits each period (paid = billing period, free = rolling 30 days from signup).

**Pricing sources (OpenAI, per 1M tokens):**
- **gpt-4.1-nano** (humanize, summarize, quiz, flashcard, crossword, lessons): $0.10 input / $0.40 output
- **gpt-4o-mini** (essay analysis free/pro, citation search): $0.15 input / $0.60 output
- **gpt-5-mini** (essay analysis premium): $0.25 input / $2.00 output

**Token rule of thumb:** ~1.3 tokens per word (English).

---

## Per-Operation Cost Estimates

| Feature | Model | Est. Input Tokens | Est. Output Tokens | Cost/Op |
|---------|-------|-------------------|--------------------|---------|
| Citation search | gpt-4o-mini | 800 | 2,500 | $0.0016 |
| Essay analysis (free) | gpt-4o-mini | 6,500 | 4,000 | $0.0034 |
| Essay analysis (pro) | gpt-4o-mini | 7,500 | 6,000 | $0.0047 |
| Essay analysis (premium) | gpt-5-mini | 9,000 | 8,000 | $0.0183 |
| Humanize (per 1,000 words) | gpt-4.1-nano | 1,800 | 1,300 | $0.0007 |
| Summarize (per 1,000 words) | gpt-4.1-nano | 1,800 | 800 | $0.0005 |
| **Study pack** (quiz + flashcards + crossword + lesson + crater blast) | gpt-4.1-nano | ~18,000 | ~16,000 | ~$0.0089 |

*Study pack cost = quiz ($0.0020) + flashcards ($0.0012) + crossword ($0.0009) + lesson ($0.0028) + crater blast (~$0.0020).*

---

## Plan Limits (per period)

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Combined (analyses + study packs + citations) | 2 analyses, 2 study packs, 2 citations | 99 shared | 999 shared |
| Humanize words | 5,000 | 99,999 | 999,999 |
| Summarize words | 5,000 | 99,999 | 999,999 |

*One study pack = quiz + flashcards + crossword + lesson + crater blast (single generation). Pro/Premium share one pool for analyses, study packs & citations.*

---

## Max-Usage Cost per User per Period

### Free Plan ($0 revenue)

| Feature | Usage | Cost |
|---------|-------|------|
| Essay analyses | 2 | 2 × $0.0034 = $0.0068 |
| Citation searches | 2 | 2 × $0.0016 = $0.003 |
| Study packs | 2 | 2 × $0.0089 = $0.018 |
| Humanize | 5,000 words | 5 × $0.0007 = $0.004 |
| Summarize | 5,000 words | 5 × $0.0005 = $0.003 |
| **Total** | | **~$0.038** |

**Free user max cost: ~$0.03–0.04/month**

---

### Pro Plan ($19.99/month revenue)

| Feature | Usage | Cost |
|---------|-------|------|
| Combined pool (99 study packs)* | 99 | 99 × $0.0089 = $0.88 |
| Humanize | 99,999 words | 100 × $0.0007 = $0.07 |
| Summarize | 99,999 words | 100 × $0.0005 = $0.05 |
| **Total** | | **~$1.00** |

*Analyses, study packs & citations share one pool. Max cost = all 99 used on study packs (quiz + flashcards + crossword + lesson + crater blast per pack).*

**Pro user max cost: ~$1.00/month**  
**Pro profit margin: $19.99 − $1.00 ≈ $18.99 (~95%)**

---

### Premium Plan ($39.99/month revenue)

| Feature | Usage | Cost |
|---------|-------|------|
| Combined pool (999 analyses)* | 999 | 999 × $0.0183 = $18.27 |
| Humanize | 999,999 words | 1,000 × $0.0007 = $0.70 |
| Summarize | 999,999 words | 1,000 × $0.0005 = $0.50 |
| **Total** | | **~$19.47** |

*Analyses, study packs & citations share one pool. Max cost = all 999 used on analyses (gpt-5-mini at $0.0183 each). Study packs are $0.0089 each, so analyses drive worst-case cost.*

**Premium user max cost: ~$19.47/month**  
**Premium profit margin: $39.99 − $19.47 ≈ $20.52 (~51%)**

---

## Summary Table

| Plan | Revenue | Max API Cost | Profit | Margin |
|------|---------|--------------|--------|--------|
| **Free** | $0 | ~$0.03–0.04 | −$0.03 | (loss) |
| **Pro** | $19.99 | ~$1.00 | ~$18.99 | ~95% |
| **Premium** | $39.99 | ~$19.47 | ~$20.52 | ~51% |

---

## Notes

1. **Free users** cost ~$0.03–0.04 per period at max usage. This is the acquisition cost.
2. **Study packs** = one generation producing quiz + flashcards + crossword + lesson + crater blast. Pro/Premium share a combined pool of analyses, study packs & citations; max cost depends on how the pool is used (analyses cost more on Premium).
3. **Typical usage** is usually below limits, so real costs are often 20–50% of these max figures.
4. **Stripe fees** (~2.9% + $0.30 per transaction) reduce net revenue by ~$0.88 on Pro and ~$1.46 on Premium per month.
5. **Infrastructure** (hosting, Supabase, etc.) is not included in this analysis.
