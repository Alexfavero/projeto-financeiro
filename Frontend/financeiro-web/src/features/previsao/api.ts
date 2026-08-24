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

// Busca todas as parcelas (sem filtro de data) pro gráfico "A Receber x A
// Pagar" do Painel — precisa do histórico inteiro pra poder agrupar em
// mês/ano no front (o backend não tem um endpoint de série temporal pronto,
// só o /Previsao, que devolve um total só pra um período, não quebrado por
// sub-período). pageSize bem maior que o padrão (10) porque aqui o objetivo
// é ter tudo num request só, não paginar de verdade — ok pro volume de
// dados de um TCC/uso pessoal; um volume muito maior no futuro pediria um
// endpoint de agregação dedicado no backend em vez disso.
export async function getTodasParcelasParaGrafico(): Promise<ParcelaDTO[]> {
  const { data } = await api.get<ParcelaDTO[]>("/Parcelas", { params: { pageNumber: 1, pageSize: 1000 } });
  return data;
}
