using Financeiro.Api.DTOs;
using Financeiro.Api.Repositories.Interfaces;
using Financeiro.Api.Services.Interfaces;

namespace Financeiro.Api.Services.Implementations
{
    // tem Service pq junta 4 totais numa resposta só; os CRUDs simples os controllers
    // chamam direto no UnitOfWork
    public class PrevisaoService : IPrevisaoService
    {
        private readonly IUnitOfWork _uof;

        public PrevisaoService(IUnitOfWork uof)
        {
            _uof = uof;
        }

        public async Task<PrevisaoPeriodoDTO> ObterResumoPeriodoAsync(DateTime inicio, DateTime fim)
        {
            var totalAReceberPendente = await _uof.ParcelaRepository.GetTotalAReceberPendentePorPeriodoAsync(inicio, fim);
            var totalAPagarPendente = await _uof.ParcelaRepository.GetTotalAPagarPendentePorPeriodoAsync(inicio, fim);
            var totalRecebido = await _uof.ParcelaRepository.GetTotalRecebidoPorPeriodoAsync(inicio, fim);
            var totalPago = await _uof.ParcelaRepository.GetTotalPagoPorPeriodoAsync(inicio, fim);

            return new PrevisaoPeriodoDTO
            {
                Inicio = inicio,
                Fim = fim,
                Previsto = new ResumoDTO
                {
                    TotalAReceber = totalAReceberPendente,
                    TotalAPagar = totalAPagarPendente
                },
                Realizado = new ResumoDTO
                {
                    TotalAReceber = totalRecebido,
                    TotalAPagar = totalPago
                }
            };
        }
    }
}
