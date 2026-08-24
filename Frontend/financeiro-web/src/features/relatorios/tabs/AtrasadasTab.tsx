import { useQuery } from "@tanstack/react-query";
import { Card } from "@/shared/components/Card";
import { extractApiErrorMessage } from "@/lib/api";
import { getContasAPagarAtrasadas } from "../api";
import { AtrasoGrupoCard } from "../AtrasoGrupoCard";

// espelho da Inadimplência do lado de quem se deve — agrupa por fornecedor,
// "Sem fornecedor" quando a conta não tem um informado (campo opcional)
export function AtrasadasTab() {
  const query = useQuery({
    queryKey: ["relatorios", "contas-a-pagar-atrasadas"],
    queryFn: getContasAPagarAtrasadas,
  });
  const itens = query.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      {query.isLoading && (
        <Card>
          <p className="text-sm text-ink-secondary">Carregando…</p>
        </Card>
      )}
      {query.isError && (
        <Card>
          <p className="text-sm text-critical">
            {extractApiErrorMessage(query.error, "Não foi possível carregar as contas a pagar atrasadas.")}
          </p>
        </Card>
      )}
      {!query.isLoading && !query.isError && itens.length === 0 && (
        <Card>
          <p className="text-sm text-ink-secondary">Nenhuma conta a pagar atrasada — tudo em dia.</p>
        </Card>
      )}
      {itens.map((fornecedor, i) => (
        <AtrasoGrupoCard
          key={fornecedor.fornecedorId ?? `sem-fornecedor-${i}`}
          titulo={fornecedor.nomeFornecedor}
          valorTotalAtrasado={fornecedor.valorTotalAtrasado}
          parcelas={fornecedor.parcelas}
        />
      ))}
    </div>
  );
}
