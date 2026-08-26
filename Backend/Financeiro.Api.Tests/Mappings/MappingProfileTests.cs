using AutoMapper;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.DTOs;
using Financeiro.Api.DTOs.Mappings;
using Xunit;

namespace Financeiro.Api.Tests.Mappings
{
    // Regressão do bug achado em teste manual (25/08/2026): o NomeContraparte de
    // ContaAReceber acessava contaAReceber.Cliente.Nome sem checar null, enquanto o
    // ramo de ContaAPagar (Fornecedor) já tinha essa checagem - inconsistência que só
    // estourava em runtime (NullReferenceException) quando o Cliente não vinha
    // incluído na consulta. Corrigido no MappingProfile; estes testes travam se voltar.
    public class MappingProfileTests
    {
        private static IMapper CriarMapper()
        {
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            return config.CreateMapper();
        }

        [Fact]
        public void Configuracao_DoMappingProfile_DeveSerValida()
        {
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            config.AssertConfigurationIsValid();
        }

        [Fact]
        public void Parcela_DeContaAPagar_ComFornecedorCarregado_DeveMapearTipoENomeDoFornecedor()
        {
            var mapper = CriarMapper();
            var conta = new ContaAPagar
            {
                Categoria = CategoriaGasto.Outros,
                Fornecedor = new Fornecedor { Nome = "Fornecedor X", CNPJ = "11111111000100" },
            };
            var parcela = new Parcela { Valor = 100m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta };

            var dto = mapper.Map<ParcelaDTO>(parcela);

            Assert.Equal("APagar", dto.Tipo);
            Assert.Equal("Fornecedor X", dto.NomeContraparte);
        }

        [Fact]
        public void Parcela_DeContaAPagar_SemFornecedorCarregado_NomeContraparteDeveFicarNulo()
        {
            var mapper = CriarMapper();
            var conta = new ContaAPagar { Categoria = CategoriaGasto.Outros };
            var parcela = new Parcela { Valor = 100m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta };

            var dto = mapper.Map<ParcelaDTO>(parcela);

            Assert.Equal("APagar", dto.Tipo);
            Assert.Null(dto.NomeContraparte);
        }

        [Fact]
        public void Parcela_DeContaAReceber_ComClienteCarregado_DeveMapearTipoENomeDoCliente()
        {
            var mapper = CriarMapper();
            var conta = new ContaAReceber { Cliente = new Cliente { Nome = "Cliente Y" } };
            var parcela = new Parcela { Valor = 100m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta };

            var dto = mapper.Map<ParcelaDTO>(parcela);

            Assert.Equal("AReceber", dto.Tipo);
            Assert.Equal("Cliente Y", dto.NomeContraparte);
        }

        [Fact]
        public void Parcela_DeContaAReceber_SemClienteCarregado_NomeContraparteDeveFicarNulo_SemLancarExcecao()
        {
            // Este é o caso exato do bug: antes do fix, o Cliente.Nome era acessado sem
            // checar null e isso lançava NullReferenceException em vez de retornar null
            // (que é o que o comentário do MappingProfile sempre disse que devia
            // acontecer quando a navegação não vem incluída).
            var mapper = CriarMapper();
            var conta = new ContaAReceber(); // Cliente fica null (o "= null!" só suprime o warning do compilador)
            var parcela = new Parcela { Valor = 100m, DataVencimento = DateTime.Today, DocumentoFinanceiro = conta };

            var dto = mapper.Map<ParcelaDTO>(parcela);

            Assert.Equal("AReceber", dto.Tipo);
            Assert.Null(dto.NomeContraparte);
        }

        [Fact]
        public void Parcela_SemDocumentoFinanceiroReconhecido_TipoENomeContraparteDevemFicarNulos()
        {
            // Não deveria acontecer na prática (DocumentoFinanceiro é sempre ContaAPagar
            // ou ContaAReceber), mas o MapFrom tem um "null" no fim do encadeamento -
            // esse teste garante que esse fallback continua funcionando.
            var mapper = CriarMapper();
            var parcela = new Parcela { Valor = 100m, DataVencimento = DateTime.Today, DocumentoFinanceiro = null! };

            var dto = mapper.Map<ParcelaDTO>(parcela);

            Assert.Null(dto.Tipo);
            Assert.Null(dto.NomeContraparte);
        }
    }
}
