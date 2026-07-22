create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  tenant_name text not null unique,
  nova_money_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_tenant_name_check
    check (tenant_name ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists tenants_updated_at_idx on public.tenants (updated_at desc);

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

alter table public.tenants enable row level security;
revoke all on table public.tenants from anon;
grant select, insert, update, delete on table public.tenants to authenticated;

drop policy if exists "Authenticated users can read tenants" on public.tenants;
create policy "Authenticated users can read tenants"
on public.tenants for select to authenticated using (true);

drop policy if exists "Authenticated users can create tenants" on public.tenants;
create policy "Authenticated users can create tenants"
on public.tenants for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update tenants" on public.tenants;
create policy "Authenticated users can update tenants"
on public.tenants for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete tenants" on public.tenants;
create policy "Authenticated users can delete tenants"
on public.tenants for delete to authenticated using (true);

alter table public.companies add column if not exists tenant_id uuid;

do $$
declare
  bootstrap_tenant_id uuid;
begin
  if exists (select 1 from public.companies where tenant_id is null) then
    insert into public.tenants (tenant_name, nova_money_key)
    values ('legacy', 'legacy:configure')
    on conflict (tenant_name) do update set tenant_name = excluded.tenant_name
    returning id into bootstrap_tenant_id;

    update public.companies
    set tenant_id = bootstrap_tenant_id
    where tenant_id is null;
  end if;
end $$;

alter table public.companies alter column tenant_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'companies_tenant_id_fkey'
      and conrelid = 'public.companies'::regclass
  ) then
    alter table public.companies
      add constraint companies_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id) on delete restrict;
  end if;
end $$;

create index if not exists companies_tenant_id_idx on public.companies (tenant_id);
