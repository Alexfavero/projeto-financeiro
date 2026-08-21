export function Topbar({ title }: { title: string }) {
  // Parte 1: nome de usuário fixo. A partir da Parte 2 (auth real com
  // React Query), isso vem do contexto de autenticação.
  const userName = "Maria Aparecida";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-white px-7">
      <h1 className="text-[17px] font-bold">{title}</h1>
      <div className="flex items-center gap-2.5 text-sm text-ink-secondary">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </div>
        {userName}
      </div>
    </header>
  );
}
