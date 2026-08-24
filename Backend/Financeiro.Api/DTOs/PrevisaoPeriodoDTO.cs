namespace Financeiro.Api.DTOs
{
    // usado tanto pra "Previsto" quanto pra "Realizado"
    public class ResumoDTO
    {
        public decimal TotalAReceber { get; set; }
        public decimal TotalAPagar { get; set; }

        // não é saldo de caixa acumulado, é só a receber menos a pagar no período
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
