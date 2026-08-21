import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { queryClient } from "@/lib/queryClient";

/**
 * Liga o MSW (Mock Service Worker) antes de renderizar o app, quando
 * VITE_USE_MOCKS=true (padrão em .env.development). Ele intercepta as
 * chamadas do Axios no nível do navegador, então o resto do código (Axios,
 * TanStack Query, os componentes) não sabe e não precisa saber se está
 * conversando com o MSW ou com a API de verdade.
 *
 * Precisa ter rodado `npx msw init public --save` uma vez nesta pasta antes
 * (gera `public/mockServiceWorker.js` — ver README.md).
 */
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
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
});
