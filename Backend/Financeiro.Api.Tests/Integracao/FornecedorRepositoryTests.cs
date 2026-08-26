using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Repositories.Implementations;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

namespace Financeiro.Api.Tests.Integracao
{
    public class FornecedorRepositoryTests
    {
        private static AppDbContext CriarContexto(string nomeDoBanco, string usuarioLogadoId)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(nomeDoBanco)
                .Options;

            var httpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.NameIdentifier, usuarioLogadoId) })),
            };

            var httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            httpContextAccessorMock.Setup(a => a.HttpContext).Returns(httpContext);

            return new AppDbContext(options, httpContextAccessorMock.Object);
        }

        [Fact]
        public async Task GetByCnpjAsync_DeveRetornarOFornecedorComAqueleCnpj()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.Fornecedores.Add(new Fornecedor { Nome = "Fornecedor Alvo", CNPJ = "11111111000100" });
                contexto.Fornecedores.Add(new Fornecedor { Nome = "Outro Fornecedor", CNPJ = "22222222000100" });
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new FornecedorRepository(contexto);
                var fornecedor = await repositorio.GetByCnpjAsync("11111111000100");

                Assert.NotNull(fornecedor);
                Assert.Equal("Fornecedor Alvo", fornecedor!.Nome);
            }
        }

        [Fact]
        public async Task GetByCnpjAsync_QueNaoExiste_DeveRetornarNulo()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.Fornecedores.Add(new Fornecedor { Nome = "Fornecedor A", CNPJ = "11111111000100" });
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new FornecedorRepository(contexto);
                var fornecedor = await repositorio.GetByCnpjAsync("99999999000100");

                Assert.Null(fornecedor);
            }
        }

        [Fact]
        public async Task GetByCnpjAsync_DeOutroUsuario_DeveRetornarNulo()
        {
            // GetByCnpjAsync não filtra manualmente por usuário no código - depende
            // inteiramente do HasQueryFilter global do AppDbContext. Esse teste garante
            // que essa dependência continua funcionando (não é redundante com
            // IsolamentoMultiusuarioTests: aquele testa o contexto direto, este testa
            // que este método específico do repositório também é afetado pelo filtro).
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.Fornecedores.Add(new Fornecedor { Nome = "Fornecedor A", CNPJ = "11111111000100" });
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-B"))
            {
                var repositorio = new FornecedorRepository(contexto);
                var fornecedor = await repositorio.GetByCnpjAsync("11111111000100");

                Assert.Null(fornecedor);
            }
        }
    }
}
