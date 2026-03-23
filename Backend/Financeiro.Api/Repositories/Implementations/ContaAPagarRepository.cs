using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;

namespace Financeiro.Api.Repositories.Implementations
{
    public class ContaAPagarRepository : BaseRepository<ContaAPagar>, IContaAPagarRepository
    {
        public ContaAPagarRepository(AppDbContext context) : base(context)
        {
        }
    }
}
