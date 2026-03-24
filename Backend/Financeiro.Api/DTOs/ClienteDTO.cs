using System.ComponentModel.DataAnnotations;

namespace Financeiro.Api.DTOs
{
    public class ClienteDTO
    {

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
    }
}
