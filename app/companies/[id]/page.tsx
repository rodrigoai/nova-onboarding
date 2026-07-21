import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, Pencil, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DeleteButton } from "@/components/delete-button";
import { getCompany } from "@/lib/companies";
import { decryptSecret } from "@/lib/crypto";
import { formatCnpj, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function Value({ label, value, secret = false }: { label: string; value?: string | null; secret?: boolean }) {
  const display = value || "Não informado";
  return (
    <div className="border-b border-[#e9e9ed] py-4 last:border-0">
      <dt className="text-xs font-bold text-[#777481]">{label}</dt>
      <dd className="mt-1 flex items-center justify-between gap-4 text-sm font-semibold text-[#292832]">
        <span className="min-w-0 break-words">{secret && value ? "••••••••••••" : display}</span>
        {value && <CopyButton value={value} label="" />}
      </dd>
    </div>
  );
}

function LinkValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-[#e9e9ed] py-4 last:border-0">
      <dt className="text-xs font-bold text-[#777481]">{label}</dt>
      <dd className="mt-1 flex items-center justify-between gap-4 text-sm font-semibold">
        {value ? <a className="min-w-0 truncate text-[#52248e] hover:underline" href={value} target="_blank" rel="noreferrer">Abrir arquivo <ExternalLink className="ml-1 inline" size={13} /></a> : <span>Não informado</span>}
        {value && <CopyButton value={value} label="" />}
      </dd>
    </div>
  );
}

