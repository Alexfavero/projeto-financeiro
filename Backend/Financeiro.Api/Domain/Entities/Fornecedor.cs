namespace Financeiro.Api.Domain.Entities
{
    public class Fornecedor
    {
        public int FornecedorId { get; set; }
        public string Nome { get; set; } = null!;
        public string CNPJ { get; set; }

    }
}
