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
  ClienteDTO,
  ContaAPagarDTO,
  ContaAReceberDTO,
  FornecedorDTO,
  LoginModel,
  PaginationMetadata,
  ParcelaDTO,
  PrevisaoPeriodoDTO,
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

  // GET por id — usado pela modal de "editar parcela" pra saber o valorTotal
  // e as parcelas irmãs (calcula o aviso de "a soma deixou de bater").
  http.get(`${API}/ContasAPagar/:id`, ({ params }) => {
    const id = Number(params.id);
    const conta = mockContasAPagar.find((c) => c.documentoFinanceiroId === id);
    if (!conta) return HttpResponse.json("Conta a pagar não encontrada", { status: 404 });
    return HttpResponse.json(conta);
  }),

  http.get(`${API}/ContasAReceber/:id`, ({ params }) => {
    const id = Number(params.id);
    const conta = mockContasAReceber.find((c) => c.documentoFinanceiroId === id);
    if (!conta) return HttpResponse.json("Conta a receber não encontrada", { status: 404 });
    return HttpResponse.json(conta);
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

  // ---- Lançar Conta ----

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
];
