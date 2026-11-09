import { api } from "@/lib/api";
import type { CategoriaGasto, ContaAPagarDTO, PaginationMetadata } from "@/types/dtos";

export interface ContasAPagarPagedResult {
  items: ContaAPagarDTO[];
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

export async function getContasAPagarPaged(
  pageNumber: number,
  pageSize = 10,
  categoria?: CategoriaGasto,
): Promise<ContasAPagarPagedResult> {
  const params: Record<string, number> = { pageNumber, pageSize };
  if (categoria != null) params.categoria = categoria;
  const response = await api.get<ContaAPagarDTO[]>("/ContasAPagar", { params });
  return { items: response.data, pagination: lerPaginacao(response.headers["x-pagination"]) };
}

// a listagem paginada não traz as parcelas (só o Get por id inclui) — usado antes de
// excluir, pra avisar se alguma parcela já está paga
export async function getContaAPagarById(id: number): Promise<ContaAPagarDTO> {
  const { data } = await api.get<ContaAPagarDTO>(`/ContasAPagar/${id}`);
  return data;
}

// exclui a conta inteira, não uma parcela avulsa — backend tem ON DELETE CASCADE
// entre Parcela e DocumentoFinanceiro, as parcelas somem junto
export async function deleteContaAPagar(id: number): Promise<void> {
  await api.delete(`/ContasAPagar/${id}`);
}
