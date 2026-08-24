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
  // Calculados no backend a partir do DocumentoFinanceiro pai (Fornecedor/Cliente) —
  // só vêm preenchidos nas listagens que a tela de Parcelas usa (Atrasadas, Período,
  // paginada); no Get por id e na resposta do PUT (dar baixa) vêm null.
  tipo?: "APagar" | "AReceber" | null;
  nomeContraparte?: string | null;
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

// Metadados de paginação devolvidos no header `X-Pagination` pelos endpoints
// de listagem (Clientes, Fornecedores, ContasAPagar, ContasAReceber, Parcelas).
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// ---- Relatórios ----
// Conferidos contra `DTOs/RelatorioDTOs.cs` e `Services/Implementations/RelatorioService.cs`
// reais (24/08) — os comentários abaixo citam a regra de negócio exata usada
// no backend, pra quem for ler/mexer no mock saber o que reproduzir.

// Usada tanto na Inadimplência (relatório 1) quanto em Contas a Pagar
// Atrasadas (relatório 4) — mesma forma dos dois lados.
export interface ParcelaAtrasadaDTO {
  parcelaId: number;
  documentoFinanceiroId: number;
  valor: number;
  dataVencimento: string;
  diasAtraso: number;
}

// Relatório 1: parcelas de ContaAReceber com status != Pago e vencimento no
// passado, agrupadas por cliente.
export interface InadimplenciaClienteDTO {
  clienteId: number;
  nomeCliente: string;
  valorTotalAtrasado: number;
  parcelas: ParcelaAtrasadaDTO[];
}

// Relatório 4: espelho do 1, do lado de quem se deve. fornecedorId vem null
// quando a ContaAPagar não tem fornecedor informado (campo opcional) — nesse
// caso o backend agrupa como "Sem fornecedor" em vez de descartar a parcela.
export interface ContaAtrasadaFornecedorDTO {
  fornecedorId?: number | null;
  nomeFornecedor: string;
  valorTotalAtrasado: number;
  parcelas: ParcelaAtrasadaDTO[];
}

// Relatório 2: soma das parcelas de ContaAPagar com status Pago e
// DataPagamento dentro do período pedido, agrupada por CategoriaGasto.
export interface GastoPorCategoriaDTO {
  categoria: CategoriaGasto;
  valorTotal: number;
}

export interface ExtratoParcelaDTO {
  parcelaId: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: StatusPagamento;
}

export interface ExtratoDocumentoDTO {
  documentoFinanceiroId: number;
  valorTotal: number;
  parcelas: ExtratoParcelaDTO[];
}

// Relatório 3: histórico completo (todos os documentos, pagos ou não) de um
// Cliente ou Fornecedor. valorTotalMovimentado soma só as parcelas já pagas
// ("quanto já movimentou de fato"), diferente do valorTotal de cada
// documento (que é o valor total lançado, pago ou não).
export interface ExtratoDTO {
  entidadeId: number;
  nomeEntidade: string;
  valorTotalMovimentado: number;
  documentos: ExtratoDocumentoDTO[];
}

// Relatório 5: ranking por valor já pago — mesmo DTO serve pro ranking de
// clientes (top-clientes) e de fornecedores (top-fornecedores), endpoints
// diferentes no backend. Só entram entidades com valorTotalMovimentado > 0.
export interface RankingDTO {
  entidadeId: number;
  nome: string;
  valorTotalMovimentado: number;
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
