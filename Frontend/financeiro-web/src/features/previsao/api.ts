import { api } from "@/lib/api";
import type { ParcelaDTO, PrevisaoPeriodoDTO } from "@/types/dtos";

export async function getPrevisaoPeriodo(inicio: string, fim: string): Promise<PrevisaoPeriodoDTO> {
  const { data } = await api.get<PrevisaoPeriodoDTO>("/Previsao", { params: { inicio, fim } });
  return data;
}

export async function getParcelasPeriodo(inicio: string, fim: string): Promise<ParcelaDTO[]> {
  const { data } = await api.get<ParcelaDTO[]>("/Parcelas/periodo", { params: { inicio, fim } });
  return data;
}
