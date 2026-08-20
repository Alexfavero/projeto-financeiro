using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IContaAPagarRepository : IRepository<ContaAPagar>
    {
        Task<ContaAPagar?> GetContaCompletaAsync(int id);
        Task<IEnumerable<ContaAPagar>> GetByCategoriaAsync(CategoriaGasto categoria);

        // Para os relatórios de gastos por categoria, contas a pagar atrasadas e ranking
        // de fornecedores: traz tudo com Fornecedor e Parcelas incluídos, e o filtro/
        // agrupamento por relatório fica no RelatorioService.
        Task<IEnumerable<ContaAPagar>> GetTodasComParcelasAsync();

        // Para o extrato de um fornecedor específico.
        Task<IEnumerable<ContaAPagar>> GetPorFornecedorAsync(int fornecedorId);
    }
}
