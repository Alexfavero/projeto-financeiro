import { z } from "zod";

// CNPJ sem pontuação, só os 14 dígitos — bate com [StringLength(14)] do FornecedorDTO.cs
export const fornecedorSchema = z.object({
  nome: z.string().min(1, "Informe o nome").max(100, "Máximo de 100 caracteres"),
  cnpj: z
    .string()
    .min(1, "Informe o CNPJ")
    .regex(/^\d{14}$/, "Informe os 14 dígitos do CNPJ, sem pontuação"),
});

export type FornecedorFormValues = z.infer<typeof fornecedorSchema>;
