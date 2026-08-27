import { api } from "@/lib/api";
import type { ParcelaDTO, PrevisaoPeriodoDTO } from "@/types/dtos";

export async function getPrevisaoPeriodo(inicio: string, fim: string): Promise<PrevisaoPeriodoDTO> {
  const { data } = await api.get<PrevisaoPeriodoDTO>("/Previsao", { params: { inicio, fim } });
  return data;
}

export async function getParcelasPeriodo(inicio: string, fim: string, excluirPagas?: boolean): Promise<ParcelaDTO[]> {
  const params: Record<string, string | boolean> = { inicio, fim };
  if (excluirPagas) params.excluirPagas = true;
  const { data } = await api.get<ParcelaDTO[]>("/Parcelas/periodo", { params });
  return data;
}

// busca todas as parcelas pro gráfico do Painel — precisa do histórico
// inteiro pra agrupar por mês/ano no front, já que /Previsao só devolve o
// total de um período, não quebrado por sub-período. pageSize grande pq é
// só um request com tudo, não paginação de verdade (ok pro volume de um TCC)
export async function getTodasParcelasParaGrafico(): Promise<ParcelaDTO[]> {
  const { data } = await api.get<ParcelaDTO[]>("/Parcelas", { params: { pageNumber: 1, pageSize: 1000 } });
  return data;
}
