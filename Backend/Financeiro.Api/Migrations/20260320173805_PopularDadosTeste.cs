using Financeiro.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Financeiro.Api.Migrations
{
    /// <inheritdoc />
    public partial class PopularDadosTeste : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. INSERIR FORNECEDORES (5 Exemplos)
            migrationBuilder.Sql(@"INSERT INTO Fornecedores (Nome, CNPJ) VALUES 
                ('Distribuidora Vale', '12345678000101'),
                ('Transportes Rápidos S.A.', '22333444000102'),
                ('Embalagens Pro', '33444555000103'),
                ('SoftPlan Sistemas', '44555666000104'),
                ('Limpeza e Cia', '55666777000105');");

            // 2. INSERIR CLIENTES (5 Exemplos)
            migrationBuilder.Sql(@"INSERT INTO Clientes (Nome, Email, Telefone, Endereco) VALUES 
                ('Supermercado Alvorada', 'contato@alvorada.com', '1437321122', 'Rua das Flores, 100'),
                ('Mercado do Zé', 'ze@email.com', '14999887766', 'Av. Central, 500'),
                ('Restaurante Sabor', 'financeiro@sabor.com', '1433221100', 'Rua 7 de Setembro, 12'),
                ('Hortifruti Fresco', 'vendas@fresco.com', '1437334455', 'Rua Bahia, 45'),
                ('Lanchonete Central', 'lanche@email.com', '14988776655', 'Praça da Matriz, 01');");

            // 3. INSERIR DOCUMENTO FINANCEIRO (5 Contas a Pagar + 5 Contas a Receber)
            // CategoriaGasto: 1:Mercadoria, 2:Logistica, 3:Embalagem, 4:Outros

            // Contas a Pagar (Discriminator: 'ContaAPagar')
            migrationBuilder.Sql(@"INSERT INTO DocumentoFinanceiro 
                (ValorTotal, Discriminator, FornecedorId, NumeroNota, Descricao, Categoria) VALUES 
                (5000.00, 'ContaAPagar', 1, 'NF-1001', 'Compra de estoque mensal', 1),
                (850.00, 'ContaAPagar', 2, 'CTE-450', 'Frete mercadorias', 2),
                (320.00, 'ContaAPagar', 3, 'NF-88', 'Caixas de papelão', 3),
                (1200.00, 'ContaAPagar', 4, NULL, 'Mensalidade Software Gestão', 4),
                (150.00, 'ContaAPagar', 5, 'NF-12', 'Produtos de limpeza', 4);");

            // Contas a Receber (Discriminator: 'ContaAReceber')
            migrationBuilder.Sql(@"INSERT INTO DocumentoFinanceiro 
                (ValorTotal, Discriminator, ClienteId, DataVenda) VALUES 
                (2500.00, 'ContaAReceber', 1, '2026-03-10'),
                (1200.00, 'ContaAReceber', 2, '2026-03-12'),
                (3400.00, 'ContaAReceber', 3, '2026-03-15'),
                (900.00, 'ContaAReceber', 4, '2026-03-18'),
                (1500.00, 'ContaAReceber', 5, '2026-03-20');");

            // 4.INSERIR PARCELAS(Garantindo que os IDs existam)
            // Status: 1:Pendente, 2:Pago, 3:Atrasado
            migrationBuilder.Sql(@"INSERT INTO Parcelas (Valor, DataVencimento, Status, DocumentoFinanceiroId) VALUES 
            (5000.00, '2026-04-10', 1, 1), -- Referente ao primeiro 'ContaAPagar'
            (850.00, '2026-03-25', 2, 2),  -- Referente ao segundo 'ContaAPagar'
            (2500.00, '2026-04-15', 1, 6), -- Referente ao primeiro 'ContaAReceber' (ID 6 costuma ser o primeiro após os 5 de pagar)
            (1200.00, '2026-04-20', 1, 7); -- Referente ao segundo 'ContaAReceber'");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Limpa na ordem inversa para não dar erro de Chave Estrangeira
            migrationBuilder.Sql("DELETE FROM Parcelas;");
            migrationBuilder.Sql("DELETE FROM DocumentoFinanceiro;");
            migrationBuilder.Sql("DELETE FROM Clientes;");
            migrationBuilder.Sql("DELETE FROM Fornecedores;");
        }
    }
}
