namespace Financeiro.Api.Domain.Interfaces
{
    // usada pelo AppDbContext pra filtrar toda consulta pelo usuário logado (HasQueryFilter)
    // e preencher o dono sozinho ao salvar, sem depender do corpo da requisição
    public interface IPertenceAoUsuario
    {
        string UsuarioId { get; set; }
    }
}
