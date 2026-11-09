import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURACAO_MS = 4000;

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-good text-white",
  error: "bg-critical text-white",
};

// provider único, montado uma vez no main.tsx — qualquer tela chama useToast()
// pra avisar o usuário sobre sucesso/erro de uma ação sem precisar de UI própria
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const proximoId = useRef(1);

  const remover = useCallback((id: number) => {
    setToasts((atuais) => atuais.filter((t) => t.id !== id));
  }, []);

  const adicionar = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = proximoId.current++;
      setToasts((atuais) => [...atuais, { id, variant, message }]);
      setTimeout(() => remover(id), DURACAO_MS);
    },
    [remover],
  );

  const value: ToastContextValue = {
    success: (message) => adicionar("success", message),
    error: (message) => adicionar("error", message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto w-full max-w-sm rounded-lg px-4 py-3 text-sm font-semibold shadow-lg ${VARIANT_CLASSES[toast.variant]}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast precisa ser usado dentro de um ToastProvider");
  }
  return context;
}
