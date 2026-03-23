using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Financeiro.Api.Repositories.Implementations
{
    public class FornecedorRepository : BaseRepository<Fornecedor>, IFornecedorRepository
    {
        public FornecedorRepository(AppDbContext context) : base(context)
        {
        }
        public async Task<Fornecedor?> GetByCnpjAsync(string cnpj)
        {
            return await _context.Fornecedores
                .FirstOrDefaultAsync(f => f.CNPJ == cnpj);
        }
    }
}
