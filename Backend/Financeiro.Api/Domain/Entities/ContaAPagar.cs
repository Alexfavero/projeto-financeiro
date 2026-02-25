namespace Financeiro.Api.Domain.Entities
{
    public class ContaAPagar : DocumentoFinanceiro
    {
        public string NumeroNota { get; set; } = null!;
        public string? Descricao { get; set; }
    }
}
