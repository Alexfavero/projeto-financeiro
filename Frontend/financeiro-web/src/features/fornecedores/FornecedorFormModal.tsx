import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { extractApiErrorMessage } from "@/lib/api";
import type { FornecedorDTO } from "@/types/dtos";
import { fornecedorSchema, type FornecedorFormValues } from "./schema";
import { createFornecedor, updateFornecedor } from "./api";

export function FornecedorFormModal({
  open,
  onClose,
  fornecedor,
}: {
  open: boolean;
  onClose: () => void;
  fornecedor?: FornecedorDTO | null;
}) {
  const queryClient = useQueryClient();
  const editando = !!fornecedor;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { nome: "", cnpj: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        nome: fornecedor?.nome ?? "",
        cnpj: fornecedor?.cnpj ?? "",
      });
    }
  }, [open, fornecedor, reset]);

  const mutation = useMutation({
    mutationFn: (values: FornecedorFormValues) =>
      editando ? updateFornecedor(fornecedor!.fornecedorId, values) : createFornecedor(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      onClose();
    },
  });

  function onSubmit(values: FornecedorFormValues) {
    mutation.mutate(values);
  }

  return (
    <Modal open={open} onClose={onClose} title={editando ? "Editar Fornecedor" : "Novo Fornecedor"}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {mutation.isError && (
          <div className="mb-4 rounded-lg bg-critical/10 px-4 py-3 text-sm font-semibold text-critical">
            {extractApiErrorMessage(mutation.error, "Não foi possível salvar o fornecedor.")}
          </div>
        )}
        <Input label="Nome" error={errors.nome?.message} {...register("nome")} />
        <Input
          label="CNPJ"
          placeholder="Somente números, 14 dígitos"
          error={errors.cnpj?.message}
          {...register("cnpj")}
        />
        <div className="mt-5 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
