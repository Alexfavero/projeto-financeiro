import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL, formatData } from "@/shared/utils/format";
import { useToast } from "@/shared/toast/ToastProvider";
import { StatusPagamento, type ContaAReceberDTO } from "@/types/dtos";
import { listClientes } from "@/features/clientes/api";
import { deleteContaAReceber, getContaAReceberById, getContasAReceberPaged } from "./api";

const TAMANHO_PAGINA = 10;

// mesmo escopo da tela de Contas a Pagar: só listar + excluir a conta inteira
export function ContasAReceberPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pagina, setPagina] = useState(1);
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaAReceberDTO | null>(null);
  // datas de vencimento das parcelas já pagas dessa conta — preenchido ao clicar em
  // "Excluir" (a listagem paginada não traz as parcelas, só o Get por id)
  const [parcelasPagasVencimentos, setParcelasPagasVencimentos] = useState<string[]>([]);
  const [verificandoExclusao, setVerificandoExclusao] = useState(false);

  const query = useQuery({
    queryKey: ["contas-a-receber", pagina],
    queryFn: () => getContasAReceberPaged(pagina, TAMANHO_PAGINA),
  });

  // só pra resolver clienteId → nome na tabela
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
      setParcelasPagasVencimentos([]);
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error, "Não foi possível excluir a conta."));
    },
  });

  // busca a conta completa (com parcelas) antes de abrir a confirmação, pra avisar se
  // alguma parcela já foi paga — excluir apaga a conta inteira, pagas inclusive
  async function solicitarExclusao(conta: ContaAReceberDTO) {
    setVerificandoExclusao(true);
    try {
      const completa = await getContaAReceberById(conta.documentoFinanceiroId);
      const vencimentosPagas = completa.parcelas
        .filter((p) => p.status === StatusPagamento.Pago)
        .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
        .map((p) => formatData(p.dataVencimento));
      setParcelasPagasVencimentos(vencimentosPagas);
      setContaParaExcluir(conta);
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Não foi possível verificar as parcelas dessa conta."));
    } finally {
      setVerificandoExclusao(false);
    }
  }

  function cancelarExclusao() {
    setContaParaExcluir(null);
    setParcelasPagasVencimentos([]);
  }

  const itens = query.data?.items ?? [];
  const paginacao = query.data?.pagination;
  const mensagemExclusao =
    parcelasPagasVencimentos.length > 0
      ? `Atenção: ${parcelasPagasVencimentos.length === 1 ? "1 parcela dessa conta já está paga" : `${parcelasPagasVencimentos.length} parcelas dessa conta já estão pagas`} (vencimento em ${parcelasPagasVencimentos.join(", ")}). Excluir remove TODAS as parcelas, inclusive as já pagas, e essa ação não pode ser desfeita. Deseja continuar mesmo assim?`
      : "Tem certeza que deseja excluir esta conta? Todas as parcelas dela serão excluídas junto. Essa ação não pode ser desfeita.";

  return (
    <AppLayout title="Contas a Receber">
      <div className="mb-5 flex justify-end">
        <Button onClick={() => navigate("/lancar-conta", { state: { tipoInicial: "receber" } })}>
          + Nova Conta
        </Button>
      </div>

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
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
                <tr key={conta.documentoFinanceiroId} className="border-b border-border last:border-0">
                  <td className="py-2.5">{nomeCliente(conta.clienteId)}</td>
                  <td className="py-2.5">{formatData(conta.dataVenda)}</td>
                  <td className="py-2.5">{formatBRL(conta.valorTotal)}</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-critical disabled:opacity-50"
                      disabled={verificandoExclusao}
                      onClick={() => solicitarExclusao(conta)}
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
        title="Excluir conta a receber"
        message={mensagemExclusao}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onCancel={cancelarExclusao}
        onConfirm={() => contaParaExcluir && deleteMutation.mutate(contaParaExcluir.documentoFinanceiroId)}
      />
    </AppLayout>
  );
}
