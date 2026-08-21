/**
 * Tipos espelhando os DTOs do backend (Financeiro.Api).
 *
 * IMPORTANTE: escritos de memória a partir do que já vimos do código C#
 * durante o projeto. Os nomes de campo devem bater com os DTOs reais, mas
 * antes de ligar isso na API de verdade (Parte 2 em diante), vale conferir
 * cada um contra o `.cs` correspondente em `Backend/Financeiro.Api/DTOs/`.
 */

export type StatusPagamento = "Pendente" | "Pago";

export type CategoriaGasto =
  | "Fornecedores"
  | "Aluguel"
  | "Salarios"
  | "Impostos"
  | "Outros";

export interface ClienteDTO {
  clienteId: number;
  nome: string;
  email?: string;
  endereco?: string;
  telefone?: string;
}

export interface FornecedorDTO {
  fornecedorId: number;
  nome: string;
  cnpj: string;
}

export interface ParcelaDTO {
  parcelaId: number;
  valor: number;
  dataVencimento: string; // ISO date
  dataPagamento?: string | null; // ISO date
  status: StatusPagamento;
  documentoFinanceiroId: number;
}

export interface ContaAPagarDTO {
  documentoFinanceiroId: number;
  valorTotal: number;
  categoria: CategoriaGasto;
  descricao?: string;
  numeroNota?: string;
  fornecedorId?: number | null;
  parcelas: ParcelaDTO[];
}

export interface ContaAReceberDTO {
  documentoFinanceiroId: number;
  valorTotal: number;
  clienteId: number;
  dataVenda: string; // ISO date
  parcelas: ParcelaDTO[];
}

export interface PrevisaoPeriodoDTO {
  entradasPrevistas: number;
  saidasPrevistas: number;
  entradasRealizadas: number;
  saidasRealizadas: number;
  resumo: {
    saldo: number;
  };
}

// ---- Autenticação ----

export interface LoginModel {
  email: string;
  password: string;
}

export interface RegisterModel {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface TokenModel {
  accessToken: string;
  refreshToken: string;
}

export interface ApiErrorResponse {
  status: string;
  message: string;
}
