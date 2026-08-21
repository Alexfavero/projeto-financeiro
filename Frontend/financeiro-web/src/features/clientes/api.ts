import { api } from "@/lib/api";
import type { ClienteDTO } from "@/types/dtos";

// Lista simples usada no select da tela de Lançar Conta. A tela de
// listagem/CRUD completa de Clientes (com paginação) fica pra Parte 3.
export async function listClientes(): Promise<ClienteDTO[]> {
  const { data } = await api.get<ClienteDTO[]>("/Clientes", { params: { pageSize: 100 } });
  return data;
}
