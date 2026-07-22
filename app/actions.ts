"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { encryptSecret } from "@/lib/crypto";
import {
  createCompanyRecord,
  deleteCompanyRecord,
  getCompany,
  updateCompanyRecord,
  type CompanyWrite,
} from "@/lib/companies";
import { digits } from "@/lib/format";
import {
  createTenantRecord,
  deleteTenantRecord,
  getTenant,
  updateTenantRecord,
} from "@/lib/tenants";

export type FormState = { error?: string };

const optionalText = z.string().trim().transform((value) => value || null);
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\//i.test(value), "Informe um link válido.")
  .transform((value) => value || null);
const optionalRate = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^\d{1,3}([.,]\d{1,4})?$/.test(value),
    "Use uma alíquota entre 0 e 100.",
  )
  .transform((value) => (value ? value.replace(",", ".") : null))
  .refine((value) => value === null || Number(value) <= 100, "A alíquota máxima é 100%.");

function validCnpj(value: string) {
  const cnpj = digits(value);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calculate = (length: number) => {
    let size = length - 7;
    let sum = 0;
    for (let index = length; index >= 1; index -= 1) {
      sum += Number(cnpj[length - index]) * size--;
      if (size < 2) size = 9;
    }
    const result = sum % 11;
    return result < 2 ? 0 : 11 - result;
  };
  return calculate(12) === Number(cnpj[12]) && calculate(13) === Number(cnpj[13]);
}

const companySchema = z
  .object({
    tenantId: z.string().uuid("Selecione uma conta principal."),
    legalName: z.string().trim().min(2, "Informe a razão social."),
    cnpj: z.string().trim().refine(validCnpj, "Informe um CNPJ válido."),
    taxRegime: z.enum(["SIMPLES_NACIONAL", "NAO_OPTANTE"], { error: "Informe o regime de tributação." }),
    addressStreet: optionalText,
    addressNumber: optionalText,
    addressComplement: optionalText,
    addressDistrict: optionalText,
    addressCity: optionalText,
    addressState: optionalText,
    addressZipCode: optionalText,
    noteTypes: z.array(z.enum(["SERVICE", "PRODUCT"])).min(1, "Selecione um tipo de nota."),
    municipalRegistration: optionalText,
    stateRegistration: optionalText,
    certificateUrl: optionalUrl,
    certificatePassword: optionalText,
    serviceCnae: optionalText,
    serviceCode: optionalText,
    serviceIss: optionalRate,
    serviceIr: optionalRate,
    servicePis: optionalRate,
    serviceCofins: optionalRate,
    serviceCsll: optionalRate,
    serviceXmlUrl: optionalUrl,
    servicePdfUrl: optionalUrl,
    productCnae: optionalText,
    productNcm: optionalText,
    productIr: optionalRate,
    productPis: optionalRate,
    productCofins: optionalRate,
    productXmlUrl: optionalUrl,
    productPdfUrl: optionalUrl,
    productIcmsRules: z.string().transform((value, context) => {
      try {
        const rules = JSON.parse(value || "[]");
        if (!Array.isArray(rules)) throw new Error();
        return rules.filter((rule) => rule.state || rule.taxStatus || rule.rate || rule.taxBase);
      } catch {
        context.addIssue({ code: "custom", message: "Regras de ICMS inválidas." });
        return z.NEVER;
      }
    }),
    observations: optionalText,
  })
  .superRefine((data, context) => {
    if (data.noteTypes.includes("SERVICE") && !data.municipalRegistration) {
      context.addIssue({ code: "custom", path: ["municipalRegistration"], message: "Informe a inscrição municipal." });
    }
    if (data.noteTypes.includes("PRODUCT") && !data.stateRegistration) {
      context.addIssue({ code: "custom", path: ["stateRegistration"], message: "Informe a inscrição estadual ou ISENTO." });
    }
  });

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function parseCompany(formData: FormData) {
  const raw = {
    tenantId: stringValue(formData, "tenantId"),
    legalName: stringValue(formData, "legalName"),
    cnpj: stringValue(formData, "cnpj"),
    taxRegime: stringValue(formData, "taxRegime"),
    addressStreet: stringValue(formData, "addressStreet"),
    addressNumber: stringValue(formData, "addressNumber"),
    addressComplement: stringValue(formData, "addressComplement"),
    addressDistrict: stringValue(formData, "addressDistrict"),
    addressCity: stringValue(formData, "addressCity"),
    addressState: stringValue(formData, "addressState"),
    addressZipCode: stringValue(formData, "addressZipCode"),
    noteTypes: formData.getAll("noteTypes").map(String),
    municipalRegistration: stringValue(formData, "municipalRegistration"),
    stateRegistration: stringValue(formData, "stateRegistration"),
    certificateUrl: stringValue(formData, "certificateUrl"),
    certificatePassword: stringValue(formData, "certificatePassword"),
    serviceCnae: stringValue(formData, "serviceCnae"),
    serviceCode: stringValue(formData, "serviceCode"),
    serviceIss: stringValue(formData, "serviceIss"),
    serviceIr: stringValue(formData, "serviceIr"),
    servicePis: stringValue(formData, "servicePis"),
    serviceCofins: stringValue(formData, "serviceCofins"),
    serviceCsll: stringValue(formData, "serviceCsll"),
    serviceXmlUrl: stringValue(formData, "serviceXmlUrl"),
    servicePdfUrl: stringValue(formData, "servicePdfUrl"),
    productCnae: stringValue(formData, "productCnae"),
    productNcm: stringValue(formData, "productNcm"),
    productIr: stringValue(formData, "productIr"),
    productPis: stringValue(formData, "productPis"),
    productCofins: stringValue(formData, "productCofins"),
    productXmlUrl: stringValue(formData, "productXmlUrl"),
    productPdfUrl: stringValue(formData, "productPdfUrl"),
    productIcmsRules: stringValue(formData, "productIcmsRules"),
    observations: stringValue(formData, "observations"),
  };
  return companySchema.safeParse(raw);
}

