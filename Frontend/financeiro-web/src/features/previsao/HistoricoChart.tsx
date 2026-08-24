import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { formatBRL } from "@/shared/utils/format";
import { StatusPagamento, type ParcelaDTO } from "@/types/dtos";
import { getTodasParcelasParaGrafico } from "./api";

type Escala = "mensal" | "anual" | "tudo";
type ModoDado = "realizado" | "previsto";

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

interface Bucket {
  chave: string;
  label: string;
  aReceber: number;
  aPagar: number;
}

// Um dia dentro do mês selecionado no "detalhe do mês" — quatro números em
// vez de dois, porque aqui "Já pago/recebido" e "Previsto" aparecem juntos
// (empilhados), não alternados por um botão de modo como no resto do
// gráfico.
interface BucketDiario {
  dia: number;
  label: string;
  aReceberPago: number;
  aReceberPendente: number;
  aPagarPago: number;
  aPagarPendente: number;
}

// Resumo de tudo que está sendo mostrado no gráfico no momento — os 4
// números "brutos" (recebido, pago, em aberto de cada lado) mais o saldo
// (recebido + a receber em aberto, menos pago + a pagar em aberto — ou
// seja, o resultado líquido esperado do período inteiro, já realizado ou
// ainda por vir). Independente do botão "modo": aqui os dois sempre entram
// juntos, porque é um resumo do que está no gráfico, não uma das duas
// visões alternadas.
interface TotaisPeriodo {
  recebido: number;
  pago: number;
  aReceberAberto: number;
  aPagarAberto: number;
  saldo: number;
}

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

// Gera a lista de chaves "yyyy-MM" dos últimos `qtd` meses, terminando no
// mês corrente (incluso).
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

// Quantos dias tem o mês "yyyy-MM" (o dia 0 do mês seguinte é sempre o
// último dia do mês atual — truque padrão do objeto Date do JS).
function diasNoMes(anoMes: string): number {
  const [ano, mes] = anoMes.split("-").map(Number);
  return new Date(ano, mes, 0).getDate();
}

// "Realizado" olha pra quem já foi de fato pago (Status Pago, por
// DataPagamento) — mesma regra do PrevisaoService. "Previsto" olha pro que
// ainda está por vir (Status != Pago, por DataVencimento).
function dadoRelevante(p: ParcelaDTO, modo: ModoDado): boolean {
  if (modo === "realizado") return p.status === StatusPagamento.Pago && !!p.dataPagamento;
  return p.status !== StatusPagamento.Pago;
}

function dataDoModo(p: ParcelaDTO, modo: ModoDado): string {
  return modo === "realizado" ? (p.dataPagamento as string) : p.dataVencimento;
}

