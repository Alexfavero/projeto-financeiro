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
        public async Task<IEnumerable<Parcela>> GetVencendoHojeAsync()
        {
            return await _context.Parcelas
                .Where(p => p.DataVencimento.Date == DateTime.Today && p.Status == StatusPagamento.Pendente)
                .ToListAsync();
        }

        public async Task<IEnumerable<Parcela>> GetAtrasadasAsync()
        {
            return await _context.Parcelas
                .Where(p => p.DataVencimento < DateTime.Now && p.Status == StatusPagamento.Pendente)
                .ToListAsync();
        }
        public async Task<IEnumerable<Parcela>> GetPorPeriodoAsync(DateTime inicio, DateTime fim)
        {
            return await _context.Parcelas
                .Include(p => p.DocumentoFinanceiro)
                .Where(p => p.DataVencimento.Date >= inicio.Date
                       && p.DataVencimento.Date <= fim.Date)
                .OrderBy(p => p.DataVencimento) // Organiza por data para facilitar a leitura
                .ToListAsync();
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
