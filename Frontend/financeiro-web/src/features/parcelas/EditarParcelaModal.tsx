import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL } from "@/shared/utils/format";
import type { ParcelaDTO } from "@/types/dtos";
import { editarParcela, getContaPorParcela } from "./api";

const TOLERANCIA = 0.005;

// corrige valor/data de uma parcela sem precisar excluir e relançar a conta
// toda. não bloqueia se isso desbalancear a soma vs valor total, só avisa —
// assume que quem tá editando sabe o que tá fazendo
export function EditarParcelaModal({
  open,
  onClose,
  parcela,
}: {
  open: boolean;
  onClose: () => void;
  parcela: ParcelaDTO | null;
}) {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");

  useEffect(() => {
    if (open && parcela) {
      setValor(String(parcela.valor));
      setDataVencimento(parcela.dataVencimento.slice(0, 10));
    }
  }, [open, parcela]);

  const contaQuery = useQuery({
    queryKey: ["conta-por-parcela", parcela?.tipo, parcela?.documentoFinanceiroId],
    queryFn: () => getContaPorParcela(parcela!),
    enabled: open && !!parcela,
  });

  const valorNumero = Number(valor.replace(",", "."));

  const diferenca = (() => {
    if (!contaQuery.data || !parcela || Number.isNaN(valorNumero)) return null;
    const somaOutras = contaQuery.data.parcelas
      .filter((p) => p.parcelaId !== parcela.parcelaId)
      .reduce((acc, p) => acc + p.valor, 0);
    return somaOutras + valorNumero - contaQuery.data.valorTotal;
  })();

  const mutation = useMutation({
    mutationFn: () => editarParcela(parcela!, valorNumero, dataVencimento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-periodo"] });
      queryClient.invalidateQueries({ queryKey: ["previsao"] });
      onClose();
    },
  });

  if (!parcela) return null;

  return (
    <Modal open={open} onClose={onClose} title="Editar parcela">
      <p className="mb-4 text-sm text-ink-secondary">
        {parcela.nomeContraparte ? `${parcela.nomeContraparte} — ` : ""}Doc. #{parcela.documentoFinanceiroId}
      </p>

      {mutation.isError && (
        <div className="mb-4 rounded-lg bg-critical/10 px-4 py-3 text-sm font-semibold text-critical">
          {extractApiErrorMessage(mutation.error, "Não foi possível salvar a parcela.")}
        </div>
      )}

      <Input
        label="Valor"
        inputMode="decimal"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      <Input
        label="Data de vencimento"
        type="date"
        value={dataVencimento}
        onChange={(e) => setDataVencimento(e.target.value)}
      />

      {diferenca != null && Math.abs(diferenca) > TOLERANCIA && (
        <div className="mb-3.5 rounded-lg bg-warning/15 px-3 py-2 text-xs font-semibold text-[#a06400] dark:text-[#ffd166]">
          Atenção: com esse valor, a soma das parcelas fica{" "}
          {diferenca > 0 ? "acima" : "abaixo"} do valor total da conta em{" "}
          {formatBRL(Math.abs(diferenca))}. É permitido salvar mesmo assim — confira se é o
          que você quer.
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={mutation.isPending || Number.isNaN(valorNumero) || !dataVencimento}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </Modal>
  );
}
