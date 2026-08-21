import { http, HttpResponse } from "msw";
import {
  mockClientes,
  mockContasAPagar,
  mockContasAReceber,
  mockFornecedores,
  mockUsers,
  proximoDocumentoId,
  proximosParcelaIds,
} from "./data";
import type {
  ContaAPagarDTO,
  ContaAReceberDTO,
  LoginModel,
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

const PAGO: StatusPagamento = 2;

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

  http.get(`${API}/Parcelas/periodo`, ({ request }) => {
    const url = new URL(request.url);
    const inicio = url.searchParams.get("inicio") ?? "";
    const fim = url.searchParams.get("fim") ?? "";

    const todas: ParcelaDTO[] = [
      ...mockContasAPagar.flatMap((c) => c.parcelas),
      ...mockContasAReceber.flatMap((c) => c.parcelas),
    ];

    const noPeriodo = todas
      .filter((p) => dentroDoIntervalo(p.dataVencimento, inicio, fim))
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

    return HttpResponse.json(noPeriodo);
  }),

  // ---- Clientes / Fornecedores (só listagem, usada nos selects do formulário) ----

  http.get(`${API}/Clientes`, () => HttpResponse.json(mockClientes)),
  http.get(`${API}/Fornecedores`, () => HttpResponse.json(mockFornecedores)),

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
