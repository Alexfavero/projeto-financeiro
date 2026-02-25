using Financeiro.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Financeiro.Api.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<ContaAReceber> ContasAReceber { get; set; }
        public DbSet<ContaAPagar> ContasAPagar { get; set; }
        public DbSet<Parcela> Parcelas { get; set; }

    }
}
