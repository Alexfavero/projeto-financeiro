import { api } from "@/lib/api";
import type {
  ContaAtrasadaFornecedorDTO,
  ExtratoDTO,
  GastoPorCategoriaDTO,
  InadimplenciaClienteDTO,
  RankingDTO,
} from "@/types/dtos";

// Os 7 endpoints reais de RelatoriosController.cs — todos [Authorize],
// só leitura (nenhum POST/PUT/DELETE aqui).

export async function getInadimplencia(): Promise<InadimplenciaClienteDTO[]> {
  const { data } = await api.get<InadimplenciaClienteDTO[]>("/Relatorios/inadimplencia");
  return data;
}

export async function getContasAPagarAtrasadas(): Promise<ContaAtrasadaFornecedorDTO[]> {
  const { data } = await api.get<ContaAtrasadaFornecedorDTO[]>("/Relatorios/contas-a-pagar-atrasadas");
  return data;
}

// inicio/fim em yyyy-MM-dd — o backend valida fim >= inicio (400 se não).
export async function getGastosPorCategoria(inicio: string, fim: string): Promise<GastoPorCategoriaDTO[]> {
  const { data } = await api.get<GastoPorCategoriaDTO[]>("/Relatorios/gastos-por-categoria", {
    params: { inicio, fim },
  });
  return data;
}

export async function getExtratoCliente(clienteId: number): Promise<ExtratoDTO> {
  const { data } = await api.get<ExtratoDTO>(`/Relatorios/extrato/cliente/${clienteId}`);
  return data;
}

export async function getExtratoFornecedor(fornecedorId: number): Promise<ExtratoDTO> {
  const { data } = await api.get<ExtratoDTO>(`/Relatorios/extrato/fornecedor/${fornecedorId}`);
  return data;
}

export async function getTopClientes(quantidade = 10): Promise<RankingDTO[]> {
  const { data } = await api.get<RankingDTO[]>("/Relatorios/top-clientes", { params: { quantidade } });
  return data;
}

export async function getTopFornecedores(quantidade = 10): Promise<RankingDTO[]> {
  const { data } = await api.get<RankingDTO[]>("/Relatorios/top-fornecedores", { params: { quantidade } });
  return data;
}
