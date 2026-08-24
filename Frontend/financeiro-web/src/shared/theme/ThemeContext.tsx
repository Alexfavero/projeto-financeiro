import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Tema = "light" | "dark";

const CHAVE_STORAGE = "financeiro-tema";

interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function temaSalvo(): Tema | null {
  const salvo = localStorage.getItem(CHAVE_STORAGE);
  return salvo === "light" || salvo === "dark" ? salvo : null;
}

function temaPreferidoDoSistema(): Tema {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Tema claro/escuro com toggle manual (botão na Topbar), que fica salvo no
 * localStorage e persiste entre sessões. Na primeira visita, sem nada salvo
 * ainda, usa a preferência do sistema operacional como ponto de partida —
 * depois disso, a escolha do usuário sempre tem prioridade.
 *
 * Funciona aplicando/removendo a classe `dark` no `<html>`, que é o gatilho
 * que o Tailwind (`darkMode: "class"`, em tailwind.config.js) e as variáveis
 * CSS (em index.css) observam. Nenhum componente precisa saber em qual tema
 * está — eles só usam as mesmas classes de sempre (bg-surface, text-ink…).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => temaSalvo() ?? temaPreferidoDoSistema());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "dark");
    localStorage.setItem(CHAVE_STORAGE, tema);
  }, [tema]);

  function alternarTema() {
    setTema((atual) => (atual === "light" ? "dark" : "light"));
  }

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa ser usado dentro de um ThemeProvider");
  return ctx;
}
