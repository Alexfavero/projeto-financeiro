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
    public class ClientesController : ControllerBase
    {
        private readonly IUnitOfWork _uof;
        private readonly IMapper _mapper;

        public ClientesController(IUnitOfWork uof, IMapper mapper)
        {
            _uof = uof;
            _mapper = mapper;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClienteDTO>>> GetPaged([FromQuery] Financeiro.Api.Pagination.QueryStringParameters parameters)
        {
            var paged = await _uof.ClienteRepository.GetPagedAsync(parameters.PageNumber, parameters.PageSize);
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
            var result = _mapper.Map<IEnumerable<ClienteDTO>>(paged);
            return Ok(result);
        }

        [HttpGet("{id}", Name = "GetClienteById")]
        public async Task<ActionResult<ClienteDTO>> Get(int id)
        {
            var cliente = await _uof.ClienteRepository.GetClienteComContasAsync(id);

            if (cliente == null)
            {
                return NotFound("Cliente não encontrado");
            }

            return Ok(_mapper.Map<ClienteDTO>(cliente));
        }

        [HttpPost]
        public async Task<ActionResult> Create(ClienteDTO clienteDto)
        {
            var cliente = _mapper.Map<Cliente>(clienteDto);
            _uof.ClienteRepository.Create(cliente);
            await _uof.CommitAsync();

            var clienteDtoCreated = _mapper.Map<ClienteDTO>(cliente);
            return CreatedAtAction(nameof(Get), new { id = cliente.ClienteId }, clienteDtoCreated);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ClienteDTO clienteDto)
        {
            // validação de IDs (padronizada com o resto do projeto)
            if (id != clienteDto.ClienteId)
            {
                return BadRequest("IDs não conferem");
            }

            // buscar entidade rastreada para update seguro (preserva navegações)
            var existing = await _uof.ClienteRepository.GetTrackedAsync(c => c.ClienteId == id);
            if (existing == null)
            {
                // comportamento padrão do projeto: retornar 404 se não existir
                return NotFound("Cliente não encontrado");
            }

            // mapear os valores do DTO sobre a entidade existente para evitar sobrescrever navegações
            _mapper.Map(clienteDto, existing);

            _uof.ClienteRepository.Update(existing);
            await _uof.CommitAsync();

            // retornar o DTO atualizado (padronizado)
            return Ok(_mapper.Map<ClienteDTO>(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // obter entidade rastreada antes de remover
            var cliente = await _uof.ClienteRepository.GetTrackedAsync(c => c.ClienteId == id);

            if (cliente == null)
            {
                return NotFound("Cliente não encontrado");
            }

            _uof.ClienteRepository.Delete(cliente);
            await _uof.CommitAsync();

            // padronização: retorna 204 NoContent para deletes sem payload
            return NoContent();
        }
    }
}