import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/shared/theme/ThemeContext";
import { ToastProvider } from "@/shared/toast/ToastProvider";

// intercepta as chamadas do Axios no nível do navegador, então o resto do
// app nem sabe se tá falando com o MSW ou com a API real.
// precisa ter rodado `npx msw init public --save` uma vez antes (gera
// public/mockServiceWorker.js).
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== "true") return;

  const { worker } = await import("@/mocks/browser");
  return worker.start({
    onUnhandledRequest: "bypass",
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ThemeProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ToastProvider>
      </ThemeProvider>
    </StrictMode>,
  );
});
