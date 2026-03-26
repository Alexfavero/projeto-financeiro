using Microsoft.AspNetCore.Mvc;
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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClienteDTO>>> GetAll()
        {
            var clientes = await _uof.ClienteRepository.GetAllAsync();
            return Ok(_mapper.Map<IEnumerable<ClienteDTO>>(clientes));
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
            if (id != clienteDto.ClienteId)
            {
                return BadRequest("IDs não conferem");
            }

            var cliente = _mapper.Map<Cliente>(clienteDto);
            _uof.ClienteRepository.Update(cliente);
            await _uof.CommitAsync();

            return Ok(_mapper.Map<ClienteDTO>(cliente));
        }

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