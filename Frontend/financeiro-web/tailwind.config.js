/** @type {import('tailwindcss').Config} */
export default {
  // "class" (não "media"): a troca de tema é um botão que o usuário controla
  // (ver ThemeContext.tsx), não só a preferência do sistema — o Tailwind
  // aplica os estilos `dark:` quando a classe `dark` está no <html>.
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cada cor aponta pra uma variável CSS (ver index.css), no formato
        // "R G B" (sem "rgb()"), o que o Tailwind exige pra suportar opacidade
        // com a notação `/valor` (ex.: bg-critical/10) mesmo com o valor por
        // trás mudando conforme o tema. Trocar de tema = trocar só o valor
        // dessas variáveis (classe `.dark` no <html>) — nenhuma classe
        // Tailwind usada no resto do código muda.
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          alt: "rgb(var(--color-surface-alt) / <alpha-value>)",
        },
        border: "rgb(var(--color-border) / <alpha-value>)",
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          secondary: "rgb(var(--color-ink-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
        },
        good: "rgb(var(--color-good) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        critical: "rgb(var(--color-critical) / <alpha-value>)",
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
