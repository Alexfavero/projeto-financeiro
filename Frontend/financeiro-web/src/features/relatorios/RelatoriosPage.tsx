import { useState } from "react";
import { AppLayout } from "@/app/layout/AppLayout";
import { Button } from "@/shared/components/Button";
import { InadimplenciaTab } from "./tabs/InadimplenciaTab";
import { AtrasadasTab } from "./tabs/AtrasadasTab";
import { GastosPorCategoriaTab } from "./tabs/GastosPorCategoriaTab";
import { ExtratoTab } from "./tabs/ExtratoTab";
import { RankingTab } from "./tabs/RankingTab";

type Aba = "inadimplencia" | "atrasadas" | "gastos" | "extrato" | "ranking";

const ABAS: { key: Aba; label: string }[] = [
  { key: "inadimplencia", label: "Inadimplência" },
  { key: "atrasadas", label: "Contas a Pagar Atrasadas" },
  { key: "gastos", label: "Gastos por Categoria" },
  { key: "extrato", label: "Extrato" },
  { key: "ranking", label: "Ranking" },
];

// só leitura — sem editar/dar baixa/excluir aqui. Pra agir sobre algo visto
// num relatório, o caminho é ir pra tela correspondente (Parcelas etc)
export function RelatoriosPage() {
  const [aba, setAba] = useState<Aba>("inadimplencia");

  return (
    <AppLayout title="Relatórios">
      <div className="mb-5 flex flex-wrap gap-2">
        {ABAS.map((item) => (
          <Button
            key={item.key}
            variant={aba === item.key ? "primary" : "secondary"}
            size="sm"
            onClick={() => setAba(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {aba === "inadimplencia" && <InadimplenciaTab />}
      {aba === "atrasadas" && <AtrasadasTab />}
      {aba === "gastos" && <GastosPorCategoriaTab />}
      {aba === "extrato" && <ExtratoTab />}
      {aba === "ranking" && <RankingTab />}
    </AppLayout>
  );
}
