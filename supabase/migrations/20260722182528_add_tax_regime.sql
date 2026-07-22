alter table public.companies
  add column if not exists tax_regime text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'companies_tax_regime_check'
      and conrelid = 'public.companies'::regclass
  ) then
    alter table public.companies
      add constraint companies_tax_regime_check
      check (tax_regime is null or tax_regime in ('SIMPLES_NACIONAL', 'NAO_OPTANTE'));
  end if;
end $$;
