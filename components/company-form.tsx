"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, CircleCheck, Eye, EyeOff, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { createCompany, updateCompany } from "@/app/actions";
import { formatCnpj } from "@/lib/format";

type IcmsRule = { state: string; taxStatus: string; rate: string; taxBase: string };

export type CompanyFormValues = {
  id?: string;
  legalName?: string;
  cnpj?: string;
  taxRegime?: "SIMPLES_NACIONAL" | "NAO_OPTANTE" | "";
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressDistrict?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  noteTypes?: ("SERVICE" | "PRODUCT")[];
  municipalRegistration?: string;
  stateRegistration?: string;
  certificateUrl?: string;
  serviceCnae?: string;
  serviceCode?: string;
  serviceIss?: string;
  serviceIr?: string;
  servicePis?: string;
  serviceCofins?: string;
  serviceCsll?: string;
  serviceXmlUrl?: string;
  servicePdfUrl?: string;
  productCnae?: string;
  productNcm?: string;
  productIr?: string;
  productPis?: string;
  productCofins?: string;
  productIcmsRules?: IcmsRule[];
  productXmlUrl?: string;
  productPdfUrl?: string;
  observations?: string;
};

const steps = ["Empresa", "Certificado", "Tributação", "Observações"];
const emptyRule: IcmsRule = { state: "", taxStatus: "", rate: "", taxBase: "" };

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
  hint,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  inputMode?: "text" | "decimal";
}) {
  return (
    <label className="block">
      <span className="label">{label}{required && <span className="text-[#af3d34]"> *</span>}</span>
      <input className="field" name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} inputMode={inputMode} />
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}

function RateField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="relative">
        <input className="field pr-9" name={name} defaultValue={defaultValue} placeholder="0,00" inputMode="decimal" />
        <span className="pointer-events-none absolute right-3 top-3 text-sm text-[#8b918a]">%</span>
      </div>
    </label>
  );
}

function ReferenceFields({ prefix, xml, pdf }: { prefix: "service" | "product"; xml?: string; pdf?: string }) {
  const [hasXml, setHasXml] = useState(Boolean(xml));
  const [hasPdf, setHasPdf] = useState(Boolean(pdf));
  return (
    <div className="border-t border-[#e9e9ed] pt-5">
      <h3 className="text-sm font-bold">Notas de referência</h3>
      <div className="mt-3 space-y-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#5f5c68]">
          <input className="size-4 accent-[#52248e]" type="checkbox" checked={hasXml} onChange={(event) => setHasXml(event.target.checked)} />
          Possui nota de referência XML
        </label>
        {hasXml && <input className="field step-enter" type="url" name={`${prefix}XmlUrl`} defaultValue={xml} placeholder="https://.../nota.xml" />}
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#5f5c68]">
          <input className="size-4 accent-[#52248e]" type="checkbox" checked={hasPdf} onChange={(event) => setHasPdf(event.target.checked)} />
          Possui nota de referência PDF
        </label>
        {hasPdf && <input className="field step-enter" type="url" name={`${prefix}PdfUrl`} defaultValue={pdf} placeholder="https://.../nota.pdf" />}
      </div>
    </div>
  );
}

