import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { PainelPage } from "@/features/previsao/PainelPage";
import { LancarContaPage } from "@/features/lancar-conta/LancarContaPage";
import { ComingSoonPage } from "@/shared/components/ComingSoonPage";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";

/**
 * Parte 2: Painel e Lançar Conta já usam dado de verdade (via MSW/API) e
 * ficam atrás de `ProtectedRoute` (exige token salvo, senão manda pro
 * login). As demais entradas do menu (Contas a Pagar, Contas a Receber,
 * Parcelas, Clientes, Fornecedores, Relatórios) continuam no placeholder
 * "em construção" — entram na Parte 3 em diante, uma de cada vez.
 */
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <PainelPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/lancar-conta",
    element: (
      <ProtectedRoute>
        <LancarContaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/contas-a-pagar",
    element: (
      <ProtectedRoute>
        <ComingSoonPage title="Contas a Pagar" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/contas-a-receber",
    element: (
      <ProtectedRoute>
        <ComingSoonPage title="Contas a Receber" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/parcelas",
    element: (
      <ProtectedRoute>
        <ComingSoonPage title="Parcelas" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/clientes",
    element: (
      <ProtectedRoute>
        <ComingSoonPage title="Clientes" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/fornecedores",
    element: (
      <ProtectedRoute>
        <ComingSoonPage title="Fornecedores" />
      </ProtectedRoute>
    ),
  },
  {
    path: "/relatorios",
    element: (
      <ProtectedRoute>
        <ComingSoonPage title="Relatórios" />
      </ProtectedRoute>
    ),
  },
]);
