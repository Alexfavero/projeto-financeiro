namespace Financeiro.Api.Domain.Entities;

public class ContaAReceber : DocumentoFinanceiro
{
    //FK para Cliente
    public int ClienteId { get; set; }
    public DateTime DataVenda { get; set; } = DateTime.UtcNow;

    // propriedades de navegação
    public Cliente Cliente { get; set; } = null!;

}
