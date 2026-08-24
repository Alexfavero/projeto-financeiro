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

        // Calculados a partir do DocumentoFinanceiro pai (TPH) — não têm coluna
        // própria no banco. Só vêm preenchidos nas listagens que a tela de
        // Parcelas usa (Atrasadas, Período e a listagem paginada), onde o
        // repositório inclui a navegação necessária; nos demais endpoints
        // (Get por id, resposta do PUT) vêm null.
        public string? Tipo { get; set; } // "APagar" ou "AReceber"
        public string? NomeContraparte { get; set; } // nome do Fornecedor (a pagar) ou Cliente (a receber)
    }
}
