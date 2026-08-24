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
        // DocumentoFinanceiro é a classe base abstrata (TPH), então pra trazer o
        // Fornecedor (só existe em ContaAPagar) e o Cliente (só existe em ContaAReceber)
        // precisa de um Include por subtipo, com cast. O EF só aplica o cast que bate
        // com o tipo real de cada linha, não dá erro em runtime.
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
                .OrderBy(p => p.DataVencimento)
                .ToListAsync();
        }

        // usado na aba "Todas" da tela de Parcelas: igual ao GetPagedAsync genérico,
        // mas já com a navegação incluída pra vir com Tipo/NomeContraparte preenchidos
        public async Task<Financeiro.Api.Pagination.PagedList<Parcela>> GetPagedComContraparteAsync(int pageNumber, int pageSize, StatusPagamento? status = null)
        {
            IQueryable<Parcela> source = ComContraparte().AsNoTracking();

            if (status.HasValue)
                source = source.Where(p => p.Status == status.Value);

            return await Financeiro.Api.Pagination.PagedList<Parcela>.ToPagedListAsync(source, pageNumber, pageSize);
        }

        // previsto a receber: parcelas de ContaAReceber ainda não pagas, somadas pela
        // DataVencimento. "is ContaAReceber" vira comparação na coluna Discriminator (TPH)
        public async Task<decimal> GetTotalAReceberPendentePorPeriodoAsync(DateTime inicio, DateTime fim)
        {
            return await _context.Parcelas
                .Where(p => p.DocumentoFinanceiro is ContaAReceber
                       && p.Status != StatusPagamento.Pago
                       && p.DataVencimento.Date >= inicio.Date
                       && p.DataVencimento.Date <= fim.Date)
                .SumAsync(p => p.Valor);
        }

        // previsto a pagar: mesma regra acima, só que pra ContaAPagar
        public async Task<decimal> GetTotalAPagarPendentePorPeriodoAsync(DateTime inicio, DateTime fim)
        {
            return await _context.Parcelas
                .Where(p => p.DocumentoFinanceiro is ContaAPagar
                       && p.Status != StatusPagamento.Pago
                       && p.DataVencimento.Date >= inicio.Date
                       && p.DataVencimento.Date <= fim.Date)
                .SumAsync(p => p.Valor);
        }

        // realizado recebido: parcelas já pagas, somadas pela DataPagamento (não pela
        // DataVencimento)
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

        // realizado pago: mesma regra acima, só que pra ContaAPagar
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
