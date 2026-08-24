namespace Financeiro.Api.Pagination
{
    public class QueryStringParameters
    {
        // Valor máximo permitido para PageSize.
        // Ajustado de 50 para 2000 em 24/08: o gráfico do Painel busca o histórico
        // completo de parcelas numa única chamada (GET /Parcelas?pageSize=1000) pra
        // montar as escalas Anual/Todo o período; com o teto em 50 essa chamada era
        // truncada silenciosamente pelo setter abaixo, sem nenhum erro, entregando
        // dado incompleto pro front. 2000 cobre esse caso de uso (dentro da escala
        // de uso esperada do sistema — vendedor autônomo, milhares de parcelas ao
        // longo de vários anos) sem deixar o pageSize arbitrariamente grande.
        public const int MaxPageSize = 2000;

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
