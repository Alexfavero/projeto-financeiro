import { api } from "@/lib/api";
import {
  StatusPagamento,
  type ContaAPagarDTO,
  type ContaAReceberDTO,
  type ParcelaDTO,
  type PaginationMetadata,
} from "@/types/dtos";

export interface ParcelasPagedResult {
  items: ParcelaDTO[];
  pagination: PaginationMetadata;
}

const PAGINACAO_PADRAO: PaginationMetadata = {
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  totalCount: 0,
  hasPrevious: false,
  hasNext: false,
};

function lerPaginacao(headerValue: unknown): PaginationMetadata {
  if (typeof headerValue !== "string" || !headerValue) return PAGINACAO_PADRAO;
  try {
    return JSON.parse(headerValue) as PaginationMetadata;
  } catch {
    return PAGINACAO_PADRAO;
  }
}

// Aba "Todas" da tela de Parcelas — listagem paginada, com filtro opcional por status.
export async function getParcelasPaged(
  pageNumber: number,
  pageSize = 10,
  status?: StatusPagamento,
): Promise<ParcelasPagedResult> {
  const params: Record<string, number> = { pageNumber, pageSize };
  if (status != null) params.status = status;
  const response = await api.get<ParcelaDTO[]>("/Parcelas", { params });
  return { items: response.data, pagination: lerPaginacao(response.headers["x-pagination"]) };
}

// Aba "Atrasadas" — parcelas pendentes com vencimento já passado.
export async function getParcelasAtrasadas(): Promise<ParcelaDTO[]> {
  const { data } = await api.get<ParcelaDTO[]>("/Parcelas/atrasadas");
  return data;
}

// Aba "Esta semana" (e também usado no Painel) — parcelas com vencimento no intervalo.
export async function getParcelasPorPeriodo(inicio: string, fim: string): Promise<ParcelaDTO[]> {
  const { data } = await api.get<ParcelaDTO[]>("/Parcelas/periodo", { params: { inicio, fim } });
  return data;
}

// Dar baixa reaproveita o PUT genérico de Parcela — o backend espera o DTO inteiro
// (não só o campo que mudou, senão os outros campos seriam sobrescritos com valor
// padrão), então partimos da própria linha já carregada na tela e só sobrescrevemos
// status/dataPagamento.
export async function darBaixa(parcela: ParcelaDTO, dataPagamento: string): Promise<ParcelaDTO> {
  const body: ParcelaDTO = { ...parcela, status: StatusPagamento.Pago, dataPagamento };
  const { data } = await api.put<ParcelaDTO>(`/Parcelas/${parcela.parcelaId}`, body);
  return data;
}

// Corrigir um lançamento com dado errado (valor ou data), sem excluir a
// conta inteira. Mesmo PUT genérico, sobrescrevendo valor/dataVencimento em
// vez de status/dataPagamento.
export async function editarParcela(parcela: ParcelaDTO, valor: number, dataVencimento: string): Promise<ParcelaDTO> {
  const body: ParcelaDTO = { ...parcela, valor, dataVencimento };
  const { data } = await api.put<ParcelaDTO>(`/Parcelas/${parcela.parcelaId}`, body);
  return data;
}

// Busca a conta pai (a pagar ou a receber, conforme o Tipo já calculado pelo
// backend) — usada só pela modal de editar parcela, pra avisar se a edição
// vai desbalancear a soma das parcelas em relação ao valor total da conta.
export async function getContaPorParcela(parcela: ParcelaDTO): Promise<ContaAPagarDTO | ContaAReceberDTO | null> {
  if (parcela.tipo === "APagar") {
    const { data } = await api.get<ContaAPagarDTO>(`/ContasAPagar/${parcela.documentoFinanceiroId}`);
    return data;
  }
  if (parcela.tipo === "AReceber") {
    const { data } = await api.get<ContaAReceberDTO>(`/ContasAReceber/${parcela.documentoFinanceiroId}`);
    return data;
  }
  return null;
}
