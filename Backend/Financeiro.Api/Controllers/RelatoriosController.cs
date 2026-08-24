using Financeiro.Api.DTOs;
using Financeiro.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Financeiro.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class RelatoriosController : ControllerBase
    {
        private readonly IRelatorioService _relatorioService;

        public RelatoriosController(IRelatorioService relatorioService)
        {
            _relatorioService = relatorioService;
        }

        [HttpGet("inadimplencia")]
        public async Task<ActionResult<IEnumerable<InadimplenciaClienteDTO>>> GetInadimplencia()
        {
            return Ok(await _relatorioService.ObterInadimplenciaAsync());
        }

        [HttpGet("gastos-por-categoria")]
        public async Task<ActionResult<IEnumerable<GastoPorCategoriaDTO>>> GetGastosPorCategoria([FromQuery] DateTime inicio, [FromQuery] DateTime fim)
        {
            if (fim < inicio)
                return BadRequest("A data final não pode ser anterior à data inicial");

            return Ok(await _relatorioService.ObterGastosPorCategoriaAsync(inicio, fim));
        }

        [HttpGet("extrato/cliente/{clienteId}")]
        public async Task<ActionResult<ExtratoDTO>> GetExtratoCliente(int clienteId)
        {
            var extrato = await _relatorioService.ObterExtratoClienteAsync(clienteId);
            if (extrato == null) return NotFound("Cliente não encontrado");

            return Ok(extrato);
        }

        [HttpGet("extrato/fornecedor/{fornecedorId}")]
        public async Task<ActionResult<ExtratoDTO>> GetExtratoFornecedor(int fornecedorId)
        {
            var extrato = await _relatorioService.ObterExtratoFornecedorAsync(fornecedorId);
            if (extrato == null) return NotFound("Fornecedor não encontrado");

            return Ok(extrato);
        }

        [HttpGet("contas-a-pagar-atrasadas")]
        public async Task<ActionResult<IEnumerable<ContaAtrasadaFornecedorDTO>>> GetContasAPagarAtrasadas()
        {
            return Ok(await _relatorioService.ObterContasAPagarAtrasadasAsync());
        }

        [HttpGet("top-clientes")]
        public async Task<ActionResult<IEnumerable<RankingDTO>>> GetTopClientes([FromQuery] int quantidade = 10)
        {
            return Ok(await _relatorioService.ObterTopClientesAsync(quantidade));
        }

        [HttpGet("top-fornecedores")]
        public async Task<ActionResult<IEnumerable<RankingDTO>>> GetTopFornecedores([FromQuery] int quantidade = 10)
        {
            return Ok(await _relatorioService.ObterTopFornecedoresAsync(quantidade));
        }
    }
}
