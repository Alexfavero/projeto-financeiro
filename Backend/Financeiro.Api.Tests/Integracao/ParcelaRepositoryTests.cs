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
    // Assim como o isolamento multiusuário (IsolamentoMultiusuarioTests), os métodos
    // do ParcelaRepository fazem consulta e agregação (Where, OrderBy, SumAsync,
    // discriminador de TPH via "is ContaAPagar"/"is ContaAReceber") direto no banco —
    // com repositório mockado esse comportamento simplesmente não existe pra testar,
    // então usamos o mesmo provider InMemory do EF Core já usado nos testes de
    // isolamento, exercitando a tradução real de LINQ-to-Entities.
    //
    // Cobre os 7 métodos do ParcelaRepository que ainda não tinham teste (Previsão e
    // Relatórios já testam a lógica de negócio em cima deles, mas com o repositório
    // mockado — aqui o alvo é a consulta em si).
    public class ParcelaRepositoryTests
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

        private static ContaAPagar NovaContaAPagar(
            DateTime vencimento, StatusPagamento status, decimal valor = 100m, DateTime? dataPagamento = null)
        {
            var conta = new ContaAPagar { ValorTotal = valor, Categoria = CategoriaGasto.Outros };
            var parcela = new Parcela
            {
                Valor = valor,
                DataVencimento = vencimento,
                DataPagamento = dataPagamento,
                Status = status,
                DocumentoFinanceiro = conta,
            };
            conta.Parcelas.Add(parcela);
            return conta;
        }

        private static ContaAReceber NovaContaAReceber(
            DateTime vencimento, StatusPagamento status, decimal valor = 100m, DateTime? dataPagamento = null)
        {
            // Cliente é navegação obrigatória em ContaAReceber ([Required] + FK não
            // anulável) — preenchido aqui só pra satisfazer o modelo; o dado do cliente
            // em si não importa pra nenhum dos testes deste arquivo.
            var conta = new ContaAReceber { ValorTotal = valor, Cliente = new Cliente { Nome = "Cliente Teste" } };
            var parcela = new Parcela
            {
                Valor = valor,
                DataVencimento = vencimento,
                DataPagamento = dataPagamento,
                Status = status,
                DocumentoFinanceiro = conta,
            };
            conta.Parcelas.Add(parcela);
            return conta;
        }

        [Fact]
        public async Task GetVencendoHojeAsync_DeveRetornarSoParcelasPendentesComVencimentoHoje()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            var hoje = DateTime.Today;

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.ContasAPagar.Add(NovaContaAPagar(hoje, StatusPagamento.Pendente)); // vence hoje, pendente -> entra
                contexto.ContasAPagar.Add(NovaContaAPagar(hoje, StatusPagamento.Pago, dataPagamento: hoje)); // vence hoje, mas já paga -> não entra
                contexto.ContasAPagar.Add(NovaContaAPagar(hoje.AddDays(1), StatusPagamento.Pendente)); // vence amanhã -> não entra
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ParcelaRepository(contexto);
                var resultado = await repositorio.GetVencendoHojeAsync();

                var parcela = Assert.Single(resultado);
                Assert.Equal(StatusPagamento.Pendente, parcela.Status);
                Assert.Equal(hoje, parcela.DataVencimento.Date);
            }
        }

        [Fact]
        public async Task GetAtrasadasAsync_DeveRetornarSoParcelasPendentesVencidasNoPassado()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            var passado = DateTime.Today.AddDays(-5);
            var futuro = DateTime.Today.AddDays(5);

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.ContasAPagar.Add(NovaContaAPagar(passado, StatusPagamento.Pendente)); // vencida, pendente -> entra
                contexto.ContasAPagar.Add(NovaContaAPagar(passado, StatusPagamento.Pago, dataPagamento: passado)); // vencida, mas já paga -> não entra
                contexto.ContasAPagar.Add(NovaContaAPagar(futuro, StatusPagamento.Pendente)); // ainda não venceu -> não entra
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ParcelaRepository(contexto);
                var resultado = await repositorio.GetAtrasadasAsync();

                var parcela = Assert.Single(resultado);
                Assert.Equal(StatusPagamento.Pendente, parcela.Status);
                Assert.Equal(passado.Date, parcela.DataVencimento.Date);
            }
        }

        [Fact]
        public async Task GetPorPeriodoAsync_DeveRetornarParcelasDentroDoIntervaloInclusivoOrdenadasPorVencimento()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            var inicio = new DateTime(2026, 8, 1);
            var fim = new DateTime(2026, 8, 31);

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.ContasAPagar.Add(NovaContaAPagar(new DateTime(2026, 8, 15), StatusPagamento.Pendente, valor: 300m)); // meio do período
                contexto.ContasAPagar.Add(NovaContaAPagar(inicio, StatusPagamento.Pendente, valor: 100m)); // limite inicial (inclusivo)
                contexto.ContasAPagar.Add(NovaContaAPagar(fim, StatusPagamento.Pendente, valor: 200m)); // limite final (inclusivo)
                contexto.ContasAPagar.Add(NovaContaAPagar(inicio.AddDays(-1), StatusPagamento.Pendente, valor: 999m)); // um dia antes -> fora
                contexto.ContasAPagar.Add(NovaContaAPagar(fim.AddDays(1), StatusPagamento.Pendente, valor: 999m)); // um dia depois -> fora
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ParcelaRepository(contexto);
                var resultado = (await repositorio.GetPorPeriodoAsync(inicio, fim)).ToList();

                Assert.Equal(3, resultado.Count);
                Assert.Equal(new[] { 100m, 300m, 200m }, resultado.Select(p => p.Valor)); // ordenado por DataVencimento
            }
        }

        [Fact]
        public async Task GetTotalAReceberPendentePorPeriodoAsync_DeveSomarSoParcelasDeContaAReceberNaoPagasNoPeriodo()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            var inicio = new DateTime(2026, 8, 1);
            var fim = new DateTime(2026, 8, 31);

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 8, 10), StatusPagamento.Pendente, valor: 500m)); // soma
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 8, 20), StatusPagamento.Atrasado, valor: 300m)); // soma (!= Pago)
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 8, 15), StatusPagamento.Pago, valor: 999m, dataPagamento: new DateTime(2026, 8, 15))); // já paga -> não soma
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 9, 1), StatusPagamento.Pendente, valor: 999m)); // fora do período -> não soma
                contexto.ContasAPagar.Add(NovaContaAPagar(new DateTime(2026, 8, 10), StatusPagamento.Pendente, valor: 999m)); // lado errado (a pagar) -> não soma
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ParcelaRepository(contexto);
                var total = await repositorio.GetTotalAReceberPendentePorPeriodoAsync(inicio, fim);

                Assert.Equal(800m, total); // 500 + 300
            }
        }

        [Fact]
        public async Task GetTotalAPagarPendentePorPeriodoAsync_DeveSomarSoParcelasDeContaAPagarNaoPagasNoPeriodo()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            var inicio = new DateTime(2026, 8, 1);
            var fim = new DateTime(2026, 8, 31);

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.ContasAPagar.Add(NovaContaAPagar(new DateTime(2026, 8, 10), StatusPagamento.Pendente, valor: 400m)); // soma
                contexto.ContasAPagar.Add(NovaContaAPagar(new DateTime(2026, 8, 15), StatusPagamento.Pago, valor: 999m, dataPagamento: new DateTime(2026, 8, 15))); // já paga -> não soma
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 8, 10), StatusPagamento.Pendente, valor: 999m)); // lado errado -> não soma
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ParcelaRepository(contexto);
                var total = await repositorio.GetTotalAPagarPendentePorPeriodoAsync(inicio, fim);

                Assert.Equal(400m, total);
            }
        }

        [Fact]
        public async Task GetTotalRecebidoPorPeriodoAsync_DeveSomarSoParcelasDeContaAReceberJaPagasPorDataDePagamento()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            var inicio = new DateTime(2026, 8, 1);
            var fim = new DateTime(2026, 8, 31);

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                // Venceu em julho, mas foi pago em agosto -> soma (usa DataPagamento, não DataVencimento)
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 7, 20), StatusPagamento.Pago, valor: 600m, dataPagamento: new DateTime(2026, 8, 5)));
                // Vence em agosto, mas ainda não foi pago -> não soma, mesmo com vencimento dentro do período
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 8, 10), StatusPagamento.Pendente, valor: 999m));
                // Pago fora do período -> não soma
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 6, 1), StatusPagamento.Pago, valor: 999m, dataPagamento: new DateTime(2026, 7, 1)));
                // Lado errado (a pagar) -> não soma
                contexto.ContasAPagar.Add(NovaContaAPagar(new DateTime(2026, 8, 1), StatusPagamento.Pago, valor: 999m, dataPagamento: new DateTime(2026, 8, 1)));
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ParcelaRepository(contexto);
                var total = await repositorio.GetTotalRecebidoPorPeriodoAsync(inicio, fim);

                Assert.Equal(600m, total);
            }
        }

        [Fact]
        public async Task GetTotalPagoPorPeriodoAsync_DeveSomarSoParcelasDeContaAPagarJaPagasPorDataDePagamento()
        {
            var nomeDoBanco = Guid.NewGuid().ToString();
            var inicio = new DateTime(2026, 8, 1);
            var fim = new DateTime(2026, 8, 31);

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                contexto.ContasAPagar.Add(NovaContaAPagar(new DateTime(2026, 7, 25), StatusPagamento.Pago, valor: 350m, dataPagamento: new DateTime(2026, 8, 2)));
                contexto.ContasAPagar.Add(NovaContaAPagar(new DateTime(2026, 8, 10), StatusPagamento.Pendente, valor: 999m));
                contexto.ContasAReceber.Add(NovaContaAReceber(new DateTime(2026, 8, 1), StatusPagamento.Pago, valor: 999m, dataPagamento: new DateTime(2026, 8, 1)));
                await contexto.SaveChangesAsync();
            }

            using (var contexto = CriarContexto(nomeDoBanco, "usuario-A"))
            {
                var repositorio = new ParcelaRepository(contexto);
                var total = await repositorio.GetTotalPagoPorPeriodoAsync(inicio, fim);

                Assert.Equal(350m, total);
            }
        }
    }
}
