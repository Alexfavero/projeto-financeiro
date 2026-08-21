import { AppLayout } from "@/app/layout/AppLayout";
import { Card } from "@/shared/components/Card";
import { Badge } from "@/shared/components/Badge";
import { Button } from "@/shared/components/Button";
import type { PrevisaoPeriodoDTO, ParcelaDTO } from "@/types/dtos";

/**
 * Parte 1: dado fixo, só pra validar layout/estilo contra o mockup.
 * Na Parte 2 isso vira `useQuery(['previsao', periodo], ...)` (TanStack
 * Query) buscando em `GET /api/previsao` — via MSW no modo mock.
 */
const previsaoMock: PrevisaoPeriodoDTO = {
  entradasPrevistas: 4320,
  saidasPrevistas: 2150,
  entradasRealizadas: 0,
  saidasRealizadas: 0,
  resumo: { saldo: 2170 },
};

const parcelasVencendoMock: (ParcelaDTO & { descricao: string })[] = [
  {
    parcelaId: 1,
    descricao: "Fornecedor ABC Ltda",
    valor: 350,
    dataVencimento: "2026-08-18",
    dataPagamento: null,
    status: "Pendente",
    documentoFinanceiroId: 10,
  },
  {
    parcelaId: 2,
    descricao: "Cliente João da Silva",
    valor: 120,
    dataVencimento: "2026-08-20",
    dataPagamento: null,
    status: "Pendente",
    documentoFinanceiroId: 11,
  },
  {
    parcelaId: 3,
    descricao: "Fornecedor XYZ Materiais",
    valor: 780,
    dataVencimento: "2026-08-25",
    dataPagamento: null,
    status: "Pendente",
    documentoFinanceiroId: 12,
  },
];

function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export function PainelPage() {
  const p = previsaoMock;

  return (
    <AppLayout title="Painel — Previsão Financeira">
      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Entradas Previstas
          </div>
          <div className="text-2xl font-bold text-good">
            {formatBRL(p.entradasPrevistas)}
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Saídas Previstas
          </div>
          <div className="text-2xl font-bold text-critical">
            {formatBRL(p.saidasPrevistas)}
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Saldo Projetado
          </div>
          <div className="text-2xl font-bold text-primary">
            {formatBRL(p.resumo.saldo)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <Card title="Parcelas vencendo">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] uppercase tracking-wide text-ink-secondary">
                <th className="pb-2">Descrição</th>
                <th className="pb-2">Valor</th>
                <th className="pb-2">Vencimento</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {parcelasVencendoMock.map((parcela) => (
                <tr key={parcela.parcelaId} className="border-b border-[#eef0f2] last:border-0">
                  <td className="py-2.5">{parcela.descricao}</td>
                  <td className="py-2.5">{formatBRL(parcela.valor)}</td>
                  <td className="py-2.5">{formatData(parcela.dataVencimento)}</td>
                  <td className="py-2.5">
                    <Badge variant="warning">Pendente</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Ações rápidas">
          <Button className="mb-2.5 w-full justify-center">+ Lançar Conta</Button>
          <Button variant="secondary" className="w-full justify-center">
            Registrar Pagamento
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}
