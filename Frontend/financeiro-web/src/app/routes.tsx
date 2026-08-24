import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { PainelPage } from "@/features/previsao/PainelPage";
import { LancarContaPage } from "@/features/lancar-conta/LancarContaPage";
import { ClientesPage } from "@/features/clientes/ClientesPage";
import { FornecedoresPage } from "@/features/fornecedores/FornecedoresPage";
import { ParcelasPage } from "@/features/parcelas/ParcelasPage";
import { ContasAPagarPage } from "@/features/contas-a-pagar/ContasAPagarPage";
import { ContasAReceberPage } from "@/features/contas-a-receber/ContasAReceberPage";
import { RelatoriosPage } from "@/features/relatorios/RelatoriosPage";
import { ProtectedRoute } from "@/shared/auth/ProtectedRoute";

/**
 * Todas as telas do roadmap já têm implementação real: Clientes,
 * Fornecedores, Parcelas (listar + dar baixa + editar), Contas a
 * Pagar/Receber (listar + excluir) e agora Relatórios (5 relatórios em
 * abas, só leitura). Toda rota interna fica atrás de `ProtectedRoute`
 * (exige token salvo, senão manda pro login).
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
        <ContasAPagarPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/contas-a-receber",
    element: (
      <ProtectedRoute>
        <ContasAReceberPage />
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
        <RelatoriosPage />
      </ProtectedRoute>
    ),
  },
]);
