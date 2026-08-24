using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IContaAReceberRepository : IRepository<ContaAReceber>
    {
        Task<ContaAReceber?> GetContaCompletaAsync(int id);

        // usado nos relatórios de inadimplência e gastos: já traz Cliente e Parcelas
        // incluídos, o filtro/agrupamento fica no RelatorioService
        Task<IEnumerable<ContaAReceber>> GetTodasComParcelasAsync();
    }
}
