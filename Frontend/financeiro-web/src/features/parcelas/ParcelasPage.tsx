import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL, formatData, hojeISO, addDiasISO, primeiroDiaMesISO } from "@/shared/utils/format";
import { StatusPagamento, STATUS_PAGAMENTO_LABELS, type ParcelaDTO } from "@/types/dtos";
import { getParcelasAtrasadas, getParcelasPaged, getParcelasPorPeriodo, getParcelasPagas } from "./api";
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

type FiltroTipo = "" | "APagar" | "AReceber";

const TIPO_FILTRO_OPCOES: { valor: FiltroTipo; label: string }[] = [
  { valor: "", label: "Todos" },
  { valor: "APagar", label: "A Pagar" },
  { valor: "AReceber", label: "A Receber" },
];

// mesmas cores do badge da coluna Tipo (critical = a pagar, good = a receber),
// só que sólidas aqui pra marcar qual filtro está ativo
const TIPO_FILTRO_CLASSES: Record<FiltroTipo, string> = {
  "": "bg-primary text-white",
  APagar: "bg-critical text-white",
  AReceber: "bg-good text-white",
};

type Aba = "todas" | "atrasadas" | "semana" | "historico";

const hoje = hojeISO();
const fimSemana = addDiasISO(hoje, 6);

// não é CRUD: parcela só nasce dentro de uma Conta a Pagar/Receber, então não
// tem "criar" aqui. Só listar (Todas/Atrasadas/Esta semana), dar baixa e
// editar. Excluir parcela avulsa não é oferecido pq quebraria a regra de que
// a soma bate com o valor total da conta — pra desfazer um lançamento errado
// o certo é excluir a conta inteira (cascade cuida das parcelas)
export function ParcelasPage() {
  const [aba, setAba] = useState<Aba>("todas");
  const [pagina, setPagina] = useState(1);
  const [filtroStatus, setFiltroStatus] = useState<StatusPagamento | "">("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("");
  const [historicoInicio, setHistoricoInicio] = useState(primeiroDiaMesISO());
  const [historicoFim, setHistoricoFim] = useState(hojeISO());
  const [parcelaEmBaixa, setParcelaEmBaixa] = useState<ParcelaDTO | null>(null);
  const [parcelaEmEdicao, setParcelaEmEdicao] = useState<ParcelaDTO | null>(null);

  const todasQuery = useQuery({
    queryKey: ["parcelas", "todas", pagina, filtroStatus, filtroTipo],
    queryFn: () =>
      getParcelasPaged(
        pagina,
        TAMANHO_PAGINA,
        filtroStatus === "" ? undefined : filtroStatus,
        filtroTipo === "" ? undefined : filtroTipo,
        true, // já pago sai daqui, mora só na aba Histórico
      ),
    enabled: aba === "todas",
  });

  const atrasadasQuery = useQuery({
    queryKey: ["parcelas", "atrasadas"],
    queryFn: getParcelasAtrasadas,
    enabled: aba === "atrasadas",
  });

  const semanaQuery = useQuery({
    queryKey: ["parcelas", "semana", hoje, fimSemana],
    queryFn: () => getParcelasPorPeriodo(hoje, fimSemana, true), // já pago sai daqui também
    enabled: aba === "semana",
  });

  const historicoQuery = useQuery({
    queryKey: ["parcelas", "historico", historicoInicio, historicoFim, filtroTipo],
    queryFn: () => getParcelasPagas(historicoInicio, historicoFim, filtroTipo === "" ? undefined : filtroTipo),
    enabled: aba === "historico",
  });

  const queryAtual =
    aba === "todas" ? todasQuery : aba === "atrasadas" ? atrasadasQuery : aba === "semana" ? semanaQuery : historicoQuery;
  const isLoading = queryAtual.isLoading;
  const isError = queryAtual.isError;
  const error = queryAtual.error;
  // "todas" e "historico" já vem filtradas pelo backend (a primeira por causa da
  // paginação, filtrar de novo bagunçaria a contagem; a segunda porque o filtro de
  // Tipo já vai direto na query). "atrasadas"/"semana" trazem a lista inteira, então
  // o filtro de Tipo nelas é só um .filter() local mesmo
  const itensBrutos: ParcelaDTO[] =
    aba === "todas"
      ? (todasQuery.data?.items ?? [])
      : aba === "atrasadas"
        ? (atrasadasQuery.data ?? [])
        : aba === "semana"
          ? (semanaQuery.data ?? [])
          : (historicoQuery.data ?? []);
  const itens =
    aba === "atrasadas" || aba === "semana"
      ? itensBrutos.filter((p) => filtroTipo === "" || p.tipo === filtroTipo)
      : itensBrutos;
  const paginacao = aba === "todas" ? todasQuery.data?.pagination : undefined;

  function mudarAba(novaAba: Aba) {
    setAba(novaAba);
  }

  const sufixoTipo = filtroTipo === "APagar" ? " a pagar" : filtroTipo === "AReceber" ? " a receber" : "";
  const mensagemVazio =
    aba === "atrasadas"
      ? filtroTipo === ""
        ? "Nenhuma parcela atrasada — tudo em dia."
        : `Nenhuma parcela${sufixoTipo} atrasada.`
      : aba === "semana"
        ? `Nenhuma parcela${sufixoTipo} vencendo nos próximos 7 dias.`
        : aba === "historico"
          ? `Nenhuma parcela${sufixoTipo} baixada nesse período.`
          : `Nenhuma parcela${sufixoTipo} cadastrada ainda.`;

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
        <Button variant={aba === "historico" ? "primary" : "secondary"} size="sm" onClick={() => mudarAba("historico")}>
          Histórico
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Tipo</label>
          <div className="flex gap-1.5">
            {TIPO_FILTRO_OPCOES.map((opcao) => (
              <button
                key={opcao.valor || "todos"}
                type="button"
                onClick={() => {
                  setFiltroTipo(opcao.valor);
                  setPagina(1);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filtroTipo === opcao.valor
                    ? TIPO_FILTRO_CLASSES[opcao.valor]
                    : "border border-border bg-surface-alt text-ink-secondary hover:bg-surface"
                }`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        </div>

        {aba === "todas" && (
          <div className="flex items-center gap-2">
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
              <option value={StatusPagamento.Atrasado}>Atrasado</option>
            </select>
          </div>
        )}

        {aba === "historico" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Período</label>
            <input
              type="date"
              className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={historicoInicio}
              max={historicoFim}
              onChange={(e) => setHistoricoInicio(e.target.value)}
            />
            <span className="text-ink-secondary">até</span>
            <input
              type="date"
              className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={historicoFim}
              min={historicoInicio}
              onChange={(e) => setHistoricoFim(e.target.value)}
            />
          </div>
        )}
      </div>

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
