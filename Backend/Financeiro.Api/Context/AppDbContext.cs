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

        // Id do usuário logado, lido da claim NameIdentifier do JWT.
        // Fica null fora de uma requisição HTTP autenticada (ex.: quando o dotnet ef
        // usa este contexto em tempo de design para gerar migrations).
        private string? UsuarioLogadoId =>
            _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Isolamento multiusuário: cada usuário só enxerga os próprios registros.
            // O EF Core aplica esse filtro automaticamente em toda consulta feita através
            // do DbSet (Get, GetPaged, Include, etc.), então os repositórios não precisam
            // repetir esse "Where" manualmente em cada método.
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

        // Preenche o dono de todo registro novo com o usuário logado, ignorando qualquer
        // valor que porventura viesse do corpo da requisição — o cliente da API nunca
        // escolhe o dono, quem decide é o token de quem está autenticado.
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
