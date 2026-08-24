using Financeiro.Api.Context;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Financeiro.Api.Repositories.Implementations
{
    public class BaseRepository<T> : IRepository<T> where T : class
    {
        protected readonly AppDbContext _context;

        public BaseRepository(AppDbContext context)
        {
            _context = context;
        }

        // sem tracking pq é usado em GET; filter é opcional (ex: Categoria, Status)
        public async Task<Financeiro.Api.Pagination.PagedList<T>> GetPagedAsync(int pageNumber, int pageSize, Expression<Func<T, bool>>? filter = null)
        {
            var source = _context.Set<T>().AsNoTracking();
            if (filter != null)
                source = source.Where(filter);

            return await Financeiro.Api.Pagination.PagedList<T>.ToPagedListAsync(source, pageNumber, pageSize);
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _context.Set<T>().AsNoTracking().ToListAsync();
        }

        public async Task<T?> GetAsync(Expression<Func<T, bool>> predicate)
        {
            return await _context.Set<T>().AsNoTracking().FirstOrDefaultAsync(predicate);
        }

        // com tracking, pq precisa antes de Update/Delete pro EF acompanhar a entidade
        public async Task<T?> GetTrackedAsync(Expression<Func<T, bool>> predicate)
        {
            return await _context.Set<T>().FirstOrDefaultAsync(predicate);
        }

        public T Create(T entity)
        {
            _context.Set<T>().Add(entity);
            return entity;
        }

        public T Update(T entity)
        {
            _context.Set<T>().Update(entity);
            return entity;
        }

        public T Delete(T entity)
        {
            _context.Set<T>().Remove(entity);
            return entity;
        }
    }
}
