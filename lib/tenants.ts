import { createClient } from "@/lib/supabase/server";

export type Tenant = {
  id: string;
  tenantName: string;
  novaMoneyKey: string;
  companyCount: number;
  createdAt: string;
  updatedAt: string;
};

type TenantRow = {
  id: string;
  tenant_name: string;
  nova_money_key: string;
  companies?: { count: number }[];
  created_at: string;
  updated_at: string;
};

export type TenantWrite = Pick<Tenant, "tenantName" | "novaMoneyKey">;

function fromRow(row: TenantRow): Tenant {
  return {
    id: row.id,
    tenantName: row.tenant_name,
    novaMoneyKey: row.nova_money_key,
    companyCount: row.companies?.[0]?.count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function throwIfError(error: { message: string; code?: string } | null) {
  if (error) {
    const failure = new Error(error.message);
    Object.assign(failure, { code: error.code });
    throw failure;
  }
}

export async function listTenants(query = "") {
  const supabase = await createClient();
  let request = supabase
    .from("tenants")
    .select("*, companies(count)")
    .order("updated_at", { ascending: false });
  const safeQuery = query.replace(/[,().]/g, " ").trim();
  if (safeQuery) request = request.ilike("tenant_name", `%${safeQuery}%`);
  const { data, error } = await request;
  throwIfError(error);
  return ((data ?? []) as TenantRow[]).map(fromRow);
}

export async function getTenant(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("*, companies(count)")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data ? fromRow(data as TenantRow) : null;
}

export async function createTenantRecord(tenant: TenantWrite) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .insert({ tenant_name: tenant.tenantName, nova_money_key: tenant.novaMoneyKey })
    .select("*, companies(count)")
    .single();
  throwIfError(error);
  return fromRow(data as TenantRow);
}

export async function updateTenantRecord(id: string, tenant: TenantWrite) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .update({ tenant_name: tenant.tenantName, nova_money_key: tenant.novaMoneyKey })
    .eq("id", id)
    .select("*, companies(count)")
    .single();
  throwIfError(error);
  return fromRow(data as TenantRow);
}

export async function deleteTenantRecord(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tenants").delete().eq("id", id);
  throwIfError(error);
}
