namespace Financeiro.Api.Domain.Entities
{
    public abstract class DocumentoFinanceiro
    {
        public int DocumentoFinanceiroId { get; set; }
        public decimal ValorTotal { get; set; }
        public ICollection<Parcela> Parcelas { get; set; } = new List<Parcela>();
    }
}
