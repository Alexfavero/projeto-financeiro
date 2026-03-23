using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Interfaces;

namespace Financeiro.Api.Repositories.Implementations
{
    public class ParcelaRepository : BaseRepository<Parcela>, IParcelaRepository
    {
        public ParcelaRepository(AppDbContext context) : base(context)
        {
        }
    }
}
