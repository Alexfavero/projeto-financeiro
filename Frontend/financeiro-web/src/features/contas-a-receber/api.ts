import { api } from "@/lib/api";
import type { ContaAReceberDTO, PaginationMetadata } from "@/types/dtos";

export interface ContasAReceberPagedResult {
  items: ContaAReceberDTO[];
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

// Sem filtro de categoria aqui — Categoria é campo exclusivo de ContaAPagar
// (ContaAReceberParameters no backend real não tem esse campo).
export async function getContasAReceberPaged(pageNumber: number, pageSize = 10): Promise<ContasAReceberPagedResult> {
  const response = await api.get<ContaAReceberDTO[]>("/ContasAReceber", { params: { pageNumber, pageSize } });
  return { items: response.data, pagination: lerPaginacao(response.headers["x-pagination"]) };
}

// Exclui a conta inteira — mesmo raciocínio de deleteContaAPagar (cascade
// já cuida das parcelas).
export async function deleteContaAReceber(id: number): Promise<void> {
  await api.delete(`/ContasAReceber/${id}`);
}
