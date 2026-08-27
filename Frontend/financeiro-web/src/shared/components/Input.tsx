import { forwardRef, useState, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// ícone de "olho" pra mostrar/ocultar senha — SVG inline, sem depender de
// nenhuma lib de ícones (o projeto não tem nenhuma instalada)
function IconeOlho({ aberto }: { aberto: boolean }) {
  if (aberto) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a15.6 15.6 0 0 1-3.1 3.7M6.3 7.5C3.9 9.1 2.5 11.3 2.5 12c0 0 3.1 6 9.5 6 1.2 0 2.3-.2 3.3-.6M9.9 9.9a3 3 0 0 0 4.2 4.2"
      />
    </svg>
  );
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, type, ...props }, ref) => {
    const inputId = id ?? props.name;
    const ehSenha = type === "password";
    // estado local, um por campo — dá pra revelar a senha de login sem
    // mexer no campo de confirmar senha do cadastro, por exemplo
    const [mostrarSenha, setMostrarSenha] = useState(false);

    return (
      <div className="mb-3.5">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-xs font-semibold text-ink-secondary"
          >
            {label.toUpperCase()}
          </label>
        )}
        <div className={ehSenha ? "relative" : undefined}>
          <input
            id={inputId}
            ref={ref}
            type={ehSenha ? (mostrarSenha ? "text" : "password") : type}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30 ${
              error ? "border-critical" : "border-border"
            } ${ehSenha ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {ehSenha && (
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-secondary hover:text-ink"
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              <IconeOlho aberto={mostrarSenha} />
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-critical">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
