namespace Financeiro.Api.Repositories.Interfaces
{
    public interface IRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync();
        Task<T?> GetAsync(int id);
        void Create(T entity);
        void Update(T entity);
        void Delete(int id);
    }
}
