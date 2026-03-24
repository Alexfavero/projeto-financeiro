using Financeiro.Api.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Financeiro.Api.DTOs
{
    public class DocumentoFinanceiroDTO
    {
        public int DocumentoFinanceiroId { get; set; }
        [Required(ErrorMessage = "O valor total é obrigatório.")]
        public decimal ValorTotal { get; set; }
        public ICollection<ParcelaDTO> Parcelas { get; set; } = new List<ParcelaDTO>();
    }
}