export function CompanyForm({ initial = {} }: { initial?: CompanyFormValues }) {
  const [step, setStep] = useState(0);
  const [cnpj, setCnpj] = useState(initial.cnpj ? formatCnpj(initial.cnpj) : "");
  const [legalName, setLegalName] = useState(initial.legalName ?? "");
  const [taxRegime, setTaxRegime] = useState(initial.taxRegime ?? "");
  const [address, setAddress] = useState({
    addressStreet: initial.addressStreet ?? "",
    addressNumber: initial.addressNumber ?? "",
    addressComplement: initial.addressComplement ?? "",
    addressDistrict: initial.addressDistrict ?? "",
    addressCity: initial.addressCity ?? "",
    addressState: initial.addressState ?? "",
    addressZipCode: initial.addressZipCode ?? "",
  });
  const [lookup, setLookup] = useState<{ status: "idle" | "loading" | "success" | "error"; message?: string }>({ status: "idle" });
  const [types, setTypes] = useState<("SERVICE" | "PRODUCT")[]>(initial.noteTypes ?? []);
  const [showPassword, setShowPassword] = useState(false);
  const [rules, setRules] = useState<IcmsRule[]>(initial.productIcmsRules?.length ? initial.productIcmsRules : [{ ...emptyRule }]);
  const formRef = useRef<HTMLFormElement>(null);
  const skipInitialLookup = useRef(Boolean(initial.id && initial.cnpj));
  const action = useMemo(() => initial.id ? updateCompany.bind(null, initial.id) : createCompany, [initial.id]);
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    const rawCnpj = cnpj.replace(/\D/g, "");
    if (rawCnpj.length !== 14) {
      return;
    }
    if (skipInitialLookup.current) {
      skipInitialLookup.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLookup({ status: "loading", message: "Buscando dados do CNPJ..." });
      try {
        const response = await fetch(`/api/cnpj/${rawCnpj}`, { signal: controller.signal });
        const data = await response.json() as {
          error?: string;
          legalName?: string;
          taxRegime?: "SIMPLES_NACIONAL" | "NAO_OPTANTE" | "";
          addressStreet?: string;
          addressNumber?: string;
          addressComplement?: string;
          addressDistrict?: string;
          addressCity?: string;
          addressState?: string;
          addressZipCode?: string;
        };
        if (!response.ok) throw new Error(data.error || "Não foi possível consultar este CNPJ.");
        setLegalName(data.legalName ?? "");
        setTaxRegime(data.taxRegime ?? "");
        setAddress({
          addressStreet: data.addressStreet ?? "",
          addressNumber: data.addressNumber ?? "",
          addressComplement: data.addressComplement ?? "",
          addressDistrict: data.addressDistrict ?? "",
          addressCity: data.addressCity ?? "",
          addressState: data.addressState ?? "",
          addressZipCode: data.addressZipCode ?? "",
        });
        setLookup({ status: "success", message: "Dados encontrados e preenchidos automaticamente." });
      } catch (error) {
        if (controller.signal.aborted) return;
        setLookup({ status: "error", message: error instanceof Error ? error.message : "Não foi possível consultar este CNPJ." });
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cnpj]);

  function updateAddress(key: keyof typeof address, value: string) {
    setAddress((current) => ({ ...current, [key]: value }));
  }

  function updateCnpj(value: string) {
    const formatted = formatCnpj(value);
    if (formatted.replace(/\D/g, "").length !== 14) setLookup({ status: "idle" });
    setCnpj(formatted);
  }

  function toggleType(type: "SERVICE" | "PRODUCT") {
    setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  function nextStep() {
    if (step === 0) {
      const required = [...(formRef.current?.querySelectorAll("[data-company] [required]") ?? [])] as (HTMLInputElement | HTMLSelectElement)[];
      if (types.length === 0) return;
      const invalid = required.find((input) => !input.reportValidity());
      if (invalid) return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateRule(index: number, key: keyof IcmsRule, value: string) {
    setRules((current) => current.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, [key]: value } : rule));
  }

  return (
    <form ref={formRef} action={formAction} className="page-enter">
      <input type="hidden" name="productIcmsRules" value={JSON.stringify(rules)} />
      <div className="border-b border-[#e9e9ed] bg-white px-5 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-5">
          <div>
            <Link href={initial.id ? `/companies/${initial.id}` : "/"} className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#6e6e7c] hover:text-[#52248e]">
              <ArrowLeft size={14} /> Voltar
            </Link>
            <h1 className="text-2xl font-bold tracking-[-0.035em] sm:text-[28px]">{initial.id ? "Editar empresa" : "Nova empresa"}</h1>
          </div>
          <span className="hidden text-sm text-[#6e6e7c] sm:block">Etapa {step + 1} de {steps.length}</span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Etapas do formulário">
          {steps.map((label, index) => (
            <li key={label} className="min-w-0">
              <div className={`mb-2 h-1 rounded-full transition-colors ${index <= step ? "bg-[#52248e]" : "bg-[#e3dce9]"}`} />
              <span className={`hidden text-xs font-bold sm:block ${index === step ? "text-[#52248e]" : "text-[#8a8791]"}`}>{label}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-[22px] border border-[#e9e9ed] bg-white p-5 shadow-[0_16px_45px_rgba(82,36,142,.07)] sm:p-8">
          <section className={step === 0 ? "step-enter" : "hidden"} data-company>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Identificação</p>
              <h2 className="text-xl font-bold tracking-[-0.025em]">Dados da empresa emissora</h2>
              <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">Informe o CNPJ para buscar a razão social e o endereço automaticamente.</p>
              <div className="mt-7 max-w-md">
                <label className="block">
                  <span className="label">CNPJ <span className="text-[#af3d34]">*</span></span>
                  <input className="field" name="cnpj" value={cnpj} placeholder="00.000.000/0000-00" required inputMode="text" onChange={(event) => updateCnpj(event.currentTarget.value)} />
                </label>
              </div>
              {lookup.status !== "idle" && (
                <div aria-live="polite" className={`mt-3 flex items-center gap-2 text-xs font-semibold ${lookup.status === "error" ? "text-[#9d4a42]" : lookup.status === "success" ? "text-[#367357]" : "text-[#6e6e7c]"}`}>
                  {lookup.status === "loading" && <LoaderCircle className="animate-spin" size={15} />}
                  {lookup.status === "success" && <CircleCheck size={15} />}
                  {lookup.status === "error" && <CircleAlert size={15} />}
                  {lookup.message}
                </div>
              )}

              <div className="mt-6 border-t border-[#e9e9ed] pt-6">
                <h3 className="text-sm font-bold">Dados cadastrais</h3>
                <p className="mt-1 text-xs leading-5 text-[#777481]">Os dados preenchidos pela consulta podem ser corrigidos antes de continuar.</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="label">Razão social <span className="text-[#af3d34]">*</span></span>
                    <input className="field" name="legalName" value={legalName} onChange={(event) => setLegalName(event.currentTarget.value)} placeholder="Nome registrado da empresa" required />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="label">Regime de Tributação <span className="text-[#af3d34]">*</span></span>
                    <select className="field" name="taxRegime" value={taxRegime} onChange={(event) => setTaxRegime(event.currentTarget.value as typeof taxRegime)} required>
                      <option value="">Selecione o regime</option>
                      <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                      <option value="NAO_OPTANTE">Não optante pelo Simples Nacional</option>
                    </select>
                    <span className="hint block">Preenchido conforme a opção pelo Simples Nacional retornada pela OpenCNPJ.</span>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="label">Logradouro</span>
                    <input className="field" name="addressStreet" value={address.addressStreet} onChange={(event) => updateAddress("addressStreet", event.currentTarget.value)} placeholder="Rua, avenida..." />
                  </label>
                  <label className="block">
                    <span className="label">Número</span>
                    <input className="field" name="addressNumber" value={address.addressNumber} onChange={(event) => updateAddress("addressNumber", event.currentTarget.value)} placeholder="Número" />
                  </label>
                  <label className="block">
                    <span className="label">Complemento</span>
                    <input className="field" name="addressComplement" value={address.addressComplement} onChange={(event) => updateAddress("addressComplement", event.currentTarget.value)} placeholder="Sala, conjunto..." />
                  </label>
                  <label className="block">
                    <span className="label">Bairro</span>
                    <input className="field" name="addressDistrict" value={address.addressDistrict} onChange={(event) => updateAddress("addressDistrict", event.currentTarget.value)} placeholder="Bairro" />
                  </label>
                  <label className="block">
                    <span className="label">CEP</span>
                    <input className="field" name="addressZipCode" value={address.addressZipCode} onChange={(event) => updateAddress("addressZipCode", event.currentTarget.value)} placeholder="00000-000" inputMode="text" />
                  </label>
                  <label className="block">
                    <span className="label">Cidade</span>
                    <input className="field" name="addressCity" value={address.addressCity} onChange={(event) => updateAddress("addressCity", event.currentTarget.value)} placeholder="Cidade" />
                  </label>
                  <label className="block">
                    <span className="label">UF</span>
                    <input className="field" name="addressState" value={address.addressState} onChange={(event) => updateAddress("addressState", event.currentTarget.value.toUpperCase().slice(0, 2))} placeholder="UF" maxLength={2} />
                  </label>
                </div>
              </div>
              <fieldset className="mt-7">
                <legend className="label">Qual tipo de nota? <span className="text-[#af3d34]">*</span></legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["SERVICE", "PRODUCT"] as const).map((type) => {
                    const selected = types.includes(type);
                    const label = type === "SERVICE" ? "Serviço" : "Produtos";
                    return (
                      <label key={type} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-4 transition ${selected ? "border-[#7445ad] bg-[#f3eef9]" : "border-[#e4e2e9] hover:border-[#c9c3d1]"}`}>
                        <span className="font-bold">{label}</span>
                        <input className="size-4 accent-[#52248e]" type="checkbox" name="noteTypes" value={type} checked={selected} onChange={() => toggleType(type)} />
                      </label>
                    );
                  })}
                </div>
                {types.length === 0 && <p className="hint text-[#9d4a42]">Selecione ao menos uma opção.</p>}
              </fieldset>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {types.includes("SERVICE") && <Field label="Inscrição Municipal" name="municipalRegistration" defaultValue={initial.municipalRegistration} placeholder="Inscrição municipal" required />}
                {types.includes("PRODUCT") && <Field label="Inscrição Estadual" name="stateRegistration" defaultValue={initial.stateRegistration} placeholder="Número ou ISENTO" hint="Se a empresa for isenta, informe ISENTO." required />}
              </div>
          </section>

          <section className={step === 1 ? "step-enter" : "hidden"}>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Certificado digital</p>
              <h2 className="text-xl font-bold tracking-[-0.025em]">A1 / E-CNPJ</h2>
              <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">Adicione um link seguro para o arquivo PFX. A senha será criptografada no banco.</p>
              <div className="mt-7 space-y-5">
                <Field label="Link do certificado PFX" name="certificateUrl" type="url" defaultValue={initial.certificateUrl} placeholder="https://..." hint="Use um link com acesso restrito e prazo de expiração quando possível." />
                <label className="block">
                  <span className="label">Senha do certificado</span>
                  <div className="relative">
                    <input className="field pr-12" name="certificatePassword" type={showPassword ? "text" : "password"} placeholder={initial.id ? "Deixe vazio para manter a senha atual" : "Senha do arquivo"} autoComplete="new-password" />
                    <button type="button" aria-label={showPassword ? "Ocultar senha" : "Exibir senha"} className="absolute right-3 top-3 text-[#777481]" onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>
          </section>

          <section className={step === 2 ? "step-enter" : "hidden"}>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Produtos e serviços</p>
              <h2 className="text-xl font-bold tracking-[-0.025em]">Informações tributárias</h2>
              <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">Preencha somente as seções aplicáveis. Alíquotas devem ser informadas em porcentagem.</p>
              <div className="mt-8 space-y-10">
                {types.includes("SERVICE") && (
                  <div>
                    <h3 className="mb-5 border-b border-[#e9e9ed] pb-3 text-base font-bold">Serviços</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="CNAE de referência" name="serviceCnae" defaultValue={initial.serviceCnae} placeholder="0000-0/00" />
                      <Field label="Código na lista de serviço" name="serviceCode" defaultValue={initial.serviceCode} placeholder="Código municipal" />
                    </div>
                    <p className="mb-3 mt-6 text-sm font-bold">Alíquotas</p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      <RateField label="ISS" name="serviceIss" defaultValue={initial.serviceIss} />
                      <RateField label="IR" name="serviceIr" defaultValue={initial.serviceIr} />
                      <RateField label="PIS" name="servicePis" defaultValue={initial.servicePis} />
                      <RateField label="Cofins" name="serviceCofins" defaultValue={initial.serviceCofins} />
                      <RateField label="CSLL" name="serviceCsll" defaultValue={initial.serviceCsll} />
                    </div>
                    <div className="mt-7"><ReferenceFields prefix="service" xml={initial.serviceXmlUrl} pdf={initial.servicePdfUrl} /></div>
                  </div>
                )}
                {types.includes("PRODUCT") && (
                  <div>
                    <h3 className="mb-5 border-b border-[#e9e9ed] pb-3 text-base font-bold">Produtos</h3>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="CNAE de referência" name="productCnae" defaultValue={initial.productCnae} placeholder="0000-0/00" />
                      <Field label="NCM" name="productNcm" defaultValue={initial.productNcm} placeholder="0000.00.00" />
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm font-bold">Regras de ICMS</p>
                      <button className="btn-ghost !min-h-8 !px-2 text-xs" type="button" onClick={() => setRules((current) => [...current, { ...emptyRule }])}><Plus size={14} /> Adicionar estado</button>
                    </div>
                    <div className="mt-3 space-y-3">
                      {rules.map((rule, index) => (
                        <div key={index} className="grid gap-3 rounded-xl bg-[#f8f7fc] p-3 sm:grid-cols-[.65fr_1.35fr_1fr_1fr_auto]">
                          <input className="field" aria-label="Estado" placeholder="UF" maxLength={2} value={rule.state} onChange={(e) => updateRule(index, "state", e.target.value.toUpperCase())} />
                          <input className="field" aria-label="Situação tributária" placeholder="Situação tributária" value={rule.taxStatus} onChange={(e) => updateRule(index, "taxStatus", e.target.value)} />
                          <input className="field" aria-label="Alíquota" placeholder="Alíquota %" inputMode="decimal" value={rule.rate} onChange={(e) => updateRule(index, "rate", e.target.value)} />
                          <input className="field" aria-label="Base de cálculo" placeholder="Base de cálculo" value={rule.taxBase} onChange={(e) => updateRule(index, "taxBase", e.target.value)} />
                          <button type="button" aria-label="Remover regra" className="grid size-11 place-items-center rounded-lg text-[#9a514b] hover:bg-[#f5e8e6]" onClick={() => setRules((current) => current.length === 1 ? [{ ...emptyRule }] : current.filter((_, ruleIndex) => ruleIndex !== index))}><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <p className="mb-3 mt-6 text-sm font-bold">Outras alíquotas</p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <RateField label="IR" name="productIr" defaultValue={initial.productIr} />
                      <RateField label="PIS" name="productPis" defaultValue={initial.productPis} />
                      <RateField label="Cofins" name="productCofins" defaultValue={initial.productCofins} />
                    </div>
                    <div className="mt-7"><ReferenceFields prefix="product" xml={initial.productXmlUrl} pdf={initial.productPdfUrl} /></div>
                  </div>
                )}
              </div>
          </section>

          <section className={step === 3 ? "step-enter" : "hidden"}>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Descrição geral</p>
              <h2 className="text-xl font-bold tracking-[-0.025em]">Exceções e alertas</h2>
              <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">Registre particularidades que a equipe deve observar ao emitir notas.</p>
              <label className="mt-7 block">
                <span className="label">Observações</span>
                <textarea className="field min-h-44 resize-y" name="observations" defaultValue={initial.observations} placeholder="Regras de exceção, especificidades, alertas..." />
              </label>
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#f3eef9] p-4 text-sm leading-6 text-[#52248e]">
                <Check className="mt-1 shrink-0" size={16} />
                Ao salvar, o cadastro ficará disponível na lista de empresas e poderá ser copiado, editado ou excluído.
              </div>
          </section>

          {state.error && <div role="alert" className="mt-6 rounded-lg bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#963b33]">{state.error}</div>}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button type="button" className="btn-secondary" disabled={step === 0 || pending} onClick={() => setStep((current) => Math.max(0, current - 1))}><ArrowLeft size={16} /> Anterior</button>
          {step < steps.length - 1 ? (
            <button type="button" className="btn-primary" onClick={nextStep}>Continuar <ArrowRight size={16} /></button>
          ) : (
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Salvando..." : initial.id ? "Salvar alterações" : "Cadastrar empresa"} <Check size={16} /></button>
          )}
        </div>
      </div>
    </form>
  );
}
