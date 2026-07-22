type OpenCnpjResponse = {
  razao_social?: string;
  tipo_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  opcao_simples?: "S" | "N" | string;
};

export async function GET(_request: Request, context: RouteContext<"/api/cnpj/[cnpj]">) {
  const { cnpj } = await context.params;
  if (!/^\d{14}$/.test(cnpj)) {
    return Response.json({ error: "Informe um CNPJ com 14 dígitos." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.opencnpj.org/${cnpj}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return Response.json(
        { error: response.status === 404 ? "CNPJ não encontrado na OpenCNPJ." : "A consulta à OpenCNPJ está indisponível." },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const data = await response.json() as OpenCnpjResponse;
    if (!data.razao_social) {
      return Response.json({ error: "A consulta não retornou a razão social." }, { status: 502 });
    }

    return Response.json({
      legalName: data.razao_social,
      taxRegime: data.opcao_simples === "S" ? "SIMPLES_NACIONAL" : data.opcao_simples === "N" ? "NAO_OPTANTE" : "",
      addressStreet: [data.tipo_logradouro, data.logradouro].filter(Boolean).join(" "),
      addressNumber: data.numero ?? "",
      addressComplement: data.complemento ?? "",
      addressDistrict: data.bairro ?? "",
      addressCity: data.municipio ?? "",
      addressState: data.uf ?? "",
      addressZipCode: data.cep ?? "",
    });
  } catch {
    return Response.json({ error: "Não foi possível conectar à OpenCNPJ. Tente novamente." }, { status: 502 });
  }
}
