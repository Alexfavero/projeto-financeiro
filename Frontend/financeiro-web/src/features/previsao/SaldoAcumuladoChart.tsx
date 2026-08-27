import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { formatBRL } from "@/shared/utils/format";
import { StatusPagamento, type ParcelaDTO } from "@/types/dtos";
import { getTodasParcelasParaGrafico } from "./api";

// Componente irmão do HistoricoChart, mas resolve um problema diferente: o
// HistoricoChart soma tudo de um período de uma vez só (ex: o mês inteiro),
// então se o começo do mês tem muito a receber e o fim tem muito a pagar, o
// saldo pode aparecer positivo no total mesmo tendo passado por dias no
// vermelho (ou vice-versa). Aqui a soma é acumulada dia a dia (ou mês a mês,
// dependendo da escala), pra mostrar a trajetória real do saldo dentro do
// período, não só o resultado final.
//
// Importante: isso NÃO é um saldo de caixa de verdade (o sistema não
// persiste conta/caixa nenhum, ver "Decisão de escopo" no status do
// projeto) — é só uma soma acumulada calculada em cima das mesmas Parcelas
// de sempre (Realizado pela DataPagamento, Previsto pela DataVencimento),
// só pra fins de visualização.

type EscalaSaldo = "mensal" | "anual" | "tudo";

interface PontoSaldo {
  chave: string;
  label: string;
  saldo: number;
}

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_COMPLETOS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function chaveMes(iso: string): string {
  return iso.slice(0, 7); // "yyyy-MM"
}

function chaveAno(iso: string): string {
  return iso.slice(0, 4);
}

function labelDoMes(chave: string): string {
  const [ano, mes] = chave.split("-");
  return `${MESES_ABREV[Number(mes) - 1]}/${ano.slice(2)}`;
}

