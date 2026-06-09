/**
 * Kashf brand mark — "Horizon"
 *
 * A medallion: thin institutional ring, a precise horizon line bisecting it,
 * and a half-disc rising from that horizon. The mark reads as dawn — the
 * literal meaning of kashf (كشف): unveiling, revelation, what was hidden
 * becoming seen. Coin-like and quiet enough to age into a logo people trust.
 *
 * Reads cleanly from 16px favicon to 200px+ hero scale.
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
      {/* Outer ring — the institutional medallion */}
      <circle cx="50" cy="50" r="44" stroke={stroke} strokeWidth="3" />
      {/* Horizon line — the line of revelation */}
      <line x1="14" y1="56" x2="86" y2="56" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      {/* Rising half-disc — what emerges */}
      <path d="M28 56 A22 22 0 0 1 72 56 Z" fill={stroke} />
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