-- Expertise Field (candidates) and Field (employers) become multi-select,
-- sourced from the shared categories list instead of a single free choice.

alter table public.candidates
  alter column expertise_field type text[] using array[expertise_field],
  alter column expertise_field set default '{}';

alter table public.employers
  alter column field type text[] using array[field],
  alter column field set default '{}';
