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

// aplica/remove a classe "dark" no <html>, que é o que o Tailwind
// (darkMode: "class") e as variáveis CSS observam — os componentes não
// precisam saber em qual tema estão, só usam as classes de sempre.
// sem nada salvo, usa a preferência do SO; depois disso a escolha manual
// sempre tem prioridade.
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
