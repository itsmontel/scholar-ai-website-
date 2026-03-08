# Citation Search Feature - Limits and Recommendations

## Summary
This document provides recommendations for citation search limits across subscription tiers for WriteScholar.

## Current Implementation

### Citation Search Feature
- **Landing Page**: Users can now toggle between "Analyze Text" and "Find Citations" modes
- **Citation Styles Supported**: APA, MLA, Chicago, Harvard, IEEE, Vancouver
- **Functionality**: Users enter a research topic/essay question and receive 10 academic citations with:
  - Full citation in chosen format
  - In-text citation example
  - Brief summary of relevance
  - Abstract/description

### Current Subscription Limits (Analyses)
- **Free**: 3 analyses per month
- **Pro ($19.99/month)**: 999 analyses per month
- **Premium ($39.99/month)**: 999 analyses per month

## Recommended Citation Limits

### Option 1: Separate Citation Quota (RECOMMENDED)
Treat citations as a separate feature with its own limits:

#### **Free Tier**
- **2 citation searches per month** (5 citations each = 10 total citations)
- **Rationale**: 
  - Allows users to try the feature without being too restrictive
  - Low enough to encourage upgrades
  - Doesn't consume their document analysis quota
  - Typical student writes 2-3 papers per month

#### **Pro Tier ($19.99/month)**
- **Unlimited citation searches**
- **Rationale**:
  - Major value-add over free tier
  - Cost of API calls is low compared to subscription price
  - Students/researchers need frequent access to citations
  - Makes the paid tier significantly more attractive

#### **Premium Tier ($39.99/month)**
- **Unlimited citation searches** (same as Pro)
- **Additional Benefits**:
  - Priority processing for citations
  - Access to citation history/saved searches
  - Export citations in multiple formats
  - **Rationale**: Premium focuses on advanced analysis, support, and features

### Option 2: Combined Quota (Alternative)
Count citations against the same analysis quota:

#### **Free Tier**
- 3 total actions per month (mix of analyses OR citations)
- **Rationale**: Simpler to understand, but less flexible

#### **Paid Tiers**
- 999 total actions per month
- **Rationale**: Plenty of headroom for any reasonable use case

## Implementation Recommendations

### Backend Changes Required

1. **Add Citation Limits to `subscriptionService.js`**:
```javascript
const PLAN_LIMITS = {
  free: {
    documentsPerMonth: 3,
    analysesPerMonth: 3,
    citationSearchesPerMonth: 2,  // NEW
    citationsPerSearch: 5,         // NEW
    maxDocumentSize: 1024 * 1024,
    maxTotalStorage: 1024 * 1024,
    maxAnalysisPercentage: 50,
    name: 'Free'
  },
  pro: {
    documentsPerMonth: -1,
    analysesPerMonth: 999,
    citationSearchesPerMonth: -1,  // NEW (unlimited)
    citationsPerSearch: 10,        // NEW
    maxDocumentSize: 25 * 1024 * 1024,
    maxTotalStorage: 25 * 1024 * 1024,
    maxAnalysisPercentage: 100,
    name: 'Pro',
    price: 19.99
  },
  premium: {
    documentsPerMonth: -1,
    analysesPerMonth: 999,
    citationSearchesPerMonth: -1,  // NEW (unlimited)
    citationsPerSearch: 10,        // NEW
    maxDocumentSize: 100 * 1024 * 1024,
    maxTotalStorage: 100 * 1024 * 1024,
    maxAnalysisPercentage: 100,
    name: 'Premium',
    price: 39.99
  }
};
```

2. **Update Citation Search Endpoint** (`backend/src/routes/analysis.js`):
```javascript
// Add limit check before processing
const citationLimit = await checkLimit(req.user.id, 'citationSearchesPerMonth');
if (!citationLimit.allowed) {
  return res.status(403).json({
    success: false,
    message: `Citation search limit reached. You have ${citationLimit.remaining} searches remaining this month.`,
    upgrade: true,
    limit: citationLimit.limit,
    usage: citationLimit.usage
  });
}
```

3. **Track Citation Searches Separately**:
   - Create a `citation_searches` table (already exists from recent migration)
   - Count against citation limits, not analysis limits

### Frontend Updates

1. **Dashboard Usage Display**:
   - Add citation search counter to usage stats
   - Show "2/2 citation searches" for free users
   - Show "∞" for paid users

2. **Citation Search Page**:
   - Show remaining searches for free users
   - Display upgrade prompt when limit reached
   - Add "Upgrade to get unlimited citations" CTA

3. **Landing Page** (COMPLETED ✅):
   - Mode toggle between "Analyze Text" and "Find Citations"
   - Citation style selector
   - Different placeholder text based on mode
   - Prompts signup when submitting citations

## Cost Analysis

### API Costs (OpenAI GPT-4)
- **Per Citation Search**: ~$0.15 - $0.25 (10 citations with summaries)
- **Free Tier (2 searches/month)**: ~$0.50/user/month
- **Paid Tier (avg 20 searches/month)**: ~$4/user/month

### Revenue Impact
- **Free → Pro Conversion**: "Unlimited citations" is a strong motivator
- **Pro Value Prop**: $19.99/month for unlimited searches (vs $0.20/search elsewhere)
- **Break-even**: User needs ~10 citation searches to justify Pro tier cost

## Competitive Analysis

### Similar Services
- **Google Scholar**: Free but requires manual formatting
- **Citation Machine**: $9.95/month for unlimited
- **EasyBib Plus**: $9.95/month for unlimited
- **Zotero**: Free but no AI recommendations

### WriteScholar Advantage
- **AI-powered relevance**: Citations matched to research topic
- **Integrated with analysis**: One platform for writing + citations
- **Multiple styles**: Switch between citation formats easily
- **Summary included**: Understand relevance before reading

## Marketing Messaging

### Free Tier
> "Try citation search FREE with 2 searches per month. Get 5 relevant academic sources for your research papers."

### Paid Tier
> "Unlimited citation searches included! Never worry about finding the right sources for your research. Get 10 perfectly formatted citations for any topic, instantly."

### Upgrade Prompt
> "You've used all your free citation searches this month. Upgrade to Pro for unlimited access to our AI-powered citation finder and never run out of sources again!"

## Recommended Next Steps

1. ✅ **COMPLETED**: Add citation mode to landing page
2. ✅ **COMPLETED**: Update pricing display with citation limits
3. **TODO**: Implement backend citation limit tracking
4. **TODO**: Add citation counter to dashboard
5. **TODO**: Create upgrade prompts for free users
6. **TODO**: Update backend PLAN_LIMITS with citation quotas
7. **TODO**: Add citation usage tracking endpoint

## Final Recommendation

**Implement Option 1 (Separate Citation Quota)** with:
- **Free**: 2 citation searches/month (5 citations each)
- **Paid**: Unlimited citation searches (10 citations each)

This provides:
- Clear value proposition for paid tiers
- Low barrier to entry for free users to try the feature
- Strong upgrade incentive
- Sustainable economics (free users cost ~$0.50/month)
- Competitive positioning vs other citation tools


