import { Badge } from "@/shared/components/Badge";
import { formatBRL, formatData } from "@/shared/utils/format";
import type { ParcelaAtrasadaDTO } from "@/types/dtos";

interface AtrasoGrupoCardProps {
  titulo: string;
  valorTotalAtrasado: number;
  parcelas: ParcelaAtrasadaDTO[];
}

/**
 * Um grupo (cliente ou fornecedor) com as parcelas atrasadas dele. Mesma
 * forma nos dois relatórios que usam isso — Inadimplência (cliente) e
 * Contas a Pagar Atrasadas (fornecedor) — só muda o rótulo da entidade, daí
 * um componente compartilhado só.
 */
export function AtrasoGrupoCard({ titulo, valorTotalAtrasado, parcelas }: AtrasoGrupoCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink">{titulo}</h4>
        <Badge variant="critical">{formatBRL(valorTotalAtrasado)} em atraso</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-secondary">
            <th className="pb-2">Documento</th>
            <th className="pb-2">Valor</th>
            <th className="pb-2">Vencimento</th>
            <th className="pb-2">Dias em atraso</th>
          </tr>
        </thead>
        <tbody>
          {parcelas.map((p) => (
            <tr key={p.parcelaId} className="border-b border-border last:border-0">
              <td className="py-2">Doc. #{p.documentoFinanceiroId}</td>
              <td className="py-2">{formatBRL(p.valor)}</td>
              <td className="py-2">{formatData(p.dataVencimento)}</td>
              <td className="py-2 font-semibold text-critical">{p.diasAtraso}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
