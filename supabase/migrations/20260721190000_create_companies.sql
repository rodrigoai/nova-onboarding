create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  cnpj text not null unique,
  note_types text[] not null default '{}',
  municipal_registration text,
  state_registration text,
  certificate_url text,
  certificate_password text,
  service_cnae text,
  service_code text,
  service_iss numeric(7,4),
  service_ir numeric(7,4),
  service_pis numeric(7,4),
  service_cofins numeric(7,4),
  service_csll numeric(7,4),
  service_xml_url text,
  service_pdf_url text,
  product_cnae text,
  product_ncm text,
  product_ir numeric(7,4),
  product_pis numeric(7,4),
  product_cofins numeric(7,4),
  product_icms_rules jsonb,
  product_xml_url text,
  product_pdf_url text,
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_note_types_check
    check (note_types <@ array['SERVICE', 'PRODUCT']::text[] and cardinality(note_types) > 0)
);

create index if not exists companies_legal_name_idx on public.companies (legal_name);
create index if not exists companies_updated_at_idx on public.companies (updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
revoke all on table public.companies from anon;
grant select, insert, update, delete on table public.companies to authenticated;

drop policy if exists "Authenticated users can read companies" on public.companies;
create policy "Authenticated users can read companies"
on public.companies for select to authenticated using (true);

drop policy if exists "Authenticated users can create companies" on public.companies;
create policy "Authenticated users can create companies"
on public.companies for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update companies" on public.companies;
create policy "Authenticated users can update companies"
on public.companies for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete companies" on public.companies;
create policy "Authenticated users can delete companies"
on public.companies for delete to authenticated using (true);
