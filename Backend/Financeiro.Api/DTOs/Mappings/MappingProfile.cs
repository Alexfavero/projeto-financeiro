using AutoMapper;
using Financeiro.Api.Domain.Entities;

namespace Financeiro.Api.DTOs.Mappings
{
    public class
        MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Cliente, ClienteDTO>().ReverseMap();
            CreateMap<ContaAReceber, ContaAReceberDTO>().ReverseMap();
            CreateMap<DocumentoFinanceiro, DocumentoFinanceiroDTO>().ReverseMap();
            CreateMap<ContaAPagar, ContaAPagarDTO>().ReverseMap();
            CreateMap<Fornecedor, FornecedorDTO>().ReverseMap();
            // Tipo/NomeContraparte não existem na entidade, vêm do DocumentoFinanceiro pai (TPH) -
            // fica null se a navegação não foi incluída no repositório.
            // MapFrom com Func aqui, não Expression, pq `is Tipo variavel` não compila em expression tree.
            CreateMap<Parcela, ParcelaDTO>()
                .ForMember(dest => dest.Tipo, opt => opt.MapFrom((src, dest, destMember, context) =>
                    src.DocumentoFinanceiro is ContaAPagar ? "APagar" :
                    src.DocumentoFinanceiro is ContaAReceber ? "AReceber" :
                    null))
                .ForMember(dest => dest.NomeContraparte, opt => opt.MapFrom((src, dest, destMember, context) =>
                    src.DocumentoFinanceiro is ContaAPagar contaAPagar ? (contaAPagar.Fornecedor != null ? contaAPagar.Fornecedor.Nome : null) :
                    src.DocumentoFinanceiro is ContaAReceber contaAReceber ? (contaAReceber.Cliente != null ? contaAReceber.Cliente.Nome : null) :
                    null))
                .ReverseMap();
        }
    }
}
