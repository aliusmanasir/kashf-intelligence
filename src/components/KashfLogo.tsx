export function KashfLogo({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/40 via-primary/10 to-transparent blur-2xl" />
      <div
        className="relative flex h-full w-full items-center justify-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/20 to-card shadow-[0_0_40px_-12px] shadow-primary/40"
      >
        <span
          className="font-display font-bold text-primary"
          style={{ fontSize: size * 0.5, letterSpacing: "-0.04em" }}
        >
          K
        </span>
      </div>
    </div>
  );
}

export function KashfWordmark({ className }: { className?: string }) {
  return (
    <div className={"inline-flex items-baseline gap-1 " + (className ?? "")}>
      <span className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
        Kashf
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
    </div>
  );
}