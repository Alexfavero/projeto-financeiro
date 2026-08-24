using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IClienteRepository : IRepository<Cliente>
    {
        Task<Cliente?> GetClienteComContasAsync(int id);

        // usado no ranking de clientes: já traz ContaAReceber e Parcelas incluídas
        // pra somar por cliente no RelatorioService
        Task<IEnumerable<Cliente>> GetTodosComContasAsync();
    }
}
