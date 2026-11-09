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

// sem filtro de categoria: esse campo é exclusivo de ContaAPagar no backend
export async function getContasAReceberPaged(pageNumber: number, pageSize = 10): Promise<ContasAReceberPagedResult> {
  const response = await api.get<ContaAReceberDTO[]>("/ContasAReceber", { params: { pageNumber, pageSize } });
  return { items: response.data, pagination: lerPaginacao(response.headers["x-pagination"]) };
}

// a listagem paginada não traz as parcelas (só o Get por id inclui) — usado antes de
// excluir, pra avisar se alguma parcela já está paga
export async function getContaAReceberById(id: number): Promise<ContaAReceberDTO> {
  const { data } = await api.get<ContaAReceberDTO>(`/ContasAReceber/${id}`);
  return data;
}

// exclui a conta inteira — mesmo raciocínio de deleteContaAPagar
export async function deleteContaAReceber(id: number): Promise<void> {
  await api.delete(`/ContasAReceber/${id}`);
}
