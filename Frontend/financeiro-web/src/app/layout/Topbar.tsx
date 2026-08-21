import { useNavigate } from "react-router-dom";
import { clearSession, getUsername } from "@/shared/auth/authStorage";

export function Topbar({ title }: { title: string }) {
  const navigate = useNavigate();
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
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-white px-7">
      <h1 className="text-[17px] font-bold">{title}</h1>
      <div className="flex items-center gap-3 text-sm text-ink-secondary">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </div>
        {userName}
        <button
          type="button"
          onClick={handleLogout}
          className="ml-1 text-xs font-semibold text-ink-muted hover:text-critical"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
