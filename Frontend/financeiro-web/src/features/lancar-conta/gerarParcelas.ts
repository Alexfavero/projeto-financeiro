import { addDiasISO } from "@/shared/utils/format";
import type { ParcelaFormValues } from "./schema";

/**
 * Gera `quantidade` parcelas a partir do valor total, espaçadas por
 * `intervaloDias` a partir de `primeiraData`.
 *
 * O valor é dividido em centavos pra evitar sobra de ponto flutuante. Como
 * a divisão nem sempre é exata, o resto (em centavos) é distribuído UM
 * CENTAVO DE CADA VEZ nas PRIMEIRAS parcelas — não tudo empilhado na
 * última (feedback do usuário em 21/08). Ex.: R$ 100,00 em 3 parcelas vira
 * 33,34 + 33,33 + 33,33 (o 1º centavo de resto vai pra 1ª parcela), e não
 * 33,33 + 33,33 + 33,34. A soma bate exatamente com o valor total, sempre.
 */
export function gerarParcelasAutomaticas(
  valorTotal: number,
  quantidade: number,
  intervaloDias: number,
  primeiraData: string,
): ParcelaFormValues[] {
  const centavosTotal = Math.round(valorTotal * 100);
  const centavosBase = Math.floor(centavosTotal / quantidade);
  const restoCentavos = centavosTotal - centavosBase * quantidade; // 0 <= resto < quantidade

  const parcelas: ParcelaFormValues[] = [];

  for (let i = 0; i < quantidade; i++) {
    // As primeiras `restoCentavos` parcelas levam +1 centavo cada.
    const centavos = centavosBase + (i < restoCentavos ? 1 : 0);

    parcelas.push({
      valor: centavos / 100,
      dataVencimento: addDiasISO(primeiraData, i * intervaloDias),
    });
  }

  return parcelas;
}
