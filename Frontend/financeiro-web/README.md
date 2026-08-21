# Financeiro Web — Frontend (Parte 1: esqueleto)

Front-end em React do Sistema de Controle Financeiro. Esta é a **Parte 1**: estrutura do projeto, Tailwind, layout (Sidebar/Topbar), roteamento e as telas de Login e Painel com dado fixo (mockado direto no código) — só pra confirmar que builda e roda antes de entrar em API/mocks de verdade nas próximas partes.

## Pré-requisitos

- **Node.js 20 ou superior** (recomendado a versão LTS mais recente). Se você não tiver instalado, baixe em https://nodejs.org — o instalador já traz o `npm` junto.
- Verifique se está instalado abrindo um terminal (PowerShell ou cmd) e rodando:
  ```
  node -v
  npm -v
  ```

## Como rodar

Dentro desta pasta (`Frontend/financeiro-web`):

```
npm install
npm run dev
```

O terminal vai mostrar um endereço, algo como `http://localhost:5173` — abra no navegador. Deve aparecer a tela de login; qualquer e-mail/senha preenchidos e clique em "Entrar" leva pro Painel (é só um fluxo fake pra essa parte, sem checagem de verdade ainda).

Pra parar o servidor, `Ctrl+C` no terminal.

## Se der erro

Se o `npm install` ou o `npm run dev` acusar algum erro, me manda a mensagem completa (pode ser print ou texto copiado do terminal) que eu conserto — não escrevi esse código com um `npm run dev` rodando pra conferir (limitação de rede do meu ambiente), então é esperado que alguma coisa pequena precise de ajuste na primeira rodada, do mesmo jeito que aconteceu com os testes automatizados do backend.

## O que já existe nesta parte

- Estrutura de pastas: `src/app` (layout e rotas), `src/shared/components` (Button, Input, Card, Badge — peças reutilizáveis), `src/features` (uma pasta por área de negócio), `src/types` (DTOs espelhando o backend).
- Tailwind CSS configurado com a paleta de cor usada nos mockups que te mandei antes.
- Sidebar + Topbar (o "shell" do app).
- Tela de Login (fake) e Painel (com dado fixo).
- As demais entradas do menu (Contas a Pagar, Contas a Receber, Parcelas, Clientes, Fornecedores, Relatórios) já navegam, mas mostram uma tela "em construção" — chega nas próximas partes.

## Próximas partes

- **Parte 2**: Axios + TanStack Query + MSW (mock de API de verdade, simulando as respostas do backend) + React Hook Form/Zod, tela de Lançar Conta.
- **Parte 3 em diante**: Clientes, Fornecedores, Contas a Pagar/Receber (listagens), Parcelas, Relatórios.
