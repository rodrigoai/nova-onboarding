import { createClient } from "@/lib/supabase/server";

export type NoteType = "SERVICE" | "PRODUCT";
export type IcmsRule = {
  state?: string;
  taxStatus?: string;
  rate?: string;
  taxBase?: string;
};

export type Company = {
  id: string;
  legalName: string;
  cnpj: string;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  noteTypes: NoteType[];
  municipalRegistration: string | null;
  stateRegistration: string | null;
  certificateUrl: string | null;
  certificatePassword: string | null;
  serviceCnae: string | null;
  serviceCode: string | null;
  serviceIss: string | number | null;
  serviceIr: string | number | null;
  servicePis: string | number | null;
  serviceCofins: string | number | null;
  serviceCsll: string | number | null;
  serviceXmlUrl: string | null;
  servicePdfUrl: string | null;
  productCnae: string | null;
  productNcm: string | null;
  productIr: string | number | null;
  productPis: string | number | null;
  productCofins: string | number | null;
  productIcmsRules: IcmsRule[] | null;
  productXmlUrl: string | null;
  productPdfUrl: string | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
};

type CompanyRow = {
  id: string;
  legal_name: string;
  cnpj: string;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_district: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  note_types: NoteType[];
  municipal_registration: string | null;
  state_registration: string | null;
  certificate_url: string | null;
  certificate_password: string | null;
  service_cnae: string | null;
  service_code: string | null;
  service_iss: string | number | null;
  service_ir: string | number | null;
  service_pis: string | number | null;
  service_cofins: string | number | null;
  service_csll: string | number | null;
  service_xml_url: string | null;
  service_pdf_url: string | null;
  product_cnae: string | null;
  product_ncm: string | null;
  product_ir: string | number | null;
  product_pis: string | number | null;
  product_cofins: string | number | null;
  product_icms_rules: IcmsRule[] | null;
  product_xml_url: string | null;
  product_pdf_url: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyWrite = Omit<Company, "id" | "createdAt" | "updatedAt">;

function fromRow(row: CompanyRow): Company {
  return {
    id: row.id,
    legalName: row.legal_name,
    cnpj: row.cnpj,
    addressStreet: row.address_street,
    addressNumber: row.address_number,
    addressComplement: row.address_complement,
    addressDistrict: row.address_district,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZipCode: row.address_zip_code,
    noteTypes: row.note_types,
    municipalRegistration: row.municipal_registration,
    stateRegistration: row.state_registration,
    certificateUrl: row.certificate_url,
    certificatePassword: row.certificate_password,
    serviceCnae: row.service_cnae,
    serviceCode: row.service_code,
    serviceIss: row.service_iss,
    serviceIr: row.service_ir,
    servicePis: row.service_pis,
    serviceCofins: row.service_cofins,
    serviceCsll: row.service_csll,
    serviceXmlUrl: row.service_xml_url,
    servicePdfUrl: row.service_pdf_url,
    productCnae: row.product_cnae,
    productNcm: row.product_ncm,
    productIr: row.product_ir,
    productPis: row.product_pis,
    productCofins: row.product_cofins,
    productIcmsRules: row.product_icms_rules,
    productXmlUrl: row.product_xml_url,
    productPdfUrl: row.product_pdf_url,
    observations: row.observations,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(company: CompanyWrite) {
  return {
    legal_name: company.legalName,
    cnpj: company.cnpj,
    address_street: company.addressStreet,
    address_number: company.addressNumber,
    address_complement: company.addressComplement,
    address_district: company.addressDistrict,
    address_city: company.addressCity,
    address_state: company.addressState,
    address_zip_code: company.addressZipCode,
    note_types: company.noteTypes,
    municipal_registration: company.municipalRegistration,
    state_registration: company.stateRegistration,
    certificate_url: company.certificateUrl,
    certificate_password: company.certificatePassword,
    service_cnae: company.serviceCnae,
    service_code: company.serviceCode,
    service_iss: company.serviceIss,
    service_ir: company.serviceIr,
    service_pis: company.servicePis,
    service_cofins: company.serviceCofins,
    service_csll: company.serviceCsll,
    service_xml_url: company.serviceXmlUrl,
    service_pdf_url: company.servicePdfUrl,
    product_cnae: company.productCnae,
    product_ncm: company.productNcm,
    product_ir: company.productIr,
    product_pis: company.productPis,
    product_cofins: company.productCofins,
    product_icms_rules: company.productIcmsRules,
    product_xml_url: company.productXmlUrl,
    product_pdf_url: company.productPdfUrl,
    observations: company.observations,
  };
}

function throwIfError(error: { message: string; code?: string } | null) {
  if (error) {
    const failure = new Error(error.message);
    Object.assign(failure, { code: error.code });
    throw failure;
  }
}

export async function listCompanies(query: string, type: string) {
  const supabase = await createClient();
  let request = supabase.from("companies").select("*").order("updated_at", { ascending: false });
  const safeQuery = query.replace(/[,().]/g, " ").trim();
  if (safeQuery) {
    const cnpj = safeQuery.replace(/\D/g, "");
    request = request.or(
      cnpj
        ? `legal_name.ilike.%${safeQuery}%,cnpj.ilike.%${cnpj}%`
        : `legal_name.ilike.%${safeQuery}%`,
    );
  }
  if (type === "SERVICE" || type === "PRODUCT") {
    request = request.contains("note_types", [type]);
  }
  const { data, error } = await request;
  throwIfError(error);
  return ((data ?? []) as CompanyRow[]).map(fromRow);
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  throwIfError(error);
  return data ? fromRow(data as CompanyRow) : null;
}

export async function createCompanyRecord(company: CompanyWrite) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("companies").insert(toRow(company)).select("*").single();
  throwIfError(error);
  return fromRow(data as CompanyRow);
}

export async function updateCompanyRecord(id: string, company: CompanyWrite) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("companies").update(toRow(company)).eq("id", id).select("*").single();
  throwIfError(error);
  return fromRow(data as CompanyRow);
}

export async function deleteCompanyRecord(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  throwIfError(error);
}