// A "janela" de chaves (meses ou anos) que a escala atual está mostrando —
// extraído à parte de `construirBuckets` porque o resumo de totais
// (`construirTotaisGerais`) precisa da mesma janela, mas somando os dois
// status (pago e pendente) ao mesmo tempo, não só o do modo selecionado.
function obterJanela(parcelas: ParcelaDTO[], escala: Escala, modo: ModoDado): { chaves: string[]; porMes: boolean } {
  if (escala === "mensal") return { chaves: ultimosMeses(12), porMes: true };
  if (escala === "anual") return { chaves: ultimosAnos(5), porMes: false };

  // "Toda amplitude": olha o intervalo real dos dados do modo atual (do
  // mais antigo ao mais recente) e decide mês ou ano conforme o tamanho —
  // mês fica ilegível (barras demais) acima de ~2 anos de histórico.
  const relevantes = parcelas.filter((p) => dadoRelevante(p, modo));
  if (relevantes.length === 0) return { chaves: [], porMes: true };

  const datas = relevantes.map((p) => dataDoModo(p, modo)).sort();
  const min = new Date(datas[0].slice(0, 10) + "T00:00:00");
  const max = new Date(datas[datas.length - 1].slice(0, 10) + "T00:00:00");
  const totalMeses = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
  const porMes = totalMeses <= 24;

  if (porMes) {
    const chaves = Array.from({ length: totalMeses }, (_, i) => {
      const d = new Date(min.getFullYear(), min.getMonth() + i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
    return { chaves, porMes };
  }

  const totalAnos = max.getFullYear() - min.getFullYear() + 1;
  const chaves = Array.from({ length: totalAnos }, (_, i) => String(min.getFullYear() + i));
  return { chaves, porMes };
}

function construirBuckets(parcelas: ParcelaDTO[], escala: Escala, modo: ModoDado): Bucket[] {
  const relevantes = parcelas.filter((p) => dadoRelevante(p, modo));
  if (relevantes.length === 0) return [];

  const { chaves, porMes } = obterJanela(parcelas, escala, modo);

  const somaPorChave = new Map<string, { aReceber: number; aPagar: number }>();
  for (const chave of chaves) somaPorChave.set(chave, { aReceber: 0, aPagar: 0 });

  for (const p of relevantes) {
    const data = dataDoModo(p, modo);
    const chave = porMes ? chaveMes(data) : chaveAno(data);
    const bucket = somaPorChave.get(chave);
    if (!bucket) continue; // fora da janela fixa (só ocorre em "mensal"/"anual", que têm janela de tamanho fixo)
    if (p.tipo === "AReceber") bucket.aReceber += p.valor;
    else if (p.tipo === "APagar") bucket.aPagar += p.valor;
  }

  return chaves.map((chave) => ({
    chave,
    label: porMes ? labelDoMes(chave) : chave,
    ...somaPorChave.get(chave)!,
  }));
}

// Detalhe dia a dia de um único mês ("yyyy-MM"), pros dois lados (Contas a
// Receber e Contas a Pagar) e os dois status (pago/recebido x pendente) ao
// mesmo tempo — por isso não depende do "modo" (Realizado/Previsto), que só
// faz sentido na visão de vários meses/anos. Cada parcela entra em no
// máximo um dos dois grupos: pago/recebido (status Pago, por Data de
// Pagamento) OU pendente (status != Pago, vencendo dentro do mês, por Data
// de Vencimento) — nunca nos dois.
function construirBucketsDiarios(parcelas: ParcelaDTO[], anoMes: string): BucketDiario[] {
  const totalDias = diasNoMes(anoMes);
  const buckets: BucketDiario[] = Array.from({ length: totalDias }, (_, i) => ({
    dia: i + 1,
    label: String(i + 1).padStart(2, "0"),
    aReceberPago: 0,
    aReceberPendente: 0,
    aPagarPago: 0,
    aPagarPendente: 0,
  }));

  for (const p of parcelas) {
    if (p.status === StatusPagamento.Pago && p.dataPagamento && p.dataPagamento.slice(0, 7) === anoMes) {
      const dia = Number(p.dataPagamento.slice(8, 10));
      const bucket = buckets[dia - 1];
      if (bucket) {
        if (p.tipo === "AReceber") bucket.aReceberPago += p.valor;
        else if (p.tipo === "APagar") bucket.aPagarPago += p.valor;
      }
    } else if (p.status !== StatusPagamento.Pago && p.dataVencimento.slice(0, 7) === anoMes) {
      const dia = Number(p.dataVencimento.slice(8, 10));
      const bucket = buckets[dia - 1];
      if (bucket) {
        if (p.tipo === "AReceber") bucket.aReceberPendente += p.valor;
        else if (p.tipo === "APagar") bucket.aPagarPendente += p.valor;
      }
    }
  }

  return buckets;
}

// Resumo do que está dentro da janela (`chaves`) atualmente exibida na
// visão geral (Mensal/Anual/Todo o período) — soma recebido/pago/em aberto
// dos dois lados ao mesmo tempo, sem depender do "modo" selecionado (que só
// decide qual das duas séries vira barra no gráfico).
function construirTotaisGerais(parcelas: ParcelaDTO[], chaves: string[], porMes: boolean): TotaisPeriodo {
  const chaveSet = new Set(chaves);
  let recebido = 0;
  let pago = 0;
  let aReceberAberto = 0;
  let aPagarAberto = 0;

  for (const p of parcelas) {
    if (p.status === StatusPagamento.Pago && p.dataPagamento) {
      const chave = porMes ? chaveMes(p.dataPagamento) : chaveAno(p.dataPagamento);
      if (!chaveSet.has(chave)) continue;
      if (p.tipo === "AReceber") recebido += p.valor;
      else if (p.tipo === "APagar") pago += p.valor;
    } else if (p.status !== StatusPagamento.Pago) {
      const chave = porMes ? chaveMes(p.dataVencimento) : chaveAno(p.dataVencimento);
      if (!chaveSet.has(chave)) continue;
      if (p.tipo === "AReceber") aReceberAberto += p.valor;
      else if (p.tipo === "APagar") aPagarAberto += p.valor;
    }
  }

  return { recebido, pago, aReceberAberto, aPagarAberto, saldo: recebido + aReceberAberto - (pago + aPagarAberto) };
}

// Mesmo resumo, mas a partir dos buckets diários já calculados (soma os 30
// e poucos dias do mês em detalhe).
function totaisDosBucketsDiarios(buckets: BucketDiario[]): TotaisPeriodo {
  const recebido = buckets.reduce((soma, d) => soma + d.aReceberPago, 0);
  const pago = buckets.reduce((soma, d) => soma + d.aPagarPago, 0);
  const aReceberAberto = buckets.reduce((soma, d) => soma + d.aReceberPendente, 0);
  const aPagarAberto = buckets.reduce((soma, d) => soma + d.aPagarPendente, 0);
  return { recebido, pago, aReceberAberto, aPagarAberto, saldo: recebido + aReceberAberto - (pago + aPagarAberto) };
}

function formatarEixoY(valor: number): string {
  if (Math.abs(valor) >= 1000) return `${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1)}k`;
  return String(valor);
}

// Uma "pastilha" do resumo de totais — rótulo pequeno em cima, valor em
// baixo, cor conforme o tipo do número.
function PastilhaTotal({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: "good" | "critical" | "primary" }) {
  const corTexto = cor === "good" ? "text-good" : cor === "critical" ? "text-critical" : "text-primary";
  return (
    <div className="min-w-[110px]">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-secondary">{rotulo}</div>
      <div className={`text-sm font-bold ${corTexto}`}>{formatBRL(valor)}</div>
    </div>
  );
}

/**
 * Gráfico comparativo A Receber x A Pagar do Painel, com duas escolhas
 * independentes: a escala do agrupamento (Mensal = últimos 12 meses, Anual =
 * últimos 5 anos, Todo o período = desde a parcela mais antiga até hoje,
 * mês ou ano conforme o tamanho do intervalo) e o dado mostrado (Já
 * pago/recebido = Realizado, por Data de Pagamento; ou Previsto, por Data
 * de Vencimento — mesma distinção já usada nos cards do Painel e nos
 * relatórios de Gastos por Categoria/Ranking).
 *
 * Dentro da escala "Mensal" existe ainda um terceiro nível, opcional: um
 * seletor "ver detalhe de um mês", que troca a visão de "12 barras, uma por
 * mês" para "uma barra por dia daquele mês", com Já pago/recebido e
 * Previsto empilhados juntos em cada barra (em vez de alternados pelo botão
 * de modo, que fica escondido nesse estado).
 *
 * Acima do gráfico (abaixo dos botões) fica um resumo com 5 números —
 * Recebido, Pago, A Receber em aberto, A Pagar em aberto e Saldo — sempre
 * referentes exatamente ao que está sendo exibido no gráfico no momento
 * (a mesma janela de tempo, com os dois status somados juntos independente
 * do botão de modo).
 *
 * Busca o histórico inteiro de parcelas uma vez só (`getTodasParcelasParaGrafico`)
 * e faz todo o agrupamento no front — o backend não tem um endpoint de série
 * temporal pronto, só o /Previsao (um total por período, não quebrado por
 * sub-período).
 */
export function HistoricoChart() {
  const [escala, setEscala] = useState<Escala>("mensal");
  const [modo, setModo] = useState<ModoDado>("realizado");
  const [mesDetalhe, setMesDetalhe] = useState<string>(""); // "" = visão geral (12 meses); "yyyy-MM" = detalhe de um mês

  const query = useQuery({ queryKey: ["parcelas-todas-grafico"], queryFn: getTodasParcelasParaGrafico });

  // O seletor de mês só existe (e só tem efeito) dentro da escala Mensal —
  // trocar pra Anual/Todo o período volta pra visão normal daquela escala,
  // mas guarda a escolha de mês pro caso de o usuário voltar pra Mensal.
  const detalheAtivo = escala === "mensal" && mesDetalhe !== "";

  const mesesParaSelecao = useMemo(() => [...ultimosMeses(12)].reverse(), []);

  const janela = useMemo(
    () => (detalheAtivo ? { chaves: [], porMes: true } : obterJanela(query.data ?? [], escala, modo)),
    [query.data, escala, modo, detalheAtivo],
  );

  const dadosGerais = useMemo(
    () => (detalheAtivo ? [] : construirBuckets(query.data ?? [], escala, modo)),
    [query.data, escala, modo, detalheAtivo],
  );

  const dadosDiarios = useMemo(
    () => (detalheAtivo ? construirBucketsDiarios(query.data ?? [], mesDetalhe) : []),
    [query.data, detalheAtivo, mesDetalhe],
  );

  const temDadoDiario = dadosDiarios.some(
    (d) => d.aReceberPago || d.aReceberPendente || d.aPagarPago || d.aPagarPendente,
  );

  const totais = useMemo(() => {
    if (detalheAtivo) return temDadoDiario ? totaisDosBucketsDiarios(dadosDiarios) : null;
    return dadosGerais.length > 0 ? construirTotaisGerais(query.data ?? [], janela.chaves, janela.porMes) : null;
  }, [detalheAtivo, temDadoDiario, dadosDiarios, dadosGerais, query.data, janela]);

  return (
    <Card title="A Receber x A Pagar">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant={escala === "mensal" ? "primary" : "secondary"} size="sm" onClick={() => setEscala("mensal")}>
            Mensal
          </Button>
          <Button
            variant={escala === "anual" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setEscala("anual")}
          >
            Anual
          </Button>
          <Button variant={escala === "tudo" ? "primary" : "secondary"} size="sm" onClick={() => setEscala("tudo")}>
            Todo o período
          </Button>

          {escala === "mensal" && (
            <select
              value={mesDetalhe}
              onChange={(e) => setMesDetalhe(e.target.value)}
              className="ml-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Visão geral (12 meses)</option>
              {mesesParaSelecao.map((chave) => (
                <option key={chave} value={chave}>
                  Detalhar {labelMesCompleto(chave)}
                </option>
              ))}
            </select>
          )}
        </div>

        {!detalheAtivo && (
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={modo === "realizado" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setModo("realizado")}
            >
              Já pago/recebido
            </Button>
            <Button
              variant={modo === "previsto" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setModo("previsto")}
            >
              Previsto
            </Button>
          </div>
        )}
      </div>

      {detalheAtivo && (
        <p className="mb-3 text-xs text-ink-secondary">
          Mostrando pago/recebido e pendente juntos, dia a dia — a distinção Realizado/Previsto some aqui porque os
          dois já aparecem lado a lado em cada barra.
        </p>
      )}

      {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
      {query.isError && <p className="text-sm text-critical">Não foi possível carregar o histórico.</p>}

      {!query.isLoading && !query.isError && !detalheAtivo && dadosGerais.length === 0 && (
        <p className="text-sm text-ink-secondary">
          Sem dados suficientes pra montar o gráfico ainda
          {modo === "realizado" ? " — dê baixa em alguma parcela pra ver o histórico de pagamentos." : "."}
        </p>
      )}

      {!query.isLoading && !query.isError && detalheAtivo && !temDadoDiario && (
        <p className="text-sm text-ink-secondary">Nenhum lançamento pago, recebido ou pendente em {labelMesCompleto(mesDetalhe)}.</p>
      )}

      {totais && (
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-3 rounded-lg bg-surface-alt px-4 py-3">
          <PastilhaTotal rotulo="Recebido" valor={totais.recebido} cor="good" />
          <PastilhaTotal rotulo="Pago" valor={totais.pago} cor="critical" />
          <PastilhaTotal rotulo="A receber em aberto" valor={totais.aReceberAberto} cor="good" />
          <PastilhaTotal rotulo="A pagar em aberto" valor={totais.aPagarAberto} cor="critical" />
          <PastilhaTotal rotulo="Saldo do período" valor={totais.saldo} cor="primary" />
        </div>
      )}

      {!detalheAtivo && dadosGerais.length > 0 && (
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGerais} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgb(var(--color-ink-secondary))" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "rgb(var(--color-ink-secondary))" }}
                tickFormatter={formatarEixoY}
                width={40}
              />
              <Tooltip
                formatter={(valor: number) => formatBRL(valor)}
                contentStyle={{
                  backgroundColor: "rgb(var(--color-surface))",
                  border: "1px solid rgb(var(--color-border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="aReceber" name="A Receber" fill="rgb(var(--color-good))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="aPagar" name="A Pagar" fill="rgb(var(--color-critical))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {detalheAtivo && temDadoDiario && (
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosDiarios} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgb(var(--color-ink-secondary))" }} interval={1} />
              <YAxis
                tick={{ fontSize: 11, fill: "rgb(var(--color-ink-secondary))" }}
                tickFormatter={formatarEixoY}
                width={40}
              />
              <Tooltip
                formatter={(valor: number) => formatBRL(valor)}
                contentStyle={{
                  backgroundColor: "rgb(var(--color-surface))",
                  border: "1px solid rgb(var(--color-border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="aReceberPago"
                name="Recebido"
                stackId="receber"
                fill="rgb(var(--color-good))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="aReceberPendente"
                name="A receber (pendente)"
                stackId="receber"
                fill="rgb(var(--color-good) / 0.4)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="aPagarPago"
                name="Pago"
                stackId="pagar"
                fill="rgb(var(--color-critical))"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="aPagarPendente"
                name="A pagar (pendente)"
                stackId="pagar"
                fill="rgb(var(--color-critical) / 0.4)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
