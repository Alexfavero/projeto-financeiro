using AutoMapper;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.DTOs;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

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
        public async Task<ActionResult<IEnumerable<ContaAPagarDTO>>> GetAll()
        {
            var contas = await _uof.ContaAPagarRepository.GetAllAsync();
            return Ok(_mapper.Map<IEnumerable<ContaAPagarDTO>>(contas));
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

            _uof.ContaAPagarRepository.Create(conta);
            await _uof.CommitAsync();

            var createdDTO = _mapper.Map<ContaAPagarDTO>(conta);
            return CreatedAtAction(nameof(Get), new { id = conta.DocumentoFinanceiroId }, createdDTO);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ContaAPagarDTO contaDTO)
        {
            if (id != contaDTO.DocumentoFinanceiroId) return BadRequest("IDs não conferem");

            var conta = _mapper.Map<ContaAPagar>(contaDTO);
            _uof.ContaAPagarRepository.Update(conta);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ContaAPagarDTO>(conta));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var conta = await _uof.ContaAPagarRepository.GetAsync(c => c.DocumentoFinanceiroId == id);
            if (conta == null) return NotFound("Conta a pagar não encontrada");

            _uof.ContaAPagarRepository.Delete(conta);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ContaAPagarDTO>(conta));
        }
    }
}