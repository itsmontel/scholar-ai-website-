-- ============================================================
-- ADD content_html COLUMN FOR THE IN-APP RICH-TEXT EDITOR
-- ============================================================
--
-- Run once in Supabase → SQL editor.
--
-- Adds a nullable TEXT column to the `documents` table so the
-- new TipTap-based editor can persist its HTML output without
-- clobbering the existing plain-text `content_text` (which the
-- AI analyzer still consumes).
--
-- We keep BOTH columns:
--   • content_text — plain text fed to the analyzer + downstream
--     services. Mirrors the editor's `getText()` output.
--   • content_html — the editor's `getHTML()` output. Restored
--     verbatim on document open so formatting is preserved.
--
-- IDEMPOTENT: re-running this script is safe — IF NOT EXISTS
-- guards prevent duplicate columns.
-- ============================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS content_html TEXT;

-- Track when the editor last persisted a save, separately from
-- the upload timestamp. Lets the front-end show "Saved 2 minutes
-- ago" without conflating uploads vs. in-editor edits.
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- Backfill last_edited_at for existing rows so the new column
-- has a sensible default for any document that already exists.
UPDATE documents
SET last_edited_at = COALESCE(updated_at, created_at)
WHERE last_edited_at IS NULL;

COMMENT ON COLUMN documents.content_html IS
  'Rich-text HTML payload from the in-app editor (TipTap). NULL for documents that have never been opened in the editor.';

COMMENT ON COLUMN documents.last_edited_at IS
  'Timestamp of the most recent save from the in-app editor. Distinct from updated_at, which also moves on metadata changes (title, etc.).';
