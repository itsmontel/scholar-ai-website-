-- Migration 024: Fix Security Advisor warnings
-- 1. Drop RLS policies that use USING (true) / WITH CHECK (true) (allows unrestricted access)
-- 2. Set search_path on functions to prevent search path exploitation
--
-- Run in Supabase: Dashboard → SQL Editor → New query → paste and Run

-- =============================================================================
-- PART 1: Drop overly permissive RLS policies (RLS Policy Always True)
-- =============================================================================
-- With RLS enabled and these policies removed, anon/authenticated get no access.
-- Your backend uses service_role which bypasses RLS, so it continues to work.

DROP POLICY IF EXISTS "Allow service role full access to citation_searches" ON public.citation_searches;
DROP POLICY IF EXISTS "Service role full access to humanize_usage" ON public.humanize_usage;

-- quiz_usage, quizzes, summarize_usage - drop common permissive policy names
DROP POLICY IF EXISTS "Allow service role full access to quiz_usage" ON public.quiz_usage;
DROP POLICY IF EXISTS "Service role full access to quiz_usage" ON public.quiz_usage;
DROP POLICY IF EXISTS "Enable full access for quiz_usage" ON public.quiz_usage;

DROP POLICY IF EXISTS "Allow service role full access to quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Service role full access to quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Enable full access for quizzes" ON public.quizzes;

DROP POLICY IF EXISTS "Allow service role full access to summarize_usage" ON public.summarize_usage;
DROP POLICY IF EXISTS "Service role full access to summarize_usage" ON public.summarize_usage;
DROP POLICY IF EXISTS "Enable full access for summarize_usage" ON public.summarize_usage;

-- Fallback: Drop any remaining permissive policies on these tables
-- (catches policies with non-standard names, e.g. from Supabase UI)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('citation_searches','humanize_usage','quiz_usage','quizzes','summarize_usage')
    AND (qual::text ILIKE '%true%' OR with_check::text ILIKE '%true%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
  END LOOP;
END $$;

-- =============================================================================
-- PART 2: Fix Function Search Path Mutable (security best practice)
-- =============================================================================

ALTER FUNCTION public.generate_friend_code() SET search_path TO public, pg_temp;
ALTER FUNCTION public.set_friend_code() SET search_path TO public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path TO public, pg_temp;
