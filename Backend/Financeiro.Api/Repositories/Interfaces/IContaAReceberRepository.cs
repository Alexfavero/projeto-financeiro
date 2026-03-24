using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IContaAReceberRepository : IRepository<ContaAReceber>
    {
        Task<ContaAReceber?> GetContaCompletaAsync(int id);
    }
}
