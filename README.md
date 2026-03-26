# Projeto Financeiro - API de Gestão de Contas

Sistema de controle financeiro desenvolvido como parte do curso de Tecnologia em Análise e Desenvolvimento de Sistemas (FATEC). A API permite o gerenciamento completo de Contas a Pagar, Contas a Receber, Clientes e Fornecedores, com suporte a parcelamento automático.

## 🚀 Tecnologias Utilizadas

* **.NET 8** (ASP.NET Core Web API)
* **Entity Framework Core** (ORM)
* **SQL Server** (Banco de Dados)
* **AutoMapper** (Mapeamento de DTOs)
* **Swagger/OpenAPI** (Documentação da API)

## 🏗️ Arquitetura e Padrões

O projeto foi construído seguindo boas práticas de desenvolvimento:
* **Repository Pattern**: Abstração da lógica de acesso a dados.
* **Unit of Work**: Garantia de integridade nas transações (All-or-Nothing).
* **DTOs (Data Transfer Objects)**: Camada de segurança para exposição de dados.
* **Programação Assíncrona**: Uso de `async/await` para melhor performance e escalabilidade.

## 📊 Estrutura de Domínio

O sistema gerencia os seguintes fluxos:
* **Financeiro**: Documentos base, Contas a Pagar (com fornecedores) e Contas a Receber (com clientes).
* **Parcelas**: Geração e controle de status de pagamento (Pendente, Pago, Atrasado).
* **Entidades**: Cadastro de Clientes (Pessoa Física/Jurídica) e Fornecedores (via CNPJ).

## 🛠️ Como Executar o Projeto

1. Clone o repositório:
   ```bash
   git clone [https://github.com/Alexfavero/projeto-financeiro.git](https://github.com/Alexfavero/projeto-financeiro.git)