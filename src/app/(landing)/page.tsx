import { Wordmark } from "@/components/brand";

export default function Home() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-24 md:px-10">
      <p className="text-xs uppercase tracking-wider text-dim">
        Sessão 2 · teste visual do Wordmark (placeholder — substituído pelo hero na sessão 3)
      </p>
      <div className="flex flex-col gap-8">
        <Wordmark size="sm" />
        <Wordmark size="md" />
        <Wordmark size="lg" />
        <Wordmark size="xl" />
      </div>
    </section>
  );
}
