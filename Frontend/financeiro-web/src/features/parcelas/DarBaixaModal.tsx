import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { extractApiErrorMessage } from "@/lib/api";
import { formatBRL, hojeISO } from "@/shared/utils/format";
import type { ParcelaDTO } from "@/types/dtos";
import { darBaixa } from "./api";

export function DarBaixaModal({
  open,
  onClose,
  parcela,
}: {
  open: boolean;
  onClose: () => void;
  parcela: ParcelaDTO | null;
}) {
  const queryClient = useQueryClient();
  const [dataPagamento, setDataPagamento] = useState(hojeISO());

  // reseta pra "hoje" toda vez que abre, senão fica com a data da baixa anterior
  useEffect(() => {
    if (open) setDataPagamento(hojeISO());
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => darBaixa(parcela!, dataPagamento),
    onSuccess: () => {
      // invalida as abas de Parcelas + card do Painel + totais Previsto/Realizado
      queryClient.invalidateQueries({ queryKey: ["parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-periodo"] });
      queryClient.invalidateQueries({ queryKey: ["previsao"] });
      onClose();
    },
  });

  if (!parcela) return null;

  return (
    <Modal open={open} onClose={onClose} title="Dar baixa no pagamento">
      <p className="mb-4 text-sm text-ink-secondary">
        {parcela.nomeContraparte ? `${parcela.nomeContraparte} — ` : ""}
        {formatBRL(parcela.valor)}
      </p>

      {mutation.isError && (
        <div className="mb-4 rounded-lg bg-critical/10 px-4 py-3 text-sm font-semibold text-critical">
          {extractApiErrorMessage(mutation.error, "Não foi possível dar baixa na parcela.")}
        </div>
      )}

      <Input
        label="Data do pagamento"
        type="date"
        value={dataPagamento}
        onChange={(e) => setDataPagamento(e.target.value)}
      />

      <div className="mt-5 flex justify-end gap-2.5">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Salvando…" : "Confirmar baixa"}
        </Button>
      </div>
    </Modal>
  );
}
