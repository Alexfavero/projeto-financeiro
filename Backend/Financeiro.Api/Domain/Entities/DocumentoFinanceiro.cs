using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Financeiro.Api.Domain.Interfaces;

namespace Financeiro.Api.Domain.Entities
{
    public abstract class DocumentoFinanceiro : IPertenceAoUsuario
    {
        [Key]
        public int DocumentoFinanceiroId { get; set; }
        [Required(ErrorMessage = "O valor total é obrigatório")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ValorTotal { get; set; }
        virtual public ICollection<Parcela> Parcelas { get; set; } = new List<Parcela>();

        // Dono do registro (isolamento multiusuário). Como ContaAPagar e ContaAReceber
        // herdam de DocumentoFinanceiro (TPH, mesma tabela), essa propriedade cobre as duas.
        // Preenchido automaticamente pelo AppDbContext a partir do usuário logado.
        public string UsuarioId { get; set; } = null!;
    }
}
