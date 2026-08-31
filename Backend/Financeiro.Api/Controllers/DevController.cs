using Financeiro.Api.Domain.Entities;
using Financeiro.Api.Domain.Enums;
using Financeiro.Api.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace Financeiro.Api.Controllers
{
    // Endpoint de uso pontual, fora do "produto" de verdade - so serve pra
    // popular a conta logada com dados de demonstracao (clientes,
    // fornecedores, contas a pagar/receber e parcelas espalhadas em varios
    // meses, com status variados: pago, pendente, atrasado), pra testar e
    // apresentar o sistema com uma base parecida com uso real.
    //
    // So funciona em ambiente de desenvolvimento (ver SeedDemo abaixo) e,
    // dentro disso, [Authorize] garante que so afeta quem estiver logado no
    // momento - mesmo isolamento multiusuario de sempre (o UsuarioId e
    // preenchido automaticamente pelo AppDbContext a partir do token, nunca
    // escolhido aqui). Rodar de novo acrescenta outro lote (os nomes fixos
    // vao se repetir) - a ideia e rodar uma vez so.
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DevController : ControllerBase
    {
        private readonly IUnitOfWork _uof;
        private readonly IWebHostEnvironment _env;

        public DevController(IUnitOfWork uof, IWebHostEnvironment env)
        {
            _uof = uof;
            _env = env;
        }

        private static readonly string[] NomesClientes =
        {
            "Ana Beatriz Souza",
            "Carlos Eduardo Lima",
            "Fernanda Oliveira Santos",
            "Gabriel Henrique Costa",
            "Juliana Ramos Pereira",
            "Marcos Vinicius Almeida",
            "Patricia Nogueira Fernandes",
            "Rodrigo Teixeira Barbosa",
        };

        private static readonly string[] EmailsClientes =
        {
            "ana.souza@exemplo.com",
            "carlos.lima@exemplo.com",
            "fernanda.santos@exemplo.com",
            "gabriel.costa@exemplo.com",
            "juliana.pereira@exemplo.com",
            "marcos.almeida@exemplo.com",
            "patricia.fernandes@exemplo.com",
            "rodrigo.barbosa@exemplo.com",
        };

        private static readonly (string Nome, string Cnpj)[] Fornecedores =
        {
            ("Distribuidora Nordeste Ltda", "12345678000190"),
            ("Embalagens Rio Comercio", "23456789000181"),
            ("Insumos e Cia Suprimentos", "34567890000172"),
            ("Logistica Expressa SP", "45678901000163"),
            ("TransCarga Brasil Transportes", "56789012000154"),
        };

        [HttpPost("seed-demo")]
        public async Task<ActionResult> SeedDemo()
        {
            // fora de Development, nem existe - segurança extra além do
            // [Authorize], pra não sobreviver sem querer até um deploy real
            if (!_env.IsDevelopment())
                return NotFound();

            var rng = new Random();
            var hoje = DateTime.Today;

            var clientes = new List<Cliente>();
            for (int i = 0; i < NomesClientes.Length; i++)
            {
                var cliente = new Cliente
                {
                    Nome = NomesClientes[i],
                    Email = EmailsClientes[i],
                    Telefone = $"(11) 9{rng.Next(1000, 9999)}-{rng.Next(1000, 9999)}",
                };
                _uof.ClienteRepository.Create(cliente);
                clientes.Add(cliente);
            }

            var fornecedores = new List<Fornecedor>();
            foreach (var (nome, cnpj) in Fornecedores)
            {
                var fornecedor = new Fornecedor { Nome = nome, CNPJ = cnpj };
                _uof.FornecedorRepository.Create(fornecedor);
                fornecedores.Add(fornecedor);
            }

            // precisa comitar antes: as Contas abaixo usam o ClienteId/FornecedorId
            // gerado agora, e só existe depois que o EF salva de verdade
            await _uof.CommitAsync();

            int qtdParcelas = 0;

            // Contas a Receber - uma leva pra cada cliente, algumas repetindo
            // cliente pra simular quem compra mais de uma vez
            for (int i = 0; i < 14; i++)
            {
                var cliente = clientes[i % clientes.Count];
                var dataVenda = hoje.AddDays(-rng.Next(0, 75));
                var parcelas = GerarParcelas(rng, dataVenda, rng.Next(1, 4), hoje);

                var conta = new ContaAReceber
                {
                    ClienteId = cliente.ClienteId,
                    DataVenda = dataVenda,
                    ValorTotal = parcelas.Sum(p => p.Valor),
                    Parcelas = parcelas,
                };
                _uof.ContaAReceberRepository.Create(conta);
                qtdParcelas += parcelas.Count;
            }

            // Contas a Pagar - espalhadas pelos fornecedores e categorias
            var categorias = Enum.GetValues<CategoriaGasto>();
            for (int i = 0; i < 12; i++)
            {
                var fornecedor = fornecedores[i % fornecedores.Count];
                var dataCompra = hoje.AddDays(-rng.Next(0, 75));
                var parcelas = GerarParcelas(rng, dataCompra, rng.Next(1, 3), hoje);

                var conta = new ContaAPagar
                {
                    FornecedorId = fornecedor.FornecedorId,
                    Categoria = categorias[rng.Next(categorias.Length)],
                    NumeroNota = $"NF-{rng.Next(1000, 9999)}",
                    Descricao = "Compra de mercadoria/insumo pra revenda",
                    ValorTotal = parcelas.Sum(p => p.Valor),
                    Parcelas = parcelas,
                };
                _uof.ContaAPagarRepository.Create(conta);
                qtdParcelas += parcelas.Count;
            }

            await _uof.CommitAsync();

            return Ok(new
            {
                mensagem = "Dados de demonstracao gerados com sucesso pra sua conta.",
                clientes = clientes.Count,
                fornecedores = fornecedores.Count,
                contasAReceber = 14,
                contasAPagar = 12,
                parcelas = qtdParcelas,
            });
        }

        // gera de 1 a N parcelas a partir de uma data base, com ~30 dias de
        // intervalo entre elas (parcelamento mensal, o mais comum). Parcela
        // com vencimento no passado: a maioria já paga (com DataPagamento
        // pouco depois do vencimento), uma fatia menor fica Atrasada de
        // propósito, pra dar dado pra aba Atrasadas e o relatório de
        // inadimplência. Vencimento no futuro (ou hoje): sempre Pendente.
        private static List<Parcela> GerarParcelas(Random rng, DateTime dataBase, int quantidade, DateTime hoje)
        {
            var parcelas = new List<Parcela>();
            for (int n = 0; n < quantidade; n++)
            {
                var vencimento = dataBase.AddDays(30 * n).AddDays(rng.Next(0, 10));
                var valor = Math.Round(rng.Next(8000, 60000) / 100m, 2);

                var parcela = new Parcela { Valor = valor, DataVencimento = vencimento };

                if (vencimento < hoje)
                {
                    var ficaAtrasada = rng.Next(0, 100) < 20;
                    if (ficaAtrasada)
                    {
                        parcela.Status = StatusPagamento.Atrasado;
                    }
                    else
                    {
                        parcela.Status = StatusPagamento.Pago;
                        parcela.DataPagamento = vencimento.AddDays(rng.Next(0, 5));
                    }
                }
                else
                {
                    parcela.Status = StatusPagamento.Pendente;
                }

                parcelas.Add(parcela);
            }
            return parcelas;
        }
    }
}
