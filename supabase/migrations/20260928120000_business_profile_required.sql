-- Business profile must carry real contact + description data, enforced in the
-- database as well as the forms (the forms can be bypassed by calling the API).
--
--  * business_email must be on the company's own domain -- consumer mailboxes
--    (Gmail, Yahoo, Outlook, ...) are refused
--  * phone is required and must look like a phone number (8-15 digits, optional
--    leading +, common separators only)
--  * registration number cannot be blank
--  * business_details and (once set) about must have real content
--
-- Each rule only fires when that column is being written, so an unrelated update
-- (verification flags, suspension, ...) on a legacy row that predates the rule
-- is never blocked. The free-mail list mirrors FREE_EMAIL_DOMAINS in
-- web/src/lib/partly.ts; keep the two in sync.

create or replace function public.is_free_email_domain(p_email text)
returns boolean
language sql
immutable
as $$
  select
    split_part(lower(trim(coalesce(p_email, ''))), '@', 2) = any (array[
      'gmail.com', 'googlemail.com', 'icloud.com', 'me.com', 'mac.com', 'msn.com', 'live.com',
      'aol.com', 'proton.me', 'protonmail.com', 'pm.me', 'mail.com', 'zohomail.com', 'yandex.com',
      'yandex.ru', 'mail.ru', 'qq.com', '163.com', '126.com', 'sina.com', 'naver.com', 'daum.net',
      'hanmail.net', 'inbox.com', 'tutanota.com', 'tuta.io', 'rediffmail.com', 'ymail.com',
      'rocketmail.com', 'gmx.com', 'gmx.net', 'gmx.de'
    ])
    or split_part(split_part(lower(trim(coalesce(p_email, ''))), '@', 2), '.', 1)
       = any (array['yahoo', 'hotmail', 'outlook', 'live', 'gmx']);
$$;

create or replace function public.is_valid_phone(p_phone text)
returns boolean
language sql
immutable
as $$
  select p_phone is not null
    and trim(p_phone) ~ '^\+?[0-9(][0-9[:space:]().-]*$'
    and trim(p_phone) !~ '[[:space:].-]{2,}'
    and trim(p_phone) !~ '[[:space:].-]$'
    and length(regexp_replace(p_phone, '\D', '', 'g')) between 8 and 15;
$$;

create or replace function public.employers_require_profile()
returns trigger
language plpgsql
as $$
declare
  v_min constant integer := 20;
begin
  if tg_op = 'INSERT' or new.business_email is distinct from old.business_email then
    if public.is_free_email_domain(new.business_email) then
      raise exception 'Please use your business email on your company domain — free mailboxes such as Gmail are not accepted.'
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'INSERT' or new.phone is distinct from old.phone then
    if not public.is_valid_phone(new.phone) then
      raise exception 'Enter a valid business phone number with country code, e.g. +65 6123 4567.'
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'INSERT' or new.reg_no is distinct from old.reg_no then
    if coalesce(trim(new.reg_no), '') = '' then
      raise exception 'Enter your business registration number.'
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'INSERT' or new.business_details is distinct from old.business_details then
    if length(trim(coalesce(new.business_details, ''))) < v_min then
      raise exception 'Tell us about your business — at least % characters.', v_min
        using errcode = 'check_violation';
    end if;
  end if;

  -- "About us" is rich text: judge it on the words, not the markup.
  if tg_op = 'UPDATE' and new.about is distinct from old.about then
    if length(trim(regexp_replace(replace(coalesce(new.about, ''), '&nbsp;', ' '), '<[^>]*>', ' ', 'g'))) < v_min then
      raise exception 'About us needs at least % characters.', v_min
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists employers_require_profile on public.employers;
create trigger employers_require_profile
  before insert or update of business_email, phone, reg_no, business_details, about
  on public.employers
  for each row execute function public.employers_require_profile();
