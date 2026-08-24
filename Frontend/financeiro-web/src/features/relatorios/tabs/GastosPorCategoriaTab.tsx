import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL, primeiroDiaMesISO, ultimoDiaMesISO } from "@/shared/utils/format";
import { CATEGORIA_GASTO_LABELS } from "@/types/dtos";
import { getGastosPorCategoria } from "../api";

const inicioMesPadrao = primeiroDiaMesISO();
const fimMesPadrao = ultimoDiaMesISO();

// Relatório 2: gastos já pagos (não previstos) no período, agrupados por
// categoria — mês corrente por padrão, com filtro de data pra outros
// períodos. Sem gráfico de biblioteca externa (Recharts, cogitado na
// arquitetura original) pra não introduzir uma dependência nova só pra 4
// categorias — uma barra de progresso simples (%  do maior valor) resolve.
export function GastosPorCategoriaTab() {
  const [inicio, setInicio] = useState(inicioMesPadrao);
  const [fim, setFim] = useState(fimMesPadrao);
  const [periodoAplicado, setPeriodoAplicado] = useState({ inicio: inicioMesPadrao, fim: fimMesPadrao });

  const query = useQuery({
    queryKey: ["relatorios", "gastos-por-categoria", periodoAplicado.inicio, periodoAplicado.fim],
    queryFn: () => getGastosPorCategoria(periodoAplicado.inicio, periodoAplicado.fim),
  });

  const itens = query.data ?? [];
  const maiorValor = Math.max(1, ...itens.map((i) => i.valorTotal));
  const total = itens.reduce((soma, i) => soma + i.valorTotal, 0);
  const periodoInvalido = fim < inicio;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">De</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">Até</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <Button size="sm" onClick={() => setPeriodoAplicado({ inicio, fim })} disabled={periodoInvalido}>
            Filtrar
          </Button>
        </div>
        {periodoInvalido && <p className="mt-2 text-xs text-critical">A data final não pode ser anterior à inicial.</p>}
      </Card>

      <Card title={`Gastos pagos no período (total: ${formatBRL(total)})`}>
        {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
        {query.isError && (
          <p className="text-sm text-critical">
            {extractApiErrorMessage(query.error, "Não foi possível carregar os gastos por categoria.")}
          </p>
        )}
        {!query.isLoading && !query.isError && itens.length === 0 && (
          <p className="text-sm text-ink-secondary">Nenhum gasto pago nesse período.</p>
        )}
        {itens.length > 0 && (
          <div className="flex flex-col gap-3">
            {itens.map((item) => (
              <div key={item.categoria}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{CATEGORIA_GASTO_LABELS[item.categoria]}</span>
                  <span className="text-ink-secondary">{formatBRL(item.valorTotal)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(item.valorTotal / maiorValor) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
