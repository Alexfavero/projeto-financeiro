using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Financeiro.Api.Repositories.Implementations
{
    public class ClienteRepository : BaseRepository<Cliente>, IClienteRepository
    {
        public ClienteRepository(AppDbContext context) : base(context)
        {

        }
        public async Task<Cliente?> GetClienteComContasAsync(int id)
        {
            return await _context.Clientes
                .Include(c => c.ContasAReceber)
                    .ThenInclude(conta => conta.Parcelas)
                .FirstOrDefaultAsync(c => c.ClienteId == id);
        }

    }
}
