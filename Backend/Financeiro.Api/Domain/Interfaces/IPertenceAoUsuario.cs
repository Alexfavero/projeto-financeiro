namespace Financeiro.Api.Domain.Interfaces
{
    // Marca as entidades que pertencem a um usuário específico.
    // O AppDbContext usa essa interface para: (1) filtrar automaticamente toda consulta
    // pelo usuário logado (HasQueryFilter) e (2) preencher o dono sozinho ao criar um
    // registro novo (SaveChanges), sem depender do que vier no corpo da requisição.
    public interface IPertenceAoUsuario
    {
        string UsuarioId { get; set; }
    }
}
