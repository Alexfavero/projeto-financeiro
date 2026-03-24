using System.ComponentModel.DataAnnotations;

namespace Financeiro.Api.DTOs
{
    public class FornecedorDTO
    {
        public int FornecedorId { get; set; }
        [StringLength(100)]
        [Required(ErrorMessage = "O nome do fornecedor é obrigatório.")]
        public string Nome { get; set; } = null!;
        [StringLength(14)]
        [Required(ErrorMessage = "O CNPJ do fornecedor é obrigatório.")]
        public string CNPJ { get; set; } = null!;
    }
}
