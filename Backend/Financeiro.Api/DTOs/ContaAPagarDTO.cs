using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Financeiro.Api.DTOs
{
    public class ContaAPagarDTO : DocumentoFinanceiroDTO
    {
        public int? FornecedorId { get; set; }

        [StringLength(50)]
        public string? NumeroNota { get; set; }

        [StringLength(500)]
        public string? Descricao { get; set; }

        [Required]
        public CategoriaGasto Categoria { get; set; }
    }
}
