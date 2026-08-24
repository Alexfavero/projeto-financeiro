import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL, formatData, hojeISO, addDiasISO } from "@/shared/utils/format";
import { StatusPagamento, STATUS_PAGAMENTO_LABELS, type ParcelaDTO } from "@/types/dtos";
import { getParcelasAtrasadas, getParcelasPaged, getParcelasPorPeriodo } from "./api";
import { DarBaixaModal } from "./DarBaixaModal";
import { EditarParcelaModal } from "./EditarParcelaModal";

const TAMANHO_PAGINA = 10;

const STATUS_BADGE_VARIANT: Record<StatusPagamento, "good" | "warning" | "critical"> = {
  1: "warning", // Pendente
  2: "good", // Pago
  3: "critical", // Atrasado
};

const TIPO_BADGE: Record<"APagar" | "AReceber", { label: string; variant: "good" | "critical" }> = {
  APagar: { label: "A Pagar", variant: "critical" },
  AReceber: { label: "A Receber", variant: "good" },
};

type Aba = "todas" | "atrasadas" | "semana";

const hoje = hojeISO();
const fimSemana = addDiasISO(hoje, 6);

/**
 * Não é um CRUD: parcela só nasce dentro de uma Conta a Pagar/Receber (tela
 * de Lançar Conta), então aqui não existe "criar". O que existe é listar (com
 * 3 recortes — Todas, Atrasadas, Esta semana), "dar baixa" (marcar como
 * paga — caso de uso "Registrar Pagamento de Parcela" da ERS) e "editar"
 * (corrigir valor/data de um lançamento errado, sem precisar excluir a conta
 * inteira — avisa mas não bloqueia se isso desbalancear a soma das parcelas).
 * Excluir uma parcela avulsa não é oferecido aqui: quebraria a regra de que a
 * soma bate com o valor total da conta. Pra desfazer um lançamento inteiro
 * errado, o caminho é excluir a conta inteira (parcelas incluídas, cascade já
 * configurado no banco) — ação que fica na futura tela de Contas a
 * Pagar/Receber, não aqui.
 */
export function ParcelasPage() {
  const [aba, setAba] = useState<Aba>("todas");
  const [pagina, setPagina] = useState(1);
  const [filtroStatus, setFiltroStatus] = useState<StatusPagamento | "">("");
  const [parcelaEmBaixa, setParcelaEmBaixa] = useState<ParcelaDTO | null>(null);
  const [parcelaEmEdicao, setParcelaEmEdicao] = useState<ParcelaDTO | null>(null);

  const todasQuery = useQuery({
    queryKey: ["parcelas", "todas", pagina, filtroStatus],
    queryFn: () => getParcelasPaged(pagina, TAMANHO_PAGINA, filtroStatus === "" ? undefined : filtroStatus),
    enabled: aba === "todas",
  });

  const atrasadasQuery = useQuery({
    queryKey: ["parcelas", "atrasadas"],
    queryFn: getParcelasAtrasadas,
    enabled: aba === "atrasadas",
  });

  const semanaQuery = useQuery({
    queryKey: ["parcelas", "semana", hoje, fimSemana],
    queryFn: () => getParcelasPorPeriodo(hoje, fimSemana),
    enabled: aba === "semana",
  });

  const isLoading =
    aba === "todas" ? todasQuery.isLoading : aba === "atrasadas" ? atrasadasQuery.isLoading : semanaQuery.isLoading;
  const isError = aba === "todas" ? todasQuery.isError : aba === "atrasadas" ? atrasadasQuery.isError : semanaQuery.isError;
  const error = aba === "todas" ? todasQuery.error : aba === "atrasadas" ? atrasadasQuery.error : semanaQuery.error;
  const itens: ParcelaDTO[] =
    aba === "todas" ? (todasQuery.data?.items ?? []) : aba === "atrasadas" ? (atrasadasQuery.data ?? []) : (semanaQuery.data ?? []);
  const paginacao = aba === "todas" ? todasQuery.data?.pagination : undefined;

  function mudarAba(novaAba: Aba) {
    setAba(novaAba);
  }

  const mensagemVazio =
    aba === "atrasadas"
      ? "Nenhuma parcela atrasada — tudo em dia."
      : aba === "semana"
        ? "Nenhuma parcela vencendo nos próximos 7 dias."
        : "Nenhuma parcela cadastrada ainda.";

  return (
    <AppLayout title="Parcelas">
      <div className="mb-5 flex gap-2">
        <Button variant={aba === "todas" ? "primary" : "secondary"} size="sm" onClick={() => mudarAba("todas")}>
          Todas
        </Button>
        <Button variant={aba === "atrasadas" ? "primary" : "secondary"} size="sm" onClick={() => mudarAba("atrasadas")}>
          Atrasadas
        </Button>
        <Button variant={aba === "semana" ? "primary" : "secondary"} size="sm" onClick={() => mudarAba("semana")}>
          Esta semana
        </Button>
      </div>

      {aba === "todas" && (
        <div className="mb-4 flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Status</label>
          <select
            className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value === "" ? "" : (Number(e.target.value) as StatusPagamento));
              setPagina(1);
            }}
          >
            <option value="">Todos</option>
            <option value={StatusPagamento.Pendente}>Pendente</option>
            <option value={StatusPagamento.Pago}>Pago</option>
            <option value={StatusPagamento.Atrasado}>Atrasado</option>
          </select>
        </div>
      )}

      <Card>
        {isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
        {isError && (
          <p className="text-sm text-critical">
            {extractApiErrorMessage(error, "Não foi possível carregar as parcelas.")}
          </p>
        )}
        {!isLoading && !isError && itens.length === 0 && <p className="text-sm text-ink-secondary">{mensagemVazio}</p>}

        {itens.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Contraparte</th>
                <th className="pb-2">Valor</th>
                <th className="pb-2">Vencimento</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Data Pagamento</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((parcela) => {
                const tipoInfo = parcela.tipo ? TIPO_BADGE[parcela.tipo] : null;
                return (
                  <tr key={parcela.parcelaId} className="border-b border-border last:border-0">
                    <td className="py-2.5">{tipoInfo ? <Badge variant={tipoInfo.variant}>{tipoInfo.label}</Badge> : "—"}</td>
                    <td className="py-2.5">{parcela.nomeContraparte || "—"}</td>
                    <td className="py-2.5">{formatBRL(parcela.valor)}</td>
                    <td className="py-2.5">{formatData(parcela.dataVencimento)}</td>
                    <td className="py-2.5">
                      <Badge variant={STATUS_BADGE_VARIANT[parcela.status]}>{STATUS_PAGAMENTO_LABELS[parcela.status]}</Badge>
                    </td>
                    <td className="py-2.5">{parcela.dataPagamento ? formatData(parcela.dataPagamento) : "—"}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        className="mr-3 text-xs font-semibold text-primary"
                        onClick={() => setParcelaEmEdicao(parcela)}
                      >
                        Editar
                      </button>
                      {parcela.status !== StatusPagamento.Pago && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary"
                          onClick={() => setParcelaEmBaixa(parcela)}
                        >
                          Dar baixa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {aba === "todas" && paginacao && paginacao.totalPages > 1 && (
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

      <DarBaixaModal open={!!parcelaEmBaixa} onClose={() => setParcelaEmBaixa(null)} parcela={parcelaEmBaixa} />
      <EditarParcelaModal open={!!parcelaEmEdicao} onClose={() => setParcelaEmEdicao(null)} parcela={parcelaEmEdicao} />
    </AppLayout>
  );
}
