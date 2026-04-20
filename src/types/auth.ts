export type AuthModalMode = "login" | "signup";

export type AuthModalState = AuthModalMode | "closed";

export interface AuthModalContextValue {
  state: AuthModalState;
  openLogin: () => void;
  openSignup: () => void;
  switchToLogin: () => void;
  switchToSignup: () => void;
  close: () => void;
}
