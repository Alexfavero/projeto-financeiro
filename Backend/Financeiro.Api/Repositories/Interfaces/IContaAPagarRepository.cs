using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IContaAPagarRepository : IRepository<ContaAPagar>
    {
        Task<ContaAPagar?> GetContaCompletaAsync(int id);
        Task<IEnumerable<ContaAPagar>> GetByCategoriaAsync(CategoriaGasto categoria);
    }
}