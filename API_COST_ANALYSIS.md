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
| Quiz generation | gpt-4.1-nano | 4,000 | 4,000 | $0.0020 |
| Flashcard generation | gpt-4.1-nano | 3,500 | 2,000 | $0.0012 |
| Crossword generation | gpt-4.1-nano | 2,500 | 1,200 | $0.0009 |
| Lesson generation | gpt-4.1-nano | 4,000 | 6,000 | $0.0028 |

---

## Plan Limits (per period)

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Citation searches | 2 | 99 | 199 |
| Essay analyses | 3 | 99 | 199 |
| Humanize words | 5,000 | 99,999 | 999,999 |
| Summarize words | 5,000 | 99,999 | 999,999 |
| Quiz generations | 3 | 99 | 199 |
| Lesson generations | 3 | 99 | 199 |
| Flashcards + crosswords | (shares quiz pool) | (shares) | (shares) |

---

## Max-Usage Cost per User per Period

### Free Plan ($0 revenue)

| Feature | Usage | Cost |
|---------|-------|------|
| Citation searches | 2 | 2 × $0.0016 = $0.003 |
| Essay analyses | 3 | 3 × $0.0034 = $0.010 |
| Humanize | 5,000 words | 5 × $0.0007 = $0.004 |
| Summarize | 5,000 words | 5 × $0.0005 = $0.003 |
| Quiz | 3 | 3 × $0.0020 = $0.006 |
| Lessons | 3 | 3 × $0.0028 = $0.008 |
| **Total** | | **~$0.034** |

**Free user max cost: ~$0.03–0.04/month**

---

### Pro Plan ($19.99/month revenue)

| Feature | Usage | Cost |
|---------|-------|------|
| Citation searches | 99 | 99 × $0.0016 = $0.16 |
| Essay analyses | 99 | 99 × $0.0047 = $0.47 |
| Humanize | 99,999 words | 100 × $0.0007 = $0.07 |
| Summarize | 99,999 words | 100 × $0.0005 = $0.05 |
| Quiz | 99 | 99 × $0.0020 = $0.20 |
| Lessons | 99 | 99 × $0.0028 = $0.28 |
| **Total** | | **~$1.18** |

**Pro user max cost: ~$1.18/month**  
**Pro profit margin: $19.99 − $1.18 ≈ $18.81 (~94%)**

---

### Premium Plan ($39.99/month revenue)

| Feature | Usage | Cost |
|---------|-------|------|
| Citation searches | 199 | 199 × $0.0016 = $0.32 |
| Essay analyses | 199 | 199 × $0.0183 = $3.64 |
| Humanize | 999,999 words | 1,000 × $0.0007 = $0.70 |
| Summarize | 999,999 words | 1,000 × $0.0005 = $0.50 |
| Quiz | 199 | 199 × $0.0020 = $0.40 |
| Lessons | 199 | 199 × $0.0028 = $0.56 |
| **Total** | | **~$6.12** |

**Premium user max cost: ~$6.12/month**  
**Premium profit margin: $39.99 − $6.12 ≈ $33.87 (~85%)**

---

## Summary Table

| Plan | Revenue | Max API Cost | Profit | Margin |
|------|---------|--------------|--------|--------|
| **Free** | $0 | ~$0.03–0.04 | −$0.03 | (loss) |
| **Pro** | $19.99 | ~$1.18 | ~$18.81 | ~94% |
| **Premium** | $39.99 | ~$6.12 | ~$33.87 | ~85% |

---

## Notes

1. **Free users** cost ~$0.03–0.04 per period at max usage. This is the acquisition cost.
2. **Pro** and **Premium** margins stay high even at full usage because:
   - Humanize/summarize use gpt-4.1-nano
   - Only essay analysis uses the more expensive models
   - Premium essay analysis (gpt-5-mini) is the main cost driver
3. **Typical usage** is usually below limits, so real costs are often 20–50% of these max figures.
4. **Stripe fees** (~2.9% + $0.30 per transaction) reduce net revenue by ~$0.88 on Pro and ~$1.46 on Premium per month.
5. **Infrastructure** (hosting, Supabase, etc.) is not included in this analysis.
