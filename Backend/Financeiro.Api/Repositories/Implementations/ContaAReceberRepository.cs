using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;

namespace Financeiro.Api.Repositories.Implementations
{
    public class ContaAReceberRepository : BaseRepository<ContaAReceber>, IContaAReceberRepository
    {
        public ContaAReceberRepository(AppDbContext context) : base(context)
        {
        }
    }
}
