# WriteScholar Flyer Pack

4 print-ready HTML flyers for campus distribution. Each is sized for US Letter
(8.5" × 11"), uses WriteScholar brand colors, and has a UTM-tagged QR code so
you can track which design drives the most traffic.

## How to use

### Print directly
1. Open any `.html` file in a browser (double-click)
2. Press **⌘+P** (Mac) or **Ctrl+P** (Windows)
3. In print options:
   - Paper size: **US Letter**
   - Margins: **None**
   - Background graphics: **enabled** (important — otherwise colors won't print)
   - Scale: **100%**
4. Print or "Save as PDF"

### Bulk print (~$15 for 100 flyers)
Save each as PDF, then upload to:
- **VistaPrint** (cheapest, slow shipping)
- **FedEx Office** / **Staples** (same-day pickup)
- **Local print shop** (cheapest if you have one nearby)

Recommended: print on **80lb glossy** for the brand colors to pop. Bulk
flyer prints cost roughly $0.10-0.15 each at scale.

## The 4 designs

| # | Filename | Angle | Best for |
|---|---|---|---|
| 1 | `01-grades-b-to-a.html` | "Turn your grades from B → A" | General campus distribution. Universal hook. |
| 2 | `02-free-essay-grader.html` | Massive "FREE" treatment | Pre-essay-deadline. Library/dorm areas. |
| 3 | `03-quizlet-alternative.html` | Comparison table vs Quizlet+ | Where you see Quizlet posters. Specific objection. |
| 4 | `04-exam-week-survival.html` | "Exam Week Survival Kit" checklist | Mid-terms / finals season. Library, study halls. |

## Where to put them

Highest-traffic spots on campus (in order):
1. **Library bulletin boards** (especially the entrance/exit ones)
2. **Coffee shops** (campus-adjacent ones)
3. **Student union notice boards**
4. **Dorm common-area boards**
5. **Department announcement boards** (the ones outside major lecture halls)
6. **Bathrooms** (controversial but high read-rate — flyers in stalls get scanned)

**Always ask permission first.** Most schools have specific bulletin board
rules. Posting in the wrong spot can get your flyer ripped down within
hours, wasting the whole batch.

## QR code tracking

Each flyer's QR code uses a unique UTM campaign tag so you can see which
design works best in Google Analytics:

| Flyer | UTM campaign |
|---|---|
| Grades B → A | `grades_b_to_a` |
| Free essay grader | `free_grader` |
| Quizlet alternative | `quizlet_alt` |
| Exam week | `exam_week` |

In GA4: Reports → Acquisition → Traffic Acquisition → Filter by `utm_source =
flyer`. You'll see scans, signups, and conversion rate per design.

## Customization tips

The flyers are plain HTML/CSS files — anyone can edit them in a text editor.
Common tweaks:

- **Change the discount code** (currently `MAY2026` 50% off in flyer 1):
  search for `MAY2026` and replace with your current code.
- **Change the URL** in the QR code if you want to drive to a specific
  landing page (e.g. `/tools/analyze` instead of homepage).
- **Add a name + email** at the bottom (search for "writescholar.com" — the
  CTA spot is easy to swap).
- **Different size** — change `@page { size: letter; }` to
  `@page { size: A4; }` for European print, or `@page { size: 5.5in 8.5in; }`
  for half-page handouts.

## Print run plan (suggested)

For a single campus, week 1:
- 25 × Flyer 1 (general hook) — main bulletin boards
- 30 × Flyer 2 (free grader) — library + coffee shops near deadline season
- 25 × Flyer 3 (Quizlet alt) — wherever you see Quizlet ads/posters
- 25 × Flyer 4 (exam week) — only during midterm/finals weeks

Total: ~105 flyers. Cost: ~$10-15. Expected scans: 30-100 (3-10% scan rate
on physical flyers is realistic). Expected signups: 5-20.

If one design clearly outperforms in tracking, double down on it.
