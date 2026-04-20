import { Wordmark } from "@/components/brand";

type FooterColumn = {
  title: string;
  links: string[];
};

const columns: FooterColumn[] = [
  {
    title: "Plataforma",
    links: ["Invscore", "Ranking", "Performance", "Método"],
  },
  {
    title: "Institucional",
    links: ["Sobre", "Metodologia", "Preços", "Contato"],
  },
  {
    title: "Legal",
    links: ["Termos de uso", "Política de privacidade", "Aviso legal CVM"],
  },
];

export function Footer() {
  return (
    <footer className="bg-elevated border-t border-[var(--border)] px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Wordmark size="md" />
          <p className="text-sm text-muted">
            Research quantamental aplicado a ações da B3.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-dim">
              {column.title}
            </h3>
            <ul>
              {column.links.map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="block py-1 text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-2 border-t border-[var(--border)] pt-8 text-xs text-faint md:flex-row">
        <span>© 2026 Invística. CNPJ a ser registrado.</span>
        <span>Made in Brasil.</span>
      </div>
    </footer>
  );
}
