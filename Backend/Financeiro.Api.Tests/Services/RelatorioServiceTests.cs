using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.Repositories.Interfaces;
using Financeiro.Api.Services.Implementations;
using Moq;
using Xunit;

namespace Financeiro.Api.Tests.Services
{
    // RelatorioService é o código mais arriscado do projeto pra testar: diferente do
    // PrevisaoService (que só soma no banco), aqui quem agrupa, filtra e soma é o próprio
    // Service, em LINQ puro sobre listas trazidas pra memória. É onde um bug de lógica
    // mais provavelmente passaria despercebido, porque nunca rodou contra dado variado.
    public class RelatorioServiceTests
    {
        private static RelatorioService CriarService(
            IContaAReceberRepository? contaAReceberRepo = null,
            IContaAPagarRepository? contaAPagarRepo = null,
            IClienteRepository? clienteRepo = null,
            IFornecedorRepository? fornecedorRepo = null)
        {
            var uofMock = new Mock<IUnitOfWork>();
            uofMock.Setup(u => u.ContaAReceberRepository).Returns(contaAReceberRepo ?? Mock.Of<IContaAReceberRepository>());
            uofMock.Setup(u => u.ContaAPagarRepository).Returns(contaAPagarRepo ?? Mock.Of<IContaAPagarRepository>());
            uofMock.Setup(u => u.ClienteRepository).Returns(clienteRepo ?? Mock.Of<IClienteRepository>());
            uofMock.Setup(u => u.FornecedorRepository).Returns(fornecedorRepo ?? Mock.Of<IFornecedorRepository>());
            return new RelatorioService(uofMock.Object);
        }

        private static Parcela CriarParcela(int id, decimal valor, DateTime dataVencimento,
            StatusPagamento status, DateTime? dataPagamento = null) => new()
        {
            ParcelaId = id,
            Valor = valor,
            DataVencimento = dataVencimento,
            Status = status,
            DataPagamento = dataPagamento
        };

        // ---------- Relatório 1: inadimplência ----------

        [Fact]
        public async Task ObterInadimplenciaAsync_DeveAgruparPorClienteESomarSoAsParcelasAtrasadas()
        {
            var cliente = new Cliente { ClienteId = 1, Nome = "Cliente A" };

            var conta = new ContaAReceber
            {
                DocumentoFinanceiroId = 10,
                Cliente = cliente,
                Parcelas = new List<Parcela>
                {
                    CriarParcela(1, 100m, DateTime.Today.AddDays(-10), StatusPagamento.Pendente),
                    CriarParcela(2, 50m, DateTime.Today.AddDays(-3), StatusPagamento.Pendente),
                    CriarParcela(3, 200m, DateTime.Today.AddDays(-10), StatusPagamento.Pago, DateTime.Today.AddDays(-9)),
                    CriarParcela(4, 300m, DateTime.Today.AddDays(5), StatusPagamento.Pendente)
                }
            };

            var repoMock = new Mock<IContaAReceberRepository>();
            repoMock.Setup(r => r.GetTodasComParcelasAsync()).ReturnsAsync(new[] { conta });

            var service = CriarService(contaAReceberRepo: repoMock.Object);

            var resultado = (await service.ObterInadimplenciaAsync()).ToList();

            var doCliente = Assert.Single(resultado);
            Assert.Equal(1, doCliente.ClienteId);
            // só as duas atrasadas (100 + 50); a paga e a que ainda não venceu ficam de fora
            Assert.Equal(150m, doCliente.ValorTotalAtrasado);
            Assert.Equal(2, doCliente.Parcelas.Count);
        }

        [Fact]
        public async Task ObterInadimplenciaAsync_ParcelaQueVenceHoje_AindaNaoDeveSerConsideradaAtrasada()
        {
            // EstaAtrasada usa "< DateTime.Today" (estritamente menor) — uma parcela que
            // vence exatamente hoje ainda não está atrasada. É a fronteira mais fácil de
            // errar por um (usar "<=" por engano) nesse tipo de regra.
            var cliente = new Cliente { ClienteId = 1, Nome = "Cliente A" };
            var conta = new ContaAReceber
            {
                DocumentoFinanceiroId = 10,
                Cliente = cliente,
                Parcelas = new List<Parcela> { CriarParcela(1, 100m, DateTime.Today, StatusPagamento.Pendente) }
            };

            var repoMock = new Mock<IContaAReceberRepository>();
            repoMock.Setup(r => r.GetTodasComParcelasAsync()).ReturnsAsync(new[] { conta });

            var service = CriarService(contaAReceberRepo: repoMock.Object);

            var resultado = await service.ObterInadimplenciaAsync();

            Assert.Empty(resultado);
        }

