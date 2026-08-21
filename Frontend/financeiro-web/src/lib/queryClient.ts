import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Nossos dados (previsão, parcelas, listas) não mudam a cada segundo;
      // evita refetch em toda troca de aba do navegador.
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});
