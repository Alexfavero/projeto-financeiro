using System.Linq.Expressions;

namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync();
        // sem tracking
        Task<T?> GetAsync(Expression<Func<T, bool>> predicate);
        // com tracking, pra usar antes de Update/Delete
        Task<T?> GetTrackedAsync(Expression<Func<T, bool>> predicate);
        T Create(T entity);
        T Update(T entity);
        T Delete(T entity);
        // filter é opcional: quando informado, aplica um Where antes de paginar
        Task<Financeiro.Api.Pagination.PagedList<T>> GetPagedAsync(int pageNumber, int pageSize, Expression<Func<T, bool>>? filter = null);
    }
}
