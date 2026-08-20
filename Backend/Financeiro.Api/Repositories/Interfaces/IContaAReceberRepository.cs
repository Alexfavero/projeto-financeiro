using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IContaAReceberRepository : IRepository<ContaAReceber>
    {
        Task<ContaAReceber?> GetContaCompletaAsync(int id);

        // Para os relatórios de inadimplência e gastos: traz tudo com Cliente e Parcelas
        // incluídos, e o filtro/agrupamento por relatório fica no RelatorioService.
        Task<IEnumerable<ContaAReceber>> GetTodasComParcelasAsync();
    }
}
