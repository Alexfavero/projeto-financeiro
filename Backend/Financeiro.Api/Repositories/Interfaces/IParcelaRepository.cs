using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IParcelaRepository : IRepository<Parcela>
    {
        Task<IEnumerable<Parcela>> GetVencendoHojeAsync();
        Task<IEnumerable<Parcela>> GetAtrasadasAsync();
        Task<IEnumerable<Parcela>> GetPorPeriodoAsync(DateTime inicio, DateTime fim);

        // Igual ao GetPagedAsync genérico (herdado de IRepository<Parcela>), mas
        // incluindo o DocumentoFinanceiro pai (e o Fornecedor/Cliente dele) — é o
        // que a tela de Parcelas usa na aba "Todas", pra mostrar de quem é cada
        // parcela sem precisar de uma chamada extra.
        Task<Financeiro.Api.Pagination.PagedList<Parcela>> GetPagedComContraparteAsync(int pageNumber, int pageSize, StatusPagamento? status = null);

        // Previsão de gastos e recebimentos: cada método soma o Valor das parcelas
        // direto no banco (SumAsync), sem trazer as parcelas inteiras pra memória.
        // "Pendente" = previsto (ainda não pago, por DataVencimento).
        // "Recebido"/"Pago" = realizado (já pago, por DataPagamento).
        Task<decimal> GetTotalAReceberPendentePorPeriodoAsync(DateTime inicio, DateTime fim);
        Task<decimal> GetTotalAPagarPendentePorPeriodoAsync(DateTime inicio, DateTime fim);
        Task<decimal> GetTotalRecebidoPorPeriodoAsync(DateTime inicio, DateTime fim);
        Task<decimal> GetTotalPagoPorPeriodoAsync(DateTime inicio, DateTime fim);
    }
}
