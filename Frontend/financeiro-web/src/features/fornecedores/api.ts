import { api } from "@/lib/api";
import type { FornecedorDTO, PaginationMetadata } from "@/types/dtos";
import type { FornecedorFormValues } from "./schema";

export interface FornecedoresPagedResult {
  items: FornecedorDTO[];
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

export async function getFornecedoresPaged(pageNumber: number, pageSize = 10): Promise<FornecedoresPagedResult> {
  const response = await api.get<FornecedorDTO[]>("/Fornecedores", { params: { pageNumber, pageSize } });
  return { items: response.data, pagination: lerPaginacao(response.headers["x-pagination"]) };
}

// Lista simples (até o máximo de 50 permitido pela API) usada no select da
// tela de Lançar Conta.
export async function listFornecedores(): Promise<FornecedorDTO[]> {
  const { items } = await getFornecedoresPaged(1, 50);
  return items;
}

export async function createFornecedor(dto: FornecedorFormValues): Promise<FornecedorDTO> {
  const { data } = await api.post<FornecedorDTO>("/Fornecedores", { fornecedorId: 0, ...dto });
  return data;
}

export async function updateFornecedor(id: number, dto: FornecedorFormValues): Promise<FornecedorDTO> {
  const { data } = await api.put<FornecedorDTO>(`/Fornecedores/${id}`, { fornecedorId: id, ...dto });
  return data;
}

export async function deleteFornecedor(id: number): Promise<void> {
  await api.delete(`/Fornecedores/${id}`);
}
