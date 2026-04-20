export function OrDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--border)]" />
      <span className="text-[12px] uppercase tracking-[0.12em] text-faint">
        ou
      </span>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}
