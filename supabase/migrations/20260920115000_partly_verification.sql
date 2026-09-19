-- Verification tiers, built extensible rather than hard-coded.
--
--   Base tier   -- identity-verified: an Expert's local ID (last 5 digits) and a
--                  Business's registration number, each backed by an uploaded
--                  document an admin approves by hand.
--   Paid tier   -- an Expert's optional annual "Verified" badge, which buys
--                  priority in the match ranking.
--
-- The Expert's ID digits are collected but NEVER displayed back to either party.
-- They are encrypted in the edge function (AES-GCM, key in STRIPE-style env
-- secret, never in the database) and only the ciphertext lands here; SELECT on
-- that column is revoked from both client roles so even a leaked anon key can't
-- read it. Phase 3's OCR automation replaces the manual approval step, not this
-- storage model.

-- 1. Expert (candidate) identity + badge state.
alter table public.candidates
  add column if not exists country_code text,              -- SEA market, drives pricing
  add column if not exists id_type text,                   -- 'NRIC' | 'MyKad' | 'KTP' | 'CCCD' | ...
  add column if not exists id_last5_cipher text,           -- AES-GCM ciphertext, never displayed
  add column if not exists id_last5_key_version integer,
  add column if not exists identity_verified boolean not null default false,
  add column if not exists identity_verified_at timestamptz,
  add column if not exists identity_verified_by uuid,
  add column if not exists linkedin_url text,
  add column if not exists headline text,
  add column if not exists portfolio_links jsonb not null default '[]'::jsonb,
  add column if not exists public_slug text,
  add column if not exists verified_badge_until timestamptz;

create unique index if not exists candidates_public_slug_key
  on public.candidates (public_slug) where public_slug is not null;
create index if not exists candidates_country_code_idx on public.candidates (country_code);

revoke select (id_last5_cipher, id_last5_key_version) on public.candidates from anon, authenticated;

-- 2. Business (employer) registration verification.
alter table public.employers
  add column if not exists country_code text,              -- businesses may be from anywhere
  add column if not exists registration_verified boolean not null default false,
  add column if not exists registration_verified_at timestamptz,
  add column if not exists registration_verified_by uuid;

-- 3. Uploaded proof documents, reviewed by an admin in the backoffice.
create table if not exists public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  owner_kind text not null,                                -- 'candidate' | 'employer'
  owner_id uuid not null,
  user_id uuid references auth.users (id) on delete cascade,
  doc_type text not null,                                  -- 'identity' | 'business_registration' | 'credential'
  doc_path text not null,                                  -- storage object path
  status text not null default 'pending',                  -- 'pending' | 'approved' | 'rejected'
  notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists verification_documents_owner_idx
  on public.verification_documents (owner_kind, owner_id);
create index if not exists verification_documents_status_idx
  on public.verification_documents (status);

alter table public.verification_documents enable row level security;

drop policy if exists "Users manage their own verification documents" on public.verification_documents;
create policy "Users manage their own verification documents"
  on public.verification_documents for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Staff review verification documents" on public.verification_documents;
create policy "Staff review verification documents"
  on public.verification_documents for all
  to anon
  using (true)
  with check (true);

-- Private bucket: documents are uploaded by their owner and read only through a
-- signed URL the backoffice mints with the service role.
insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

drop policy if exists "Users upload their own verification documents" on storage.objects;
create policy "Users upload their own verification documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'verification-docs');

-- 4. The paid annual badge. One row per term, chained through renewed_from so a
--    renewal keeps its own purchase record (the affiliate earns on each one).
create table if not exists public.verified_badges (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  status text not null default 'pending',                  -- 'pending'|'active'|'superseded'|'expired'|'cancelled'
  country_code text references public.pricing_countries (code),
  currency text not null,
  amount_local numeric(14, 2) not null,
  amount_usd numeric(10, 2) not null,
  pay_currency text not null default 'local',              -- 'local' | 'usd'
  stripe_session_id text,
  stripe_payment_intent text,
  renewed_from uuid references public.verified_badges (id) on delete set null,
  purchased_at timestamptz,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists verified_badges_candidate_id_idx
  on public.verified_badges (candidate_id);
create index if not exists verified_badges_expiry_idx
  on public.verified_badges (expires_at) where status = 'active';

alter table public.verified_badges enable row level security;

drop policy if exists "Experts read their own badge" on public.verified_badges;
create policy "Experts read their own badge"
  on public.verified_badges for select
  to authenticated
  using (
    candidate_id in (select id from public.candidates where user_id = auth.uid())
  );

drop policy if exists "Staff read badges" on public.verified_badges;
create policy "Staff read badges"
  on public.verified_badges for select
  to anon
  using (true);

-- Renewal reminders fire at 30, 14, 7 and 1 days out; one row per (badge, mark)
-- keeps a re-run from sending twice.
create table if not exists public.badge_renewal_reminders (
  badge_id uuid not null references public.verified_badges (id) on delete cascade,
  days_before integer not null,
  sent_at timestamptz not null default now(),
  primary key (badge_id, days_before)
);

alter table public.badge_renewal_reminders enable row level security;

-- 5. Admin actions (backoffice reaches these through the anon key, like the
--    existing admin_* RPCs).
create or replace function public.admin_review_verification(
  p_document_id uuid,
  p_approve boolean,
  p_admin_id uuid,
  p_notes text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.verification_documents;
  v_user uuid;
begin
  select * into v_doc from public.verification_documents where id = p_document_id;
  if not found then
    raise exception 'verification document not found';
  end if;

  update public.verification_documents
     set status = case when p_approve then 'approved' else 'rejected' end,
         notes = p_notes,
         reviewed_by = p_admin_id,
         reviewed_at = now()
   where id = p_document_id;

  if v_doc.owner_kind = 'candidate' then
    update public.candidates
       set identity_verified = p_approve,
           identity_verified_at = case when p_approve then now() else null end,
           identity_verified_by = p_admin_id
     where id = v_doc.owner_id
    returning user_id into v_user;
  else
    update public.employers
       set registration_verified = p_approve,
           registration_verified_at = case when p_approve then now() else null end,
           registration_verified_by = p_admin_id
     where id = v_doc.owner_id
    returning user_id into v_user;
  end if;

  perform public.notify_user(
    v_user,
    case when p_approve then 'verification_approved' else 'verification_rejected' end,
    case when p_approve then 'You are verified' else 'Verification needs attention' end,
    case when p_approve
      then 'Your document was approved. Your profile now carries the verified mark.'
      else coalesce(p_notes, 'We could not verify the document you uploaded. Please upload a clearer copy.')
    end,
    '/dashboard/verification'
  );
end;
$$;

grant execute on function public.admin_review_verification(uuid, boolean, uuid, text) to anon, authenticated;
