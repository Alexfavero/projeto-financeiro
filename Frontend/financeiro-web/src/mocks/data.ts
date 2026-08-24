import {
  CategoriaGasto,
  StatusPagamento,
  type ClienteDTO,
  type ContaAPagarDTO,
  type ContaAReceberDTO,
  type FornecedorDTO,
  type ParcelaDTO,
} from "@/types/dtos";

// "banco" fake pro MSW, pra dar pra usar o front sem precisar da API rodando.
// Reseta a cada reload, sem persistência — de propósito.
// login de teste: demo / demo1234
// 20 de cada (clientes, fornecedores, contas a pagar/receber) pra estourar a
// paginação e ter dado nos relatórios. IDs do seed < 100/1000 pra não bater
// com os gerados em runtime.

export interface MockUser {
  username: string;
  email: string;
  password: string; // texto puro só porque é mock local; nunca fazer isso valendo
}

export const mockUsers: MockUser[] = [
  { username: "demo", email: "demo@exemplo.com", password: "demo1234" },
];

const NOMES_CLIENTES = [
  "João da Silva",
  "Maria Oliveira",
  "Comércio Bom Preço Ltda",
  "Carlos Eduardo Souza",
  "Ana Paula Ferreira",
  "Roberto Lima Santos",
  "Fernanda Costa",
  "Mercado Estrela Ltda",
  "Lucas Almeida",
  "Juliana Ribeiro",
  "Papelaria Central Ltda",
  "Marcos Vinícius Pereira",
  "Camila Rodrigues",
  "Distribuidora Nordeste Ltda",
  "Patrícia Gomes",
  "Rafael Barbosa",
  "Loja do Zé Ltda",
  "Beatriz Cardoso",
  "Thiago Martins",
  "Sandra Regina Nunes",
];

export const mockClientes: ClienteDTO[] = NOMES_CLIENTES.map((nome, i) => ({
  clienteId: i + 1,
  nome,
  email: i % 4 === 3 ? null : `cliente${i + 1}@exemplo.com`,
  telefone: `1199999${String(1000 + i).slice(-4)}`,
  endereco: null,
}));

const NOMES_FORNECEDORES = [
  "Fornecedor ABC Ltda",
  "Fornecedor XYZ Materiais",
  "Distribuidora Sul Embalagens",
  "Atacado Rio Mercadorias",
  "Transportadora Rápida Log Ltda",
  "Gráfica Central Etiquetas",
  "Embalagens Prime Ltda",
  "Comercial Norte Suprimentos",
  "Indústria Vale Mercadorias",
  "Logística Expressa SA",
  "Fornecedor Bela Vista Ltda",
  "Atacadão Popular Ltda",
  "Caixas & Cia Embalagens",
  "Transporte Seguro Cargas",
  "Mercadorias União Ltda",
  "Distribuidora Alfa Ltda",
  "Fornecedor Beta Insumos",
  "Papel & Cia Embalagens",
  "Rede Comercial Sudeste",
  "Fornecedor Gama Produtos",
];

// CNPJ é só [StringLength(14)] no backend (sem validação de dígito
// verificador) — string numérica de 14 dígitos já basta.
const CNPJ_BASE = 11222333000100;

export const mockFornecedores: FornecedorDTO[] = NOMES_FORNECEDORES.map((nome, i) => ({
  fornecedorId: i + 1,
  nome,
  cnpj: String(CNPJ_BASE + i * 37).padStart(14, "0"),
}));

let nextDocumentoId = 100;
let nextParcelaId = 1000;
let nextClienteId = 100;
let nextFornecedorId = 100;
let seedParcelaId = 1;

function hojeMaisDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

// A maioria cai dentro do mês corrente (pra Gastos por Categoria e Ranking
// já mostrarem dado assim que a tela abre, sem precisar mexer no filtro),
// mas 2 ficam em meses anteriores — de propósito, pra dar o que testar no
// filtro de período de Gastos por Categoria.
const DIAS_ATRAS_PAGO = [3, 9, 15, 6, 12, 45, 70];

