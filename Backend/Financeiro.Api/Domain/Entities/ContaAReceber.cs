using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Financeiro.Api.Domain.Entities;

public class ContaAReceber : DocumentoFinanceiro
{
    //FK para Cliente
    public int ClienteId { get; set; }
    [Required(ErrorMessage = "A data da venda é obrigatória")]
    [Column(TypeName = "datetime")]
    public DateTime DataVenda { get; set; } = DateTime.UtcNow;

    // propriedades de navegação
    [ForeignKey("ClienteId")]
    [Required]
    public virtual Cliente Cliente { get; set; } = null!;

}
