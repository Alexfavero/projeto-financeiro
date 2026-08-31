# Sistema de Controle Financeiro

Sistema web de controle financeiro voltado a vendedores autônomos e microempreendedores individuais (MEI), desenvolvido como Trabalho de Conclusão de Curso do curso de Tecnologia em Análise e Desenvolvimento de Sistemas (FATEC Presidente Prudente). Permite o gerenciamento de contas a pagar e a receber com parcelamento, controle de clientes e fornecedores, previsão financeira e relatórios gerenciais, com autenticação e isolamento de dados por usuário.

O projeto é full-stack: uma API REST em ASP.NET Core (back-end) e uma aplicação em React (front-end).

## 🚀 Tecnologias Utilizadas

**Back-end**
* **.NET 8** (ASP.NET Core Web API)
* **Entity Framework Core** (ORM), com o provedor **Pomelo.EntityFrameworkCore.MySql**
* **MySQL** (banco de dados)
* **ASP.NET Core Identity + JWT** (autenticação e autorização, com refresh token)
* **AutoMapper** (mapeamento entre entidades e DTOs)
* **Swagger/Swashbuckle** (documentação interativa da API, com suporte a Bearer token)
* **xUnit + Moq** (testes automatizados)

**Front-end**
* **React 19 + TypeScript**
* **Vite** (build e dev server)
* **TanStack Query** (cache e sincronização de dados com a API)
* **React Router** (navegação)
* **React Hook Form + Zod** (formulários e validação)
* **Axios** (requisições HTTP)
* **Recharts** (gráficos)
* **Tailwind CSS**
* **MSW** (mock de API para desenvolvimento isolado do front-end)

## 🏗️ Arquitetura e Padrões

* **Repository Pattern + Unit of Work**: abstração e consistência transacional no acesso a dados.
* **Camada de Services**: concentra as regras de negócio (o modelo de domínio é intencionalmente anêmico).
* **DTOs (Data Transfer Objects)**: camada de segurança para exposição de dados pela API.
* **Table Per Hierarchy (TPH)**: `ContaAPagar` e `ContaAReceber` são persistidas em uma única tabela (`DocumentoFinanceiro`), diferenciadas por coluna discriminadora.
* **Isolamento multiusuário**: cada Cliente, Fornecedor, conta e parcela pertence a um usuário autenticado (filtro aplicado na camada de aplicação, via `UsuarioId`).
* **Programação assíncrona**: uso de `async/await` em toda a API.
* Arquitetura do front-end organizada **por feature** (não Atomic Design), com mocks de API via MSW para desenvolver sem depender do back-end rodando.

## 📊 Funcionalidades

* Cadastro e gerenciamento (CRUD) de Clientes e Fornecedores.
* Lançamento de contas a pagar e a receber, com parcelamento automático.
* Consulta de parcelas com filtros por status (pendente, paga, atrasada), período e categoria, e registro de baixa (pagamento/recebimento).
* Previsão financeira: entradas e saídas previstas, saldo projetado e saldo acumulado ao longo de um período, com gráficos comparando valores já realizados e previstos.
* Relatórios: inadimplência, gastos por categoria, extrato do cliente, contas a pagar atrasadas e ranking (clientes e fornecedores).
* Autenticação com registro, login e renovação de sessão via refresh token; dados isolados por usuário.
* Tema claro/escuro e layout responsivo (mobile/tablet/desktop).

Mais detalhes de cada tela estão no Manual do Usuário, incluído na documentação do projeto (ERS).

## 📁 Estrutura do Projeto

```
Backend/
  Financeiro.Api/          # API (Controllers, Services, Repositories, Models, DTOs, migrations)
  Financeiro.Api.Tests/    # Testes automatizados (xUnit + Moq)
Frontend/
  financeiro-web/          # Aplicação React (ver README próprio para instruções detalhadas)
```

## 🛠️ Como Executar o Projeto

### Back-end (API)

1. Clone o repositório:
   ```bash
   git clone https://github.com/Alexfavero/projeto-financeiro.git
   ```
2. Tenha um servidor **MySQL** disponível localmente (ou apontando para um serviço gerenciado).
3. Configure a connection string e a chave JWT — esses valores **não** ficam no repositório (arquivos `appsettings.json` e `appsettings.Development.json` estão no `.gitignore`). Em desenvolvimento, use o User Secrets do .NET a partir da pasta `Backend/Financeiro.Api`:
   ```bash
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Port=3306;Database=FinanceiroDb;Uid=SEU_USUARIO;Pwd=SUA_SENHA;"
   dotnet user-secrets set "JWT:SecretKey" "uma-chave-secreta-longa-qualquer"
   ```
   (ou crie os arquivos `appsettings.json`/`appsettings.Development.json` localmente com essas chaves — eles já estão ignorados pelo Git.)
4. Aplique as migrations do Entity Framework Core, a partir da pasta `Backend/Financeiro.Api`:
   ```bash
   dotnet ef database update
   ```
5. Rode a API:
   ```bash
   dotnet run --project Backend/Financeiro.Api
   ```
   O Swagger fica disponível em `/swagger` com o servidor rodando.

### Front-end (React)

Instruções completas de pré-requisitos e execução estão em [`Frontend/financeiro-web/README.md`](Frontend/financeiro-web/README.md). Resumo:
```bash
cd Frontend/financeiro-web
npm install
npm run dev
```

## ✅ Testes Automatizados

O projeto conta com uma suíte de testes automatizados (xUnit + Moq) cobrindo controllers, repositories e regras de negócio do back-end, em `Backend/Financeiro.Api.Tests`. Para rodar:
```bash
dotnet test
```

## ⚙️ Integração Contínua

O repositório tem um workflow de CI no GitHub Actions (`.github/workflows/dotnet-ci.yml`), executado a cada push e pull request para `main`: build da API em modo Release e, quando há projeto de testes, execução automática dos testes.

## ☁️ Hospedagem (planejada)

A hospedagem definitiva planejada é: **Google Cloud Run** para a API, **Aiven** para o MySQL e **Vercel/Cloudflare Pages** para o front-end (todos em nível gratuito). Até o momento, o projeto foi validado em ambiente de desenvolvimento local; o deploy ainda não foi realizado.
