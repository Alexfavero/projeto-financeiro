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

// fundo escuro fixo em qualquer tema, de propósito (é "chrome" do app, não conteúdo)
// abaixo de md vira menu deslizante controlado por abertoMobile
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
