# Financeiro Web — Frontend

Front-end em React do Sistema de Controle Financeiro.

## Pré-requisitos

- **Node.js 20 ou superior** (recomendado a versão LTS mais recente). Se você não tiver instalado, baixe em https://nodejs.org — o instalador já traz o `npm` junto.
- Verifique se está instalado abrindo um terminal (PowerShell ou cmd) e rodando:
  ```
  node -v
  npm -v
  ```

## Como rodar (primeira vez, depois desta Parte 2)

Dentro desta pasta (`Frontend/financeiro-web`):

```
npm install
npx msw init public --save
npm run dev
```

O segundo comando (`npx msw init public --save`) só precisa ser rodado **uma vez** (ou de novo se a pasta `public/` for apagada, ou depois de atualizar a versão do MSW) — ele gera o arquivo `public/mockServiceWorker.js`, que é o "worker" que intercepta as chamadas de API no navegador para devolver os dados mockados. Sem rodar isso, o app builda e abre, mas as chamadas de API não são interceptadas e você vai ver erros de rede no console.

O terminal do `npm run dev` vai mostrar um endereço, algo como `http://localhost:5173` — abra no navegador.

Pra parar o servidor, `Ctrl+C` no terminal.

## Login de teste

Com o modo mock ligado (padrão — ver `.env.development`), já existe um usuário de teste pronto, sem precisar cadastrar:

- **Usuário:** `demo`
- **Senha:** `demo1234`

Ou clique em "Criar conta" pra cadastrar outro usuário (fica só na memória do navegador, some ao recarregar a página).

## Modo mock x API real

O arquivo `.env.development` tem duas variáveis:

```
VITE_API_URL=http://localhost:5027/api
VITE_USE_MOCKS=true
```

Com `VITE_USE_MOCKS=true` (padrão), todas as chamadas de API são respondidas pelo MSW com dados fixos em memória (ver `src/mocks/`) — dá pra usar o front-end inteiro sem o backend nem o banco rodando, o que é útil porque o banco MySQL de verdade ainda está vazio. Pra testar contra a API .NET de verdade (rodando localmente com `dotnet run`, perfil `http`, porta 5027), troque para `VITE_USE_MOCKS=false` e reinicie o `npm run dev`. Não esqueça: os dados mockados desaparecem a cada F5 (não persistem), então é normal a Previsão do Painel zerar depois de recarregar a página se você lançou uma conta e deu refresh.

## Se der erro

Se qualquer comando acima acusar erro, me manda a mensagem completa (pode ser print ou texto copiado do terminal) que eu conserto — não escrevi este código com um `npm run dev` rodando pra conferir (limitação de rede do meu ambiente), então é esperado que alguma coisa pequena precise de ajuste na primeira rodada.

## O que já existe

**Parte 1**: estrutura do projeto (Vite + React + TypeScript + Tailwind), layout (Sidebar/Topbar), roteamento, componentes visuais reutilizáveis (Button, Input, Select, Card, Badge).

**Parte 2** (atual): Axios com interceptor de JWT, TanStack Query, MSW (mock de API completo — login/registro, previsão, parcelas, clientes, fornecedores, criação de conta), rotas protegidas (exigem login), telas de Login/Criar Conta e Painel com dado real (mockado), e a tela de **Lançar Conta** (Conta a Pagar / Conta a Receber) com React Hook Form + Zod e lista de parcelas dinâmica.

As entradas do menu ainda não implementadas (Contas a Pagar, Contas a Receber, Parcelas, Clientes, Fornecedores, Relatórios) continuam mostrando uma tela "em construção".

## Próximas partes

- **Parte 3 em diante**: telas de listagem/CRUD de Clientes, Fornecedores, Contas a Pagar/Receber e Parcelas, e a tela de Relatórios — uma de cada vez.
