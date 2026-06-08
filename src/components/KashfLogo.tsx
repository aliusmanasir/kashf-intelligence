/**
 * Kashf brand mark — "The Aperture"
 *
 * An original geometric symbol: a circle (the lens / field of view) bisected by
 * a single horizon line slightly above center, with a small filled disc on that
 * horizon — the moment of revelation, the signal emerging from noise. No letters,
 * no monogram, no charts. Reads at favicon scale and at hero scale.
 */
export function KashfMarkSvg({
  size = 64,
  stroke = "currentColor",
  className,
}: {
  size?: number;
  stroke?: string;
  className?: string;
}) {
  // viewBox 100 — geometry derived from golden ratio
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer aperture ring */}
      <circle cx="50" cy="50" r="42" stroke={stroke} strokeWidth="3" />
      {/* Horizon: revelation line at golden-ratio height (≈ 38 from top) */}
      <line
        x1="14"
        y1="38"
        x2="86"
        y2="38"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="square"
      />
      {/* Point of insight — a single emerging mark */}
      <circle cx="50" cy="38" r="4.5" fill={stroke} />
    </svg>
  );
}

export function KashfLogo({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      <div className="absolute inset-0 rounded-[28%] bg-gradient-to-b from-primary/15 to-transparent blur-2xl" />
      <div className="relative flex h-full w-full items-center justify-center rounded-[24%] border border-border bg-[oklch(0.13_0.01_260)]">
        <KashfMarkSvg size={Math.round(size * 0.6)} stroke="var(--primary)" />
      </div>
    </div>
  );
}

export function KashfWordmark({ className }: { className?: string }) {
  return (
    <span
      className={
        "font-display text-2xl font-semibold tracking-[-0.04em] text-foreground " +
        (className ?? "")
      }
    >
      Kashf
    </span>
  );
}