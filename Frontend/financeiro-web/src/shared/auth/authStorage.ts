/**
 * Guarda o token de acesso e o nome do usuário logado no localStorage.
 *
 * Simplificação consciente desta Parte 2: não implementamos a rotação de
 * refresh token no Axios (interceptor de resposta 401 -> chamar
 * /auth/refresh-token -> repetir a requisição original). Por enquanto, se o
 * access token expirar ou a API responder 401, o usuário simplesmente volta
 * pra tela de login. Dá pra evoluir isso depois sem mudar o resto do app,
 * porque tudo que lê/escreve o token passa por este arquivo.
 */

const ACCESS_TOKEN_KEY = "financeiro:accessToken";
const REFRESH_TOKEN_KEY = "financeiro:refreshToken";
const USERNAME_KEY = "financeiro:username";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function setSession(params: {
  accessToken: string;
  refreshToken?: string | null;
  username: string;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, params.accessToken);
  if (params.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, params.refreshToken);
  }
  localStorage.setItem(USERNAME_KEY, params.username);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
