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

export function Sidebar() {
  return (
    <aside className="flex w-[232px] shrink-0 flex-col bg-[#12233d] py-5 text-white">
      <div className="flex items-center gap-2.5 px-5 pb-6 font-bold">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm">
          $
        </div>
        Controle Financeiro
      </div>
      <nav className="flex flex-col gap-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
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
  );
}
