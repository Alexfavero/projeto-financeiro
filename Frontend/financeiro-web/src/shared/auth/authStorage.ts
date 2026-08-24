// guarda token de acesso e usuário logado no localStorage.
// não tem rotação de refresh token ainda (interceptor 401 -> chamar
// /auth/refresh-token -> repetir a requisição). Por ora, expirou o token
// ou deu 401, volta pro login. Dá pra evoluir isso depois sem mexer no
// resto do app, já que tudo passa por aqui.

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
