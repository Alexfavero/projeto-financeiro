using Financeiro.Api.Domain.Enums;
using Financeiro.Api.Domain.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.CompilerServices;

namespace Financeiro.Api.Domain.Entities
{
    public class Parcela : IPertenceAoUsuario
    {
        [Key]
        public int ParcelaId { get; set; }

        [Required(ErrorMessage = "O valor é obrigatório")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Valor { get; set; }
        [Required(ErrorMessage = "A data de vencimento é obrigatória")]
        [Column(TypeName = "datetime")]
        public DateTime DataVencimento { get; set; }
        [Column(TypeName = "datetime")]
        public DateTime? DataPagamento { get; set; }
        [Required(ErrorMessage = "O status de pagamento é obrigatório")]
        public StatusPagamento Status { get; set; } = StatusPagamento.Pendente;

        public int DocumentoFinanceiroId { get; set; }
        [ForeignKey("DocumentoFinanceiroId")]
        public virtual DocumentoFinanceiro DocumentoFinanceiro { get; set; } = null!;

        // guardado aqui também (não só no DocumentoFinanceiro pai) porque o ParcelaRepository
        // tem consultas que acessam Parcelas direto (ex.: GetVencendoHojeAsync), sem passar pelo pai
        public string UsuarioId { get; set; } = null!;
    }
}
