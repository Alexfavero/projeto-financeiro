namespace Financeiro.Api.Pagination
{
    public class QueryStringParameters
    {
        // Valor máximo permitido para PageSize
        public const int MaxPageSize = 50;

        private int _pageSize = 10;

        // Página atual (padrão = 1)
        public int PageNumber { get; set; } = 1;

        // Tamanho da página com validação para não ultrapassar MaxPageSize
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }
    }
}