"use client";

import { ChevronDown } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { cn } from "@/lib/utils";

const navLinks: { label: string; hasChevron: boolean }[] = [
  { label: "Plataforma", hasChevron: true },
  { label: "Invscore", hasChevron: true },
  { label: "Método", hasChevron: false },
  { label: "Performance", hasChevron: false },
];

const btnBase =
  "text-sm font-medium px-4 py-2 rounded-md transition-all";

const btnLink = cn(btnBase, "text-foreground hover:bg-subtle");
const btnOutline = cn(
  btnBase,
  "text-foreground border border-[var(--border-strong)] hover:border-[var(--text)]",
);
const btnPrimary = cn(
  btnBase,
  "text-white bg-accent hover:bg-accent-hover hover:-translate-y-[1px]",
);

export function Header() {
  const noop = () => {
    // TODO: integração de auth/rota em sessão futura
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b border-[var(--border)] bg-[rgb(255_255_255_/_0.92)] backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8 md:py-5 lg:px-12">
        <div className="flex items-center gap-12">
          <Wordmark size="md" />
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-8"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  noop();
                }}
                className="flex items-center gap-1 text-sm text-foreground transition-colors hover:text-accent"
              >
                {link.label}
                {link.hasChevron && (
                  <ChevronDown className="h-3 w-3 text-dim" aria-hidden="true" />
                )}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={noop}
            className={cn("hidden md:inline-flex", btnLink)}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={noop}
            className={cn("hidden md:inline-flex", btnOutline)}
          >
            Criar conta
          </button>
          <button type="button" onClick={noop} className={btnPrimary}>
            Acessar plataforma
          </button>
        </div>
      </div>
    </header>
  );
}
