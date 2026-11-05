-- ============================================================
-- FUNNEL EVENTS
-- ============================================================
--
-- Run once in Supabase → SQL Editor. IDEMPOTENT.
--
-- The site's own record of the conversion funnel, written by
-- POST /api/events (backend/src/routes/events.js). PostHog was wired
-- but never had a key in production, so until now there was no way to
-- see where people drop. Rows are small and append-only.
--
-- anon_id is a random id the browser keeps in localStorage so the
-- steps before sign-up (landing view, essay pasted) join up with the
-- account that follows.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id          BIGSERIAL PRIMARY KEY,
  event       VARCHAR(64) NOT NULL,
  user_id     UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  anon_id     VARCHAR(64) NULL,
  path        VARCHAR(255) NULL,
  props       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_event_created ON public.funnel_events (event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_events_user ON public.funnel_events (user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_anon ON public.funnel_events (anon_id);

-- Funnel for the last 30 days, one row per step:
--
--   SELECT event, COUNT(DISTINCT COALESCE(user_id::text, anon_id)) AS people
--   FROM funnel_events
--   WHERE created_at > NOW() - INTERVAL '30 days'
--   GROUP BY event
--   ORDER BY CASE event
--     WHEN 'landing_view' THEN 1 WHEN 'essay_pasted' THEN 2 WHEN 'gate_view' THEN 3
--     WHEN 'signed_up' THEN 4 WHEN 'grade_started' THEN 5 WHEN 'grade_completed' THEN 6
--     WHEN 'paywall_view' THEN 7 WHEN 'checkout_started' THEN 8 WHEN 'subscription_converted' THEN 9
--     ELSE 99 END;
--
-- Free grades per hour today (abuse check):
--
--   SELECT date_trunc('hour', created_at) AS hour, COUNT(*)
--   FROM funnel_events
--   WHERE event = 'grade_completed' AND created_at > NOW() - INTERVAL '1 day'
--   GROUP BY 1 ORDER BY 1;
