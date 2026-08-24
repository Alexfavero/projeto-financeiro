import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { extractApiErrorMessage } from "@/lib/api";
import type { ClienteDTO } from "@/types/dtos";
import { deleteCliente, getClientesPaged } from "./api";
import { ClienteFormModal } from "./ClienteFormModal";

const TAMANHO_PAGINA = 10;

export function ClientesPage() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<ClienteDTO | null>(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<ClienteDTO | null>(null);

  const query = useQuery({
    queryKey: ["clientes", pagina],
    queryFn: () => getClientesPaged(pagina, TAMANHO_PAGINA),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setClienteParaExcluir(null);
    },
  });

  function abrirNovo() {
    setClienteEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(cliente: ClienteDTO) {
    setClienteEmEdicao(cliente);
    setModalAberto(true);
  }

  const itens = query.data?.items ?? [];
  const paginacao = query.data?.pagination;

  return (
    <AppLayout title="Clientes">
      <div className="mb-5 flex justify-end">
        <Button onClick={abrirNovo}>+ Novo Cliente</Button>
      </div>

      <Card>
        {query.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
        {query.isError && (
          <p className="text-sm text-critical">
            {extractApiErrorMessage(query.error, "Não foi possível carregar os clientes.")}
          </p>
        )}
        {!query.isLoading && !query.isError && itens.length === 0 && (
          <p className="text-sm text-ink-secondary">Nenhum cliente cadastrado ainda.</p>
        )}

        {itens.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
                <th className="pb-2">Nome</th>
                <th className="pb-2">E-mail</th>
                <th className="pb-2">Telefone</th>
                <th className="pb-2">Endereço</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((cliente) => (
                <tr key={cliente.clienteId} className="border-b border-border last:border-0">
                  <td className="py-2.5">{cliente.nome}</td>
                  <td className="py-2.5">{cliente.email || "—"}</td>
                  <td className="py-2.5">{cliente.telefone || "—"}</td>
                  <td className="py-2.5">{cliente.endereco || "—"}</td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      className="mr-3 text-xs font-semibold text-primary"
                      onClick={() => abrirEdicao(cliente)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold text-critical"
                      onClick={() => setClienteParaExcluir(cliente)}
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

      <ClienteFormModal open={modalAberto} onClose={() => setModalAberto(false)} cliente={clienteEmEdicao} />

      <ConfirmDialog
        open={!!clienteParaExcluir}
        title="Excluir cliente"
        message={`Tem certeza que deseja excluir "${clienteParaExcluir?.nome}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onCancel={() => setClienteParaExcluir(null)}
        onConfirm={() => clienteParaExcluir && deleteMutation.mutate(clienteParaExcluir.clienteId)}
      />
    </AppLayout>
  );
}
