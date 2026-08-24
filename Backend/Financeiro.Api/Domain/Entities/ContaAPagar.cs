using Financeiro.Api.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Financeiro.Api.Domain.Entities
{
    public class ContaAPagar : DocumentoFinanceiro
    {
        public int? FornecedorId { get; set; }

        [ForeignKey("FornecedorId")]
        public Fornecedor? Fornecedor { get; set; }

        [StringLength(50)]
        public string? NumeroNota { get; set; }

        [StringLength(500)]
        public string? Descricao { get; set; }

        [Required(ErrorMessage = "A categoria de gastos é obrigatória")]
        public CategoriaGasto Categoria { get; set; }
    }
}
