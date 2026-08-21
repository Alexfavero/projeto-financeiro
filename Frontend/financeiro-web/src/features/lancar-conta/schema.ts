import { z } from "zod";

/**
 * Validação do formulário de Lançar Conta com Zod, usada pelo React Hook
 * Form via `zodResolver`. Os campos vêm do HTML como string (inputs de
 * número/data), por isso o `z.coerce.number()` — ele converte antes de
 * validar.
 *
 * Fluxo (revisado a partir do feedback do usuário em 21/08): o Valor Total
 * é digitado pelo usuário (é a fonte da verdade), e a soma das parcelas
 * precisa bater exatamente com esse valor — nem mais, nem menos — validado
 * pelo `.refine` no final de cada schema, que anexa o erro no campo
 * "parcelas". Se o valor total foi digitado errado, a correção é mudar o
 * campo Valor Total (e gerar as parcelas de novo), não forçar as parcelas
 * a compensar um total errado.
 */

// Confere se o valor tem no máximo 2 casas decimais (dinheiro não tem
// fração de centavo). Comparar via centavos arredondados evita falso
// positivo por imprecisão de ponto flutuante (0.1 + 0.2 !== 0.3 em JS).
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

// Pequena tolerância pra evitar falso-positivo por imprecisão de ponto flutuante
// (ex.: 0.1 + 0.2 !== 0.3 em JS).
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
