using Microsoft.AspNetCore.Mvc;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;
using Financeiro.Api.DTOs;
using Financeiro.Api.Pagination;
using AutoMapper;
using System.Text.Json;

namespace Financeiro.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ParcelasController : ControllerBase
    {
        private readonly IUnitOfWork _uof;
        private readonly IMapper _mapper;

        public ParcelasController(IUnitOfWork uof, IMapper mapper)
        {
            _uof = uof;
            _mapper = mapper;
        }

        // GET: api/parcelas/vencendo-hoje
        [HttpGet("vencendo-hoje")]
        public async Task<ActionResult<IEnumerable<ParcelaDTO>>> GetVencendoHoje()
        {
            var parcelas = await _uof.ParcelaRepository.GetVencendoHojeAsync();
            return Ok(_mapper.Map<IEnumerable<ParcelaDTO>>(parcelas));
        }

        // GET: api/parcelas/atrasadas
        [HttpGet("atrasadas")]
        public async Task<ActionResult<IEnumerable<ParcelaDTO>>> GetAtrasadas()
        {
            var parcelas = await _uof.ParcelaRepository.GetAtrasadasAsync();
            return Ok(_mapper.Map<IEnumerable<ParcelaDTO>>(parcelas));
        }

        // GET: api/parcelas/periodo?inicio=2026-03-01&fim=2026-03-31
        [HttpGet("periodo")]
        public async Task<ActionResult<IEnumerable<ParcelaDTO>>> GetPorPeriodo([FromQuery] DateTime inicio, [FromQuery] DateTime fim)
        {
            var parcelas = await _uof.ParcelaRepository.GetPorPeriodoAsync(inicio, fim);
            return Ok(_mapper.Map<IEnumerable<ParcelaDTO>>(parcelas));
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ParcelaDTO>>> GetPaged([FromQuery] Financeiro.Api.Pagination.ParcelaParameters parameters)
        {
            var paged = await _uof.ParcelaRepository.GetPagedAsync(parameters.PageNumber, parameters.PageSize);
            var paginationMetadata = new
            {
                currentPage = paged.CurrentPage,
                totalPages = paged.TotalPages,
                pageSize = paged.PageSize,
                totalCount = paged.TotalCount,
                hasPrevious = paged.HasPrevious,
                hasNext = paged.HasNext
            };
            Response.Headers.Append("X-Pagination", JsonSerializer.Serialize(paginationMetadata));
            var result = _mapper.Map<IEnumerable<ParcelaDTO>>(paged);
            return Ok(result);
        }

        // GET: api/parcelas/5
        [HttpGet("{id}", Name = "GetParcelaById")]
        public async Task<ActionResult<ParcelaDTO>> Get(int id)
        {
            var parcela = await _uof.ParcelaRepository.GetAsync(p => p.ParcelaId == id);
            if (parcela == null) return NotFound("Parcela não encontrada");

            return Ok(_mapper.Map<ParcelaDTO>(parcela));
        }

        // PUT: api/parcelas/5 (Útil para dar baixa no pagamento)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ParcelaDTO parcelaDTO)
        {
            if (id != parcelaDTO.ParcelaId) return BadRequest("IDs não conferem");

            // obter entidade rastreada
            var existing = await _uof.ParcelaRepository.GetTrackedAsync(p => p.ParcelaId == id);
            if (existing == null) return NotFound("Parcela não encontrada");

            // mapear valores do DTO sobre a entidade existente
            _mapper.Map(parcelaDTO, existing);
            _uof.ParcelaRepository.Update(existing);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ParcelaDTO>(existing));
        }

        // DELETE: api/parcelas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // obter entidade rastreada antes de remover
            var parcela = await _uof.ParcelaRepository.GetTrackedAsync(p => p.ParcelaId == id);
            if (parcela == null) return NotFound("Parcela não encontrada");

            _uof.ParcelaRepository.Delete(parcela);
            await _uof.CommitAsync();

            // padronização: retorna 204 NoContent para deletes sem payload
            return NoContent();
        }
    }
}