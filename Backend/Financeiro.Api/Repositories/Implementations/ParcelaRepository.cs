using Financeiro.Api.Context;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Financeiro.Api.Repositories.Implementations
{
    public class ParcelaRepository : BaseRepository<Parcela>, IParcelaRepository
    {
        public ParcelaRepository(AppDbContext context) : base(context)
        {

        }
        // As duas chamadas .Include(p => p.DocumentoFinanceiro).ThenInclude(...) abaixo
        // são o jeito do EF Core trazer dados de tipos derivados numa herança TPH: a
        // navegação DocumentoFinanceiro é da classe base (abstrata), então pra incluir
        // Fornecedor (só existe em ContaAPagar) e Cliente (só existe em ContaAReceber)
        // é preciso um Include por subtipo, cada um com o cast. O EF só aplica o que
        // corresponde ao tipo real de cada linha — não lança erro de cast em runtime.
        private IQueryable<Parcela> ComContraparte()
        {
            return _context.Parcelas
                .Include(p => p.DocumentoFinanceiro).ThenInclude(df => ((ContaAPagar)df).Fornecedor)
                .Include(p => p.DocumentoFinanceiro).ThenInclude(df => ((ContaAReceber)df).Cliente);
        }

        public async Task<IEnumerable<Parcela>> GetVencendoHojeAsync()
        {
            return await ComContraparte()
                .Where(p => p.DataVencimento.Date == DateTime.Today && p.Status == StatusPagamento.Pendente)
                .ToListAsync();
        }

        public async Task<IEnumerable<Parcela>> GetAtrasadasAsync()
        {
            return await ComContraparte()
                .Where(p => p.DataVencimento < DateTime.Now && p.Status == StatusPagamento.Pendente)
                .ToListAsync();
        }
        public async Task<IEnumerable<Parcela>> GetPorPeriodoAsync(DateTime inicio, DateTime fim)
        {
            return await ComContraparte()
                .Where(p => p.DataVencimento.Date >= inicio.Date
                       && p.DataVencimento.Date <= fim.Date)
                .OrderBy(p => p.DataVencimento) // Organiza por data para facilitar a leitura
                .ToListAsync();
        }

        // Usado pela aba "Todas" da tela de Parcelas — mesma ideia do GetPagedAsync
        // genérico (herdado de BaseRepository<Parcela>), mas com AsNoTracking (leitura)
        // e a navegação incluída, pra vir com Tipo/NomeContraparte preenchidos.
        public async Task<Financeiro.Api.Pagination.PagedList<Parcela>> GetPagedComContraparteAsync(int pageNumber, int pageSize, StatusPagamento? status = null)
        {
            IQueryable<Parcela> source = ComContraparte().AsNoTracking();

            if (status.HasValue)
                source = source.Where(p => p.Status == status.Value);

            return await Financeiro.Api.Pagination.PagedList<Parcela>.ToPagedListAsync(source, pageNumber, pageSize);
        }

        // Previsto a receber: parcelas de ContaAReceber ainda não pagas (Pendente ou
        // Atrasado), somadas pela DataVencimento no período. "is ContaAReceber" vira,
        // no SQL gerado pelo EF, uma comparação na coluna Discriminator (TPH).
        public async Task<decimal> GetTotalAReceberPendentePorPeriodoAsync(DateTime inicio, DateTime fim)
        {
            return await _context.Parcelas
                .Where(p => p.DocumentoFinanceiro is ContaAReceber
                       && p.Status != StatusPagamento.Pago
                       && p.DataVencimento.Date >= inicio.Date
                       && p.DataVencimento.Date <= fim.Date)
                .SumAsync(p => p.Valor);
        }

        // Previsto a pagar: mesma regra acima, só que para ContaAPagar.
        public async Task<decimal> GetTotalAPagarPendentePorPeriodoAsync(DateTime inicio, DateTime fim)
        {
            return await _context.Parcelas
                .Where(p => p.DocumentoFinanceiro is ContaAPagar
                       && p.Status != StatusPagamento.Pago
                       && p.DataVencimento.Date >= inicio.Date
                       && p.DataVencimento.Date <= fim.Date)
                .SumAsync(p => p.Valor);
        }

        // Realizado recebido: parcelas de ContaAReceber já pagas, somadas pela
        // DataPagamento (não pela DataVencimento) no período.
        public async Task<decimal> GetTotalRecebidoPorPeriodoAsync(DateTime inicio, DateTime fim)
        {
            return await _context.Parcelas
                .Where(p => p.DocumentoFinanceiro is ContaAReceber
                       && p.Status == StatusPagamento.Pago
                       && p.DataPagamento.HasValue
                       && p.DataPagamento.Value.Date >= inicio.Date
                       && p.DataPagamento.Value.Date <= fim.Date)
                .SumAsync(p => p.Valor);
        }

        // Realizado pago: mesma regra acima, só que para ContaAPagar.
        public async Task<decimal> GetTotalPagoPorPeriodoAsync(DateTime inicio, DateTime fim)
        {
            return await _context.Parcelas
                .Where(p => p.DocumentoFinanceiro is ContaAPagar
                       && p.Status == StatusPagamento.Pago
                       && p.DataPagamento.HasValue
                       && p.DataPagamento.Value.Date >= inicio.Date
                       && p.DataPagamento.Value.Date <= fim.Date)
                .SumAsync(p => p.Valor);
        }
    }
}