function percent(value: string | number | null) {
  return value ? `${value.toString()}%` : null;
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const password = decryptSecret(company.certificatePassword);
  const rules = company.productIcmsRules ?? [];
  const service = company.noteTypes.includes("SERVICE");
  const product = company.noteTypes.includes("PRODUCT");
  const copySummary = [
    company.legalName,
    `CNPJ: ${formatCnpj(company.cnpj)}`,
    `Tipo de nota: ${company.noteTypes.map((item) => item === "SERVICE" ? "Serviço" : "Produto").join(" e ")}`,
    service ? `Inscrição Municipal: ${company.municipalRegistration || "Não informado"}` : "",
    product ? `Inscrição Estadual: ${company.stateRegistration || "Não informado"}` : "",
    company.certificateUrl ? `Certificado PFX: ${company.certificateUrl}` : "",
    password ? `Senha do certificado: ${password}` : "",
    service ? `\nSERVIÇOS\nCNAE: ${company.serviceCnae || "—"}\nCódigo de serviço: ${company.serviceCode || "—"}\nISS: ${percent(company.serviceIss) || "—"}\nIR: ${percent(company.serviceIr) || "—"}\nPIS: ${percent(company.servicePis) || "—"}\nCofins: ${percent(company.serviceCofins) || "—"}\nCSLL: ${percent(company.serviceCsll) || "—"}` : "",
    product ? `\nPRODUTOS\nCNAE: ${company.productCnae || "—"}\nNCM: ${company.productNcm || "—"}\nIR: ${percent(company.productIr) || "—"}\nPIS: ${percent(company.productPis) || "—"}\nCofins: ${percent(company.productCofins) || "—"}` : "",
    company.observations ? `\nOBSERVAÇÕES\n${company.observations}` : "",
  ].filter(Boolean).join("\n");

  return (
    <AppShell>
      <div className="page-enter px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/" className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#6e6e7c] hover:text-[#52248e]"><ArrowLeft size={14} /> Empresas</Link>
          <header className="flex flex-col justify-between gap-5 border-b border-[#e9e9ed] pb-7 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2">
                {company.noteTypes.map((noteType) => <span key={noteType} className="rounded-full bg-[#f0e9f7] px-2.5 py-1 text-[11px] font-bold text-[#63339d]">{noteType === "SERVICE" ? "Serviço" : "Produto"}</span>)}
              </div>
              <h1 className="truncate text-3xl font-bold tracking-[-0.045em] sm:text-[38px]">{company.legalName}</h1>
              <p className="mt-2 text-sm text-[#6e6e7c]">{formatCnpj(company.cnpj)} · Atualizado em {formatDate(company.updatedAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={copySummary} label="Copiar tudo" />
              <Link href={`/companies/${id}/edit`} className="btn-primary"><Pencil size={15} /> Editar</Link>
            </div>
          </header>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <section>
              <div className="mb-2 flex items-center gap-2"><FileText size={17} className="text-[#52248e]" /><h2 className="font-bold">Emissão de notas</h2></div>
              <dl className="rounded-2xl border border-[#e9e9ed] bg-white px-5 shadow-[0_10px_30px_rgba(82,36,142,.04)]">
                <Value label="Razão social" value={company.legalName} />
                <Value label="CNPJ" value={formatCnpj(company.cnpj)} />
                {service && <Value label="Inscrição Municipal" value={company.municipalRegistration} />}
                {product && <Value label="Inscrição Estadual" value={company.stateRegistration} />}
              </dl>
            </section>
            <section>
              <div className="mb-2 flex items-center gap-2"><ShieldCheck size={17} className="text-[#52248e]" /><h2 className="font-bold">Certificado digital</h2></div>
              <dl className="rounded-2xl border border-[#e9e9ed] bg-white px-5 shadow-[0_10px_30px_rgba(82,36,142,.04)]">
                <LinkValue label="Arquivo PFX" value={company.certificateUrl} />
                <Value label="Senha do certificado" value={password} secret />
              </dl>
              <p className="mt-2 text-xs leading-5 text-[#7c7984]">A senha é descriptografada somente nesta visualização e ao copiar os dados.</p>
            </section>
          </div>

          {service && (
            <section className="mt-9">
              <h2 className="mb-2 font-bold">Serviços</h2>
              <div className="grid rounded-2xl border border-[#e9e9ed] bg-white px-5 sm:grid-cols-2 sm:gap-x-7">
                <Value label="CNAE de referência" value={company.serviceCnae} />
                <Value label="Código na lista de serviço" value={company.serviceCode} />
                <Value label="ISS" value={percent(company.serviceIss)} />
                <Value label="IR" value={percent(company.serviceIr)} />
                <Value label="PIS" value={percent(company.servicePis)} />
                <Value label="Cofins" value={percent(company.serviceCofins)} />
                <Value label="CSLL" value={percent(company.serviceCsll)} />
                <LinkValue label="Nota XML de referência" value={company.serviceXmlUrl} />
                <LinkValue label="Nota PDF de referência" value={company.servicePdfUrl} />
              </div>
            </section>
          )}

          {product && (
            <section className="mt-9">
              <h2 className="mb-2 font-bold">Produtos</h2>
              <div className="grid rounded-2xl border border-[#e9e9ed] bg-white px-5 sm:grid-cols-2 sm:gap-x-7">
                <Value label="CNAE de referência" value={company.productCnae} />
                <Value label="NCM" value={company.productNcm} />
                <Value label="IR" value={percent(company.productIr)} />
                <Value label="PIS" value={percent(company.productPis)} />
                <Value label="Cofins" value={percent(company.productCofins)} />
                <LinkValue label="Nota XML de referência" value={company.productXmlUrl} />
                <LinkValue label="Nota PDF de referência" value={company.productPdfUrl} />
              </div>
              <h3 className="mb-2 mt-5 text-sm font-bold">Regras de ICMS</h3>
              {rules.length ? <div className="overflow-x-auto rounded-2xl border border-[#e9e9ed] bg-white"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-[#e9e9ed] bg-[#faf9fc] text-xs text-[#777481]"><tr><th className="p-4">Estado</th><th className="p-4">Situação tributária</th><th className="p-4">Alíquota</th><th className="p-4">Base de cálculo</th></tr></thead><tbody>{rules.map((rule, index) => <tr key={index} className="border-b border-[#efedf2] last:border-0"><td className="p-4 font-bold">{rule.state || "—"}</td><td className="p-4">{rule.taxStatus || "—"}</td><td className="p-4">{rule.rate ? `${rule.rate}%` : "—"}</td><td className="p-4">{rule.taxBase || "—"}</td></tr>)}</tbody></table></div> : <p className="text-sm text-[#777481]">Nenhuma regra informada.</p>}
            </section>
          )}

          <section className="mt-9">
            <h2 className="mb-2 font-bold">Observações</h2>
            <div className="min-h-28 whitespace-pre-wrap rounded-2xl border border-[#e9e9ed] bg-white p-5 text-sm leading-7 text-[#45434e]">{company.observations || "Nenhuma observação registrada."}</div>
          </section>

          <div className="mt-10 flex justify-end border-t border-[#e9e9ed] pt-6"><DeleteButton id={id} /></div>
        </div>
      </div>
    </AppShell>
  );
}
