using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IParcelaRepository : IRepository<Parcela>
    {
        Task<IEnumerable<Parcela>> GetVencendoHojeAsync();
        Task<IEnumerable<Parcela>> GetAtrasadasAsync();
        Task<IEnumerable<Parcela>> GetPorPeriodoAsync(DateTime inicio, DateTime fim);
    }
}
