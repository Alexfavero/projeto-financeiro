using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

namespace Financeiro.Api.Tests.Integracao
{
    // Diferente dos outros testes (que mockam o repositório), aqui o alvo É o próprio
    // AppDbContext: o isolamento multiusuário vive dentro do EF Core (HasQueryFilter
    // global), então não dá pra testar isso com mock — a regra some junto com o mock.
    // Por isso usamos o provider InMemory do EF Core: um banco de verdade (em memória,
    // sem precisar do MySQL rodando), exercitando o comportamento real do EF Core.
    //
    // Este é o teste mais importante do projeto: se o isolamento falhar, um usuário
    // enxerga dado financeiro de outro usuário. É o tipo de bug mais grave que o sistema
    // pode ter.
    public class IsolamentoMultiusuarioTests
    {
        private static AppDbContext CriarContexto(string nomeDoBanco, string? usuarioLogadoId)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(nomeDoBanco)
                .Options;

            var httpContext = new DefaultHttpContext();
            if (usuarioLogadoId != null)
            {
                httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.NameIdentifier, usuarioLogadoId) }));
            }

            var httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            httpContextAccessorMock.Setup(a => a.HttpContext).Returns(httpContext);

            return new AppDbContext(options, httpContextAccessorMock.Object);
        }

        [Fact]
        public async Task Cliente_CriadoPorUmUsuario_NaoDeveAparecerParaOutroUsuario()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contextoUsuarioA = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contextoUsuarioA.Clientes.Add(new Cliente { Nome = "Cliente da empresa A" });
                await contextoUsuarioA.SaveChangesAsync();
            }

            using (var contextoUsuarioB = CriarContexto(nomeDoBanco, "usuario-B"))
            {
                var clientesVisiveis = await contextoUsuarioB.Clientes.ToListAsync();
                Assert.Empty(clientesVisiveis);
            }

            using (var contextoUsuarioANovamente = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var clientesVisiveis = await contextoUsuarioANovamente.Clientes.ToListAsync();
                var cliente = Assert.Single(clientesVisiveis);
                Assert.Equal("Cliente da empresa A", cliente.Nome);
            }
        }

        [Fact]
        public async Task ContaAPagar_CriadaPorUmUsuario_NaoDeveAparecerParaOutroUsuario()
        {
            // Mesma verificação acima, mas do lado do dado financeiro de verdade
            // (DocumentoFinanceiro, via TPH) — que é o que mais importa não vazar.
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contextoUsuarioA = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contextoUsuarioA.ContasAPagar.Add(new ContaAPagar
                {
                    ValorTotal = 500m,
                    Categoria = CategoriaGasto.Outros
                });
                await contextoUsuarioA.SaveChangesAsync();
            }

            using (var contextoUsuarioB = CriarContexto(nomeDoBanco, "usuario-B"))
            {
                var contasVisiveis = await contextoUsuarioB.ContasAPagar.ToListAsync();
                Assert.Empty(contasVisiveis);
            }
        }

        [Fact]
        public async Task SaveChanges_DevePreencherUsuarioIdComOUsuarioLogado_IgnorandoValorInformadoManualmente()
        {
            // O UsuarioId nunca deve vir do corpo da requisição. Mesmo que alguém tente
            // forçar um valor diferente (ex.: manipulando o JSON enviado), o AppDbContext
            // deve sobrescrever com o usuário de fato autenticado (lido do token).
            var nomeDoBanco = Guid.NewGuid().ToString();

            using var contexto = CriarContexto(nomeDoBanco, "usuario-A");
            var cliente = new Cliente { Nome = "Teste", UsuarioId = "usuario-forjado-na-requisicao" };
            contexto.Clientes.Add(cliente);
            await contexto.SaveChangesAsync();

            Assert.Equal("usuario-A", cliente.UsuarioId);
        }
    }
}
