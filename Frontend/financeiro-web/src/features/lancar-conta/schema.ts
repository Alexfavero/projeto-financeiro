import { z } from "zod";

// z.coerce.number() pq os inputs vêm como string do HTML (number/date).
// Valor Total é a fonte da verdade: a soma das parcelas tem que bater exato
// com ele (validado no .refine de cada schema, erro cai no campo "parcelas").

// Confere se tem no máximo 2 casas decimais comparando em centavos
// arredondados (evita erro de ponto flutuante tipo 0.1+0.2 !== 0.3).
export function temNoMaximoDuasCasas(valor: number): boolean {
  return Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6;
}

export const parcelaSchema = z.object({
  valor: z.coerce
    .number({ invalid_type_error: "Informe um valor" })
    .positive("O valor deve ser maior que zero")
    .refine(temNoMaximoDuasCasas, "Use no máximo 2 casas decimais"),
  dataVencimento: z.string().min(1, "Informe a data de vencimento"),
});

export type ParcelaFormValues = z.infer<typeof parcelaSchema>;

function somaParcelas(parcelas: ParcelaFormValues[]): number {
  return parcelas.reduce((soma, p) => soma + (Number(p.valor) || 0), 0);
}

// Tolerância pra imprecisão de ponto flutuante (0.1 + 0.2 !== 0.3 em JS).
const TOLERANCIA = 0.005;

export const contaAPagarSchema = z
  .object({
    valorTotal: z.coerce
      .number({ invalid_type_error: "Informe o valor total" })
      .positive("O valor total deve ser maior que zero")
      .refine(temNoMaximoDuasCasas, "Use no máximo 2 casas decimais"),
    fornecedorId: z.string().optional(), // "" = sem fornecedor; convertido pra number|undefined no submit
    categoria: z.coerce
      .number({ invalid_type_error: "Selecione uma categoria" })
      .refine((v) => [1, 2, 3, 4].includes(v), "Selecione uma categoria"),
    numeroNota: z.string().optional(),
    descricao: z.string().optional(),
    parcelas: z.array(parcelaSchema).min(1, "Adicione pelo menos uma parcela"),
  })
  .refine((data) => Math.abs(somaParcelas(data.parcelas) - data.valorTotal) <= TOLERANCIA, {
    message: "A soma das parcelas precisa ser igual ao valor total informado.",
    path: ["parcelas"],
  });

export type ContaAPagarFormValues = z.infer<typeof contaAPagarSchema>;

export const contaAReceberSchema = z
  .object({
    valorTotal: z.coerce
      .number({ invalid_type_error: "Informe o valor total" })
      .positive("O valor total deve ser maior que zero")
      .refine(temNoMaximoDuasCasas, "Use no máximo 2 casas decimais"),
    clienteId: z.string().min(1, "Selecione um cliente"),
    dataVenda: z.string().min(1, "Informe a data da venda"),
    parcelas: z.array(parcelaSchema).min(1, "Adicione pelo menos uma parcela"),
  })
  .refine((data) => Math.abs(somaParcelas(data.parcelas) - data.valorTotal) <= TOLERANCIA, {
    message: "A soma das parcelas precisa ser igual ao valor total informado.",
    path: ["parcelas"],
  });

export type ContaAReceberFormValues = z.infer<typeof contaAReceberSchema>;
