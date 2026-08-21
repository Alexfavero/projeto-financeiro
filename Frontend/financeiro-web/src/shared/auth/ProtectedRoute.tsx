import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "./authStorage";

/**
 * Envolve o elemento de uma rota interna: se não houver token guardado,
 * manda pra /login (guardando de onde veio em `state.from`, pra dar pra
 * voltar depois do login — não usado ainda na Parte 2, mas já deixa pronto).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
