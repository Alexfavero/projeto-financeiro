import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL, formatData } from "@/shared/utils/format";
import type { ContaAReceberDTO } from "@/types/dtos";
import { listClientes } from "@/features/clientes/api";
import { deleteContaAReceber, getContasAReceberPaged } from "./api";

const TAMANHO_PAGINA = 10;

/**
 * Listagem de Contas a Receber — mesmo raciocínio de escopo da tela de
 * Contas a Pagar (ver comentário lá): sem criar, sem editar linha a linha,
 * só listar + excluir a conta inteira.
 */
export function ContasAReceberPage() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaAReceberDTO | null>(null);

  const query = useQuery({
    queryKey: ["contas-a-receber", pagina],
    queryFn: () => getContasAReceberPaged(pagina, TAMANHO_PAGINA),
  });

  // Lista de clientes só pra resolver clienteId → nome na tabela.
  const clientesQuery = useQuery({ queryKey: ["clientes-todos"], queryFn: listClientes });

  function nomeCliente(id: number): string {
    return clientesQuery.data?.find((c) => c.clienteId === id)?.nome ?? `Cliente #${id}`;
  }

  const deleteMutation = useMutation({
    mutationFn: deleteContaAReceber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-a-receber"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-periodo"] });
      queryClient.invalidateQueries({ queryKey: ["previsao"] });
      setContaParaExcluir(null);
    },
  });

  const itens = query.data?.items ?? [];
  const paginacao = query.data?.pagination;

  return (
    <AppLayout title="Contas a Receber">
      <Card>
        {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
        {query.isError && (
          <p className="text-sm text-critical">
            {extractApiErrorMessage(query.error, "Não foi possível carregar as contas a receber.")}
          </p>
        )}
        {!query.isLoading && !query.isError && itens.length === 0 && (
          <p className="text-sm text-ink-secondary">Nenhuma conta a receber cadastrada ainda.</p>
        )}

        {itens.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
                <th className="pb-2">Cliente</th>
                <th className="pb-2">Data da Venda</th>
                <th className="pb-2">Valor Total</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((conta) => (
                <tr key={conta.documentoFinanceiroId} className="border-b border-[#eef0f2] last:border-0">
                  <td className="py-2.5">{nomeCliente(conta.clienteId)}</td>
                  <td className="py-2.5">{formatData(conta.dataVenda)}</td>
                  <td className="py-2.5">{formatBRL(conta.valorTotal)}</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-critical"
                      onClick={() => setContaParaExcluir(conta)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {paginacao && paginacao.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-ink-secondary">
              Página {paginacao.currentPage} de {paginacao.totalPages} ({paginacao.totalCount} no total)
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={!paginacao.hasPrevious} onClick={() => setPagina((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="secondary" size="sm" disabled={!paginacao.hasNext} onClick={() => setPagina((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!contaParaExcluir}
        title="Excluir conta a receber"
        message="Tem certeza que deseja excluir esta conta? Todas as parcelas dela serão excluídas junto. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onCancel={() => setContaParaExcluir(null)}
        onConfirm={() => contaParaExcluir && deleteMutation.mutate(contaParaExcluir.documentoFinanceiroId)}
      />
    </AppLayout>
  );
}
