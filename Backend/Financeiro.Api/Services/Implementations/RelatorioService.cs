using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.DTOs;
using Financeiro.Api.Repositories.Interfaces;
using Financeiro.Api.Services.Interfaces;

namespace Financeiro.Api.Services.Implementations
{
    // Regra de negócio real (agrupar, somar e ordenar dados de várias entidades), por
    // isso tem Service. Diferente do PrevisaoService (que soma tudo no banco via
    // SumAsync), aqui os repositórios trazem o grafo já com Include (Cliente/Fornecedor
    // + Parcelas) e quem filtra, agrupa e soma é este Service — mais fácil de explicar
    // e de ajustar depois, e o volume de dados de um TCC não justifica a otimização.
    public class RelatorioService : IRelatorioService
    {
        private readonly IUnitOfWork _uof;

        public RelatorioService(IUnitOfWork uof)
        {
            _uof = uof;
        }

        // Relatório 1: inadimplência — parcelas de ContaAReceber vencidas e não pagas,
        // agrupadas por cliente.
        public async Task<IEnumerable<InadimplenciaClienteDTO>> ObterInadimplenciaAsync()
        {
            var contas = await _uof.ContaAReceberRepository.GetTodasComParcelasAsync();

            var parcelasAtrasadas = contas
                .SelectMany(c => c.Parcelas
                    .Where(EstaAtrasada)
                    .Select(p => new { c.Cliente, c.DocumentoFinanceiroId, Parcela = p }));

            return parcelasAtrasadas
                .GroupBy(x => x.Cliente.ClienteId)
                .Select(g => new InadimplenciaClienteDTO
                {
                    ClienteId = g.Key,
                    NomeCliente = g.First().Cliente.Nome,
                    ValorTotalAtrasado = g.Sum(x => x.Parcela.Valor),
                    Parcelas = g.Select(x => new ParcelaAtrasadaDTO
                    {
                        ParcelaId = x.Parcela.ParcelaId,
                        DocumentoFinanceiroId = x.DocumentoFinanceiroId,
                        Valor = x.Parcela.Valor,
                        DataVencimento = x.Parcela.DataVencimento,
                        DiasAtraso = (DateTime.Today - x.Parcela.DataVencimento.Date).Days
                    }).OrderByDescending(p => p.DiasAtraso).ToList()
                })
                .OrderByDescending(c => c.ValorTotalAtrasado)
                .ToList();
        }

        // Relatório 2: gastos por categoria — ContaAPagar paga num período (pela
        // DataPagamento, igual ao "realizado" do PrevisaoService), agrupada por
        // CategoriaGasto.
        public async Task<IEnumerable<GastoPorCategoriaDTO>> ObterGastosPorCategoriaAsync(DateTime inicio, DateTime fim)
        {
            var contas = await _uof.ContaAPagarRepository.GetTodasComParcelasAsync();

            var parcelasPagasNoPeriodo = contas
                .SelectMany(c => c.Parcelas
                    .Where(p => p.Status == StatusPagamento.Pago
                           && p.DataPagamento.HasValue
                           && p.DataPagamento.Value.Date >= inicio.Date
                           && p.DataPagamento.Value.Date <= fim.Date)
                    .Select(p => new { c.Categoria, p.Valor }));

            return parcelasPagasNoPeriodo
                .GroupBy(x => x.Categoria)
                .Select(g => new GastoPorCategoriaDTO
                {
                    Categoria = g.Key,
                    ValorTotal = g.Sum(x => x.Valor)
                })
                .OrderByDescending(g => g.ValorTotal)
                .ToList();
        }

        // Relatório 3a: extrato de um cliente — todas as ContaAReceber e Parcelas dele.
        // Devolve null quando o cliente não existe (ou não é do usuário logado — o
        // filtro global do AppDbContext já cuida disso).
        public async Task<ExtratoDTO?> ObterExtratoClienteAsync(int clienteId)
        {
            var cliente = await _uof.ClienteRepository.GetClienteComContasAsync(clienteId);
            if (cliente == null) return null;

            return new ExtratoDTO
            {
                EntidadeId = cliente.ClienteId,
                NomeEntidade = cliente.Nome,
                ValorTotalMovimentado = SomaPago(cliente.ContasAReceber.SelectMany(c => c.Parcelas)),
                Documentos = cliente.ContasAReceber.Select(MapDocumento).ToList()
            };
        }

