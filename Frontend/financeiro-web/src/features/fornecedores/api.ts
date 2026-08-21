import { api } from "@/lib/api";
import type { FornecedorDTO } from "@/types/dtos";

// Lista simples usada no select da tela de Lançar Conta. A tela de
// listagem/CRUD completa de Fornecedores (com paginação) fica pra Parte 3.
export async function listFornecedores(): Promise<FornecedorDTO[]> {
  const { data } = await api.get<FornecedorDTO[]>("/Fornecedores", { params: { pageSize: 100 } });
  return data;
}
