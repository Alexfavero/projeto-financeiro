namespace Financeiro.Api.Pagination
{
    public class QueryStringParameters
    {
        // o gráfico do Painel busca o histórico completo de parcelas numa chamada só
        // (GET /Parcelas?pageSize=1000) pra montar as escalas Anual/Todo o período;
        // teto baixo aqui trunca esse resultado sem erro nenhum, então precisa ser alto
        public const int MaxPageSize = 2000;

        private int _pageSize = 10;

        public int PageNumber { get; set; } = 1;

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }
    }
}
