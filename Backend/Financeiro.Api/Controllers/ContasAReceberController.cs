using AutoMapper;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.DTOs;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Financeiro.Api.Controllers
{
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

        // GET: api/contasAReceber
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContaAReceberDTO>>> GetAll()
        {
            var contasAReceber = await _uof.ContaAReceberRepository.GetAllAsync();
            var contasAReceberDto = _mapper.Map<IEnumerable<ContaAReceberDTO>>(contasAReceber);
            return Ok(contasAReceberDto);
        }

        // GET: api/contasAReceber/5
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


        // POST: api/contasAReceber
        [HttpPost]
        public async Task<ActionResult> Create(ContaAReceberDTO contaAReceberDTO)
        {
            var contaAReceber = _mapper.Map<ContaAReceber>(contaAReceberDTO);

            _uof.ContaAReceberRepository.Create(contaAReceber);
            await _uof.CommitAsync();

            var contaAReceberDTOCreated = _mapper.Map<ContaAReceberDTO>(contaAReceber);
            return CreatedAtAction(nameof(Get), new { id = contaAReceber.DocumentoFinanceiroId }, contaAReceberDTOCreated);
        }

        // PUT: api/contasAReceber/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ContaAReceberDTO contaAReceberDTO)
        {

            if (id != contaAReceberDTO.DocumentoFinanceiroId)
            {
                return BadRequest("IDs não conferem");
            }

            var contaAReceber = _mapper.Map<ContaAReceber>(contaAReceberDTO);

            _uof.ContaAReceberRepository.Update(contaAReceber);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ContaAReceberDTO>(contaAReceber));
        }

        // DELETE: api/contasAReceber/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var contaAReceber = await _uof.ContaAReceberRepository.GetAsync(c => c.DocumentoFinanceiroId == id);

            if (contaAReceber == null)
            {
                return NotFound("Conta a receber não encontrado");
            }

            _uof.ContaAReceberRepository.Delete(contaAReceber);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ContaAReceberDTO>(contaAReceber));
        }
    }

}