        // Relatório 3b: extrato de um fornecedor — todas as ContaAPagar e Parcelas dele.
        public async Task<ExtratoDTO?> ObterExtratoFornecedorAsync(int fornecedorId)
        {
            var fornecedor = await _uof.FornecedorRepository.GetAsync(f => f.FornecedorId == fornecedorId);
            if (fornecedor == null) return null;

            var contas = await _uof.ContaAPagarRepository.GetPorFornecedorAsync(fornecedorId);

            return new ExtratoDTO
            {
                EntidadeId = fornecedor.FornecedorId,
                NomeEntidade = fornecedor.Nome,
                ValorTotalMovimentado = SomaPago(contas.SelectMany(c => c.Parcelas)),
                Documentos = contas.Select(MapDocumento).ToList()
            };
        }

        // Relatório 4: contas a pagar atrasadas — espelho do relatório 1, do lado de
        // quem se deve. Fornecedor é opcional em ContaAPagar, então parcelas sem
        // fornecedor entram agrupadas como "Sem fornecedor" em vez de sumir do relatório.
        public async Task<IEnumerable<ContaAtrasadaFornecedorDTO>> ObterContasAPagarAtrasadasAsync()
        {
            var contas = await _uof.ContaAPagarRepository.GetTodasComParcelasAsync();

            var parcelasAtrasadas = contas
                .SelectMany(c => c.Parcelas
                    .Where(EstaAtrasada)
                    .Select(p => new { c.Fornecedor, c.DocumentoFinanceiroId, Parcela = p }));

            return parcelasAtrasadas
                .GroupBy(x => x.Fornecedor?.FornecedorId)
                .Select(g => new ContaAtrasadaFornecedorDTO
                {
                    FornecedorId = g.Key,
                    NomeFornecedor = g.First().Fornecedor?.Nome ?? "Sem fornecedor",
                    ValorTotalAtrasado = g.Sum(x => x.Parcela.Valor),
                    Parcelas = g.Select(x => new ParcelaAtrasadaDTO
                    {
                        ParcelaId = x.Parcela.ParcelaId,
                        DocumentoFinanceiroId = x.DocumentoFinanceiroId,
                        Valor = x.Parcela.Valor,
                        DataVencimento = x.Parcela.DataVencimento,
                        DiasAtraso = (DateTime.Today - x.Parcela.DataVencimento.Date).Days
                    }).OrderByDescending(p => p.DiasAtraso).ToList()
                })
                .OrderByDescending(c => c.ValorTotalAtrasado)
                .ToList();
        }

        // Relatório 5a: ranking de clientes por valor pago (recebido).
        public async Task<IEnumerable<RankingDTO>> ObterTopClientesAsync(int quantidade = 10)
        {
            var clientes = await _uof.ClienteRepository.GetTodosComContasAsync();

            return clientes
                .Select(c => new RankingDTO
                {
                    EntidadeId = c.ClienteId,
                    Nome = c.Nome,
                    ValorTotalMovimentado = SomaPago(c.ContasAReceber.SelectMany(conta => conta.Parcelas))
                })
                .Where(r => r.ValorTotalMovimentado > 0)
                .OrderByDescending(r => r.ValorTotalMovimentado)
                .Take(quantidade)
                .ToList();
        }

        // Relatório 5b: ranking de fornecedores por valor pago.
        public async Task<IEnumerable<RankingDTO>> ObterTopFornecedoresAsync(int quantidade = 10)
        {
            var contas = await _uof.ContaAPagarRepository.GetTodasComParcelasAsync();

            return contas
                .Where(c => c.Fornecedor != null)
                .GroupBy(c => c.Fornecedor!.FornecedorId)
                .Select(g => new RankingDTO
                {
                    EntidadeId = g.Key,
                    Nome = g.First().Fornecedor!.Nome,
                    ValorTotalMovimentado = SomaPago(g.SelectMany(c => c.Parcelas))
                })
                .Where(r => r.ValorTotalMovimentado > 0)
                .OrderByDescending(r => r.ValorTotalMovimentado)
                .Take(quantidade)
                .ToList();
        }

        // Mesma regra usada no PrevisaoRepository (ParcelaRepository): "atrasada" é
        // parcela ainda não paga cuja DataVencimento já passou.
        private static bool EstaAtrasada(Parcela parcela) =>
            parcela.Status != StatusPagamento.Pago && parcela.DataVencimento.Date < DateTime.Today;

        private static decimal SomaPago(IEnumerable<Parcela> parcelas) =>
            parcelas.Where(p => p.Status == StatusPagamento.Pago).Sum(p => p.Valor);

        private static ExtratoDocumentoDTO MapDocumento(DocumentoFinanceiro documento) => new()
        {
            DocumentoFinanceiroId = documento.DocumentoFinanceiroId,
            ValorTotal = documento.ValorTotal,
            Parcelas = documento.Parcelas.Select(p => new ExtratoParcelaDTO
            {
                ParcelaId = p.ParcelaId,
                Valor = p.Valor,
                DataVencimento = p.DataVencimento,
                DataPagamento = p.DataPagamento,
                Status = p.Status
            }).ToList()
        };
    }
}
