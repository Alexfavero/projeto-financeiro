import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/shared/components/Card";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import { Select } from "@/shared/components/Select";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL, formatData } from "@/shared/utils/format";
import { STATUS_PAGAMENTO_LABELS, type StatusPagamento } from "@/types/dtos";
import { listClientes } from "@/features/clientes/api";
import { listFornecedores } from "@/features/fornecedores/api";
import { getExtratoCliente, getExtratoFornecedor } from "../api";

type Tipo = "cliente" | "fornecedor";

const STATUS_BADGE_VARIANT: Record<StatusPagamento, "good" | "warning" | "critical"> = {
  1: "warning", // Pendente
  2: "good", // Pago
  3: "critical", // Atrasado
};

// histórico de um cliente/fornecedor específico — por isso precisa escolher
// antes de mostrar algo, diferente dos outros relatórios
export function ExtratoTab() {
  const [tipo, setTipo] = useState<Tipo>("cliente");
  const [entidadeId, setEntidadeId] = useState<number | "">("");

  const clientesQuery = useQuery({ queryKey: ["clientes-todos"], queryFn: listClientes, enabled: tipo === "cliente" });
  const fornecedoresQuery = useQuery({
    queryKey: ["fornecedores-todos"],
    queryFn: listFornecedores,
    enabled: tipo === "fornecedor",
  });

  const extratoQuery = useQuery({
    queryKey: ["relatorios", "extrato", tipo, entidadeId],
    queryFn: () =>
      tipo === "cliente" ? getExtratoCliente(Number(entidadeId)) : getExtratoFornecedor(Number(entidadeId)),
    enabled: entidadeId !== "",
  });

  function mudarTipo(novoTipo: Tipo) {
    setTipo(novoTipo);
    setEntidadeId("");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="mb-3 flex gap-2">
          <Button variant={tipo === "cliente" ? "primary" : "secondary"} size="sm" onClick={() => mudarTipo("cliente")}>
            Cliente
          </Button>
          <Button
            variant={tipo === "fornecedor" ? "primary" : "secondary"}
            size="sm"
            onClick={() => mudarTipo("fornecedor")}
          >
            Fornecedor
          </Button>
        </div>
        <Select
          label={tipo === "cliente" ? "Cliente" : "Fornecedor"}
          value={entidadeId}
          onChange={(e) => setEntidadeId(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">Selecione…</option>
          {tipo === "cliente"
            ? clientesQuery.data?.map((c) => (
                <option key={c.clienteId} value={c.clienteId}>
                  {c.nome}
                </option>
              ))
            : fornecedoresQuery.data?.map((f) => (
                <option key={f.fornecedorId} value={f.fornecedorId}>
                  {f.nome}
                </option>
              ))}
        </Select>
      </Card>

      {entidadeId === "" && (
        <Card>
          <p className="text-sm text-ink-secondary">
            Selecione um {tipo === "cliente" ? "cliente" : "fornecedor"} pra ver o extrato.
          </p>
        </Card>
      )}

      {entidadeId !== "" && extratoQuery.isLoading && (
        <Card>
          <p className="text-sm text-ink-secondary">Carregando…</p>
        </Card>
      )}

      {entidadeId !== "" && extratoQuery.isError && (
        <Card>
          <p className="text-sm text-critical">
            {extractApiErrorMessage(extratoQuery.error, "Não foi possível carregar o extrato.")}
          </p>
        </Card>
      )}

      {extratoQuery.data && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink">{extratoQuery.data.nomeEntidade}</h4>
            <Badge variant="good">{formatBRL(extratoQuery.data.valorTotalMovimentado)} movimentado</Badge>
          </div>

          {extratoQuery.data.documentos.length === 0 && (
            <p className="text-sm text-ink-secondary">Nenhum documento encontrado.</p>
          )}

          {extratoQuery.data.documentos.map((doc) => (
            <div key={doc.documentoFinanceiroId} className="mb-4 last:mb-0">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                Documento #{doc.documentoFinanceiroId} — {formatBRL(doc.valorTotal)}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-secondary">
                    <th className="pb-2">Valor</th>
                    <th className="pb-2">Vencimento</th>
                    <th className="pb-2">Pagamento</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.parcelas.map((p) => (
                    <tr key={p.parcelaId} className="border-b border-border last:border-0">
                      <td className="py-2">{formatBRL(p.valor)}</td>
                      <td className="py-2">{formatData(p.dataVencimento)}</td>
                      <td className="py-2">{p.dataPagamento ? formatData(p.dataPagamento) : "—"}</td>
                      <td className="py-2">
                        <Badge variant={STATUS_BADGE_VARIANT[p.status]}>{STATUS_PAGAMENTO_LABELS[p.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
