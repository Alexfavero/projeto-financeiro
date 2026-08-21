import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { PainelPage } from "@/features/previsao/PainelPage";
import { ComingSoonPage } from "@/shared/components/ComingSoonPage";

/**
 * Parte 1: só Login e Painel existem de verdade. As demais rotas do menu
 * (Contas a Pagar, Contas a Receber, Parcelas, Clientes, Fornecedores,
 * Relatórios) apontam para um placeholder "em construção" — o link já
 * aparece na Sidebar e dá pra navegar sem quebrar, mas a tela de verdade
 * entra nas próximas partes.
 *
 * A partir da Parte 2, "/" (e as demais rotas internas) ganham um wrapper
 * de rota protegida que verifica o token antes de renderizar.
 */
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <PainelPage /> },
  { path: "/contas-a-pagar", element: <ComingSoonPage title="Contas a Pagar" /> },
  { path: "/contas-a-receber", element: <ComingSoonPage title="Contas a Receber" /> },
  { path: "/parcelas", element: <ComingSoonPage title="Parcelas" /> },
  { path: "/clientes", element: <ComingSoonPage title="Clientes" /> },
  { path: "/fornecedores", element: <ComingSoonPage title="Fornecedores" /> },
  { path: "/relatorios", element: <ComingSoonPage title="Relatórios" /> },
]);
