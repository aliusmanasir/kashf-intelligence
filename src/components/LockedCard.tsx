import { Lock, Sparkle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function LockedCard({
  eyebrow,
  title,
  teaser,
}: {
  eyebrow: string;
  title: string;
  teaser: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: "/pro" })}
      className="group relative block w-full overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-transparent to-primary/[0.04] p-5 text-left transition-colors hover:border-primary/50"
    >
      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          {eyebrow}
        </span>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9px] tracking-[0.2em]">
          Kashf Pro
        </span>
      </div>
      <h3 className="mt-2.5 font-display text-[17px] font-semibold leading-[1.25] tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-[1.55] text-muted-foreground">{teaser}</p>
      <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary">
        <Sparkle className="h-3.5 w-3.5" />
        Unlock with Kashf Pro
      </div>
    </button>
  );
}