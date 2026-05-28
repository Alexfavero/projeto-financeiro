using Microsoft.AspNetCore.Mvc;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.Repositories.Interfaces;
using Financeiro.Api.DTOs;
using Financeiro.Api.Pagination;
using AutoMapper;
using System.Text.Json;

namespace Financeiro.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContasAPagarController : ControllerBase
    {
        private readonly IUnitOfWork _uof;
        private readonly IMapper _mapper;

        public ContasAPagarController(IUnitOfWork uof, IMapper mapper)
        {
            _uof = uof;
            _mapper = mapper;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContaAPagarDTO>>> GetPaged([FromQuery] Financeiro.Api.Pagination.ContaAPagarParameters parameters)
        {
            var paged = await _uof.ContaAPagarRepository.GetPagedAsync(parameters.PageNumber, parameters.PageSize);
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
            var result = _mapper.Map<IEnumerable<ContaAPagarDTO>>(paged);
            return Ok(result);
        }

        [HttpGet("{id}", Name = "GetContaPagarById")]
        public async Task<ActionResult<ContaAPagarDTO>> Get(int id)
        {
            var conta = await _uof.ContaAPagarRepository.GetContaCompletaAsync(id);
            if (conta == null) return NotFound("Conta a pagar não encontrada");

            return Ok(_mapper.Map<ContaAPagarDTO>(conta));
        }

        [HttpGet("categoria/{categoria}")]
        public async Task<ActionResult<IEnumerable<ContaAPagarDTO>>> GetByCategoria(CategoriaGasto categoria)
        {
            var contas = await _uof.ContaAPagarRepository.GetByCategoriaAsync(categoria);
            return Ok(_mapper.Map<IEnumerable<ContaAPagarDTO>>(contas));
        }

        [HttpPost]
        public async Task<ActionResult> Create(ContaAPagarDTO contaDTO)
        {
            var conta = _mapper.Map<ContaAPagar>(contaDTO);

            // validação de FK: se informar FornecedorId, garantir existência
            if (conta.FornecedorId.HasValue)
            {
                var fornecedor = await _uof.FornecedorRepository.GetAsync(f => f.FornecedorId == conta.FornecedorId.Value);
                if (fornecedor == null) return BadRequest("Fornecedor não encontrado");
            }

            _uof.ContaAPagarRepository.Create(conta);
            await _uof.CommitAsync();

            var createdDTO = _mapper.Map<ContaAPagarDTO>(conta);
            return CreatedAtAction(nameof(Get), new { id = conta.DocumentoFinanceiroId }, createdDTO);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ContaAPagarDTO contaDTO)
        {
            if (id != contaDTO.DocumentoFinanceiroId) return BadRequest("IDs não conferem");

            // buscar entidade rastreada
            var existing = await _uof.ContaAPagarRepository.GetTrackedAsync(c => c.DocumentoFinanceiroId == id);
            if (existing == null) return NotFound("Conta a pagar não encontrada");

            // validação de FK
            if (contaDTO.FornecedorId.HasValue)
            {
                var fornecedor = await _uof.FornecedorRepository.GetAsync(f => f.FornecedorId == contaDTO.FornecedorId.Value);
                if (fornecedor == null) return BadRequest("Fornecedor não encontrado");
            }

            // mapear valores do DTO sobre a entidade existente
            _mapper.Map(contaDTO, existing);
            _uof.ContaAPagarRepository.Update(existing);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ContaAPagarDTO>(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // obter entidade rastreada antes de remover
            var conta = await _uof.ContaAPagarRepository.GetTrackedAsync(c => c.DocumentoFinanceiroId == id);
            if (conta == null) return NotFound("Conta a pagar não encontrada");

            _uof.ContaAPagarRepository.Delete(conta);
            await _uof.CommitAsync();

            // padronização: retorna 204 NoContent para deletes sem payload
            return NoContent();
        }
    }
}