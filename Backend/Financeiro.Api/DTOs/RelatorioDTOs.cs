using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.DTOs
{
    // Relatório 1: inadimplência — parcelas de ContaAReceber vencidas e não pagas, por cliente.
    public class InadimplenciaClienteDTO
    {
        public int ClienteId { get; set; }
        public string NomeCliente { get; set; } = null!;
        public decimal ValorTotalAtrasado { get; set; }
        public List<ParcelaAtrasadaDTO> Parcelas { get; set; } = new();
    }

    // Usado tanto na inadimplência (relatório 1) quanto nas contas a pagar atrasadas (relatório 4).
    public class ParcelaAtrasadaDTO
    {
        public int ParcelaId { get; set; }
        public int DocumentoFinanceiroId { get; set; }
        public decimal Valor { get; set; }
        public DateTime DataVencimento { get; set; }
        public int DiasAtraso { get; set; }
    }

    // Relatório 2: gastos por categoria — ContaAPagar paga num período, agrupada por CategoriaGasto.
    public class GastoPorCategoriaDTO
    {
        public CategoriaGasto Categoria { get; set; }
        public decimal ValorTotal { get; set; }
    }

    // Relatório 3: extrato — histórico financeiro completo de um Cliente ou de um Fornecedor.
    public class ExtratoDTO
    {
        public int EntidadeId { get; set; }
        public string NomeEntidade { get; set; } = null!;

        // Soma só das parcelas já pagas — "quanto já movimentou de fato" com essa entidade.
        public decimal ValorTotalMovimentado { get; set; }
        public List<ExtratoDocumentoDTO> Documentos { get; set; } = new();
    }

    public class ExtratoDocumentoDTO
    {
        public int DocumentoFinanceiroId { get; set; }
        public decimal ValorTotal { get; set; }
        public List<ExtratoParcelaDTO> Parcelas { get; set; } = new();
    }

    public class ExtratoParcelaDTO
    {
        public int ParcelaId { get; set; }
        public decimal Valor { get; set; }
        public DateTime DataVencimento { get; set; }
        public DateTime? DataPagamento { get; set; }
        public StatusPagamento Status { get; set; }
    }

    // Relatório 4: contas a pagar atrasadas — espelho do relatório 1, do lado de quem se deve.
    // FornecedorId é nullable porque ContaAPagar permite não informar fornecedor.
    public class ContaAtrasadaFornecedorDTO
    {
        public int? FornecedorId { get; set; }
        public string NomeFornecedor { get; set; } = null!;
        public decimal ValorTotalAtrasado { get; set; }
        public List<ParcelaAtrasadaDTO> Parcelas { get; set; } = new();
    }

    // Relatório 5: ranking — top clientes ou top fornecedores por valor pago. Mesmo DTO
    // serve pros dois lados (endpoints diferentes no controller).
    public class RankingDTO
    {
        public int EntidadeId { get; set; }
        public string Nome { get; set; } = null!;
        public decimal ValorTotalMovimentado { get; set; }
    }
}
