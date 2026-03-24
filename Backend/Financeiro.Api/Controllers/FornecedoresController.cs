using AutoMapper;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.DTOs;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Financeiro.Api.Controllers
{
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

        // GET: api/Fornecedores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FornecedorDTO>>> GetAll()
        {
            var fornecedores = await _uof.FornecedorRepository.GetAllAsync();
            var fornecedoresDto = _mapper.Map<IEnumerable<FornecedorDTO>>(fornecedores);
            return Ok(fornecedoresDto);
        }

        // GET: api/Fornecedores/5
        [HttpGet("{id}", Name = "GetById")]
        public async Task<ActionResult<FornecedorDTO>> Get(int id)
        {
            var fornecedor = await _uof.FornecedorRepository.GetAsync(f => f.FornecedorId == id);

            if (fornecedor == null)
            {
                return NotFound("Fornecedor não encontrado");
            }

            return Ok(_mapper.Map<FornecedorDTO>(fornecedor));
        }


        // POST: api/Fornecedores
        [HttpPost]
        public async Task<ActionResult> Create(FornecedorDTO fornecedorDTO)
        {
            var fornecedor = _mapper.Map<Fornecedor>(fornecedorDTO);

            _uof.FornecedorRepository.Create(fornecedor);
            await _uof.CommitAsync();

            var fornecedorDTOCreated = _mapper.Map<FornecedorDTO>(fornecedor);
            return CreatedAtAction(nameof(Get), new { id = fornecedor.FornecedorId }, fornecedorDTOCreated);
        }

        // PUT: api/Fornecedores/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, FornecedorDTO fornecedorDTO)
        {

            if (id != fornecedorDTO.FornecedorId)
            {
                return BadRequest("IDs não conferem");
            }

            var fornecedor = _mapper.Map<Fornecedor>(fornecedorDTO);

            _uof.FornecedorRepository.Update(fornecedor);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<FornecedorDTO>(fornecedor));
        }

        // DELETE: api/Fornecedores/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var fornecedor = await _uof.FornecedorRepository.GetAsync(c => c.FornecedorId == id);

            if (fornecedor == null)
            {
                return NotFound("Fornecedor não encontrado");
            }

            _uof.FornecedorRepository.Delete(fornecedor);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<FornecedorDTO>(fornecedor));
        }
    }
}
