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
    public class FornecedoresController : ControllerBase
    {
        private readonly IUnitOfWork _uof;
        private readonly IMapper _mapper;

        public FornecedoresController(IUnitOfWork uof, IMapper mapper)
        {
            _uof = uof;
            _mapper = mapper;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<FornecedorDTO>>> GetPaged([FromQuery] Financeiro.Api.Pagination.QueryStringParameters parameters)
        {
            var paged = await _uof.FornecedorRepository.GetPagedAsync(parameters.PageNumber, parameters.PageSize);
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
            var result = _mapper.Map<IEnumerable<FornecedorDTO>>(paged);
            return Ok(result);
        }

        [HttpGet("{id}", Name = "GetFornecedorById")]
        public async Task<ActionResult<FornecedorDTO>> Get(int id)
        {
            var fornecedor = await _uof.FornecedorRepository.GetAsync(f => f.FornecedorId == id);

            if (fornecedor == null)
            {
                return NotFound("Fornecedor não encontrado");
            }

            return Ok(_mapper.Map<FornecedorDTO>(fornecedor));
        }

        [HttpGet("cnpj/{cnpj}")]
        public async Task<ActionResult<FornecedorDTO>> GetByCnpj(string cnpj)
        {
            var fornecedor = await _uof.FornecedorRepository.GetByCnpjAsync(cnpj);

            if (fornecedor == null)
            {
                return NotFound("Fornecedor com este CNPJ não encontrado");
            }

            return Ok(_mapper.Map<FornecedorDTO>(fornecedor));
        }

        [HttpPost]
        public async Task<ActionResult> Create(FornecedorDTO fornecedorDTO)
        {
            // CNPJ é a identidade real de um fornecedor — não pode haver dois
            // cadastros com o mesmo (GetByCnpjAsync já existe e é filtrado pelo
            // isolamento multiusuário, então só compara contra os fornecedores
            // do próprio usuário logado).
            var fornecedorExistente = await _uof.FornecedorRepository.GetByCnpjAsync(fornecedorDTO.CNPJ);
            if (fornecedorExistente != null)
            {
                return Conflict(
                    new Response { Status = "Error", Message = "Já existe um fornecedor cadastrado com este CNPJ." });
            }

            var fornecedor = _mapper.Map<Fornecedor>(fornecedorDTO);
            _uof.FornecedorRepository.Create(fornecedor);
            await _uof.CommitAsync();

            var fornecedorDTOCreated = _mapper.Map<FornecedorDTO>(fornecedor);
            return CreatedAtAction(nameof(Get), new { id = fornecedor.FornecedorId }, fornecedorDTOCreated);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, FornecedorDTO fornecedorDTO)
        {
            // validação de IDs (padronizada)
            if (id != fornecedorDTO.FornecedorId)
            {
                return BadRequest("IDs não conferem");
            }

            // buscar entidade rastreada para update seguro
            var existing = await _uof.FornecedorRepository.GetTrackedAsync(f => f.FornecedorId == id);
            if (existing == null)
            {
                return NotFound("Fornecedor não encontrado");
            }

            // mesma checagem de duplicidade do Create, mas ignorando o próprio
            // registro (senão editar um fornecedor sem trocar o CNPJ acusaria
            // conflito contra si mesmo).
            var fornecedorComMesmoCnpj = await _uof.FornecedorRepository.GetByCnpjAsync(fornecedorDTO.CNPJ);
            if (fornecedorComMesmoCnpj != null && fornecedorComMesmoCnpj.FornecedorId != id)
            {
                return Conflict(
                    new Response { Status = "Error", Message = "Já existe um fornecedor cadastrado com este CNPJ." });
            }

            // mapear valores do DTO sobre a entidade existente (preserva navegações)
            _mapper.Map(fornecedorDTO, existing);

            _uof.FornecedorRepository.Update(existing);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<FornecedorDTO>(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // obter entidade rastreada antes de remover
            var fornecedor = await _uof.FornecedorRepository.GetTrackedAsync(c => c.FornecedorId == id);

            if (fornecedor == null)
            {
                return NotFound("Fornecedor não encontrado");
            }

            _uof.FornecedorRepository.Delete(fornecedor);
            await _uof.CommitAsync();

            // padronização: retorna 204 NoContent para deletes sem payload
            return NoContent();
        }
    }
}