"use client";

import { useState, type FormEvent } from "react";
import { AuthModalCard } from "./AuthModalCard";
import { AuthField } from "./AuthField";
import { GoogleButton } from "./GoogleButton";
import { OrDivider } from "./OrDivider";

interface LoginModalProps {
  onSwitchToSignup: () => void;
  onClose: () => void;
  error?: string | null;
}

export function LoginModal({
  onSwitchToSignup,
  onClose,
  error,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: integrar com POST /auth/login do invistica-api
    console.log("login submit", { email, password });
  };

  return (
    <AuthModalCard titleId="login-title" onClose={onClose}>
      <h2
        id="login-title"
        className="mb-7 text-[24px] font-bold leading-tight tracking-[-0.5px] text-foreground"
      >
        Acessar plataforma
      </h2>

      {error && (
        <p
          role="alert"
          className="mb-5 rounded-md border border-[var(--accent-soft-bg)] bg-[var(--accent-soft-bg)] px-3 py-2 text-[13px] leading-snug text-[var(--accent-soft-text)]"
        >
          {error}
        </p>
      )}

      <div className="mb-5 flex flex-col gap-4">
        <GoogleButton mode="login" />
        <OrDivider />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <div className="flex flex-col gap-[6px]">
          <AuthField
            id="login-password"
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="self-end text-[13px] text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Esqueci minha senha
          </a>
        </div>

        <button
          type="submit"
          className="mt-2 h-12 rounded-lg bg-accent text-[15px] font-semibold text-white transition-all duration-150 hover:-translate-y-[1px] hover:bg-accent-hover"
        >
          Entrar
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Ainda não tem conta?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
        >
          Criar conta
        </button>
      </p>
    </AuthModalCard>
  );
}
