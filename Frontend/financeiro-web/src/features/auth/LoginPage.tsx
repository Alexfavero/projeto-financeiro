import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";

/**
 * Parte 1: login "fake" só pra validar o fluxo de navegação — qualquer
 * e-mail/senha preenchidos leva pro Painel. A partir da Parte 2, isso vai
 * chamar de fato `POST /api/auth/login` (via MSW no modo mock, ou a API
 * real depois), guardar o token e proteger as rotas internas.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<"entrar" | "criar">("entrar");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    navigate("/");
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

        <h2 className="mb-1 text-xl font-bold">
          {tab === "entrar" ? "Bem-vindo de volta" : "Criar uma conta"}
        </h2>
        <p className="mb-5 text-sm text-ink-secondary">
          {tab === "entrar"
            ? "Acesse para gerenciar suas contas, clientes e fornecedores."
            : "Leva menos de um minuto."}
        </p>

        <form onSubmit={handleSubmit}>
          <Input
            label="e-mail"
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="mt-1.5 w-full justify-center">
            {tab === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-muted">
          Esqueceu sua senha?{" "}
          <span className="font-semibold text-primary">Recuperar acesso</span>
        </p>
      </div>
    </div>
  );
}
