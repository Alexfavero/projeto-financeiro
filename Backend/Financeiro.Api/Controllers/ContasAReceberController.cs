using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;
using Financeiro.Api.DTOs;
using Financeiro.Api.Pagination;
using AutoMapper;
using System.Text.Json;

namespace Financeiro.Api.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ContasAReceberController : ControllerBase
    {

        private readonly IUnitOfWork _uof;
        private readonly IMapper _mapper;

        public ContasAReceberController(IUnitOfWork uof, IMapper mapper)
        {
            _uof = uof;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContaAReceberDTO>>> GetPaged([FromQuery] Financeiro.Api.Pagination.ContaAReceberParameters parameters)
        {
            var paged = await _uof.ContaAReceberRepository.GetPagedAsync(parameters.PageNumber, parameters.PageSize);
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
            var result = _mapper.Map<IEnumerable<ContaAReceberDTO>>(paged);
            return Ok(result);
        }

        [HttpGet("{id}", Name = "GetById")]
        public async Task<ActionResult<ContaAReceberDTO>> Get(int id)
        {
            var contaAReceber = await _uof.ContaAReceberRepository.GetContaCompletaAsync(id);

            if (contaAReceber == null)
            {
                return NotFound("Conta a receber não encontrado");
            }

            return Ok(_mapper.Map<ContaAReceberDTO>(contaAReceber));
        }


        [HttpPost]
        public async Task<ActionResult> Create(ContaAReceberDTO contaAReceberDTO)
        {
            var contaAReceber = _mapper.Map<ContaAReceber>(contaAReceberDTO);

            var cliente = await _uof.ClienteRepository.GetAsync(c => c.ClienteId == contaAReceber.ClienteId);
            if (cliente == null) return BadRequest("Cliente não encontrado");

            _uof.ContaAReceberRepository.Create(contaAReceber);
            await _uof.CommitAsync();

            var contaAReceberDTOCreated = _mapper.Map<ContaAReceberDTO>(contaAReceber);
            return CreatedAtAction(nameof(Get), new { id = contaAReceber.DocumentoFinanceiroId }, contaAReceberDTOCreated);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ContaAReceberDTO contaAReceberDTO)
        {

            if (id != contaAReceberDTO.DocumentoFinanceiroId)
            {
                return BadRequest("IDs não conferem");
            }

            var existing = await _uof.ContaAReceberRepository.GetTrackedAsync(c => c.DocumentoFinanceiroId == id);
            if (existing == null) return NotFound("Conta a receber não encontrado");

            var cliente = await _uof.ClienteRepository.GetAsync(c => c.ClienteId == contaAReceberDTO.ClienteId);
            if (cliente == null) return BadRequest("Cliente não encontrado");

            _mapper.Map(contaAReceberDTO, existing);
            _uof.ContaAReceberRepository.Update(existing);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ContaAReceberDTO>(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var contaAReceber = await _uof.ContaAReceberRepository.GetTrackedAsync(c => c.DocumentoFinanceiroId == id);

            if (contaAReceber == null)
            {
                return NotFound("Conta a receber não encontrado");
            }

            _uof.ContaAReceberRepository.Delete(contaAReceber);
            await _uof.CommitAsync();

            return NoContent();
        }
    }
}
