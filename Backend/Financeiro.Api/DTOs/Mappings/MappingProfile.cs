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
            CreateMap<Parcela, ParcelaDTO>().ReverseMap();
        }
    }
}
