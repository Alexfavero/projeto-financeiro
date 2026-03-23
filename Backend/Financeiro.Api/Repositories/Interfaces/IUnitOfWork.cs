namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IClienteRepository ClienteRepository { get; }
        IContaAPagarRepository ContaAPagarRepository { get; }
        IContaAReceberRepository ContaAReceberRepository { get; }
        IFornecedorRepository FornecedorRepository { get; }
        IParcelaRepository ParcelaRepository { get; }

        Task<bool> CommitAsync();
    }
}
