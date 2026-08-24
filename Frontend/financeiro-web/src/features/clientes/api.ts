import { api } from "@/lib/api";
import type { ClienteDTO, PaginationMetadata } from "@/types/dtos";
import type { ClienteFormValues } from "./schema";

export interface ClientesPagedResult {
  items: ClienteDTO[];
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

export async function getClientesPaged(pageNumber: number, pageSize = 10): Promise<ClientesPagedResult> {
  const response = await api.get<ClienteDTO[]>("/Clientes", { params: { pageNumber, pageSize } });
  return { items: response.data, pagination: lerPaginacao(response.headers["x-pagination"]) };
}

// Lista simples (até o máximo de 50 permitido pela API) usada no select da
// tela de Lançar Conta.
export async function listClientes(): Promise<ClienteDTO[]> {
  const { items } = await getClientesPaged(1, 50);
  return items;
}

// Campos opcionais em branco viram `null`, não string vazia: o backend
// valida `[EmailAddress]` mesmo em campo não obrigatório, e uma string vazia
// reprova essa validação (só `null` é tratado como "não informado").
function paraDTO(id: number, dto: ClienteFormValues): ClienteDTO {
  return {
    clienteId: id,
    nome: dto.nome,
    email: dto.email || null,
    telefone: dto.telefone || null,
    endereco: dto.endereco || null,
  };
}

export async function createCliente(dto: ClienteFormValues): Promise<ClienteDTO> {
  const { data } = await api.post<ClienteDTO>("/Clientes", paraDTO(0, dto));
  return data;
}

export async function updateCliente(id: number, dto: ClienteFormValues): Promise<ClienteDTO> {
  const { data } = await api.put<ClienteDTO>(`/Clientes/${id}`, paraDTO(id, dto));
  return data;
}

export async function deleteCliente(id: number): Promise<void> {
  await api.delete(`/Clientes/${id}`);
}