function labelMesCompleto(chave: string): string {
  const [ano, mes] = chave.split("-");
  const nome = MESES_COMPLETOS[Number(mes) - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

function mesAtualISO(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

function ultimosMeses(qtd: number): string[] {
  const hoje = new Date();
  return Array.from({ length: qtd }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - (qtd - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

function ultimosAnos(qtd: number): string[] {
  const anoAtual = new Date().getFullYear();
  return Array.from({ length: qtd }, (_, i) => String(anoAtual - (qtd - 1 - i)));
}

// dia 0 do mês seguinte = último dia do mês atual (truque do Date do JS)
function diasNoMes(anoMes: string): number {
  const [ano, mes] = anoMes.split("-").map(Number);
  return new Date(ano, mes, 0).getDate();
}

function formatarEixoY(valor: number): string {
  if (Math.abs(valor) >= 1000) return `${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1)}k`;
  return String(valor);
}

// movimento líquido de uma parcela: positivo se é a receber, negativo se é
// a pagar — a base de tudo aqui é somar esses movimentos e ir acumulando
function movimentoSinalizado(p: ParcelaDTO): number {
  if (p.tipo === "AReceber") return p.valor;
  if (p.tipo === "APagar") return -p.valor;
  return 0;
}

// escala "Mensal": acumulado dia a dia dentro de um único mês. Cada parcela
// entra pela DataPagamento se já foi baixada, ou pela DataVencimento se
// ainda está pendente — mistura Realizado e Previsto na mesma linha, o que
// é exatamente o ponto (ver comentário no topo do arquivo)
function construirSaldoDiario(parcelas: ParcelaDTO[], anoMes: string): PontoSaldo[] {
  const totalDias = diasNoMes(anoMes);
  const movimentoPorDia = Array.from({ length: totalDias }, () => 0);

  for (const p of parcelas) {
    if (p.status === StatusPagamento.Pago && p.dataPagamento && p.dataPagamento.slice(0, 7) === anoMes) {
      const dia = Number(p.dataPagamento.slice(8, 10));
      if (dia >= 1 && dia <= totalDias) movimentoPorDia[dia - 1] += movimentoSinalizado(p);
    } else if (p.status !== StatusPagamento.Pago && p.dataVencimento.slice(0, 7) === anoMes) {
      const dia = Number(p.dataVencimento.slice(8, 10));
      if (dia >= 1 && dia <= totalDias) movimentoPorDia[dia - 1] += movimentoSinalizado(p);
    }
  }

  let acumulado = 0;
  return movimentoPorDia.map((mov, i) => {
    acumulado += mov;
    return { chave: String(i + 1), label: String(i + 1).padStart(2, "0"), saldo: acumulado };
  });
}

// soma o movimento de cada parcela na chave (mês ou ano) certa e devolve os
// pontos já com o acumulado — reaproveitado pela escala Anual e por "Tudo"
function acumularPorChave(parcelas: ParcelaDTO[], chaves: string[], porMes: boolean): PontoSaldo[] {
  const movimentoPorChave = new Map<string, number>(chaves.map((c) => [c, 0]));

  for (const p of parcelas) {
    let chave: string | null = null;
    if (p.status === StatusPagamento.Pago && p.dataPagamento) {
      chave = porMes ? chaveMes(p.dataPagamento) : chaveAno(p.dataPagamento);
    } else if (p.status !== StatusPagamento.Pago) {
      chave = porMes ? chaveMes(p.dataVencimento) : chaveAno(p.dataVencimento);
    }
    if (chave === null || !movimentoPorChave.has(chave)) continue;
    movimentoPorChave.set(chave, movimentoPorChave.get(chave)! + movimentoSinalizado(p));
  }

  let acumulado = 0;
  return chaves.map((chave) => {
    acumulado += movimentoPorChave.get(chave)!;
    return { chave, label: porMes ? labelDoMes(chave) : chave, saldo: acumulado };
  });
}

// escala "Anual": acumulado mês a mês dentro de um único ano
function construirSaldoMensal(parcelas: ParcelaDTO[], ano: string): PontoSaldo[] {
  const chaves = Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`);
  return acumularPorChave(parcelas, chaves, true);
}

// escala "Todo o período": mesmo critério de janela do HistoricoChart (por
// mês se o intervalo tiver até 24 meses, por ano se for maior), mas aqui
// sempre olhando Realizado + Previsto juntos, já que não existe um "modo"
// nesse gráfico
function construirSaldoTudo(parcelas: ParcelaDTO[]): PontoSaldo[] {
  const relevantes = parcelas.filter(
    (p) => (p.status === StatusPagamento.Pago && !!p.dataPagamento) || p.status !== StatusPagamento.Pago,
  );
  if (relevantes.length === 0) return [];

  const datas = relevantes
    .map((p) => (p.status === StatusPagamento.Pago ? (p.dataPagamento as string) : p.dataVencimento))
    .sort();
  const min = new Date(datas[0].slice(0, 10) + "T00:00:00");
  const max = new Date(datas[datas.length - 1].slice(0, 10) + "T00:00:00");
  const totalMeses = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
  const porMes = totalMeses <= 24;

  if (porMes) {
    const chaves = Array.from({ length: totalMeses }, (_, i) => {
      const d = new Date(min.getFullYear(), min.getMonth() + i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    return acumularPorChave(parcelas, chaves, true);
  }

  const totalAnos = max.getFullYear() - min.getFullYear() + 1;
  const chaves = Array.from({ length: totalAnos }, (_, i) => String(min.getFullYear() + i));
  return acumularPorChave(parcelas, chaves, false);
}

export function SaldoAcumuladoChart() {
  const [escala, setEscala] = useState<EscalaSaldo>("mensal");
  const [mesSelecionado, setMesSelecionado] = useState<string>(mesAtualISO());
  const [anoSelecionado, setAnoSelecionado] = useState<string>(String(new Date().getFullYear()));

  const query = useQuery({ queryKey: ["parcelas-todas-grafico"], queryFn: getTodasParcelasParaGrafico });

  const mesesParaSelecao = useMemo(() => [...ultimosMeses(12)].reverse(), []);
  const anosParaSelecao = useMemo(() => [...ultimosAnos(5)].reverse(), []);

  const pontos = useMemo(() => {
    const dados = query.data ?? [];
    if (escala === "mensal") return construirSaldoDiario(dados, mesSelecionado);
    if (escala === "anual") return construirSaldoMensal(dados, anoSelecionado);
    return construirSaldoTudo(dados);
  }, [query.data, escala, mesSelecionado, anoSelecionado]);

  const saldoFinal = pontos.length > 0 ? pontos[pontos.length - 1].saldo : 0;
  const corSaldo = saldoFinal > 0 ? "text-good" : saldoFinal < 0 ? "text-critical" : "text-ink-secondary";
  const temPontoNegativo = pontos.some((p) => p.saldo < 0);

  return (
    <Card title="Saldo Acumulado">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant={escala === "mensal" ? "primary" : "secondary"} size="sm" onClick={() => setEscala("mensal")}>
            Mensal
          </Button>
          <Button variant={escala === "anual" ? "primary" : "secondary"} size="sm" onClick={() => setEscala("anual")}>
            Anual
          </Button>
          <Button variant={escala === "tudo" ? "primary" : "secondary"} size="sm" onClick={() => setEscala("tudo")}>
            Todo o período
          </Button>

          {escala === "mensal" && (
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="ml-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:ring-2 focus:ring-primary/30"
            >
              {mesesParaSelecao.map((chave) => (
                <option key={chave} value={chave}>
                  {labelMesCompleto(chave)}
                </option>
              ))}
            </select>
          )}

          {escala === "anual" && (
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(e.target.value)}
              className="ml-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:ring-2 focus:ring-primary/30"
            >
              {anosParaSelecao.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          )}
        </div>

        {pontos.length > 0 && (
          <div className="min-w-[150px] text-right">
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-secondary">
              Saldo ao final do período
            </div>
            <div className={`text-lg font-bold ${corSaldo}`}>{formatBRL(saldoFinal)}</div>
          </div>
        )}
      </div>

      <p className="mb-3 text-xs text-ink-secondary">
        Soma o que já foi recebido/pago com o que ainda está previsto, acumulando dia a dia (ou mês a mês), pra
        mostrar se o saldo fica negativo em algum momento do período — não só o resultado final.
      </p>

      {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
      {query.isError && <p className="text-sm text-critical">Não foi possível carregar o saldo acumulado.</p>}

      {!query.isLoading && !query.isError && pontos.length === 0 && (
        <p className="text-sm text-ink-secondary">Sem lançamentos suficientes pra montar o saldo acumulado nesse período.</p>
      )}

      {pontos.length > 0 && (
        <div className="h-[260px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pontos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="saldoAcumuladoGradiente" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "rgb(var(--color-ink-secondary))" }}
                interval={escala === "mensal" ? 1 : 0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgb(var(--color-ink-secondary))" }}
                tickFormatter={formatarEixoY}
                width={44}
              />
              <Tooltip
                formatter={(valor: number) => formatBRL(valor)}
                labelFormatter={(label) => (escala === "mensal" ? `Dia ${label}` : label)}
                contentStyle={{
                  backgroundColor: "rgb(var(--color-surface))",
                  border: "1px solid rgb(var(--color-border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={0}
                stroke={temPontoNegativo ? "rgb(var(--color-critical))" : "rgb(var(--color-border))"}
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="saldo"
                name="Saldo acumulado"
                stroke="rgb(var(--color-primary))"
                strokeWidth={2}
                fill="url(#saldoAcumuladoGradiente)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
