import { useNavigate } from "react-router-dom";
import { clearSession, getUsername } from "@/shared/auth/authStorage";
import { useTheme } from "@/shared/theme/ThemeContext";
import { IconeLua, IconeSol } from "@/shared/components/icons";

export function Topbar({ title, onAbrirMenu }: { title: string; onAbrirMenu: () => void }) {
  const navigate = useNavigate();
  const { tema, alternarTema } = useTheme();
  const userName = getUsername() ?? "Usuário";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          aria-label="Abrir menu"
          className="shrink-0 text-xl text-ink-secondary md:hidden"
        >
          ☰
        </button>
        <h1 className="truncate text-[15px] font-bold sm:text-[17px]">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-sm text-ink-secondary sm:gap-3">
        <button
          type="button"
          onClick={alternarTema}
          aria-label={tema === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
          title={tema === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-alt"
        >
          {tema === "light" ? <IconeLua /> : <IconeSol />}
        </button>
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </div>
        <span className="hidden sm:inline">{userName}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="ml-1 shrink-0 text-xs font-semibold text-ink-muted hover:text-critical"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
