using System.ComponentModel.DataAnnotations;
using Financeiro.Api.Domain.Interfaces;

namespace Financeiro.Api.Domain.Entities
{
    public class Fornecedor : IPertenceAoUsuario
    {
        [Key]
        public int FornecedorId { get; set; }
        [StringLength(100)]
        [Required(ErrorMessage = "O nome do fornecedor é obrigatório.")]
        public string Nome { get; set; } = null!;
        [StringLength(14)]
        [Required(ErrorMessage = "O CNPJ do fornecedor é obrigatório.")]
        public string CNPJ { get; set; } = null!;

        // preenchido pelo AppDbContext a partir do usuário logado, nunca vem do corpo da requisição
        public string UsuarioId { get; set; } = null!;
    }
}
