"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import type {
  AuthModalContextValue,
  AuthModalMode,
  AuthModalState,
} from "@/types/auth";

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}

function readInitialAuthError(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const error = params.get("auth_error");
  return error ? decodeURIComponent(error) : null;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [initialError] = useState<string | null>(readInitialAuthError);
  const [authError, setAuthError] = useState<string | null>(initialError);
  const [state, setState] = useState<AuthModalState>(
    initialError ? "login" : "closed",
  );

  const openLogin = useCallback(() => {
    setAuthError(null);
    setState("login");
  }, []);
  const openSignup = useCallback(() => {
    setAuthError(null);
    setState("signup");
  }, []);
  const switchToLogin = useCallback(() => setState("login"), []);
  const switchToSignup = useCallback(() => {
    setAuthError(null);
    setState("signup");
  }, []);
  const close = useCallback(() => {
    setAuthError(null);
    setState("closed");
  }, []);

  useEffect(() => {
    if (!initialError) return;
    const cleaned = new URL(window.location.href);
    cleaned.searchParams.delete("auth_error");
    window.history.replaceState({}, "", cleaned.toString());
  }, [initialError]);

  useEffect(() => {
    if (state === "closed") return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [state, close]);

  const value = useMemo<AuthModalContextValue>(
    () => ({
      state,
      openLogin,
      openSignup,
      switchToLogin,
      switchToSignup,
      close,
    }),
    [state, openLogin, openSignup, switchToLogin, switchToSignup, close],
  );

  const mode: AuthModalMode | null = state === "closed" ? null : state;

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {mode && (
          <motion.div
            key="auth-backdrop"
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <button
              type="button"
              aria-label="Fechar modal"
              onClick={close}
              className="absolute inset-0 cursor-default bg-[rgb(10_10_10_/_0.45)] backdrop-blur-md"
            />
            <AnimatePresence mode="wait" initial={false}>
              {mode === "login" ? (
                <LoginModal
                  key="login"
                  onSwitchToSignup={switchToSignup}
                  onClose={close}
                  error={authError}
                />
              ) : (
                <SignupModal
                  key="signup"
                  onSwitchToLogin={switchToLogin}
                  onClose={close}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthModalContext.Provider>
  );
}