        [Fact]
        public async Task ObterInadimplenciaAsync_MesmoComInstanciasDiferentesDeCliente_DeveAgruparPeloId()
        {
            // Regressão intencional: o agrupamento é por ClienteId (int), não pelo objeto
            // Cliente (GroupBy(x => x.Cliente.ClienteId), não GroupBy(x => x.Cliente)).
            // Isso existe pra não depender do EF Core reaproveitar a mesma instância de
            // Cliente (identity map) — algo que deixaria de valer se um dia alguém
            // adicionar .AsNoTracking() nessas consultas. Aqui simulamos isso na unha, com
            // duas instâncias de Cliente diferentes mas com o mesmo ClienteId.
            var cliente1 = new Cliente { ClienteId = 1, Nome = "Cliente A" };
            var cliente2 = new Cliente { ClienteId = 1, Nome = "Cliente A" };

            var conta1 = new ContaAReceber
            {
                DocumentoFinanceiroId = 10,
                Cliente = cliente1,
                Parcelas = new List<Parcela> { CriarParcela(1, 100m, DateTime.Today.AddDays(-5), StatusPagamento.Pendente) }
            };
            var conta2 = new ContaAReceber
            {
                DocumentoFinanceiroId = 11,
                Cliente = cliente2,
                Parcelas = new List<Parcela> { CriarParcela(2, 50m, DateTime.Today.AddDays(-2), StatusPagamento.Pendente) }
            };

            var repoMock = new Mock<IContaAReceberRepository>();
            repoMock.Setup(r => r.GetTodasComParcelasAsync()).ReturnsAsync(new[] { conta1, conta2 });

            var service = CriarService(contaAReceberRepo: repoMock.Object);

            var resultado = (await service.ObterInadimplenciaAsync()).ToList();

            var doCliente = Assert.Single(resultado); // caem no mesmo grupo, apesar de instâncias diferentes
            Assert.Equal(150m, doCliente.ValorTotalAtrasado);
        }

        // ---------- Relatório 2: gastos por categoria ----------

        [Fact]
        public async Task ObterGastosPorCategoriaAsync_SoDeveSomarParcelasPagasDentroDoPeriodo()
        {
            var contaDentroDoPeriodo = new ContaAPagar
            {
                DocumentoFinanceiroId = 1,
                Categoria = CategoriaGasto.Mercadoria,
                Parcelas = new List<Parcela> { CriarParcela(1, 200m, new DateTime(2026, 1, 10), StatusPagamento.Pago, new DateTime(2026, 1, 15)) }
            };
            var contaForaDoPeriodo = new ContaAPagar
            {
                DocumentoFinanceiroId = 2,
                Categoria = CategoriaGasto.Mercadoria,
                Parcelas = new List<Parcela> { CriarParcela(2, 999m, new DateTime(2026, 2, 1), StatusPagamento.Pago, new DateTime(2026, 2, 5)) }
            };
            var contaNaoPaga = new ContaAPagar
            {
                DocumentoFinanceiroId = 3,
                Categoria = CategoriaGasto.Mercadoria,
                Parcelas = new List<Parcela> { CriarParcela(3, 999m, new DateTime(2026, 1, 12), StatusPagamento.Pendente) }
            };

            var repoMock = new Mock<IContaAPagarRepository>();
            repoMock.Setup(r => r.GetTodasComParcelasAsync())
                .ReturnsAsync(new[] { contaDentroDoPeriodo, contaForaDoPeriodo, contaNaoPaga });

            var service = CriarService(contaAPagarRepo: repoMock.Object);

            var resultado = (await service.ObterGastosPorCategoriaAsync(new DateTime(2026, 1, 1), new DateTime(2026, 1, 31))).ToList();

            var grupo = Assert.Single(resultado);
            Assert.Equal(CategoriaGasto.Mercadoria, grupo.Categoria);
            Assert.Equal(200m, grupo.ValorTotal);
        }

        // ---------- Relatório 3: extrato ----------

