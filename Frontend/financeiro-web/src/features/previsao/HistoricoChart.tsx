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

interface Bucket {
  chave: string;
  label: string;
  aReceber: number;
  aPagar: number;
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

function construirBuckets(parcelas: ParcelaDTO[], escala: Escala, modo: ModoDado): Bucket[] {
  const relevantes = parcelas.filter((p) => dadoRelevante(p, modo));
  if (relevantes.length === 0) return [];

  let porMes: boolean;
  let chaves: string[];

  if (escala === "mensal") {
    porMes = true;
    chaves = ultimosMeses(12);
  } else if (escala === "anual") {
    porMes = false;
    chaves = ultimosAnos(5);
  } else {
    // "Toda amplitude": olha o intervalo real dos dados (do mais antigo ao
    // mais recente) e decide mês ou ano conforme o tamanho — mês fica
    // ilegível (barras demais) acima de ~2 anos de histórico.
    const datas = relevantes.map((p) => dataDoModo(p, modo)).sort();
    const min = new Date(datas[0].slice(0, 10) + "T00:00:00");
    const max = new Date(datas[datas.length - 1].slice(0, 10) + "T00:00:00");
    const totalMeses = (max.getFullYear() - min.getFullYear()) * 12 + (max.getMonth() - min.getMonth()) + 1;
    porMes = totalMeses <= 24;

    if (porMes) {
      chaves = Array.from({ length: totalMeses }, (_, i) => {
        const d = new Date(min.getFullYear(), min.getMonth() + i, 1);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      });
    } else {
      const totalAnos = max.getFullYear() - min.getFullYear() + 1;
      chaves = Array.from({ length: totalAnos }, (_, i) => String(min.getFullYear() + i));
    }
  }

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

function formatarEixoY(valor: number): string {
  if (Math.abs(valor) >= 1000) return `${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1)}k`;
  return String(valor);
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
 * Busca o histórico inteiro de parcelas uma vez só (`getTodasParcelasParaGrafico`)
 * e faz todo o agrupamento no front — o backend não tem um endpoint de série
 * temporal pronto, só o /Previsao (um total por período, não quebrado por
 * sub-período).
 */
export function HistoricoChart() {
  const [escala, setEscala] = useState<Escala>("mensal");
  const [modo, setModo] = useState<ModoDado>("realizado");

  const query = useQuery({ queryKey: ["parcelas-todas-grafico"], queryFn: getTodasParcelasParaGrafico });

  const dados = useMemo(() => construirBuckets(query.data ?? [], escala, modo), [query.data, escala, modo]);

  return (
    <Card title="A Receber x A Pagar">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Button variant={escala === "mensal" ? "primary" : "secondary"} size="sm" onClick={() => setEscala("mensal")}>
            Mensal
          </Button>
          <Button variant={escala === "anual" ? "primary" : "secondary"} size="sm" onClick={() => setEscala("anual")}>
            Anual
          </Button>
          <Button variant={escala === "tudo" ? "primary" : "secondary"} size="sm" onClick={() => setEscala("tudo")}>
            Todo o período
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={modo === "realizado" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setModo("realizado")}
          >
            Já pago/recebido
          </Button>
          <Button variant={modo === "previsto" ? "primary" : "secondary"} size="sm" onClick={() => setModo("previsto")}>
            Previsto
          </Button>
        </div>
      </div>

      {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
      {query.isError && <p className="text-sm text-critical">Não foi possível carregar o histórico.</p>}
      {!query.isLoading && !query.isError && dados.length === 0 && (
        <p className="text-sm text-ink-secondary">
          Sem dados suficientes pra montar o gráfico ainda
          {modo === "realizado" ? " — dê baixa em alguma parcela pra ver o histórico de pagamentos." : "."}
        </p>
      )}

      {dados.length > 0 && (
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
    </Card>
  );
}
