import { useEffect, useState } from "react";
import { Modal } from "@/shared/components/Modal";
import { Button } from "@/shared/components/Button";
import { formatBRL } from "@/shared/utils/format";
import { temNoMaximoDuasCasas, type ParcelaFormValues } from "./schema";

const TOLERANCIA = 0.005;

/**
 * Tela de revisão que abre depois de "Gerar parcelas automaticamente":
 * mostra as parcelas calculadas (valor = total / quantidade, datas
 * espaçadas pelo intervalo escolhido), dá pra editar valor/data de cada
 * uma ou remover, mostra a soma em tempo real comparada ao valor total, e
 * só deixa confirmar se a soma bater exatamente com o total — nem mais,
 * nem menos. Se o total foi digitado errado, o certo é fechar, corrigir o
 * Valor Total na tela de trás e gerar de novo — não forçar as parcelas a
 * compensar um total errado.
 */
export function GerarParcelasModal({
  open,
  onClose,
  valorTotal,
  initialParcelas,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  valorTotal: number;
  initialParcelas: ParcelaFormValues[];
  onConfirm: (parcelas: ParcelaFormValues[]) => void;
}) {
  const [draft, setDraft] = useState<ParcelaFormValues[]>(initialParcelas);

  // Recarrega o rascunho toda vez que a modal é reaberta com uma nova geração.
  useEffect(() => {
    if (open) setDraft(initialParcelas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialParcelas]);

  const soma = draft.reduce((s, p) => s + (Number(p.valor) || 0), 0);
  const diferenca = soma - valorTotal;
  const bateComOTotal = Math.abs(diferenca) <= TOLERANCIA;
  const todasComDuasCasas = draft.every((p) => temNoMaximoDuasCasas(Number(p.valor) || 0));
  const podeConfirmar = bateComOTotal && todasComDuasCasas && draft.length > 0;

  function atualizarValor(index: number, valor: string) {
    setDraft((prev) => prev.map((p, i) => (i === index ? { ...p, valor: Number(valor) } : p)));
  }

  function atualizarData(index: number, data: string) {
    setDraft((prev) => prev.map((p, i) => (i === index ? { ...p, dataVencimento: data } : p)));
  }

  function removerLinha(index: number) {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Modal open={open} onClose={onClose} title="Revisar parcelas">
      <p className="mb-4 text-sm text-ink-secondary">
        Geradas automaticamente a partir do valor total. Pode editar valor e data de cada uma
        antes de confirmar — ou só clicar em "Confirmar parcelas".
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
            <th className="pb-2">Nº</th>
            <th className="pb-2">Valor (R$)</th>
            <th className="pb-2">Vencimento</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {draft.map((p, index) => (
            <tr key={index} className="border-b border-[#eef0f2] last:border-0">
              <td className="py-2 pr-2">{index + 1}</td>
              <td className="py-2 pr-2">
                <input
                  type="number"
                  step="0.01"
                  value={p.valor}
                  onChange={(e) => atualizarValor(index, e.target.value)}
                  className={`w-24 rounded border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${
                    temNoMaximoDuasCasas(Number(p.valor) || 0) ? "border-border" : "border-critical"
                  }`}
                />
                {!temNoMaximoDuasCasas(Number(p.valor) || 0) && (
                  <p className="mt-1 text-[11px] text-critical">Só 2 casas decimais</p>
                )}
              </td>
              <td className="py-2 pr-2">
                <input
                  type="date"
                  value={p.dataVencimento}
                  onChange={(e) => atualizarData(index, e.target.value)}
                  className="rounded border border-border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </td>
              <td className="py-2 text-right">
                {draft.length > 1 && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-critical"
                    onClick={() => removerLinha(index)}
                  >
                    Remover
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className={`mt-3 flex justify-between text-[13px] ${
          bateComOTotal ? "text-ink-secondary" : "font-semibold text-critical"
        }`}
      >
        <span>
          Soma das parcelas: <b>{formatBRL(soma)}</b>
        </span>
        <span>
          Valor total: <b>{formatBRL(valorTotal)}</b>
        </span>
      </div>
      {!bateComOTotal && (
        <p className="mt-1 text-xs text-critical">
          {diferenca > 0
            ? `A soma está ${formatBRL(diferenca)} acima do valor total.`
            : `A soma está ${formatBRL(Math.abs(diferenca))} abaixo do valor total.`}{" "}
          Ajuste as parcelas, ou feche e corrija o Valor Total antes de gerar de novo.
        </p>
      )}
      {!todasComDuasCasas && (
        <p className="mt-1 text-xs text-critical">
          Alguma parcela tem mais de 2 casas decimais — corrija antes de confirmar.
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" disabled={!podeConfirmar} onClick={() => onConfirm(draft)}>
          Confirmar parcelas
        </Button>
      </div>
    </Modal>
  );
}
