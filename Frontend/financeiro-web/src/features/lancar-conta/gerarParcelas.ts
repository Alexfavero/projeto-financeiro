import { addDiasISO } from "@/shared/utils/format";
import type { ParcelaFormValues } from "./schema";

// Divide em centavos pra não sobrar resto de ponto flutuante. Quando a
// divisão não é exata, o resto vai 1 centavo pra cada uma das PRIMEIRAS
// parcelas (não tudo empilhado na última). Ex: R$100 em 3x vira
// 33,34 + 33,33 + 33,33. Soma sempre bate certo com o total.
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
