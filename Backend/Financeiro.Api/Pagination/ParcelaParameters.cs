using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Pagination
{
    public class ParcelaParameters : QueryStringParameters
    {
        public StatusPagamento? Status { get; set; }
        // "APagar" ou "AReceber" - mesmos valores que o Tipo calculado do ParcelaDTO
        // no front; filtra pelo discriminador TPH do DocumentoFinanceiro
        public string? Tipo { get; set; }
        // true so na aba "Todas" da tela de Parcelas (parcela paga sai da lista
        // principal e passa a viver so na aba Historico) - default false pra nao
        // mudar o comportamento de quem ja usa esse endpoint sem passar isso (ex: o grafico do Painel)
        public bool ExcluirPagas { get; set; } = false;
        public string? OrderBy { get; set; }
    }
}
