using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Pagination
{
    public class ContaAPagarParameters : QueryStringParameters
    {
        public CategoriaGasto? Categoria { get; set; }
        public string? OrderBy { get; set; }
    }
}
