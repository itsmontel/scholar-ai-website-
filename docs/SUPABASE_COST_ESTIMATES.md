# Supabase cost estimates for WriteScholar (realistic)

Based on your current schema and Supabase’s **published quotas** (as of 2025). Overage **per‑MAU** and **per‑GB** rates are not fully public; ranges below use typical usage and common overage ballparks. Always confirm on [Supabase Pricing](https://supabase.com/pricing) and in the dashboard.

---

## Supabase quotas (summary)

| Item | Free | Pro ($25/mo) |
|------|------|----------------|
| **Monthly Active Users (Auth MAU)** | 50,000 | 100,000 included, then overage |
| **Database size** | 500 MB **per project** | 8 GB included, then overage |
| **Storage (files)** | 1 GB | 100 GB included |
| **Egress** | 5 GB | 250 GB included |
| **Edge function invocations** | 500K | 2M included |
| **Realtime** | 2M messages, 200 peak connections | 5M messages, 500 peak |

Notes:

- **MAU** = distinct users who **sign in or refresh token** in the billing month (Supabase Auth).
- **Free** projects can **pause after 7 days** of inactivity.
- **Pro** includes daily backups, no auto-pause, and email support.

---

## Your app’s database use (from your SQL)

You have many tables that store JSONB and grow with usage:

- `users`, `subscriptions`, `documents` (metadata), `document_analyses` (JSONB), `quizzes` (JSONB), `lesson_plans` (JSONB), `citation_searches` (JSONB), `friends`, `notifications`, `usage_tracking`, `quiz_usage`, `lesson_usage`, `humanize_usage`, `study_events`, etc.

Rough ballpark **per active user** (if they use analyses, quizzes, lessons, citations):

- **Light:** ~50–200 KB (mostly auth + a few rows).
- **Medium:** ~200 KB–1 MB (some analyses, quizzes, lessons).
- **Heavy:** ~1–3 MB (lots of analyses, quizzes, lessons, citations).

So **database size** is driven more by **usage per user** than by MAU alone. The **500 MB Free** limit is the first hard cap.

---

## Realistic scenarios

### 1. Free plan ($0/month)

- **MAU limit:** Up to **50,000** Auth MAU (you’re not limited by MAU on Free).
- **Binding limit:** **500 MB database** per project.

Realistic **practical** caps on Free:

- If most users are **light** (sign up, few analyses/quizzes): you can reach **tens of thousands** of MAU before hitting 500 MB; **5K–15K MAU** is a safe range to stay under 500 MB with mixed use.
- If many users are **medium/heavy** (lots of quizzes, lessons, analyses): **~500–2,000 MAU** can already push you near or over 500 MB.

So on **Free**:

- **Conservative (safe):** **~1,000–3,000 MAU** (assumes meaningful usage per user).
- **Optimistic (light usage):** **~5,000–15,000 MAU** (many sign up, few heavy features).
- **Theoretical max:** 50,000 MAU, but only if DB stays under 500 MB (unlikely if usage is high).

**Cost:** **$0** (until you hit limits or get paused).

---

### 2. Pro $25/month – 10,000 MAU

- **MAU:** 10K is well under the 100K included.
- **Database:** 10K users × ~0.1–0.5 MB (mixed) ⇒ **~1–5 GB**. Pro includes **8 GB**, so you’re **within included**.
- **Egress/storage:** Usually within Pro included amounts at this size.

**Estimated Supabase cost:** **~$25–35/month** (base $25 + possible small overages or none).

---

### 3. Pro $25/month – 50,000 MAU

- **MAU:** 50K still under 100K included.
- **Database:** 50K × ~0.1–0.3 MB (mixed) ⇒ **~5–15 GB**. You may exceed the **8 GB** included; overage is billed per GB (exact rate on pricing page).
- **Egress:** Can grow; 250 GB included.

**Estimated Supabase cost:** **~$25–55/month** (base $25 + possible database/egress overage). Many apps in this range report **~$35–55** total.

---

### 4. Pro $25/month – 100,000 MAU

- **MAU:** At the **100K** included limit; no MAU overage if you stay at or below 100K.
- **Database:** 100K × ~0.1–0.2 MB ⇒ **~10–20 GB**. Likely **over 8 GB** ⇒ overage for the extra GB.
- **Egress:** Likely higher; 250 GB may still be enough depending on API usage.

**Estimated Supabase cost:** **~$25–75/month** (base $25 + database overage; egress could add more). Common range cited for “high traffic” Pro apps is **~$50–100** when including all usage.

---

### 5. Beyond 100,000 MAU (e.g. 150K or 200K MAU)

- **MAU overage:** You pay for MAU **above** 100K (per‑MAU price on Supabase pricing/invoice).
- **Database:** Continues to grow; more DB overage.
- **Options:** Stay on Pro and pay overages, or move to **Team / Enterprise** for custom quotas.

**Estimated Supabase cost (e.g. 150K MAU):** often in the **~$75–150/month** range (Pro + MAU + DB + egress). Exact numbers depend on Supabase’s current per‑MAU and per‑GB rates.

---

## Summary table (your question)

| Scenario | Plan | Est. Supabase cost (monthly) | Notes |
|---------|------|------------------------------|--------|
| **Free, low usage** | Free | **$0** | ~1K–5K MAU; watch 500 MB DB. |
| **Free, max MAU** | Free | **$0** | Up to 50K MAU only if DB &lt; 500 MB (tight for heavy use). |
| **10,000 MAU** | Pro | **~$25–35** | Within Pro included MAU and typically within 8 GB DB. |
| **50,000 MAU** | Pro | **~$25–55** | Often **~$35–55**; DB may exceed 8 GB. |
| **100,000 MAU** | Pro | **~$25–75** | At MAU cap; DB overage likely; **~$50–75** common. |
| **&gt;100K MAU** | Pro + overage or Team | **~$75–150+** | MAU + DB + egress overages. |

---

## Recommendations

1. **Stay on Free** until you’re close to **500 MB database** or need no auto-pause/backups; then move to **Pro**.
2. **Monitor in Supabase:** **Database size** and **MAU** (Auth) in the dashboard; set alerts as you approach 500 MB (Free) or 8 GB (Pro).
3. **Control DB growth:** Retention/archiving for old `document_analyses`, `quizzes`, `lesson_plans`, `citation_searches` (e.g. expire or aggregate) to keep size predictable.
4. **Confirm numbers:** Check [Supabase Pricing](https://supabase.com/pricing) and the **Usage** section of your project for current quotas and overage rates; they can change.

*Doc generated from your schema and Supabase’s published billing docs. Overage $/MAU and $/GB are not fully disclosed in public docs; estimates are indicative.*