        [Fact]
        public async Task ObterExtratoClienteAsync_ClienteInexistente_DeveRetornarNull()
        {
            var repoMock = new Mock<IClienteRepository>();
            repoMock.Setup(r => r.GetClienteComContasAsync(It.IsAny<int>())).ReturnsAsync((Cliente?)null);

            var service = CriarService(clienteRepo: repoMock.Object);

            var resultado = await service.ObterExtratoClienteAsync(999);

            Assert.Null(resultado);
        }

        // ---------- Relatório 4: contas a pagar atrasadas ----------

        [Fact]
        public async Task ObterContasAPagarAtrasadasAsync_SemFornecedor_DeveAgruparComo_SemFornecedor()
        {
            // FornecedorId é opcional em ContaAPagar — uma parcela atrasada sem fornecedor
            // não pode sumir da soma total, então cai num grupo "Sem fornecedor" (Id nulo).
            var contaSemFornecedor = new ContaAPagar
            {
                DocumentoFinanceiroId = 20,
                Fornecedor = null,
                Categoria = CategoriaGasto.Outros,
                Parcelas = new List<Parcela> { CriarParcela(1, 80m, DateTime.Today.AddDays(-7), StatusPagamento.Pendente) }
            };

            var repoMock = new Mock<IContaAPagarRepository>();
            repoMock.Setup(r => r.GetTodasComParcelasAsync()).ReturnsAsync(new[] { contaSemFornecedor });

            var service = CriarService(contaAPagarRepo: repoMock.Object);

            var resultado = (await service.ObterContasAPagarAtrasadasAsync()).ToList();

            var grupo = Assert.Single(resultado);
            Assert.Null(grupo.FornecedorId);
            Assert.Equal("Sem fornecedor", grupo.NomeFornecedor);
            Assert.Equal(80m, grupo.ValorTotalAtrasado);
        }

        // ---------- Relatório 5: ranking ----------

        [Fact]
        public async Task ObterTopClientesAsync_ClienteSemNenhumaParcelaPaga_DeveFicarDeForaDoRanking()
        {
            var clienteSemPagamento = new Cliente
            {
                ClienteId = 1,
                Nome = "Nunca pagou",
                ContasAReceber = new List<ContaAReceber>
                {
                    new() { DocumentoFinanceiroId = 1, Parcelas = new List<Parcela> { CriarParcela(1, 500m, DateTime.Today.AddDays(10), StatusPagamento.Pendente) } }
                }
            };
            var clienteComPagamento = new Cliente
            {
                ClienteId = 2,
                Nome = "Bom pagador",
                ContasAReceber = new List<ContaAReceber>
                {
                    new() { DocumentoFinanceiroId = 2, Parcelas = new List<Parcela> { CriarParcela(2, 300m, DateTime.Today.AddDays(-5), StatusPagamento.Pago, DateTime.Today.AddDays(-5)) } }
                }
            };

            var repoMock = new Mock<IClienteRepository>();
            repoMock.Setup(r => r.GetTodosComContasAsync()).ReturnsAsync(new[] { clienteSemPagamento, clienteComPagamento });

            var service = CriarService(clienteRepo: repoMock.Object);

            var resultado = (await service.ObterTopClientesAsync()).ToList();

            var unico = Assert.Single(resultado);
            Assert.Equal(2, unico.EntidadeId);
            Assert.Equal(300m, unico.ValorTotalMovimentado);
        }

        [Fact]
        public async Task ObterTopClientesAsync_DeveRespeitarQuantidadeEOrdenarDoMaiorParaOMenor()
        {
            var clientes = Enumerable.Range(1, 5).Select(i => new Cliente
            {
                ClienteId = i,
                Nome = $"Cliente {i}",
                ContasAReceber = new List<ContaAReceber>
                {
                    new() { DocumentoFinanceiroId = i, Parcelas = new List<Parcela> { CriarParcela(i, i * 100m, DateTime.Today.AddDays(-1), StatusPagamento.Pago, DateTime.Today.AddDays(-1)) } }
                }
            }).ToArray();

            var repoMock = new Mock<IClienteRepository>();
            repoMock.Setup(r => r.GetTodosComContasAsync()).ReturnsAsync(clientes);

            var service = CriarService(clienteRepo: repoMock.Object);

            var resultado = (await service.ObterTopClientesAsync(quantidade: 2)).ToList();

            Assert.Equal(2, resultado.Count);
            Assert.Equal(500m, resultado[0].ValorTotalMovimentado); // cliente 5
            Assert.Equal(400m, resultado[1].ValorTotalMovimentado); // cliente 4
        }
    }
}
