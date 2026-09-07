-- Backoffice taxonomy: categories with nested subcategories.
-- Run this in the Supabase SQL Editor, or via `supabase db push` once the
-- project is linked.
--
-- Auth for the backoffice isn't wired up yet, so the policies below allow the
-- anon/publishable key to read and write. Tighten these to an authenticated
-- staff role once backoffice sign-in exists.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint categories_name_key unique (name),
  constraint categories_slug_key unique (slug)
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint subcategories_category_name_key unique (category_id, name)
);

create index if not exists subcategories_category_id_idx
  on public.subcategories (category_id);

alter table public.categories enable row level security;
alter table public.subcategories enable row level security;

create policy "Staff can read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Staff can write categories"
  on public.categories for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "Staff can read subcategories"
  on public.subcategories for select
  to anon, authenticated
  using (true);

create policy "Staff can write subcategories"
  on public.subcategories for all
  to anon, authenticated
  using (true)
  with check (true);
