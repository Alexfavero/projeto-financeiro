import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { extractApiErrorMessage } from "@/lib/api";
import { setSession } from "@/shared/auth/authStorage";
import { login, register } from "./api";

/**
 * Parte 2: login e criação de conta de verdade, batendo em
 * `POST /api/auth/login` e `POST /api/auth/register` (via MSW no modo mock
 * — ver src/mocks/handlers.ts — ou a API real quando VITE_USE_MOCKS=false).
 *
 * Usuário de demonstração já cadastrado no mock: usuário "demo", senha
 * "demo1234" — não precisa criar conta pra testar o login.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"entrar" | "criar">("entrar");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (token) => {
      setSession({
        accessToken: token.accessToken!,
        refreshToken: token.refreshToken,
        username,
      });
      navigate("/", { replace: true });
    },
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      setRegisterSuccess(true);
      setTab("entrar");
      setUsername(regUsername);
      setPassword("");
    },
  });

  function handleLoginSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    loginMutation.mutate({ username, password });
  }

  function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    if (!regUsername || !regEmail || !regPassword || !regConfirmPassword) return;
    registerMutation.mutate({
      username: regUsername,
      email: regEmail,
      password: regPassword,
      confirmPassword: regConfirmPassword,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#12233d] via-[#1c3a63] to-primary">
      <div className="w-[400px] rounded-2xl bg-white p-9 shadow-2xl">
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary font-bold text-white">
            $
          </div>
          <span className="font-bold">Controle Financeiro</span>
        </div>

        <div className="mb-5 flex rounded-lg bg-surface-alt p-1">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-semibold ${
              tab === "entrar" ? "bg-white shadow-sm" : "text-ink-secondary"
            }`}
            onClick={() => setTab("entrar")}
            type="button"
          >
            Entrar
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-semibold ${
              tab === "criar" ? "bg-white shadow-sm" : "text-ink-secondary"
            }`}
            onClick={() => setTab("criar")}
            type="button"
          >
            Criar conta
          </button>
        </div>

        {tab === "entrar" ? (
          <>
            <h2 className="mb-1 text-xl font-bold">Bem-vindo de volta</h2>
            <p className="mb-5 text-sm text-ink-secondary">
              Acesse para gerenciar suas contas, clientes e fornecedores.
            </p>

            {registerSuccess && (
              <p className="mb-3.5 rounded-lg bg-good/10 px-3 py-2 text-xs font-semibold text-good">
                Conta criada! Já pode entrar com o usuário e senha cadastrados.
              </p>
            )}
            {loginMutation.isError && (
              <p className="mb-3.5 rounded-lg bg-critical/10 px-3 py-2 text-xs font-semibold text-critical">
                {extractApiErrorMessage(loginMutation.error, "Não foi possível entrar.")}
              </p>
            )}

            <form onSubmit={handleLoginSubmit}>
              <Input
                label="usuário"
                placeholder="seu.usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                label="senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="mt-1.5 w-full justify-center" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Entrando…" : "Entrar"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-ink-muted">
              Usuário de teste: <b>demo</b> / senha <b>demo1234</b>
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-xl font-bold">Criar uma conta</h2>
            <p className="mb-5 text-sm text-ink-secondary">Leva menos de um minuto.</p>

            {registerMutation.isError && (
              <p className="mb-3.5 rounded-lg bg-critical/10 px-3 py-2 text-xs font-semibold text-critical">
                {extractApiErrorMessage(registerMutation.error, "Não foi possível criar a conta.")}
              </p>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <Input
                label="usuário"
                placeholder="seu.usuario"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
              />
              <Input
                label="e-mail"
                type="email"
                placeholder="voce@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
              <Input
                label="senha"
                type="password"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
              <Input
                label="confirmar senha"
                type="password"
                placeholder="••••••••"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />
              <Button type="submit" className="mt-1.5 w-full justify-center" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Criando…" : "Criar conta"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
