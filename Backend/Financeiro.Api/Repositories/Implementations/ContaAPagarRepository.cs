using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Financeiro.Api.Repositories.Implementations
{
    public class ContaAPagarRepository : BaseRepository<ContaAPagar>, IContaAPagarRepository
    {
        public ContaAPagarRepository(AppDbContext context) : base(context) { }

        public async Task<ContaAPagar?> GetContaCompletaAsync(int id)
        {
            return await _context.ContasAPagar
                .Include(x => x.Fornecedor)
                .Include(x => x.Parcelas)
                .FirstOrDefaultAsync(x => x.DocumentoFinanceiroId == id);
        }

        public async Task<IEnumerable<ContaAPagar>> GetByCategoriaAsync(CategoriaGasto categoria)
        {
            return await _context.ContasAPagar
                .Include(x => x.Fornecedor)
                .Include(x => x.Parcelas)
                .Where(x => x.Categoria == categoria)
                .ToListAsync();
        }
    }
}