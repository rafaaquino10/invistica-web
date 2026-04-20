"use client";

import { useState } from "react";
import { GoogleIcon } from "./GoogleIcon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AuthModalMode } from "@/types/auth";

interface GoogleButtonProps {
  mode: AuthModalMode;
}

export function GoogleButton({ mode }: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
      // Em caso de sucesso, o browser é redirecionado para o Google — o estado loading persiste até o retorno.
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar o login com Google.";
      setError(message);
      setLoading(false);
    }
  };

  const label =
    mode === "login" ? "Entrar com Google" : "Continuar com Google";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-[15px] font-medium text-foreground transition-colors hover:border-[var(--text)] hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        <span>{loading ? "Conectando..." : label}</span>
      </button>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-[var(--accent-soft-bg)] bg-[var(--accent-soft-bg)] px-3 py-2 text-[12px] leading-snug text-[var(--accent-soft-text)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
