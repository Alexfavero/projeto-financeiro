using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Pagination
{
    public class ParcelaParameters : QueryStringParameters
    {
        public StatusPagamento? Status { get; set; }
        public string? OrderBy { get; set; }
    }
}
