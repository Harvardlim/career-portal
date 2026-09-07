-- Link candidate/employer registrations to a real Supabase Auth account, so
-- Sign In can authenticate and look up which role the account has.
--
-- Registration creates the auth account (via supabase.auth.signUp) and
-- inserts the profile row right away, tagged with that user's id -- without
-- waiting for email confirmation, so registration never blocks on it. Insert
-- stays open like before; only reading a profile back is restricted to its
-- owner, which is what powers the Sign In role lookup.

alter table public.candidates
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.employers
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create policy "Users can read their own candidate profile"
  on public.candidates
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own employer profile"
  on public.employers
  for select
  to authenticated
  using (auth.uid() = user_id);
