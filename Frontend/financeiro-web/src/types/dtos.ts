/**
 * Tipos espelhando os DTOs do backend (Financeiro.Api).
 *
 * Conferidos campo a campo contra o código C# real em
 * `Backend/Financeiro.Api/DTOs/*.cs` e `Domain/Enums/*.cs` (21/08) — a
 * ressalva que existia na Parte 1 ("escrito de memória, não conferido")
 * não vale mais para este arquivo.
 *
 * Duas coisas específicas do backend que valem lembrar:
 * - O ASP.NET Core usa camelCase por padrão no JSON (System.Text.Json),
 *   então "ClienteId" (C#) vira "clienteId" (JSON/TS) — os nomes abaixo já
 *   seguem esse padrão.
 * - Os enums (CategoriaGasto, StatusPagamento) NÃO têm um conversor pra
 *   string configurado no Program.cs, então trafegam como número mesmo
 *   (ex.: Categoria = 1), não como "Mercadoria". Por isso são tipados aqui
 *   como `number`, com um mapa separado (`CATEGORIA_GASTO_LABELS` etc.)
 *   pra exibição.
 */

// ---- Enums (valores numéricos, iguais ao C#) ----

export const CategoriaGasto = {
  Mercadoria: 1,
  Logistica: 2,
  Embalagem: 3,
  Outros: 4,
} as const;
export type CategoriaGasto = (typeof CategoriaGasto)[keyof typeof CategoriaGasto];

export const CATEGORIA_GASTO_LABELS: Record<CategoriaGasto, string> = {
  1: "Mercadoria",
  2: "Logística",
  3: "Embalagem",
  4: "Outros",
};

export const StatusPagamento = {
  Pendente: 1,
  Pago: 2,
  Atrasado: 3,
} as const;
export type StatusPagamento = (typeof StatusPagamento)[keyof typeof StatusPagamento];

export const STATUS_PAGAMENTO_LABELS: Record<StatusPagamento, string> = {
  1: "Pendente",
  2: "Pago",
  3: "Atrasado",
};

// ---- Entidades ----

export interface ClienteDTO {
  clienteId: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
}

export interface FornecedorDTO {
  fornecedorId: number;
  nome: string;
  cnpj: string;
}

export interface ParcelaDTO {
  parcelaId: number;
  valor: number;
  dataVencimento: string; // ISO date (yyyy-MM-dd ou yyyy-MM-ddTHH:mm:ss)
  dataPagamento?: string | null;
  status: StatusPagamento;
  documentoFinanceiroId: number;
}

// Base comum a ContaAPagar/ContaAReceber (TPH no backend).
export interface DocumentoFinanceiroDTO {
  documentoFinanceiroId: number;
  valorTotal: number;
  parcelas: ParcelaDTO[];
}

export interface ContaAPagarDTO extends DocumentoFinanceiroDTO {
  fornecedorId?: number | null;
  numeroNota?: string | null;
  descricao?: string | null;
  categoria: CategoriaGasto;
}

export interface ContaAReceberDTO extends DocumentoFinanceiroDTO {
  clienteId: number;
  dataVenda: string; // ISO date
}

// ---- Previsão de Gastos e Recebimentos ----

// Um bloco de totais — usado tanto pra "Previsto" quanto pra "Realizado".
// Importante: NÃO é saldo de caixa acumulado, é só "a receber menos a
// pagar" dentro do período consultado (decisão de escopo de 19/08).
export interface ResumoDTO {
  totalAReceber: number;
  totalAPagar: number;
  saldo: number;
}

export interface PrevisaoPeriodoDTO {
  inicio: string;
  fim: string;
  previsto: ResumoDTO; // parcelas não pagas, por DataVencimento
  realizado: ResumoDTO; // parcelas já pagas, por DataPagamento
}

// ---- Autenticação ----

export interface LoginModel {
  username: string;
  password: string;
}

export interface RegisterModel {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TokenModel {
  accessToken: string;
  refreshToken: string;
}

// Resposta genérica usada pelo AuthController (register, etc.)
export interface Response {
  status?: string;
  message?: string;
}

// Corpo padronizado devolvido pelo middleware de exceção da API.
export interface ErrorDetails {
  statusCode: number;
  message?: string;
  trace?: string;
}
