using Financeiro.Api.DTOs;

namespace Financeiro.Api.Services.Interfaces
{
    public interface IPrevisaoService
    {
        Task<PrevisaoPeriodoDTO> ObterResumoPeriodoAsync(DateTime inicio, DateTime fim);
    }
}
