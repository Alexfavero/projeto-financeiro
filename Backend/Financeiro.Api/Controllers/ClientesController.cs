using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;
using AutoMapper;
using Financeiro.Api.DTOs;

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

        // GET: api/Clientes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClienteDTO>>> GetAll()
        {
            var clientes = await _uof.ClienteRepository.GetAllAsync();
            var clientesDto = _mapper.Map<IEnumerable<ClienteDTO>>(clientes);
            return Ok(clientesDto);
        }

        // GET: api/Clientes/5
        [HttpGet("{id}", Name = "GetById")]
        public async Task<ActionResult<ClienteDTO>> Get(int id)
        {
            var cliente = await _uof.ClienteRepository.GetAsync(c => c.ClienteId == id);

            if (cliente == null)
            {
                return NotFound("Cliente não encontrado");
            }

            return Ok(_mapper.Map<ClienteDTO>(cliente));
        }


        // POST: api/Clientes
        [HttpPost]
        public async Task<ActionResult> Create(ClienteDTO clienteDto)
        {
            var cliente = _mapper.Map<Cliente>(clienteDto);

            _uof.ClienteRepository.Create(cliente);
            await _uof.CommitAsync();

            var clienteDtoCreated = _mapper.Map<ClienteDTO>(cliente);
            return CreatedAtAction(nameof(Get), new { id = cliente.ClienteId }, clienteDtoCreated);
        }

        // PUT: api/Clientes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ClienteDTO clienteDto)
        {

            if (id != clienteDto.ClienteId)
            {
                return BadRequest("IDs não conferem");
            }

            var cliente = _mapper.Map<Cliente>(clienteDto);

            _uof.ClienteRepository.Update(cliente);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ClienteDTO>(cliente));
        }

        // DELETE: api/Clientes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cliente = await _uof.ClienteRepository.GetAsync(c => c.ClienteId == id);

            if (cliente == null)
            {
                return NotFound("Cliente não encontrado");
            }

            _uof.ClienteRepository.Delete(cliente);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ClienteDTO>(cliente));
        }
    }
}
