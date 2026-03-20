using Financeiro.Api.Repositories.Interfaces;

namespace Financeiro.Api.Domain.Entities
{
    public interface IUnityOfWork : IDisposable
    {
        IClienteRepository ClienteRepository { get; }
        IContaAPagarRepository ContaAPagarRepository { get; }
        IContaAReceberRepository ContaAReceberRepository { get; }
        IFornecedorRepository FornecedorRepository { get; }
        IParcelaRepository ParcelaRepository { get; }

        Task<bool> CommitAsync();

    }
}
