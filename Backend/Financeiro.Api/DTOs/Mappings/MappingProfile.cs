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
            // Tipo/NomeContraparte não existem na entidade Parcela — são calculados
            // aqui a partir do DocumentoFinanceiro pai (TPH). Só saem corretos quando
            // o repositório incluiu essa navegação (ver comentário no ParcelaDTO);
            // quando não foi incluída, DocumentoFinanceiro vem null e os dois campos
            // caem no ramo `null` abaixo, em vez de mostrar um tipo errado.
            //
            // Usamos a sobrecarga de MapFrom que recebe um Func normal (não uma
            // Expression<Func<...>>) de propósito: a versão com Expression é a que o
            // `.MapFrom(src => src.Prop)` de costume usa, e o compilador C# não permite
            // pattern matching com variável (`is Tipo variavel`) dentro de uma árvore de
            // expressão — dá erro "An expression tree may not contain an 'is'
            // pattern-matching operator" na hora de compilar. Como Func vira um delegate
            // comum (não uma árvore de expressão), o pattern matching funciona normal.
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
