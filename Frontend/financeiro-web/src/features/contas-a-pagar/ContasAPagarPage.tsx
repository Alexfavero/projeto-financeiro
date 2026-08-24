import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL } from "@/shared/utils/format";
import { CATEGORIA_GASTO_LABELS, type CategoriaGasto, type ContaAPagarDTO } from "@/types/dtos";
import { listFornecedores } from "@/features/fornecedores/api";
import { deleteContaAPagar, getContasAPagarPaged } from "./api";

const TAMANHO_PAGINA = 10;

/**
 * Listagem de Contas a Pagar. Sem criar (isso é a tela de Lançar Conta) e
 * sem editar linha a linha (reabrir uma conta com várias parcelas pra editar
 * é mais complexo do que vale a pena agora). O que existe além de listar é
 * excluir a conta inteira — o caminho certo pra desfazer um lançamento
 * errado por completo (as parcelas somem junto, via cascade no banco). Pra
 * corrigir só uma parcela isolada, o lugar é a tela de Parcelas (Editar).
 */
export function ContasAPagarPage() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaGasto | "">("");
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaAPagarDTO | null>(null);

  const query = useQuery({
    queryKey: ["contas-a-pagar", pagina, filtroCategoria],
    queryFn: () => getContasAPagarPaged(pagina, TAMANHO_PAGINA, filtroCategoria === "" ? undefined : filtroCategoria),
  });

  // Lista de fornecedores só pra resolver fornecedorId → nome na tabela — a
  // listagem paginada de contas não traz o nome do fornecedor, só o id.
  const fornecedoresQuery = useQuery({ queryKey: ["fornecedores-todos"], queryFn: listFornecedores });

  function nomeFornecedor(id?: number | null): string {
    if (id == null) return "—";
    return fornecedoresQuery.data?.find((f) => f.fornecedorId === id)?.nome ?? `Fornecedor #${id}`;
  }

  const deleteMutation = useMutation({
    mutationFn: deleteContaAPagar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-a-pagar"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-periodo"] });
      queryClient.invalidateQueries({ queryKey: ["previsao"] });
      setContaParaExcluir(null);
    },
  });

  const itens = query.data?.items ?? [];
  const paginacao = query.data?.pagination;

  return (
    <AppLayout title="Contas a Pagar">
      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Categoria</label>
        <select
          className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          value={filtroCategoria}
          onChange={(e) => {
            setFiltroCategoria(e.target.value === "" ? "" : (Number(e.target.value) as CategoriaGasto));
            setPagina(1);
          }}
        >
          <option value="">Todas</option>
          {Object.entries(CATEGORIA_GASTO_LABELS).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
        {query.isError && (
          <p className="text-sm text-critical">
            {extractApiErrorMessage(query.error, "Não foi possível carregar as contas a pagar.")}
          </p>
        )}
        {!query.isLoading && !query.isError && itens.length === 0 && (
          <p className="text-sm text-ink-secondary">Nenhuma conta a pagar cadastrada ainda.</p>
        )}

        {itens.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
                <th className="pb-2">Fornecedor</th>
                <th className="pb-2">Nº Nota</th>
                <th className="pb-2">Descrição</th>
                <th className="pb-2">Categoria</th>
                <th className="pb-2">Valor Total</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((conta) => (
                <tr key={conta.documentoFinanceiroId} className="border-b border-border last:border-0">
                  <td className="py-2.5">{nomeFornecedor(conta.fornecedorId)}</td>
                  <td className="py-2.5">{conta.numeroNota || "—"}</td>
                  <td className="py-2.5">{conta.descricao || "—"}</td>
                  <td className="py-2.5">
                    <Badge variant="muted">{CATEGORIA_GASTO_LABELS[conta.categoria]}</Badge>
                  </td>
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
          </div>
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
        title="Excluir conta a pagar"
        message={`Tem certeza que deseja excluir esta conta${
          contaParaExcluir?.numeroNota ? ` (Nota ${contaParaExcluir.numeroNota})` : ""
        }? Todas as parcelas dela serão excluídas junto. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onCancel={() => setContaParaExcluir(null)}
        onConfirm={() => contaParaExcluir && deleteMutation.mutate(contaParaExcluir.documentoFinanceiroId)}
      />
    </AppLayout>
  );
}
