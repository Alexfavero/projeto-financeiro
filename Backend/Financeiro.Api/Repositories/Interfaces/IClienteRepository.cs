using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IClienteRepository : IRepository<Cliente>
    {
        Task<Cliente?> GetClienteComContasAsync(int id);

        // Para o relatório de ranking (top clientes): todos os clientes com suas
        // ContaAReceber e Parcelas incluídas, para somar por cliente no RelatorioService.
        Task<IEnumerable<Cliente>> GetTodosComContasAsync();
    }
}
