using Financeiro.Api.DTOs;

namespace Financeiro.Api.Services.Interfaces
{
    public interface IRelatorioService
    {
        Task<IEnumerable<InadimplenciaClienteDTO>> ObterInadimplenciaAsync();
        Task<IEnumerable<GastoPorCategoriaDTO>> ObterGastosPorCategoriaAsync(DateTime inicio, DateTime fim);
        Task<ExtratoDTO?> ObterExtratoClienteAsync(int clienteId);
        Task<ExtratoDTO?> ObterExtratoFornecedorAsync(int fornecedorId);
        Task<IEnumerable<ContaAtrasadaFornecedorDTO>> ObterContasAPagarAtrasadasAsync();
        Task<IEnumerable<RankingDTO>> ObterTopClientesAsync(int quantidade = 10);
        Task<IEnumerable<RankingDTO>> ObterTopFornecedoresAsync(int quantidade = 10);
    }
}
