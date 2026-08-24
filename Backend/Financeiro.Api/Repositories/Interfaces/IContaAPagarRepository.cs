using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IContaAPagarRepository : IRepository<ContaAPagar>
    {
        Task<ContaAPagar?> GetContaCompletaAsync(int id);
        Task<IEnumerable<ContaAPagar>> GetByCategoriaAsync(CategoriaGasto categoria);

        // usado nos relatórios de gastos, contas atrasadas e ranking de fornecedores:
        // já traz Fornecedor e Parcelas incluídos, o filtro/agrupamento fica no RelatorioService
        Task<IEnumerable<ContaAPagar>> GetTodasComParcelasAsync();

        Task<IEnumerable<ContaAPagar>> GetPorFornecedorAsync(int fornecedorId);
    }
}
