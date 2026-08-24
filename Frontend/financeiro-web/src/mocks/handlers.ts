import { http, HttpResponse } from "msw";
import {
  allParcelasEnriquecidas,
  enriquecerParcela,
  mockClientes,
  mockContasAPagar,
  mockContasAReceber,
  mockFornecedores,
  mockUsers,
  proximoClienteId,
  proximoDocumentoId,
  proximoFornecedorId,
  proximosParcelaIds,
} from "./data";
import type {
  CategoriaGasto,
  ClienteDTO,
  ContaAPagarDTO,
  ContaAReceberDTO,
  ContaAtrasadaFornecedorDTO,
  ExtratoDTO,
  ExtratoDocumentoDTO,
  FornecedorDTO,
  GastoPorCategoriaDTO,
  InadimplenciaClienteDTO,
  LoginModel,
  PaginationMetadata,
  ParcelaAtrasadaDTO,
  ParcelaDTO,
  PrevisaoPeriodoDTO,
  RankingDTO,
  RegisterModel,
  StatusPagamento,
  TokenModel,
} from "@/types/dtos";

const API = import.meta.env.VITE_API_URL;

// Token "falso" só pra existir algo não-vazio guardado (não é um JWT de
// verdade — o front-end nesta parte só confere se ele existe, não decodifica).
function fakeToken(username: string) {
  return `mock.${username}.${Date.now()}`;
}

function dentroDoIntervalo(dataIso: string, inicio: string, fim: string) {
  const d = dataIso.slice(0, 10);
  return d >= inicio.slice(0, 10) && d <= fim.slice(0, 10);
}

// Fatia uma lista em memória do mesmo jeito que o QueryStringParameters +
// PagedList reais fazem no backend, devolvendo os mesmos metadados que
// normalmente vêm no header X-Pagination.
function paginar<T>(itens: T[], pageNumber: number, pageSize: number) {
  const totalCount = itens.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginaAtual = Math.min(Math.max(1, pageNumber || 1), totalPages);
  const inicio = (paginaAtual - 1) * pageSize;

  const pagination: PaginationMetadata = {
    currentPage: paginaAtual,
    totalPages,
    pageSize,
    totalCount,
    hasPrevious: paginaAtual > 1,
    hasNext: paginaAtual < totalPages,
  };

  return { items: itens.slice(inicio, inicio + pageSize), pagination };
}

function respostaPaginada<T>(itens: T[], pageNumber: number, pageSize: number) {
  const { items, pagination } = paginar(itens, pageNumber, pageSize);
  return HttpResponse.json(items, { headers: { "X-Pagination": JSON.stringify(pagination) } });
}

const PAGO: StatusPagamento = 2;
const PENDENTE: StatusPagamento = 1;

// ---- Helpers dos Relatórios ----
// Espelham exatamente a regra de `RelatorioService.cs` real (conferido
// 24/08): "atrasada" é status != Pago com vencimento no passado (não só
// Pendente — Atrasado também conta, diferente da simplificação já existente
// no handler de `/Parcelas/atrasadas`, que é mais restrito de propósito).

function diasAtraso(dataVencimentoIso: string): number {
  const vencimento = new Date(dataVencimentoIso.slice(0, 10) + "T00:00:00");
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((hoje.getTime() - vencimento.getTime()) / 86400000));
}

function estaAtrasada(p: ParcelaDTO): boolean {
  return p.status !== PAGO && diasAtraso(p.dataVencimento) > 0;
}

function somaPago(parcelas: ParcelaDTO[]): number {
  return parcelas.filter((p) => p.status === PAGO).reduce((soma, p) => soma + p.valor, 0);
}

function mapDocumentoExtrato(conta: ContaAPagarDTO | ContaAReceberDTO): ExtratoDocumentoDTO {
  return {
    documentoFinanceiroId: conta.documentoFinanceiroId,
    valorTotal: conta.valorTotal,
    parcelas: conta.parcelas.map((p) => ({
      parcelaId: p.parcelaId,
      valor: p.valor,
      dataVencimento: p.dataVencimento,
      dataPagamento: p.dataPagamento ?? null,
      status: p.status,
    })),
  };
}

