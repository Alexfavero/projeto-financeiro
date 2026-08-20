using Financeiro.Api.Repositories.Interfaces;
using Financeiro.Api.Services.Implementations;
using Moq;
using Xunit;

namespace Financeiro.Api.Tests.Services
{
    // PrevisaoService só agrega 4 números que vêm prontos do repositório (cada um já é
    // um SumAsync feito no banco) — a lógica de negócio real está em "juntar tudo certo
    // no DTO certo", então é isso que testamos aqui. O repositório é mockado: o Service
    // não deve depender de banco de verdade (nem do MySQL, que eu nem tenho acesso aqui)
    // pra ser testado.
    public class PrevisaoServiceTests
    {
        private static (PrevisaoService service, Mock<IParcelaRepository> parcelaRepoMock) CriarServiceComMock()
        {
            var parcelaRepoMock = new Mock<IParcelaRepository>();

            var uofMock = new Mock<IUnitOfWork>();
            uofMock.Setup(u => u.ParcelaRepository).Returns(parcelaRepoMock.Object);

            return (new PrevisaoService(uofMock.Object), parcelaRepoMock);
        }

        [Fact]
        public async Task ObterResumoPeriodoAsync_DeveMapearOsQuatroTotais_ParaOsCamposCorretos()
        {
            var (service, parcelaRepoMock) = CriarServiceComMock();
            var inicio = new DateTime(2026, 1, 1);
            var fim = new DateTime(2026, 1, 31);

            parcelaRepoMock.Setup(r => r.GetTotalAReceberPendentePorPeriodoAsync(inicio, fim)).ReturnsAsync(1000m);
            parcelaRepoMock.Setup(r => r.GetTotalAPagarPendentePorPeriodoAsync(inicio, fim)).ReturnsAsync(400m);
            parcelaRepoMock.Setup(r => r.GetTotalRecebidoPorPeriodoAsync(inicio, fim)).ReturnsAsync(700m);
            parcelaRepoMock.Setup(r => r.GetTotalPagoPorPeriodoAsync(inicio, fim)).ReturnsAsync(250m);

            var resultado = await service.ObterResumoPeriodoAsync(inicio, fim);

            // é fácil trocar "previsto" com "realizado" ou "a receber" com "a pagar" sem
            // querer numa refatoração futura — esse teste pega exatamente esse tipo de erro
            Assert.Equal(inicio, resultado.Inicio);
            Assert.Equal(fim, resultado.Fim);
            Assert.Equal(1000m, resultado.Previsto.TotalAReceber);
            Assert.Equal(400m, resultado.Previsto.TotalAPagar);
            Assert.Equal(700m, resultado.Realizado.TotalAReceber);
            Assert.Equal(250m, resultado.Realizado.TotalAPagar);
        }

        [Theory]
        [InlineData(1000, 400, 600)]   // mais a receber do que a pagar: saldo positivo
        [InlineData(400, 1000, -600)]  // mais a pagar do que a receber: saldo negativo
        [InlineData(500, 500, 0)]      // empatado: saldo zero
        public async Task ResumoDTO_Saldo_DeveSerAReceberMenosAPagar(decimal aReceber, decimal aPagar, decimal saldoEsperado)
        {
            var (service, parcelaRepoMock) = CriarServiceComMock();
            var inicio = DateTime.Today;
            var fim = DateTime.Today.AddDays(30);

            parcelaRepoMock.Setup(r => r.GetTotalAReceberPendentePorPeriodoAsync(inicio, fim)).ReturnsAsync(aReceber);
            parcelaRepoMock.Setup(r => r.GetTotalAPagarPendentePorPeriodoAsync(inicio, fim)).ReturnsAsync(aPagar);
            parcelaRepoMock.Setup(r => r.GetTotalRecebidoPorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);
            parcelaRepoMock.Setup(r => r.GetTotalPagoPorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);

            var resultado = await service.ObterResumoPeriodoAsync(inicio, fim);

            Assert.Equal(saldoEsperado, resultado.Previsto.Saldo);
        }

        [Fact]
        public async Task ObterResumoPeriodoAsync_QuandoNaoHaNadaNoPeriodo_DeveRetornarTudoZerado()
        {
            var (service, parcelaRepoMock) = CriarServiceComMock();
            var inicio = new DateTime(2026, 6, 1);
            var fim = new DateTime(2026, 6, 30);

            parcelaRepoMock.Setup(r => r.GetTotalAReceberPendentePorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);
            parcelaRepoMock.Setup(r => r.GetTotalAPagarPendentePorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);
            parcelaRepoMock.Setup(r => r.GetTotalRecebidoPorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);
            parcelaRepoMock.Setup(r => r.GetTotalPagoPorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);

            var resultado = await service.ObterResumoPeriodoAsync(inicio, fim);

            Assert.Equal(0m, resultado.Previsto.Saldo);
            Assert.Equal(0m, resultado.Realizado.Saldo);
        }

        [Fact]
        public async Task ObterResumoPeriodoAsync_DevePassarInicioEFimRecebidos_DiretoParaOsQuatroMetodosDoRepositorio()
        {
            // Garante que o Service não inverte, arredonda ou altera as datas antes de
            // repassar pro repositório — um bug bobo do tipo "troquei inicio por fim"
            // seria pego aqui.
            var (service, parcelaRepoMock) = CriarServiceComMock();
            var inicio = new DateTime(2026, 3, 10);
            var fim = new DateTime(2026, 3, 20);

            parcelaRepoMock.Setup(r => r.GetTotalAReceberPendentePorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);
            parcelaRepoMock.Setup(r => r.GetTotalAPagarPendentePorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);
            parcelaRepoMock.Setup(r => r.GetTotalRecebidoPorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);
            parcelaRepoMock.Setup(r => r.GetTotalPagoPorPeriodoAsync(inicio, fim)).ReturnsAsync(0m);

            await service.ObterResumoPeriodoAsync(inicio, fim);

            parcelaRepoMock.Verify(r => r.GetTotalAReceberPendentePorPeriodoAsync(inicio, fim), Times.Once);
            parcelaRepoMock.Verify(r => r.GetTotalAPagarPendentePorPeriodoAsync(inicio, fim), Times.Once);
            parcelaRepoMock.Verify(r => r.GetTotalRecebidoPorPeriodoAsync(inicio, fim), Times.Once);
            parcelaRepoMock.Verify(r => r.GetTotalPagoPorPeriodoAsync(inicio, fim), Times.Once);
        }
    }
}
