import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { PainelPage } from "@/features/previsao/PainelPage";
import { LancarContaPage } from "@/features/lancar-conta/LancarContaPage";
import { ClientesPage } from "@/features/clientes/ClientesPage";
import { FornecedoresPage } from "@/features/fornecedores/FornecedoresPage";
import { ParcelasPage } from "@/features/parcelas/ParcelasPage";
import { ComingSoonPage } from "@/shared/components/ComingSoonPage";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";

/**
 * Parte 3 (em andamento): Clientes, Fornecedores e Parcelas (listar + dar
 * baixa) já têm tela real. Contas a Pagar/Receber (listagem) e Relatórios
 * continuam no placeholder "em construção" — entram nas próximas rodadas.
 * Toda rota interna fica atrás de `ProtectedRoute` (exige token salvo,
 * senão manda pro login).
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
        <ParcelasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/clientes",
    element: (
      <ProtectedRoute>
        <ClientesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/fornecedores",
    element: (
      <ProtectedRoute>
        <FornecedoresPage />
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
