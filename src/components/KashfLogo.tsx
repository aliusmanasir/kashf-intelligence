/**
 * Kashf brand mark — "Strata"
 *
 * Three horizontal bands of layered information — top peeled back, middle
 * fully revealed, bottom advancing — with a single luminous point of insight
 * emerging on the middle horizon. No letters, no monogram, no candlesticks,
 * no arrows. The mark represents signal cutting through noise: the moment of
 * revelation (kashf, كشف) that gives the product its name.
 *
 * Designed to read at 16px favicon scale and 200px+ hero/app-icon scale.
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
      {/* Top stratum — peeled back, revealing what lies beneath */}
      <line x1="20" y1="30" x2="60" y2="30" stroke={stroke} strokeWidth="6" strokeLinecap="round" opacity="0.45" />
      {/* Middle stratum — fully revealed horizon */}
      <line x1="20" y1="50" x2="80" y2="50" stroke={stroke} strokeWidth="6" strokeLinecap="round" />
      {/* Bottom stratum — advancing from the right */}
      <line x1="40" y1="70" x2="80" y2="70" stroke={stroke} strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      {/* The point of insight — signal emerging on the revealed horizon */}
      <circle cx="80" cy="50" r="6" fill={stroke} />
    </svg>
  );
}

export function KashfLogo({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      <div className="absolute inset-0 rounded-[24%] bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-2xl" />
      <div className="relative flex h-full w-full items-center justify-center rounded-[22%] border border-white/[0.06] bg-gradient-to-br from-[oklch(0.18_0.01_260)] to-[oklch(0.12_0.008_260)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]">
        <KashfMarkSvg size={Math.round(size * 0.58)} stroke="var(--primary)" />
      </div>
    </div>
  );
}

export function KashfWordmark({ className }: { className?: string }) {
  return (
    <span
      className={
        "font-display text-2xl font-semibold tracking-[-0.045em] text-foreground " +
        (className ?? "")
      }
    >
      Kashf
    </span>
  );
}