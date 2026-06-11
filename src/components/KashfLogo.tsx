/**
 * Kashf brand mark — "Revelation"
 *
 * A timeless geometric symbol of the hidden becoming visible. A precise
 * crescent of light — the eclipse moment, the lens, the iris of an eye —
 * sits beside a single vertical line of record. The crescent's curve and
 * the pillar together hint at a stylised K, but never insist on it; read
 * first as a mark of insight, second as a letter.
 *
 * Built on a 100-unit grid. Crescent rendered as a true geometric
 * subtraction (two arcs, even-odd fill) so the silhouette is mathematically
 * exact at every scale. Reads cleanly from 16px favicon to 200px+ hero;
 * the pillar always anchors the composition.
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
      {/* Pillar of record — the institutional spine. */}
      <rect x="18" y="14" width="6" height="72" rx="1.5" fill={stroke} />
      {/* Crescent of revelation — outer disc minus inner disc, even-odd. */}
      <path
        d="M62 18 a32 32 0 1 1 0 64 a32 32 0 1 1 0 -64 Z
           M68 24 a26 26 0 1 0 0 52 a26 26 0 1 0 0 -52 Z"
        fill={stroke}
        fillRule="evenodd"
      />
      {/* Point of focus — the moment of clarity. */}
      <circle cx="86" cy="50" r="2.5" fill={stroke} />
    </svg>
  );
}

export function KashfLogo({ size = 64 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      <div className="absolute inset-0 rounded-[24%] bg-gradient-to-br from-primary/15 via-transparent to-transparent blur-2xl" />
      <div className="relative flex h-full w-full items-center justify-center rounded-[22%] border border-white/[0.06] bg-gradient-to-br from-[oklch(0.16_0.008_260)] to-[oklch(0.10_0.006_260)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)]">
        <KashfMarkSvg size={Math.round(size * 0.6)} stroke="var(--primary)" />
      </div>
    </div>
  );
}

export function KashfWordmark({ className }: { className?: string }) {
  return (
    <span
      className={
        "font-display text-2xl font-medium tracking-[-0.05em] text-foreground " +
        (className ?? "")
      }
    >
      Kashf
    </span>
  );
}