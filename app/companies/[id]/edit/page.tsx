import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompanyForm, type CompanyFormValues } from "@/components/company-form";
import { rate } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) notFound();
  const company = await getPrisma().company.findUnique({ where: { id } });
  if (!company) notFound();
  const rules = Array.isArray(company.productIcmsRules) ? company.productIcmsRules : [];
  const initial: CompanyFormValues = {
    id: company.id,
    legalName: company.legalName,
    cnpj: company.cnpj,
    noteTypes: company.noteTypes,
    municipalRegistration: company.municipalRegistration ?? "",
    stateRegistration: company.stateRegistration ?? "",
    certificateUrl: company.certificateUrl ?? "",
    serviceCnae: company.serviceCnae ?? "",
    serviceCode: company.serviceCode ?? "",
    serviceIss: rate(company.serviceIss), serviceIr: rate(company.serviceIr), servicePis: rate(company.servicePis), serviceCofins: rate(company.serviceCofins), serviceCsll: rate(company.serviceCsll),
    serviceXmlUrl: company.serviceXmlUrl ?? "", servicePdfUrl: company.servicePdfUrl ?? "",
    productCnae: company.productCnae ?? "", productNcm: company.productNcm ?? "",
    productIr: rate(company.productIr), productPis: rate(company.productPis), productCofins: rate(company.productCofins),
    productIcmsRules: rules as CompanyFormValues["productIcmsRules"],
    productXmlUrl: company.productXmlUrl ?? "", productPdfUrl: company.productPdfUrl ?? "",
    observations: company.observations ?? "",
  };
  return <AppShell><CompanyForm initial={initial} /></AppShell>;
}
