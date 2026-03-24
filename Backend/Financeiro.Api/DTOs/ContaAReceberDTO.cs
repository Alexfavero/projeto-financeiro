using Financeiro.Api.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Financeiro.Api.DTOs
{
    public class ContaAReceberDTO : DocumentoFinanceiroDTO
    {
        //FK para Cliente
        public int ClienteId { get; set; }
        [Required(ErrorMessage = "A data da venda é obrigatória")]
        public DateTime DataVenda { get; set; } = DateTime.UtcNow;
    }
}
