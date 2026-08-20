using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Financeiro.Api.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaUsuarioId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM Parcelas;");
            migrationBuilder.Sql("DELETE FROM DocumentoFinanceiro;");
            migrationBuilder.Sql("DELETE FROM Clientes;");
            migrationBuilder.Sql("DELETE FROM Fornecedores;");
            migrationBuilder.AddColumn<string>(
                name: "UsuarioId",
                table: "Parcelas",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "UsuarioId",
                table: "Fornecedores",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "UsuarioId",
                table: "DocumentoFinanceiro",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "UsuarioId",
                table: "Clientes",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Parcelas");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Fornecedores");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "DocumentoFinanceiro");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Clientes");
        }
    }
}