// Cicla os 3 cenários que os relatórios e as outras telas precisam ver:
// já paga (ver DIAS_ATRAS_PAGO acima), atrasada (vencida e ainda não paga,
// pra Inadimplência/Atrasadas) e pendente futura (ainda dentro do prazo,
// pra Painel/"Esta semana").
function statusDoIndice(i: number): { status: StatusPagamento; diasVencimento: number; diasPagamento?: number } {
  const cenario = i % 3;
  if (cenario === 0) {
    const diasAtras = DIAS_ATRAS_PAGO[(i / 3) % DIAS_ATRAS_PAGO.length];
    return { status: StatusPagamento.Pago, diasVencimento: -diasAtras, diasPagamento: -diasAtras + 1 };
  }
  if (cenario === 1) {
    // Vencida e ainda não paga.
    return { status: StatusPagamento.Pendente, diasVencimento: -(3 + i) };
  }
  // Pendente, vencimento ainda no futuro.
  return { status: StatusPagamento.Pendente, diasVencimento: 2 + i };
}

function novaParcela(documentoFinanceiroId: number, valor: number, i: number): ParcelaDTO {
  const cenario = statusDoIndice(i);
  return {
    parcelaId: seedParcelaId++,
    valor,
    dataVencimento: hojeMaisDias(cenario.diasVencimento),
    dataPagamento: cenario.status === StatusPagamento.Pago ? hojeMaisDias(cenario.diasPagamento ?? 0) : null,
    status: cenario.status,
    documentoFinanceiroId,
  };
}

const CATEGORIAS: CategoriaGasto[] = [
  CategoriaGasto.Mercadoria,
  CategoriaGasto.Logistica,
  CategoriaGasto.Embalagem,
  CategoriaGasto.Outros,
];

export const mockContasAPagar: ContaAPagarDTO[] = Array.from({ length: 20 }, (_, i) => {
  const documentoFinanceiroId = 10 + i;
  const fornecedorId = mockFornecedores[i % mockFornecedores.length].fornecedorId;
  const duasParcelas = i % 5 === 0; // modulus diferente do cenário (i % 3), pra não sempre coincidir com "paga"
  const valorParcela = 80 + i * 23;

  const parcelas = duasParcelas
    ? [novaParcela(documentoFinanceiroId, valorParcela, i), novaParcela(documentoFinanceiroId, valorParcela, i + 1)]
    : [novaParcela(documentoFinanceiroId, valorParcela * 2, i)];

  return {
    documentoFinanceiroId,
    valorTotal: parcelas.reduce((soma, p) => soma + p.valor, 0),
    fornecedorId,
    numeroNota: `NF-${1000 + i}`,
    descricao: `Compra ${i + 1}`,
    categoria: CATEGORIAS[i % CATEGORIAS.length],
    parcelas,
  };
});

export const mockContasAReceber: ContaAReceberDTO[] = Array.from({ length: 20 }, (_, i) => {
  const documentoFinanceiroId = 30 + i;
  const clienteId = mockClientes[i % mockClientes.length].clienteId;
  const duasParcelas = i % 5 === 2; // modulus diferente do cenário (i % 3), pra não sempre coincidir com um status só
  const valorParcela = 60 + i * 31;

  const parcelas = duasParcelas
    ? [novaParcela(documentoFinanceiroId, valorParcela, i), novaParcela(documentoFinanceiroId, valorParcela, i + 2)]
    : [novaParcela(documentoFinanceiroId, valorParcela * 2, i)];

  return {
    documentoFinanceiroId,
    valorTotal: parcelas.reduce((soma, p) => soma + p.valor, 0),
    clienteId,
    dataVenda: hojeMaisDias(-(5 + i)),
    parcelas,
  };
});

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
