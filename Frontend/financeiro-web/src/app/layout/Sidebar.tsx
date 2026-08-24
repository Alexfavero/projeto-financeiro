import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Painel", end: true },
  { to: "/contas-a-pagar", label: "Contas a Pagar" },
  { to: "/contas-a-receber", label: "Contas a Receber" },
  { to: "/parcelas", label: "Parcelas" },
  { to: "/clientes", label: "Clientes" },
  { to: "/fornecedores", label: "Fornecedores" },
  { to: "/relatorios", label: "Relatórios" },
];

/**
 * Sempre com fundo azul-marinho escuro, em qualquer tema (claro ou escuro do
 * app) — é "chrome" da aplicação, não conteúdo, então não precisa acompanhar
 * o tema (mesmo padrão usado por vários dashboards: a barra lateral fica
 * fixa, só o conteúdo muda de tema).
 *
 * Responsivo: em telas `md` (≥768px) pra cima, fica sempre visível, do jeito
 * que sempre foi. Abaixo disso, vira um menu que abre por cima do conteúdo
 * (controlado pelo botão ☰ na Topbar, estado em AppLayout) — `abertoMobile`
 * decide se está deslizada pra dentro da tela ou escondida à esquerda.
 */
export function Sidebar({
  abertoMobile,
  onFechar,
}: {
  abertoMobile: boolean;
  onFechar: () => void;
}) {
  return (
    <>
      {abertoMobile && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onFechar} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[232px] shrink-0 flex-col bg-[#12233d] py-5 text-white transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          abertoMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2.5 px-5 pb-6 font-bold">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm">$</div>
            Controle Financeiro
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            className="text-lg text-[#c7d2e3] md:hidden"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-0.5">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onFechar}
              className={({ isActive }) =>
                `border-l-[3px] px-5 py-2.5 text-[13.5px] ${
                  isActive
                    ? "border-primary bg-white/5 font-semibold text-white"
                    : "border-transparent text-[#c7d2e3] hover:bg-white/5"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 px-5 pt-4 text-xs text-[#8494ac]">
          Vendedor Autônomo
          <br />
          versão 1.0
        </div>
      </aside>
    </>
  );
}
