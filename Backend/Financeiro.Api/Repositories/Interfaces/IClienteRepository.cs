using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IClienteRepository : IRepository<Cliente>
    {
        Task<Cliente?> GetClienteComContasAsync(int id);
    }
}
