import { useQuery } from "@tanstack/react-query";
import { Card } from "@/shared/components/Card";
import { extractApiErrorMessage } from "@/lib/api";
import { getInadimplencia } from "../api";
import { AtrasoGrupoCard } from "../AtrasoGrupoCard";

// Relatório 1: parcelas de Contas a Receber atrasadas, agrupadas por
// cliente — a pergunta "quem me deve e há quanto tempo".
export function InadimplenciaTab() {
  const query = useQuery({ queryKey: ["relatorios", "inadimplencia"], queryFn: getInadimplencia });
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
            {extractApiErrorMessage(query.error, "Não foi possível carregar a inadimplência.")}
          </p>
        </Card>
      )}
      {!query.isLoading && !query.isError && itens.length === 0 && (
        <Card>
          <p className="text-sm text-ink-secondary">Nenhum cliente com parcelas atrasadas — tudo em dia.</p>
        </Card>
      )}
      {itens.map((cliente) => (
        <AtrasoGrupoCard
          key={cliente.clienteId}
          titulo={cliente.nomeCliente}
          valorTotalAtrasado={cliente.valorTotalAtrasado}
          parcelas={cliente.parcelas}
        />
      ))}
    </div>
  );
}
