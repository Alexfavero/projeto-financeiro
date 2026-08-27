using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IParcelaRepository : IRepository<Parcela>
    {
        Task<IEnumerable<Parcela>> GetVencendoHojeAsync();
        Task<IEnumerable<Parcela>> GetAtrasadasAsync();
        Task<IEnumerable<Parcela>> GetPorPeriodoAsync(DateTime inicio, DateTime fim, bool excluirPagas = false);

        // aba "Historico" da tela de Parcelas: so parcela ja paga, filtrada pela
        // DataPagamento (nao a DataVencimento) - "o que foi baixado nesse periodo"
        Task<IEnumerable<Parcela>> GetPagasPorPeriodoAsync(DateTime inicio, DateTime fim, string? tipo = null);

        // igual ao GetPagedAsync genérico, mas incluindo o DocumentoFinanceiro pai (e
        // o Fornecedor/Cliente dele) pra tela de Parcelas mostrar de quem é cada parcela
        // sem precisar de chamada extra
        Task<Financeiro.Api.Pagination.PagedList<Parcela>> GetPagedComContraparteAsync(int pageNumber, int pageSize, StatusPagamento? status = null, string? tipo = null, bool excluirPagas = false);

        // cada total é somado direto no banco (SumAsync), sem trazer as parcelas pra
        // memória. "Pendente" = previsto (por DataVencimento); "Recebido"/"Pago" = já pago (por DataPagamento)
        Task<decimal> GetTotalAReceberPendentePorPeriodoAsync(DateTime inicio, DateTime fim);
        Task<decimal> GetTotalAPagarPendentePorPeriodoAsync(DateTime inicio, DateTime fim);
        Task<decimal> GetTotalRecebidoPorPeriodoAsync(DateTime inicio, DateTime fim);
        Task<decimal> GetTotalPagoPorPeriodoAsync(DateTime inicio, DateTime fim);
    }
}
