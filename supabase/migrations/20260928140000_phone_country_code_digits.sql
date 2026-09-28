-- Phones are now stored as digits with the country code and no "+" or
-- separators (e.g. 60123456789), matching what the sign-up and profile forms
-- write. This rewrites the free-text values saved before that ("+65 6123 4567",
-- "012-345 6789") into the same shape.
--
--  * uses the row's own country_code for the dial code (SG 65, MY 60, ID 62,
--    TH 66, VN 84, PH 63); rows in any other country are left alone
--  * a number that already carries "+" is only stripped to digits
--  * otherwise a leading trunk "0" is dropped (not for Singapore) and the dial
--    code is prepended
--  * a value that wouldn't come out as 8-15 digits is left untouched, so this
--    can never trip the employers phone check or lose data
--
-- Idempotent: values already in the new shape come out unchanged.

create or replace function pg_temp.normalize_phone(p_phone text, p_country text)
returns text
language plpgsql
immutable
as $$
declare
  v_dial text := case p_country
    when 'SG' then '65' when 'MY' then '60' when 'ID' then '62'
    when 'TH' then '66' when 'VN' then '84' when 'PH' then '63'
  end;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_out text;
begin
  if v_dial is null or v_digits = '' then
    return p_phone;
  end if;

  if p_phone ~ '^\s*\+' then
    v_out := v_digits;
  elsif v_digits like v_dial || '%' and length(v_digits) - length(v_dial) between 7 and 11 then
    v_out := v_digits;                     -- already country-coded, no "+"
  else
    if p_country <> 'SG' and v_digits like '0%' then
      v_digits := substr(v_digits, 2);
    end if;
    v_out := v_dial || v_digits;
  end if;

  if v_out !~ '^\d{8,15}$' then
    return p_phone;
  end if;
  return v_out;
end;
$$;

update public.employers
   set phone = pg_temp.normalize_phone(phone, country_code)
 where phone is not null
   and phone is distinct from pg_temp.normalize_phone(phone, country_code);

update public.candidates
   set contact_number = pg_temp.normalize_phone(contact_number, country_code)
 where contact_number is not null
   and contact_number is distinct from pg_temp.normalize_phone(contact_number, country_code);
