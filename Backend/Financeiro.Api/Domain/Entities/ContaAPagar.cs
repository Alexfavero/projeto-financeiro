using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Domain.Entities
{
    public class ContaAPagar : DocumentoFinanceiro
    {
        public int? FornecedorId { get; set; }
        public Fornecedor? Fornecedor { get; set; }

        public string? NumeroNota { get; set; }
        public string? Descricao { get; set; }
        public CategoriaGasto Categoria { get; set; }
    }
}
