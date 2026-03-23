using Financeiro.Api.Context;
using Financeiro.Api.Repositories.Interfaces;

namespace Financeiro.Api.Repositories.Implementations
{
    public class UnitOfWork : IUnitOfWork
    {
        private IClienteRepository _clienteRepo;
        private IContaAPagarRepository _contaAPagarRepo;
        private IContaAReceberRepository _contaAReceberRepo;
        private IFornecedorRepository _fornecedorRepo;
        private IParcelaRepository _parcelaRepo;
        public AppDbContext _context;
        public UnitOfWork(AppDbContext context)
        {
            _context = context;
        }

        public IClienteRepository ClienteRepository
        {
            get
            {
                return _clienteRepo ??= new ClienteRepository(_context);
            }
        }
        public IContaAPagarRepository ContaAPagarRepository
        {
            get
            {
                return _contaAPagarRepo ??= new ContaAPagarRepository(_context);
            }
        }
        public IContaAReceberRepository ContaAReceberRepository
        {
            get
            {
                return _contaAReceberRepo ??= new ContaAReceberRepository(_context);
            }
        }

        public IFornecedorRepository FornecedorRepository
        {
            get
            {
                return _fornecedorRepo ??= new FornecedorRepository(_context);
            }
        }

        public IParcelaRepository ParcelaRepository
        {
            get
            {
                return _parcelaRepo ??= new ParcelaRepository(_context);
            }
        }
        public async Task<bool> CommitAsync()
        {
            var result = await _context.SaveChangesAsync();

            return result > 0;
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