const tenantSchema = z.object({
  tenantName: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Informe o nome do tenant.")
    .max(63, "O nome deve ter no máximo 63 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens entre termos.",
    ),
  description: z
    .string()
    .trim()
    .max(10000, "A descrição deve ter no máximo 10.000 caracteres.")
    .transform((value) => value || null),
  novaMoneyKey: z.string().trim(),
});

function parseTenant(formData: FormData) {
  return tenantSchema.safeParse({
    tenantName: stringValue(formData, "tenantName"),
    description: stringValue(formData, "description"),
    novaMoneyKey: stringValue(formData, "novaMoneyKey"),
  });
}

function tenantMessageFromError(error: unknown) {
  if (
    error instanceof Error &&
    (error.message.includes("duplicate key") ||
      (error as Error & { code?: string }).code === "23505")
  ) {
    return "Este nome de tenant já está em uso.";
  }
  if (error instanceof Error && (error as Error & { code?: string }).code === "23503") {
    return "Mova ou exclua as empresas vinculadas antes de excluir este tenant.";
  }
  return "Não foi possível salvar o tenant. Tente novamente.";
}

function messageFromError(error: unknown) {
  if (
    error instanceof Error &&
    (error.message.includes("duplicate key") ||
      (error as Error & { code?: string }).code === "23505")
  ) {
    return "Já existe uma empresa com este CNPJ.";
  }
  return "Não foi possível salvar. Revise os dados e tente novamente.";
}

export async function createCompany(_: FormState, formData: FormData): Promise<FormState> {
  const result = parseCompany(formData);
  if (!result.success) return { error: result.error.issues[0]?.message };
  let companyId: string;
  try {
    const data = result.data;
    const company = await createCompanyRecord({
      ...data,
      cnpj: digits(data.cnpj),
      certificatePassword: encryptSecret(data.certificatePassword),
      municipalRegistration: data.noteTypes.includes("SERVICE") ? data.municipalRegistration : null,
      stateRegistration: data.noteTypes.includes("PRODUCT") ? data.stateRegistration : null,
    } as CompanyWrite);
    companyId = company.id;
    revalidatePath("/");
  } catch (error) {
    return { error: messageFromError(error) };
  }
  redirect(`/companies/${companyId}`);
}

export async function updateCompany(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const result = parseCompany(formData);
  if (!result.success) return { error: result.error.issues[0]?.message };
  let companyId: string;
  try {
    const data = result.data;
    const current = await getCompany(id);
    const company = await updateCompanyRecord(id, {
      ...data,
      cnpj: digits(data.cnpj),
      certificatePassword: data.certificatePassword
        ? encryptSecret(data.certificatePassword)
        : current?.certificatePassword ?? null,
      municipalRegistration: data.noteTypes.includes("SERVICE") ? data.municipalRegistration : null,
      stateRegistration: data.noteTypes.includes("PRODUCT") ? data.stateRegistration : null,
    } as CompanyWrite);
    companyId = company.id;
    revalidatePath("/");
    revalidatePath(`/companies/${id}`);
  } catch (error) {
    return { error: messageFromError(error) };
  }
  redirect(`/companies/${companyId}`);
}

export async function deleteCompany(id: string) {
  await deleteCompanyRecord(id);
  revalidatePath("/");
  redirect("/");
}

export async function createTenant(_: FormState, formData: FormData): Promise<FormState> {
  const result = parseTenant(formData);
  if (!result.success) return { error: result.error.issues[0]?.message };
  if (!result.data.novaMoneyKey) return { error: "Informe a Nova Money Key." };
  let tenantId: string;
  try {
    const tenant = await createTenantRecord({
      tenantName: result.data.tenantName,
      description: result.data.description,
      novaMoneyKey: encryptSecret(result.data.novaMoneyKey) ?? "",
    });
    tenantId = tenant.id;
    revalidatePath("/tenants");
  } catch (error) {
    return { error: tenantMessageFromError(error) };
  }
  redirect(`/tenants/${tenantId}`);
}

export async function updateTenant(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const result = parseTenant(formData);
  if (!result.success) return { error: result.error.issues[0]?.message };
  let tenantId: string;
  try {
    const current = await getTenant(id);
    if (!current) return { error: "Tenant não encontrado." };
    const tenant = await updateTenantRecord(id, {
      tenantName: result.data.tenantName,
      description: result.data.description,
      novaMoneyKey: result.data.novaMoneyKey
        ? encryptSecret(result.data.novaMoneyKey) ?? ""
        : current.novaMoneyKey,
    });
    tenantId = tenant.id;
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${id}`);
  } catch (error) {
    return { error: tenantMessageFromError(error) };
  }
  redirect(`/tenants/${tenantId}`);
}

export async function deleteTenant(
  id: string,
  previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  void previousState;
  void formData;
  try {
    await deleteTenantRecord(id);
    revalidatePath("/tenants");
  } catch (error) {
    return { error: tenantMessageFromError(error) };
  }
  redirect("/tenants");
}
