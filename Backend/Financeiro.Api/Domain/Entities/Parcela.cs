using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Domain.Entities
{
    public class Parcela
    {
        public int ParcelaId { get; set; }
        public decimal Valor { get; set; }
        public DateTime DataVencimento { get; set; }
        public DateTime? DataPagamento { get; set; }
        public StatusPagamento Status { get; set; } = StatusPagamento.Pendente;

        public int DocumentoFinanceiroId { get; set; }
        public DocumentoFinanceiro DocumentoFinanceiro { get; set; } = null!;
    }
}
