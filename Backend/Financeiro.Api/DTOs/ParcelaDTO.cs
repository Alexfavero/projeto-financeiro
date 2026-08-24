using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;

namespace Financeiro.Api.DTOs
{
    public class ParcelaDTO
    {
        public int ParcelaId { get; set; }

        [Required(ErrorMessage = "O valor é obrigatório")]
        public decimal Valor { get; set; }

        [Required(ErrorMessage = "A data de vencimento é obrigatória")]

        public DateTime DataVencimento { get; set; }


        public DateTime? DataPagamento { get; set; }

        [Required(ErrorMessage = "O status de pagamento é obrigatório")]
        public StatusPagamento Status { get; set; } = StatusPagamento.Pendente;

        public int DocumentoFinanceiroId { get; set; }

        // calculados a partir do DocumentoFinanceiro pai (TPH), não têm coluna própria.
        // só vêm preenchidos onde o repositório inclui essa navegação (listagens de
        // Atrasadas/Período/paginada); no Get por id e no PUT vêm null
        public string? Tipo { get; set; } // "APagar" ou "AReceber"
        public string? NomeContraparte { get; set; } // nome do Fornecedor (a pagar) ou Cliente (a receber)
    }
}
