using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Financeiro.Api.Repositories.Implementations
{
    public class ContaAReceberRepository : BaseRepository<ContaAReceber>, IContaAReceberRepository
    {
        public ContaAReceberRepository(AppDbContext context) : base(context)
        {

        }

        public async Task<ContaAReceber?> GetContaCompletaAsync(int id)
        {
            return await _context.ContasAReceber
                .Include(c => c.Cliente)
                .Include(c => c.Parcelas)
                .FirstOrDefaultAsync(c => c.DocumentoFinanceiroId == id);
        }
    }
}
