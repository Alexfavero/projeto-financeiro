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
            // Tipo/NomeContraparte não existem na entidade, são calculados aqui a partir
            // do DocumentoFinanceiro pai (TPH). Se a navegação não foi incluída no
            // repositório, DocumentoFinanceiro vem null e cai no ramo null abaixo.
            //
            // usa a sobrecarga de MapFrom com Func (não Expression<Func<...>>) de propósito:
            // com Expression o `is Tipo variavel` não compila ("An expression tree may not
            // contain an 'is' pattern-matching operator"); com Func é só um delegate normal.
            CreateMap<Parcela, ParcelaDTO>()
                .ForMember(dest => dest.Tipo, opt => opt.MapFrom((src, dest, destMember, context) =>
                    src.DocumentoFinanceiro is ContaAPagar ? "APagar" :
                    src.DocumentoFinanceiro is ContaAReceber ? "AReceber" :
                    null))
                .ForMember(dest => dest.NomeContraparte, opt => opt.MapFrom((src, dest, destMember, context) =>
                    src.DocumentoFinanceiro is ContaAPagar contaAPagar ? (contaAPagar.Fornecedor != null ? contaAPagar.Fornecedor.Nome : null) :
                    src.DocumentoFinanceiro is ContaAReceber contaAReceber ? contaAReceber.Cliente.Nome :
                    null))
                .ReverseMap();
        }
    }
}
