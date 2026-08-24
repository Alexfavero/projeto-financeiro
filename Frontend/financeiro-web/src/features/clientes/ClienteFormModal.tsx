import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { extractApiErrorMessage } from "@/lib/api";
import type { ClienteDTO } from "@/types/dtos";
import { clienteSchema, type ClienteFormValues } from "./schema";
import { createCliente, updateCliente } from "./api";

// mesmo form serve pra criar e editar: `cliente` presente = edição (PUT), ausente = criação (POST)
export function ClienteFormModal({
  open,
  onClose,
  cliente,
}: {
  open: boolean;
  onClose: () => void;
  cliente?: ClienteDTO | null;
}) {
  const queryClient = useQueryClient();
  const editando = !!cliente;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: { nome: "", email: "", telefone: "", endereco: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        nome: cliente?.nome ?? "",
        email: cliente?.email ?? "",
        telefone: cliente?.telefone ?? "",
        endereco: cliente?.endereco ?? "",
      });
    }
  }, [open, cliente, reset]);

  const mutation = useMutation({
    mutationFn: (values: ClienteFormValues) =>
      editando ? updateCliente(cliente!.clienteId, values) : createCliente(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      onClose();
    },
  });

  function onSubmit(values: ClienteFormValues) {
    mutation.mutate(values);
  }

  return (
    <Modal open={open} onClose={onClose} title={editando ? "Editar Cliente" : "Novo Cliente"}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {mutation.isError && (
          <div className="mb-4 rounded-lg bg-critical/10 px-4 py-3 text-sm font-semibold text-critical">
            {extractApiErrorMessage(mutation.error, "Não foi possível salvar o cliente.")}
          </div>
        )}
        <Input label="Nome" error={errors.nome?.message} {...register("nome")} />
        <Input label="E-mail" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Telefone" error={errors.telefone?.message} {...register("telefone")} />
        <Input label="Endereço" error={errors.endereco?.message} {...register("endereco")} />
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
