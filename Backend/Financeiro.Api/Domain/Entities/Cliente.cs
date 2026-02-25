namespace Financeiro.Api.Domain.Entities;

public class Cliente
{
    public int ClienteId { get; set; }
    public string Nome { get; set; } = null!;
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public string? Endereco { get; set; }

    // propriedades de navegação
    public ICollection<ContaAReceber> ContasAReceber { get; set; } = new List<ContaAReceber>();

}
