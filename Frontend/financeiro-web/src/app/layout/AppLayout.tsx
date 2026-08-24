import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * Layout comum a toda tela interna. O estado do menu mobile mora aqui (não
 * dentro da Sidebar) porque tanto a Sidebar (o próprio menu) quanto a Topbar
 * (o botão ☰ que abre) precisam dele — os dois são irmãos, então o estado
 * sobe pro pai mais próximo dos dois.
 */
export function AppLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-alt">
      <Sidebar abertoMobile={menuAberto} onFechar={() => setMenuAberto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onAbrirMenu={() => setMenuAberto(true)} />
        <main className="flex-1 overflow-x-hidden bg-surface-alt p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
