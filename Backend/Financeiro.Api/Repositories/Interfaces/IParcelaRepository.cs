using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IParcelaRepository : IRepository<Parcela>
    {
        Task<IEnumerable<Parcela>> GetVencendoHojeAsync();
        Task<IEnumerable<Parcela>> GetAtrasadasAsync();
        Task<IEnumerable<Parcela>> GetPorPeriodoAsync(DateTime inicio, DateTime fim);

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
