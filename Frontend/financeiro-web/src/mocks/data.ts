import {
  CategoriaGasto,
  StatusPagamento,
  type ClienteDTO,
  type ContaAPagarDTO,
  type ContaAReceberDTO,
  type FornecedorDTO,
  type ParcelaDTO,
} from "@/types/dtos";

/**
 * "Banco de dados" em memória usado pelo MSW.
 *
 * Existe só porque o banco MySQL de verdade está vazio (sem seed além do
 * schema) e o objetivo desta parte é conseguir usar o front-end inteiro sem
 * depender da API/banco rodando. Cada `arrays` abaixo é recriado do zero
 * toda vez que a página recarrega (sem persistência) — o que é o
 * comportamento certo pra um mock, não um bug.
 *
 * Usuário de demonstração para testar login sem precisar criar conta:
 *   usuário: demo   |   senha: demo1234
 */

export interface MockUser {
  username: string;
  email: string;
  password: string; // texto puro só porque é mock local; nunca fazer isso valendo
}

export const mockUsers: MockUser[] = [
  { username: "demo", email: "demo@exemplo.com", password: "demo1234" },
];

export const mockClientes: ClienteDTO[] = [
  { clienteId: 1, nome: "João da Silva", email: "joao@exemplo.com", telefone: "11999990001", endereco: null },
  { clienteId: 2, nome: "Maria Oliveira", email: "maria@exemplo.com", telefone: "11999990002", endereco: null },
  { clienteId: 3, nome: "Comércio Bom Preço Ltda", email: null, telefone: "11999990003", endereco: null },
];

export const mockFornecedores: FornecedorDTO[] = [
  { fornecedorId: 1, nome: "Fornecedor ABC Ltda", cnpj: "11222333000144" },
  { fornecedorId: 2, nome: "Fornecedor XYZ Materiais", cnpj: "22333444000155" },
];

let nextDocumentoId = 100;
let nextParcelaId = 1000;
let nextClienteId = 100;
let nextFornecedorId = 100;

function hojeMaisDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export const mockContasAPagar: ContaAPagarDTO[] = [
  {
    documentoFinanceiroId: 10,
    valorTotal: 350,
    fornecedorId: 1,
    numeroNota: "12345",
    descricao: "Compra de mercadoria",
    categoria: CategoriaGasto.Mercadoria,
    parcelas: [
      { parcelaId: 1, valor: 175, dataVencimento: hojeMaisDias(-2), dataPagamento: null, status: StatusPagamento.Atrasado, documentoFinanceiroId: 10 },
      { parcelaId: 2, valor: 175, dataVencimento: hojeMaisDias(5), dataPagamento: null, status: StatusPagamento.Pendente, documentoFinanceiroId: 10 },
    ],
  },
];

export const mockContasAReceber: ContaAReceberDTO[] = [
  {
    documentoFinanceiroId: 11,
    valorTotal: 120,
    clienteId: 1,
    dataVenda: hojeMaisDias(-3),
    parcelas: [
      { parcelaId: 3, valor: 120, dataVencimento: hojeMaisDias(2), dataPagamento: null, status: StatusPagamento.Pendente, documentoFinanceiroId: 11 },
    ],
  },
  {
    documentoFinanceiroId: 12,
    valorTotal: 780,
    clienteId: 2,
    dataVenda: hojeMaisDias(-1),
    parcelas: [
      { parcelaId: 4, valor: 780, dataVencimento: hojeMaisDias(9), dataPagamento: null, status: StatusPagamento.Pendente, documentoFinanceiroId: 12 },
    ],
  },
];

export function allParcelas(): ParcelaDTO[] {
  return [
    ...mockContasAPagar.flatMap((c) => c.parcelas),
    ...mockContasAReceber.flatMap((c) => c.parcelas),
  ];
}

// Imita o que o backend real faz no MappingProfile: descobre, a partir do
// documentoFinanceiroId, se a parcela é de uma conta a pagar (e o nome do
// fornecedor) ou a receber (e o nome do cliente). Usado pelos handlers das
// listagens que a tela de Parcelas consome (Atrasadas, Período, paginada).
export function enriquecerParcela(p: ParcelaDTO): ParcelaDTO {
  const contaAPagar = mockContasAPagar.find((c) => c.documentoFinanceiroId === p.documentoFinanceiroId);
  if (contaAPagar) {
    const fornecedor = mockFornecedores.find((f) => f.fornecedorId === contaAPagar.fornecedorId);
    return { ...p, tipo: "APagar", nomeContraparte: fornecedor?.nome ?? null };
  }

  const contaAReceber = mockContasAReceber.find((c) => c.documentoFinanceiroId === p.documentoFinanceiroId);
  if (contaAReceber) {
    const cliente = mockClientes.find((c) => c.clienteId === contaAReceber.clienteId);
    return { ...p, tipo: "AReceber", nomeContraparte: cliente?.nome ?? null };
  }

  return { ...p, tipo: null, nomeContraparte: null };
}

export function allParcelasEnriquecidas(): ParcelaDTO[] {
  return allParcelas().map(enriquecerParcela);
}

export function proximoDocumentoId(): number {
  return nextDocumentoId++;
}

export function proximosParcelaIds(qtd: number): number[] {
  const ids = Array.from({ length: qtd }, (_, i) => nextParcelaId + i);
  nextParcelaId += qtd;
  return ids;
}

export function proximoClienteId(): number {
  return nextClienteId++;
}

export function proximoFornecedorId(): number {
  return nextFornecedorId++;
}
