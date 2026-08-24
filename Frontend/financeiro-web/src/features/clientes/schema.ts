import { z } from "zod";

// Limites de tamanho batem com as anotações [StringLength] do ClienteDTO.cs real.
export const clienteSchema = z.object({
  nome: z.string().min(1, "Informe o nome").max(100, "Máximo de 100 caracteres"),
  email: z
    .union([z.string().length(0), z.string().email("E-mail inválido").max(200, "Máximo de 200 caracteres")])
    .optional(),
  telefone: z.string().max(20, "Máximo de 20 caracteres").optional(),
  endereco: z.string().max(200, "Máximo de 200 caracteres").optional(),
});

export type ClienteFormValues = z.infer<typeof clienteSchema>;
