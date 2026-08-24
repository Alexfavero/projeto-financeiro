import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL } from "@/shared/utils/format";
import { getTopClientes, getTopFornecedores } from "../api";

type Tipo = "clientes" | "fornecedores";

// Relatório 5: quem mais pagou/foi pago — só entram entidades com valor > 0
// (regra do backend), então uma lista vazia aqui é normal antes de qualquer
// parcela ser dada baixa.
export function RankingTab() {
  const [tipo, setTipo] = useState<Tipo>("clientes");
  const [quantidade, setQuantidade] = useState(10);

  const query = useQuery({
    queryKey: ["relatorios", "ranking", tipo, quantidade],
    queryFn: () => (tipo === "clientes" ? getTopClientes(quantidade) : getTopFornecedores(quantidade)),
  });

  const itens = query.data ?? [];
  const maiorValor = Math.max(1, ...itens.map((i) => i.valorTotalMovimentado));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-2">
            <Button variant={tipo === "clientes" ? "primary" : "secondary"} size="sm" onClick={() => setTipo("clientes")}>
              Top Clientes
            </Button>
            <Button
              variant={tipo === "fornecedores" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTipo("fornecedores")}
            >
              Top Fornecedores
            </Button>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Quantidade
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="w-24 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </Card>

      <Card title={tipo === "clientes" ? "Clientes que mais compraram" : "Fornecedores com mais pagamentos"}>
        {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
        {query.isError && (
          <p className="text-sm text-critical">
            {extractApiErrorMessage(query.error, "Não foi possível carregar o ranking.")}
          </p>
        )}
        {!query.isLoading && !query.isError && itens.length === 0 && (
          <p className="text-sm text-ink-secondary">Nenhum dado de pagamento ainda.</p>
        )}
        {itens.length > 0 && (
          <div className="flex flex-col gap-3">
            {itens.map((item, i) => (
              <div key={item.entidadeId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">
                    <span className="mr-2 text-ink-secondary">#{i + 1}</span>
                    {item.nome}
                  </span>
                  <span className="text-ink-secondary">{formatBRL(item.valorTotalMovimentado)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(item.valorTotalMovimentado / maiorValor) * 100}%` }}
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
