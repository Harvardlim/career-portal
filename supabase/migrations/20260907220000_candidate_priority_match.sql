-- Priority Match (members-only): a subscribed candidate picks a preferred
-- category + subcategory, and the dashboard "Priority Match" tab surfaces the
-- active jobs that match. Stored on the candidate row; the existing
-- "Users can update their own candidate profile" policy covers writes.
-- Run in the Supabase SQL Editor, or via `supabase db push` once linked.

alter table public.candidates
  add column if not exists preferred_category text,
  add column if not exists preferred_subcategory text;
