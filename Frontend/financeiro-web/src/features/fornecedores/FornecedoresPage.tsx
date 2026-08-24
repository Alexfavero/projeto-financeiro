import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { extractApiErrorMessage } from "@/lib/api";
import type { FornecedorDTO } from "@/types/dtos";
import { deleteFornecedor, getFornecedoresPaged } from "./api";
import { FornecedorFormModal } from "./FornecedorFormModal";

const TAMANHO_PAGINA = 10;

export function FornecedoresPage() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [fornecedorEmEdicao, setFornecedorEmEdicao] = useState<FornecedorDTO | null>(null);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<FornecedorDTO | null>(null);

  const query = useQuery({
    queryKey: ["fornecedores", pagina],
    queryFn: () => getFornecedoresPaged(pagina, TAMANHO_PAGINA),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFornecedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      setFornecedorParaExcluir(null);
    },
  });

  function abrirNovo() {
    setFornecedorEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(fornecedor: FornecedorDTO) {
    setFornecedorEmEdicao(fornecedor);
    setModalAberto(true);
  }

  const itens = query.data?.items ?? [];
  const paginacao = query.data?.pagination;

  return (
    <AppLayout title="Fornecedores">
      <div className="mb-5 flex justify-end">
        <Button onClick={abrirNovo}>+ Novo Fornecedor</Button>
      </div>

      <Card>
        {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
        {query.isError && (
          <p className="text-sm text-critical">
            {extractApiErrorMessage(query.error, "Não foi possível carregar os fornecedores.")}
          </p>
        )}
        {!query.isLoading && !query.isError && itens.length === 0 && (
          <p className="text-sm text-ink-secondary">Nenhum fornecedor cadastrado ainda.</p>
        )}

        {itens.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
                <th className="pb-2">Nome</th>
                <th className="pb-2">CNPJ</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((fornecedor) => (
                <tr key={fornecedor.fornecedorId} className="border-b border-border last:border-0">
                  <td className="py-2.5">{fornecedor.nome}</td>
                  <td className="py-2.5">{fornecedor.cnpj}</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      className="mr-3 text-xs font-semibold text-primary"
                      onClick={() => abrirEdicao(fornecedor)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-critical"
                      onClick={() => setFornecedorParaExcluir(fornecedor)}
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
              <Button
                variant="secondary"
                size="sm"
                disabled={!paginacao.hasPrevious}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!paginacao.hasNext}
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      <FornecedorFormModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        fornecedor={fornecedorEmEdicao}
      />

      <ConfirmDialog
        open={!!fornecedorParaExcluir}
        title="Excluir fornecedor"
        message={`Tem certeza que deseja excluir "${fornecedorParaExcluir?.nome}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onCancel={() => setFornecedorParaExcluir(null)}
        onConfirm={() => fornecedorParaExcluir && deleteMutation.mutate(fornecedorParaExcluir.fornecedorId)}
      />
    </AppLayout>
  );
}
