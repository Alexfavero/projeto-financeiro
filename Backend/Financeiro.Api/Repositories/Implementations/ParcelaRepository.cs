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
    }
}

