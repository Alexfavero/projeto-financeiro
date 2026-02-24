namespace Financeiro.Api.Domain.Entities
{
    public abstract class DocumentoFinanceiro
    {
        public int Id { get; set; }
        public decimal ValorTotal { get; set; }
        public ICollection<Parcela> Parcelas { get; set; } = new List<Parcela>();
    }
}
