using Financeiro.Api.DTOs;
using Financeiro.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Financeiro.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PrevisaoController : ControllerBase
    {
        private readonly IPrevisaoService _previsaoService;

        public PrevisaoController(IPrevisaoService previsaoService)
        {
            _previsaoService = previsaoService;
        }

        // GET: api/previsao?inicio=2026-08-01&fim=2026-08-31
        // Devolve previsto e realizado juntos, numa chamada só, pra dar pra comparar
        // sem precisar bater duas vezes no endpoint.
        [HttpGet]
        public async Task<ActionResult<PrevisaoPeriodoDTO>> Get([FromQuery] DateTime inicio, [FromQuery] DateTime fim)
        {
            if (fim < inicio)
                return BadRequest("A data final não pode ser anterior à data inicial");

            var resumo = await _previsaoService.ObterResumoPeriodoAsync(inicio, fim);
            return Ok(resumo);
        }
    }
}
