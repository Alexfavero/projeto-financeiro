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
    public class ClienteRepositoryTests
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
        public async Task GetClienteComContasAsync_DeveTrazerContasAReceberEParcelasIncluidas()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            int clienteId;

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var cliente = new Cliente { Nome = "Cliente A" };
                contexto.Clientes.Add(cliente);
                await contexto.SaveChangesAsync();
                clienteId = cliente.ClienteId;

                var conta = new ContaAReceber { ValorTotal = 300m, ClienteId = clienteId, Cliente = cliente };
                conta.Parcelas.Add(new Parcela { Valor = 300m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta });
                contexto.ContasAReceber.Add(conta);
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ClienteRepository(contexto);
                var cliente = await repositorio.GetClienteComContasAsync(clienteId);

                Assert.NotNull(cliente);
                var conta = Assert.Single(cliente!.ContasAReceber);
                Assert.Single(conta.Parcelas);
            }
        }

        [Fact]
        public async Task GetClienteComContasAsync_DeOutroUsuario_DeveRetornarNulo()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            int clienteId;

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var cliente = new Cliente { Nome = "Cliente A" };
                contexto.Clientes.Add(cliente);
                await contexto.SaveChangesAsync();
                clienteId = cliente.ClienteId;
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-B"))
            {
                var repositorio = new ClienteRepository(contexto);
                var cliente = await repositorio.GetClienteComContasAsync(clienteId);

                Assert.Null(cliente);
            }
        }

        [Fact]
        public async Task GetTodosComContasAsync_DeveTrazerContasDeTodosOsClientesDoUsuario()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var cliente1 = new Cliente { Nome = "C1" };
                var cliente2 = new Cliente { Nome = "C2" };
                contexto.Clientes.AddRange(cliente1, cliente2);
                await contexto.SaveChangesAsync();

                var conta = new ContaAReceber { ValorTotal = 100m, ClienteId = cliente1.ClienteId, Cliente = cliente1 };
                contexto.ContasAReceber.Add(conta);
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ClienteRepository(contexto);
                var resultado = (await repositorio.GetTodosComContasAsync()).ToList();

                Assert.Equal(2, resultado.Count);
                Assert.Single(resultado.Single(c => c.Nome == "C1").ContasAReceber);
                Assert.Empty(resultado.Single(c => c.Nome == "C2").ContasAReceber);
            }
        }
    }
}
