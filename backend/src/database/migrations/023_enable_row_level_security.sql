-- Migration 023: Enable Row Level Security (RLS) on all public tables
-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run
--
-- IMPORTANT: Your backend must use SUPABASE_SERVICE_ROLE_KEY (not anon key) for database operations.
-- The service role bypasses RLS. With RLS enabled and no permissive policies for anon,
-- direct PostgREST access via the anon key will be blocked.
--
-- Tables with existing policies (quiz_usage, quizzes): enabling RLS will activate those policies.
-- Tables without policies: RLS on + no policies = deny all for anon/authenticated (service role still has full access).

-- Enable RLS on all affected tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marketing_email_unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quiz_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.friend_share_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_login_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.study_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trial_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lesson_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.focus_mode_settings ENABLE ROW LEVEL SECURITY;

-- For tables that had "Policy Exists RLS Disabled" (quiz_usage, quizzes):
-- Their existing policies will now be enforced. If you get errors after this migration,
-- you may need to create policies. Example policy for user-scoped tables:
--
-- CREATE POLICY "Users can access own data" ON public.quizzes
--   FOR ALL USING (auth.uid() = user_id);
--
-- Since your backend uses service_role (which bypasses RLS), you typically don't need
-- permissive policies—RLS will block direct anon/authenticated access.
