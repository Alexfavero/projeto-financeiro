import axios from "axios";
import { clearSession, getAccessToken } from "@/shared/auth/authStorage";

/**
 * Instância única do Axios usada por todas as chamadas de API.
 *
 * Em modo mock (VITE_USE_MOCKS=true), o MSW intercepta as requisições antes
 * delas chegarem à rede de verdade — então o `baseURL` abaixo é usado tanto
 * pra bater no MSW (que registra os handlers com esse mesmo prefixo) quanto,
 * mais pra frente, pra bater na API real.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Anexa o Bearer token em toda requisição, quando existir.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 = token ausente/expirado/inválido. Por ora (ver authStorage.ts),
// simplesmente limpa a sessão e manda pro login em vez de tentar renovar.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      clearSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/**
 * Extrai uma mensagem de erro amigável de uma resposta de erro do Axios,
 * cobrindo os três formatos que a API pode devolver:
 * - `Response { status, message }` (ex.: AuthController.Register)
 * - `ErrorDetails { statusCode, message, trace }` (middleware de exceção)
 * - `ValidationProblemDetails` do [ApiController] (400 automático de
 *   validação de model, formato `{ errors: { Campo: ["mensagem"] } }`)
 */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) return data;

    if (data && typeof data === "object") {
      if ("message" in data && typeof data.message === "string") return data.message;

      if ("errors" in data && data.errors && typeof data.errors === "object") {
        const primeiraLista = Object.values(data.errors as Record<string, unknown>)[0];
        if (Array.isArray(primeiraLista) && typeof primeiraLista[0] === "string") {
          return primeiraLista[0];
        }
      }
    }

    if (error.response?.status === 401) return "Usuário ou senha inválidos.";
    if (error.code === "ERR_NETWORK") {
      return "Não foi possível conectar à API. Verifique se ela está rodando.";
    }
  }

  return fallback;
}
