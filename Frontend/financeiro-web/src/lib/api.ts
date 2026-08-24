import axios from "axios";
import { clearSession, getAccessToken } from "@/shared/auth/authStorage";

// em modo mock (VITE_USE_MOCKS=true) o MSW intercepta antes de chegar na
// rede de verdade, usando esse mesmo baseURL como prefixo dos handlers
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 = token ausente/expirado/inválido. Por ora só limpa a sessão e manda
// pro login em vez de tentar renovar (ver authStorage.ts).
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

// cobre os 3 formatos de erro que a API devolve: Response{status,message},
// ErrorDetails{statusCode,message,trace} do middleware, e
// ValidationProblemDetails{errors:{Campo:["msg"]}} do 400 automático
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