export const handlers = [
  // ---- Auth ----

  http.post(`${API}/Auth/register`, async ({ request }) => {
    const body = (await request.json()) as RegisterModel;

    if (mockUsers.some((u) => u.username === body.username)) {
      return HttpResponse.json({ status: "Error", message: "Usuário já existe!" }, { status: 409 });
    }

    mockUsers.push({ username: body.username, email: body.email, password: body.password });
    return HttpResponse.json({ status: "Success", message: "Usuário criado com sucesso!" });
  }),

  http.post(`${API}/Auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginModel;
    const user = mockUsers.find((u) => u.username === body.username && u.password === body.password);

    if (!user) {
      return new HttpResponse(null, { status: 401 });
    }

    const token: TokenModel = {
      accessToken: fakeToken(user.username),
      refreshToken: `refresh.${user.username}`,
    };
    return HttpResponse.json(token);
  }),

  // ---- Previsão de Gastos e Recebimentos ----

  http.get(`${API}/Previsao`, ({ request }) => {
    const url = new URL(request.url);
    const inicio = url.searchParams.get("inicio") ?? "";
    const fim = url.searchParams.get("fim") ?? "";

    let previstoAReceber = 0;
    let previstoAPagar = 0;
    let realizadoAReceber = 0;
    let realizadoAPagar = 0;

    for (const conta of mockContasAPagar) {
      for (const p of conta.parcelas) {
        if (p.status === PAGO) {
          if (p.dataPagamento && dentroDoIntervalo(p.dataPagamento, inicio, fim)) realizadoAPagar += p.valor;
        } else if (dentroDoIntervalo(p.dataVencimento, inicio, fim)) {
          previstoAPagar += p.valor;
        }
      }
    }

    for (const conta of mockContasAReceber) {
      for (const p of conta.parcelas) {
        if (p.status === PAGO) {
          if (p.dataPagamento && dentroDoIntervalo(p.dataPagamento, inicio, fim)) realizadoAReceber += p.valor;
        } else if (dentroDoIntervalo(p.dataVencimento, inicio, fim)) {
          previstoAReceber += p.valor;
        }
      }
    }

    const resultado: PrevisaoPeriodoDTO = {
      inicio,
      fim,
      previsto: {
        totalAReceber: previstoAReceber,
        totalAPagar: previstoAPagar,
        saldo: previstoAReceber - previstoAPagar,
      },
      realizado: {
        totalAReceber: realizadoAReceber,
        totalAPagar: realizadoAPagar,
        saldo: realizadoAReceber - realizadoAPagar,
      },
    };
    return HttpResponse.json(resultado);
  }),

  // ---- Parcelas ----
  // Não existe POST avulso aqui, de propósito: parcela só nasce dentro do
  // corpo de uma ContaAPagar/ContaAReceber (ver handlers de "Lançar Conta"
  // mais abaixo) — imita o backend real, que também não tem esse endpoint.

  http.get(`${API}/Parcelas/periodo`, ({ request }) => {
    const url = new URL(request.url);
    const inicio = url.searchParams.get("inicio") ?? "";
    const fim = url.searchParams.get("fim") ?? "";

    const noPeriodo = allParcelasEnriquecidas()
      .filter((p) => dentroDoIntervalo(p.dataVencimento, inicio, fim))
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

    return HttpResponse.json(noPeriodo);
  }),

  // Aba "Atrasadas" da tela de Parcelas — mesma regra do backend real
  // (GetAtrasadasAsync): vencimento já passou e o status ainda é Pendente.
  http.get(`${API}/Parcelas/atrasadas`, () => {
    const agora = new Date();
    const atrasadas = allParcelasEnriquecidas()
      .filter((p) => p.status === PENDENTE && new Date(p.dataVencimento) < agora)
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

    return HttpResponse.json(atrasadas);
  }),

  // Aba "Todas" — listagem paginada, com filtro opcional por status.
  http.get(`${API}/Parcelas`, ({ request }) => {
    const url = new URL(request.url);
    const pageNumber = Number(url.searchParams.get("pageNumber") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const statusParam = url.searchParams.get("status");

    let todas = allParcelasEnriquecidas();
    if (statusParam) {
      todas = todas.filter((p) => p.status === Number(statusParam));
    }

    return respostaPaginada(todas, pageNumber, pageSize);
  }),

  // PUT genérico de Parcela — usado tanto por "dar baixa" (muda status/data-
  // Pagamento) quanto por "editar" (muda valor/dataVencimento). Sobrescreve
  // tudo que vem no corpo, igual o `_mapper.Map(parcelaDTO, existing)` real —
  // por isso o front sempre manda a linha inteira, não só o campo que mudou.
  http.put(`${API}/Parcelas/:id`, async ({ request, params }) => {
    const id = Number(params.id);
    const body = (await request.json()) as ParcelaDTO;

    for (const conta of [...mockContasAPagar, ...mockContasAReceber]) {
      const index = conta.parcelas.findIndex((p) => p.parcelaId === id);
      if (index !== -1) {
        conta.parcelas[index] = {
          ...conta.parcelas[index],
          valor: body.valor,
          dataVencimento: body.dataVencimento,
          status: body.status,
          dataPagamento: body.dataPagamento ?? null,
        };
        return HttpResponse.json(enriquecerParcela(conta.parcelas[index]));
      }
    }

    return HttpResponse.json("Parcela não encontrada", { status: 404 });
  }),

  // ---- Clientes ----

  http.get(`${API}/Clientes`, ({ request }) => {
    const url = new URL(request.url);
    const pageNumber = Number(url.searchParams.get("pageNumber") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    return respostaPaginada(mockClientes, pageNumber, pageSize);
  }),

  http.post(`${API}/Clientes`, async ({ request }) => {
    const body = (await request.json()) as ClienteDTO;
    const criado: ClienteDTO = { ...body, clienteId: proximoClienteId() };
    mockClientes.push(criado);
    return HttpResponse.json(criado, { status: 201 });
  }),

  http.put(`${API}/Clientes/:id`, async ({ request, params }) => {
    const id = Number(params.id);
    const index = mockClientes.findIndex((c) => c.clienteId === id);
    if (index === -1) return HttpResponse.json("Cliente não encontrado", { status: 404 });

    const body = (await request.json()) as ClienteDTO;
    mockClientes[index] = { ...body, clienteId: id };
    return HttpResponse.json(mockClientes[index]);
  }),

  http.delete(`${API}/Clientes/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockClientes.findIndex((c) => c.clienteId === id);
    if (index === -1) return HttpResponse.json("Cliente não encontrado", { status: 404 });

    mockClientes.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Fornecedores ----

  http.get(`${API}/Fornecedores`, ({ request }) => {
    const url = new URL(request.url);
    const pageNumber = Number(url.searchParams.get("pageNumber") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    return respostaPaginada(mockFornecedores, pageNumber, pageSize);
  }),

  http.post(`${API}/Fornecedores`, async ({ request }) => {
    const body = (await request.json()) as FornecedorDTO;
    const criado: FornecedorDTO = { ...body, fornecedorId: proximoFornecedorId() };
    mockFornecedores.push(criado);
    return HttpResponse.json(criado, { status: 201 });
  }),

  http.put(`${API}/Fornecedores/:id`, async ({ request, params }) => {
    const id = Number(params.id);
    const index = mockFornecedores.findIndex((f) => f.fornecedorId === id);
    if (index === -1) return HttpResponse.json("Fornecedor não encontrado", { status: 404 });

    const body = (await request.json()) as FornecedorDTO;
    mockFornecedores[index] = { ...body, fornecedorId: id };
    return HttpResponse.json(mockFornecedores[index]);
  }),

  http.delete(`${API}/Fornecedores/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockFornecedores.findIndex((f) => f.fornecedorId === id);
    if (index === -1) return HttpResponse.json("Fornecedor não encontrado", { status: 404 });

    mockFornecedores.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Contas a Pagar ----

  http.post(`${API}/ContasAPagar`, async ({ request }) => {
    const body = (await request.json()) as ContaAPagarDTO;

    if (body.fornecedorId != null && !mockFornecedores.some((f) => f.fornecedorId === body.fornecedorId)) {
      return HttpResponse.json("Fornecedor não encontrado", { status: 400 });
    }

    const documentoFinanceiroId = proximoDocumentoId();
    const parcelaIds = proximosParcelaIds(body.parcelas.length);
    const criada: ContaAPagarDTO = {
      ...body,
      documentoFinanceiroId,
      parcelas: body.parcelas.map((p, i) => ({ ...p, parcelaId: parcelaIds[i], documentoFinanceiroId })),
    };
    mockContasAPagar.push(criada);

    return HttpResponse.json(criada, { status: 201 });
  }),

  // Tela de Contas a Pagar — listagem paginada, com filtro opcional por categoria.
  http.get(`${API}/ContasAPagar`, ({ request }) => {
    const url = new URL(request.url);
    const pageNumber = Number(url.searchParams.get("pageNumber") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const categoriaParam = url.searchParams.get("categoria");

    let itens = mockContasAPagar;
    if (categoriaParam) {
      itens = itens.filter((c) => c.categoria === Number(categoriaParam));
    }

    return respostaPaginada(itens, pageNumber, pageSize);
  }),

  // Usado também pela modal de "editar parcela" (getContaPorParcela), pra saber o
  // valorTotal e as parcelas irmãs e calcular o aviso de "a soma deixou de bater".
  http.get(`${API}/ContasAPagar/:id`, ({ params }) => {
    const id = Number(params.id);
    const conta = mockContasAPagar.find((c) => c.documentoFinanceiroId === id);
    if (!conta) return HttpResponse.json("Conta a pagar não encontrada", { status: 404 });
    return HttpResponse.json(conta);
  }),

  // Exclui a conta inteira — não uma parcela avulsa. Como as parcelas ficam
  // aninhadas dentro da própria conta neste mock (mesma estrutura de
  // mockContasAPagar/mockContasAReceber), remover a conta já remove as
  // parcelas dela junto, imitando o ON DELETE CASCADE configurado no banco
  // real entre Parcela e DocumentoFinanceiro.
  http.delete(`${API}/ContasAPagar/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockContasAPagar.findIndex((c) => c.documentoFinanceiroId === id);
    if (index === -1) return HttpResponse.json("Conta a pagar não encontrada", { status: 404 });

    mockContasAPagar.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Contas a Receber ----

  http.post(`${API}/ContasAReceber`, async ({ request }) => {
    const body = (await request.json()) as ContaAReceberDTO;

    if (!mockClientes.some((c) => c.clienteId === body.clienteId)) {
      return HttpResponse.json("Cliente não encontrado", { status: 400 });
    }

    const documentoFinanceiroId = proximoDocumentoId();
    const parcelaIds = proximosParcelaIds(body.parcelas.length);
    const criada: ContaAReceberDTO = {
      ...body,
      documentoFinanceiroId,
      parcelas: body.parcelas.map((p, i) => ({ ...p, parcelaId: parcelaIds[i], documentoFinanceiroId })),
    };
    mockContasAReceber.push(criada);

    return HttpResponse.json(criada, { status: 201 });
  }),

  // Tela de Contas a Receber — listagem paginada (sem filtro de categoria, que
  // é exclusivo de Contas a Pagar).
  http.get(`${API}/ContasAReceber`, ({ request }) => {
    const url = new URL(request.url);
    const pageNumber = Number(url.searchParams.get("pageNumber") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    return respostaPaginada(mockContasAReceber, pageNumber, pageSize);
  }),

  http.get(`${API}/ContasAReceber/:id`, ({ params }) => {
    const id = Number(params.id);
    const conta = mockContasAReceber.find((c) => c.documentoFinanceiroId === id);
    if (!conta) return HttpResponse.json("Conta a receber não encontrada", { status: 404 });
    return HttpResponse.json(conta);
  }),

  http.delete(`${API}/ContasAReceber/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockContasAReceber.findIndex((c) => c.documentoFinanceiroId === id);
    if (index === -1) return HttpResponse.json("Conta a receber não encontrada", { status: 404 });

    mockContasAReceber.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---- Relatórios ----
  // Os 7 endpoints reais de RelatoriosController.cs, todo o cálculo (agrupar,
  // somar, filtrar) reproduzindo `RelatorioService.cs` sobre os mesmos
  // arrays em memória usados pelas outras telas — uma parcela dada baixa em
  // Parcelas, por exemplo, já aparece aqui sem nenhum handler adicional.

  // Relatório 1: parcelas de Contas a Receber atrasadas, agrupadas por cliente.
  http.get(`${API}/Relatorios/inadimplencia`, () => {
    const porCliente = new Map<number, InadimplenciaClienteDTO>();

    for (const conta of mockContasAReceber) {
      for (const p of conta.parcelas) {
        if (!estaAtrasada(p)) continue;
        const cliente = mockClientes.find((c) => c.clienteId === conta.clienteId);
        if (!cliente) continue;

        const grupo = porCliente.get(cliente.clienteId) ?? {
          clienteId: cliente.clienteId,
          nomeCliente: cliente.nome,
          valorTotalAtrasado: 0,
          parcelas: [] as ParcelaAtrasadaDTO[],
        };
        grupo.valorTotalAtrasado += p.valor;
        grupo.parcelas.push({
          parcelaId: p.parcelaId,
          documentoFinanceiroId: conta.documentoFinanceiroId,
          valor: p.valor,
          dataVencimento: p.dataVencimento,
          diasAtraso: diasAtraso(p.dataVencimento),
        });
        porCliente.set(cliente.clienteId, grupo);
      }
    }

    const resultado = [...porCliente.values()]
      .map((g) => ({ ...g, parcelas: g.parcelas.sort((a, b) => b.diasAtraso - a.diasAtraso) }))
      .sort((a, b) => b.valorTotalAtrasado - a.valorTotalAtrasado);

    return HttpResponse.json(resultado);
  }),

  // Relatório 2: parcelas de Contas a Pagar já pagas dentro do período, agrupadas por categoria.
  http.get(`${API}/Relatorios/gastos-por-categoria`, ({ request }) => {
    const url = new URL(request.url);
    const inicio = url.searchParams.get("inicio") ?? "";
    const fim = url.searchParams.get("fim") ?? "";

    const porCategoria = new Map<CategoriaGasto, number>();
    for (const conta of mockContasAPagar) {
      for (const p of conta.parcelas) {
        if (p.status !== PAGO || !p.dataPagamento) continue;
        if (!dentroDoIntervalo(p.dataPagamento, inicio, fim)) continue;
        porCategoria.set(conta.categoria, (porCategoria.get(conta.categoria) ?? 0) + p.valor);
      }
    }

    const resultado: GastoPorCategoriaDTO[] = [...porCategoria.entries()]
      .map(([categoria, valorTotal]) => ({ categoria, valorTotal }))
      .sort((a, b) => b.valorTotal - a.valorTotal);

    return HttpResponse.json(resultado);
  }),

  // Relatório 3a: extrato completo de um cliente (todos os documentos, pagos ou não).
  http.get(`${API}/Relatorios/extrato/cliente/:clienteId`, ({ params }) => {
    const id = Number(params.clienteId);
    const cliente = mockClientes.find((c) => c.clienteId === id);
    if (!cliente) return HttpResponse.json("Cliente não encontrado", { status: 404 });

    const contas = mockContasAReceber.filter((c) => c.clienteId === id);
    const extrato: ExtratoDTO = {
      entidadeId: cliente.clienteId,
      nomeEntidade: cliente.nome,
      valorTotalMovimentado: somaPago(contas.flatMap((c) => c.parcelas)),
      documentos: contas.map(mapDocumentoExtrato),
    };
    return HttpResponse.json(extrato);
  }),

  // Relatório 3b: extrato completo de um fornecedor.
  http.get(`${API}/Relatorios/extrato/fornecedor/:fornecedorId`, ({ params }) => {
    const id = Number(params.fornecedorId);
    const fornecedor = mockFornecedores.find((f) => f.fornecedorId === id);
    if (!fornecedor) return HttpResponse.json("Fornecedor não encontrado", { status: 404 });

    const contas = mockContasAPagar.filter((c) => c.fornecedorId === id);
    const extrato: ExtratoDTO = {
      entidadeId: fornecedor.fornecedorId,
      nomeEntidade: fornecedor.nome,
      valorTotalMovimentado: somaPago(contas.flatMap((c) => c.parcelas)),
      documentos: contas.map(mapDocumentoExtrato),
    };
    return HttpResponse.json(extrato);
  }),

  // Relatório 4: espelho do 1, do lado de quem se deve — agrupado por
  // fornecedor, com "Sem fornecedor" quando a conta não tem um informado.
  http.get(`${API}/Relatorios/contas-a-pagar-atrasadas`, () => {
    const porFornecedor = new Map<number | "sem-fornecedor", ContaAtrasadaFornecedorDTO>();

    for (const conta of mockContasAPagar) {
      for (const p of conta.parcelas) {
        if (!estaAtrasada(p)) continue;
        const fornecedor = mockFornecedores.find((f) => f.fornecedorId === conta.fornecedorId);
        const chave = fornecedor ? fornecedor.fornecedorId : "sem-fornecedor";

        const grupo = porFornecedor.get(chave) ?? {
          fornecedorId: fornecedor?.fornecedorId ?? null,
          nomeFornecedor: fornecedor?.nome ?? "Sem fornecedor",
          valorTotalAtrasado: 0,
          parcelas: [] as ParcelaAtrasadaDTO[],
        };
        grupo.valorTotalAtrasado += p.valor;
        grupo.parcelas.push({
          parcelaId: p.parcelaId,
          documentoFinanceiroId: conta.documentoFinanceiroId,
          valor: p.valor,
          dataVencimento: p.dataVencimento,
          diasAtraso: diasAtraso(p.dataVencimento),
        });
        porFornecedor.set(chave, grupo);
      }
    }

    const resultado = [...porFornecedor.values()]
      .map((g) => ({ ...g, parcelas: g.parcelas.sort((a, b) => b.diasAtraso - a.diasAtraso) }))
      .sort((a, b) => b.valorTotalAtrasado - a.valorTotalAtrasado);

    return HttpResponse.json(resultado);
  }),

  // Relatório 5a: ranking de clientes por valor já recebido — só entram os com valor > 0.
  http.get(`${API}/Relatorios/top-clientes`, ({ request }) => {
    const url = new URL(request.url);
    const quantidade = Number(url.searchParams.get("quantidade") ?? "10");

    const resultado: RankingDTO[] = mockClientes
      .map((cliente) => ({
        entidadeId: cliente.clienteId,
        nome: cliente.nome,
        valorTotalMovimentado: somaPago(
          mockContasAReceber.filter((c) => c.clienteId === cliente.clienteId).flatMap((c) => c.parcelas),
        ),
      }))
      .filter((r) => r.valorTotalMovimentado > 0)
      .sort((a, b) => b.valorTotalMovimentado - a.valorTotalMovimentado)
      .slice(0, quantidade);

    return HttpResponse.json(resultado);
  }),

  // Relatório 5b: ranking de fornecedores por valor já pago.
  http.get(`${API}/Relatorios/top-fornecedores`, ({ request }) => {
    const url = new URL(request.url);
    const quantidade = Number(url.searchParams.get("quantidade") ?? "10");

    const resultado: RankingDTO[] = mockFornecedores
      .map((fornecedor) => ({
        entidadeId: fornecedor.fornecedorId,
        nome: fornecedor.nome,
        valorTotalMovimentado: somaPago(
          mockContasAPagar.filter((c) => c.fornecedorId === fornecedor.fornecedorId).flatMap((c) => c.parcelas),
        ),
      }))
      .filter((r) => r.valorTotalMovimentado > 0)
      .sort((a, b) => b.valorTotalMovimentado - a.valorTotalMovimentado)
      .slice(0, quantidade);

    return HttpResponse.json(resultado);
  }),
];
