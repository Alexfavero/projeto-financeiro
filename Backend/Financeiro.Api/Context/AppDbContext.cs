using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Financeiro.Api.Context
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor httpContextAccessor)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<ContaAReceber> ContasAReceber { get; set; }
        public DbSet<ContaAPagar> ContasAPagar { get; set; }
        public DbSet<Parcela> Parcelas { get; set; }
        public DbSet<Fornecedor> Fornecedores { get; set; }

        // vem da claim NameIdentifier do JWT; fica null fora de request autenticada
        // (ex: dotnet ef usando o contexto em design time pra gerar migration)
        private string? UsuarioLogadoId =>
            _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // filtro global de multiusuário: aplica em toda query via DbSet, então
            // os repositórios não precisam repetir esse Where em cada método
            modelBuilder.Entity<Cliente>().HasQueryFilter(c => c.UsuarioId == UsuarioLogadoId);
            modelBuilder.Entity<Fornecedor>().HasQueryFilter(f => f.UsuarioId == UsuarioLogadoId);
            modelBuilder.Entity<DocumentoFinanceiro>().HasQueryFilter(d => d.UsuarioId == UsuarioLogadoId);
            modelBuilder.Entity<Parcela>().HasQueryFilter(p => p.UsuarioId == UsuarioLogadoId);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            PreencherUsuarioId();
            return base.SaveChangesAsync(cancellationToken);
        }

        public override int SaveChanges()
        {
            PreencherUsuarioId();
            return base.SaveChanges();
        }

        // seta o dono de todo registro novo com o usuário do token, ignorando
        // qualquer UsuarioId que venha no corpo da requisição
        private void PreencherUsuarioId()
        {
            var usuarioId = UsuarioLogadoId;
            if (string.IsNullOrEmpty(usuarioId)) return;

            foreach (var entry in ChangeTracker.Entries<IPertenceAoUsuario>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.UsuarioId = usuarioId;
                }
            }
        }
    }
}
