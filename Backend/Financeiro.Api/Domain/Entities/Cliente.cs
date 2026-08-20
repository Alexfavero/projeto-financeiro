using System.ComponentModel.DataAnnotations;
using Financeiro.Api.Domain.Interfaces;

namespace Financeiro.Api.Domain.Entities
{
    public class Cliente : IPertenceAoUsuario
    {
        [Key]
        public int ClienteId { get; set; }
        [StringLength(100)]
        [Required(ErrorMessage = "O nome do cliente é obrigatório.")]
        public string Nome { get; set; } = null!;

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }
        [Phone]
        [StringLength(20)]
        public string? Telefone { get; set; }

        [StringLength(200)]
        public string? Endereco { get; set; }

        // propriedades de navegação
        public ICollection<ContaAReceber> ContasAReceber { get; set; } = new List<ContaAReceber>();

        // Dono do registro (isolamento multiusuário). Preenchido automaticamente pelo
        // AppDbContext a partir do usuário logado — nunca deve vir do corpo da requisição.
        public string UsuarioId { get; set; } = null!;
    }
}
