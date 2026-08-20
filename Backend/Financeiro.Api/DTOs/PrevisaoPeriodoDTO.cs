namespace Financeiro.Api.DTOs
{
    // Um bloco de totais (usado tanto para "Previsto" quanto para "Realizado").
    public class ResumoDTO
    {
        public decimal TotalAReceber { get; set; }
        public decimal TotalAPagar { get; set; }

        // Diferença entre o que entra e o que sai no período — não é saldo de caixa
        // acumulado, é só "a receber menos a pagar" dentro do período consultado.
        public decimal Saldo => TotalAReceber - TotalAPagar;
    }

    public class PrevisaoPeriodoDTO
    {
        public DateTime Inicio { get; set; }
        public DateTime Fim { get; set; }

        // Parcelas ainda não pagas, pela DataVencimento (o que está previsto pra entrar/sair).
        public ResumoDTO Previsto { get; set; } = new();

        // Parcelas já pagas, pela DataPagamento (o que já entrou/saiu de fato).
        public ResumoDTO Realizado { get; set; } = new();
    }
}
