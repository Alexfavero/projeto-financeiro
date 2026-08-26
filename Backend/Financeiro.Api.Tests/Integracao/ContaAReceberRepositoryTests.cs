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
    public class ContaAReceberRepositoryTests
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
        public async Task GetContaCompletaAsync_DeveTrazerClienteEParcelasIncluidos()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            int contaId;

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var conta = new ContaAReceber { ValorTotal = 500m, Cliente = new Cliente { Nome = "Cliente A" } };
                conta.Parcelas.Add(new Parcela { Valor = 500m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta });
                contexto.ContasAReceber.Add(conta);
                await contexto.SaveChangesAsync();
                contaId = conta.DocumentoFinanceiroId;
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ContaAReceberRepository(contexto);
                var conta = await repositorio.GetContaCompletaAsync(contaId);

                Assert.NotNull(conta);
                Assert.Equal("Cliente A", conta!.Cliente.Nome);
                Assert.Single(conta.Parcelas);
            }
        }

        [Fact]
        public async Task GetContaCompletaAsync_DeOutroUsuario_DeveRetornarNulo()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            int contaId;

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var conta = new ContaAReceber { ValorTotal = 500m, Cliente = new Cliente { Nome = "Cliente A" } };
                contexto.ContasAReceber.Add(conta);
                await contexto.SaveChangesAsync();
                contaId = conta.DocumentoFinanceiroId;
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-B"))
            {
                var repositorio = new ContaAReceberRepository(contexto);
                var conta = await repositorio.GetContaCompletaAsync(contaId);

                Assert.Null(conta);
            }
        }

        [Fact]
        public async Task GetTodasComParcelasAsync_DeveTrazerClienteEParcelasDeTodasAsContas()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var conta1 = new ContaAReceber { ValorTotal = 100m, Cliente = new Cliente { Nome = "C1" } };
                conta1.Parcelas.Add(new Parcela { Valor = 100m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta1 });
                var conta2 = new ContaAReceber { ValorTotal = 200m, Cliente = new Cliente { Nome = "C2" } };
                contexto.ContasAReceber.AddRange(conta1, conta2);
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ContaAReceberRepository(contexto);
                var resultado = (await repositorio.GetTodasComParcelasAsync()).ToList();

                Assert.Equal(2, resultado.Count);
                Assert.Contains(resultado, c => c.Cliente.Nome == "C1");
                Assert.Single(resultado.Single(c => c.ValorTotal == 100m).Parcelas);
            }
        }
    }
}
