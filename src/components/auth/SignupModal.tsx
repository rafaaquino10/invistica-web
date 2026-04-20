"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { AuthModalCard } from "./AuthModalCard";
import { AuthField } from "./AuthField";
import { GoogleButton } from "./GoogleButton";
import { OrDivider } from "./OrDivider";
import { cn } from "@/lib/utils";

interface SignupModalProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
}

export function SignupModal({ onSwitchToLogin, onClose }: SignupModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accepted) return;
    // TODO: integrar com POST /auth/signup + /auth/trial-start do invistica-api
    console.log("signup submit", { name, email, password });
  };

  return (
    <AuthModalCard titleId="signup-title" onClose={onClose}>
      <h2
        id="signup-title"
        className="mb-1 text-[24px] font-bold leading-tight tracking-[-0.5px] text-foreground"
      >
        Criar conta
      </h2>
      <p className="mb-7 text-sm text-muted">
        14 dias grátis. Depois R$ 38,90/mês. Cancele quando quiser.
      </p>

      <div className="mb-5 flex flex-col gap-4">
        <GoogleButton mode="signup" />
        <OrDivider />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          id="signup-name"
          label="Nome completo"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <AuthField
          id="signup-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <AuthField
          id="signup-password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <label className="mt-1 flex cursor-pointer items-start gap-2">
          <button
            type="button"
            role="checkbox"
            aria-checked={accepted}
            onClick={() => setAccepted((prev) => !prev)}
            className={cn(
              "mt-[2px] flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
              accepted
                ? "border-accent bg-accent"
                : "border-[var(--border-strong)] bg-[var(--bg)] hover:border-foreground",
            )}
          >
            {accepted && (
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            )}
          </button>
          <span className="text-[13px] leading-snug text-muted">
            Li e aceito os{" "}
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Termos de uso
            </a>{" "}
            e a{" "}
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Política de privacidade
            </a>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={!accepted}
          className="mt-2 h-12 rounded-lg bg-accent text-[15px] font-semibold text-white transition-all duration-150 hover:-translate-y-[1px] hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-accent"
        >
          Começar 14 dias grátis
        </button>

        <p className="text-center text-[12px] text-faint">
          Sem cartão de crédito. Cancele antes do fim do trial e não pague nada.
        </p>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Já tem conta?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
        >
          Entrar
        </button>
      </p>
    </AuthModalCard>
  );
}
