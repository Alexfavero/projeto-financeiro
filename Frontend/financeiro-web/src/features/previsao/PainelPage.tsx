import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { STATUS_PAGAMENTO_LABELS, type StatusPagamento } from "@/types/dtos";
import { formatBRL, formatData, primeiroDiaMesISO, ultimoDiaMesISO, dataISOMaisDias, hojeISO } from "@/shared/utils/format";
import { getParcelasPeriodo, getPrevisaoPeriodo } from "./api";
import { HistoricoChart } from "./HistoricoChart";
import { SaldoAcumuladoChart } from "./SaldoAcumuladoChart";

const inicioMes = primeiroDiaMesISO();
const fimMes = ultimoDiaMesISO();
const hoje = hojeISO();
const daquiA14Dias = dataISOMaisDias(14);

const STATUS_BADGE_VARIANT: Record<StatusPagamento, "good" | "warning" | "critical"> = {
  1: "warning", // Pendente
  2: "good", // Pago
  3: "critical", // Atrasado
};

export function PainelPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;

  const previsaoQuery = useQuery({
    queryKey: ["previsao", inicioMes, fimMes],
    queryFn: () => getPrevisaoPeriodo(inicioMes, fimMes),
  });

  const parcelasQuery = useQuery({
    queryKey: ["parcelas-periodo", hoje, daquiA14Dias],
    // excluirPagas: aqui é só "o que ainda falta pagar/receber nos
    // próximos 14 dias" — parcela já baixada não faz sentido aparecer
    queryFn: () => getParcelasPeriodo(hoje, daquiA14Dias, true),
  });

  const parcelasVencendo = parcelasQuery.data ?? [];

  return (
    <AppLayout title="Painel — Previsão Financeira">
      {successMessage && (
        <div className="mb-5 rounded-lg bg-good/10 px-4 py-3 text-sm font-semibold text-good">
          {successMessage}
        </div>
      )}

      {previsaoQuery.isError && (
        <div className="mb-5 rounded-lg bg-critical/10 px-4 py-3 text-sm font-semibold text-critical">
          Não foi possível carregar a previsão do período.
        </div>
      )}

      <div className="mb-1.5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            A Receber (previsto — mês atual)
          </div>
          <div className="text-2xl font-bold text-good">
            {previsaoQuery.isLoading ? "…" : formatBRL(previsaoQuery.data?.previsto.totalAReceber ?? 0)}
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            A Pagar (previsto — mês atual)
          </div>
          <div className="text-2xl font-bold text-critical">
            {previsaoQuery.isLoading ? "…" : formatBRL(previsaoQuery.data?.previsto.totalAPagar ?? 0)}
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Saldo Projetado (mês atual)
          </div>
          <div className="text-2xl font-bold text-primary">
            {previsaoQuery.isLoading ? "…" : formatBRL(previsaoQuery.data?.previsto.saldo ?? 0)}
          </div>
        </Card>
      </div>
      <p className="mb-5 text-xs text-ink-secondary">
        Os três cards acima são sempre do mês atual, independente do que estiver selecionado nos gráficos abaixo —
        use os gráficos pra ver outros meses, anos ou o histórico completo.
      </p>

      <div className="mb-5">
        <SaldoAcumuladoChart />
      </div>

      <div className="mb-5">
        <HistoricoChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Parcelas vencendo (próximos 14 dias)">
          {parcelasQuery.isLoading && <p className="text-sm text-ink-secondary">Carregando…</p>}
          {parcelasQuery.isError && (
            <p className="text-sm text-critical">Não foi possível carregar as parcelas.</p>
          )}
          {!parcelasQuery.isLoading && parcelasVencendo.length === 0 && (
            <p className="text-sm text-ink-secondary">Nenhuma parcela vencendo nos próximos 14 dias.</p>
          )}
          {parcelasVencendo.length > 0 && (
            // max-h + overflow-y: a área do card fica do mesmo tamanho de
            // sempre (cabiam ~3 linhas antes) mesmo quando vêm mais
            // parcelas — o cabeçalho fica fixo (sticky) enquanto rola
            <div className="max-h-[230px] overflow-auto">
              <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="sticky top-0 border-b border-border bg-surface text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
                  <th className="pb-2">Documento</th>
                  <th className="pb-2">Valor</th>
                  <th className="pb-2">Vencimento</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {parcelasVencendo.map((parcela) => (
                  <tr key={parcela.parcelaId} className="border-b border-border last:border-0">
                    <td className="py-2.5">Doc. #{parcela.documentoFinanceiroId}</td>
                    <td className="py-2.5">{formatBRL(parcela.valor)}</td>
                    <td className="py-2.5">{formatData(parcela.dataVencimento)}</td>
                    <td className="py-2.5">
                      <Badge variant={STATUS_BADGE_VARIANT[parcela.status]}>
                        {STATUS_PAGAMENTO_LABELS[parcela.status]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Card>

        <Card title="Ações rápidas">
          <Button className="mb-2.5 w-full justify-center" onClick={() => navigate("/lancar-conta")}>
            + Lançar Conta
          </Button>
          <Button variant="secondary" className="w-full justify-center" onClick={() => navigate("/parcelas")}>
            Ver Parcelas
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}
