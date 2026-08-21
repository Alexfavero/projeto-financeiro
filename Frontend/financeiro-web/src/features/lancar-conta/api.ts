import { api } from "@/lib/api";
import type { ContaAPagarDTO, ContaAReceberDTO } from "@/types/dtos";

export async function criarContaAPagar(payload: ContaAPagarDTO): Promise<ContaAPagarDTO> {
  const { data } = await api.post<ContaAPagarDTO>("/ContasAPagar", payload);
  return data;
}

export async function criarContaAReceber(payload: ContaAReceberDTO): Promise<ContaAReceberDTO> {
  const { data } = await api.post<ContaAReceberDTO>("/ContasAReceber", payload);
  return data;
}
