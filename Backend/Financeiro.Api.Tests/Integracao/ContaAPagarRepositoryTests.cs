using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.Repositories.Implementations;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using System.Security.Claims;
using Xunit;

namespace Financeiro.Api.Tests.Integracao
{
    // Mesmo padrão do ParcelaRepositoryTests: os métodos aqui fazem Include/Where
    // direto no banco, então usamos o provider InMemory do EF Core em vez de mockar o
    // repositório (com mock essa consulta simplesmente não existe pra testar).
    public class ContaAPagarRepositoryTests
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
        public async Task GetContaCompletaAsync_DeveTrazerFornecedorEParcelasIncluidos()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            int contaId;

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var conta = new ContaAPagar
                {
                    ValorTotal = 500m,
                    Categoria = CategoriaGasto.Outros,
                    Fornecedor = new Fornecedor { Nome = "Fornecedor A", CNPJ = "11111111000100" },
                };
                conta.Parcelas.Add(new Parcela { Valor = 500m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta });
                contexto.ContasAPagar.Add(conta);
                await contexto.SaveChangesAsync();
                contaId = conta.DocumentoFinanceiroId;
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ContaAPagarRepository(contexto);
                var conta = await repositorio.GetContaCompletaAsync(contaId);

                Assert.NotNull(conta);
                Assert.NotNull(conta!.Fornecedor);
                Assert.Equal("Fornecedor A", conta.Fornecedor!.Nome);
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
                var conta = new ContaAPagar { ValorTotal = 500m, Categoria = CategoriaGasto.Outros };
                contexto.ContasAPagar.Add(conta);
                await contexto.SaveChangesAsync();
                contaId = conta.DocumentoFinanceiroId;
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-B"))
            {
                var repositorio = new ContaAPagarRepository(contexto);
                var conta = await repositorio.GetContaCompletaAsync(contaId);

                Assert.Null(conta);
            }
        }

        [Fact]
        public async Task GetByCategoriaAsync_DeveRetornarSoContasDaCategoriaPedida()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.ContasAPagar.Add(new ContaAPagar { ValorTotal = 100m, Categoria = CategoriaGasto.Mercadoria });
                contexto.ContasAPagar.Add(new ContaAPagar { ValorTotal = 200m, Categoria = CategoriaGasto.Outros });
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ContaAPagarRepository(contexto);
                var resultado = await repositorio.GetByCategoriaAsync(CategoriaGasto.Mercadoria);

                var conta = Assert.Single(resultado);
                Assert.Equal(100m, conta.ValorTotal);
            }
        }

        [Fact]
        public async Task GetTodasComParcelasAsync_DeveTrazerFornecedorEParcelasDeTodasAsContas()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var conta1 = new ContaAPagar { ValorTotal = 100m, Categoria = CategoriaGasto.Outros, Fornecedor = new Fornecedor { Nome = "F1", CNPJ = "1" } };
                conta1.Parcelas.Add(new Parcela { Valor = 100m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta1 });
                var conta2 = new ContaAPagar { ValorTotal = 200m, Categoria = CategoriaGasto.Outros };
                contexto.ContasAPagar.AddRange(conta1, conta2);
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ContaAPagarRepository(contexto);
                var resultado = (await repositorio.GetTodasComParcelasAsync()).ToList();

                Assert.Equal(2, resultado.Count);
                Assert.Contains(resultado, c => c.Fornecedor != null && c.Fornecedor.Nome == "F1");
                Assert.Single(resultado.Single(c => c.ValorTotal == 100m).Parcelas);
            }
        }

        [Fact]
        public async Task GetPorFornecedorAsync_DeveRetornarSoContasDaqueleFornecedor()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            int fornecedorAlvoId;

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var fornecedorAlvo = new Fornecedor { Nome = "Alvo", CNPJ = "1" };
                var outroFornecedor = new Fornecedor { Nome = "Outro", CNPJ = "2" };
                contexto.Fornecedores.AddRange(fornecedorAlvo, outroFornecedor);
                await contexto.SaveChangesAsync();
                fornecedorAlvoId = fornecedorAlvo.FornecedorId;

                contexto.ContasAPagar.Add(new ContaAPagar { ValorTotal = 100m, Categoria = CategoriaGasto.Outros, FornecedorId = fornecedorAlvo.FornecedorId });
                contexto.ContasAPagar.Add(new ContaAPagar { ValorTotal = 200m, Categoria = CategoriaGasto.Outros, FornecedorId = outroFornecedor.FornecedorId });
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ContaAPagarRepository(contexto);
                var resultado = await repositorio.GetPorFornecedorAsync(fornecedorAlvoId);

                var conta = Assert.Single(resultado);
                Assert.Equal(100m, conta.ValorTotal);
            }
        }
    }
}
