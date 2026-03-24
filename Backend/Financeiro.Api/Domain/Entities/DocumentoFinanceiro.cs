using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Financeiro.Api.Domain.Entities
{
    public abstract class DocumentoFinanceiro
    {
        [Key]
        public int DocumentoFinanceiroId { get; set; }
        [Required(ErrorMessage = "O valor total é obrigatório")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ValorTotal { get; set; }
        virtual public ICollection<Parcela> Parcelas { get; set; } = new List<Parcela>();
    }
}
