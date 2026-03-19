using Financeiro.Api.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.CompilerServices;

namespace Financeiro.Api.Domain.Entities
{
    public class Parcela
    {
        [Key]
        public int ParcelaId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Valor { get; set; }
        [Required]
        [Column(TypeName = "datetime")]
        public DateTime DataVencimento { get; set; }
        [Column(TypeName = "datetime")]
        public DateTime? DataPagamento { get; set; }
        [Required]
        public StatusPagamento Status { get; set; } = StatusPagamento.Pendente;

        public int DocumentoFinanceiroId { get; set; }
        [ForeignKey("DocumentoFinanceiroId")]
        public DocumentoFinanceiro DocumentoFinanceiro { get; set; } = null!;
    }
}
