/**
 * Kashf brand mark — "Aperture K"
 *
 * A custom geometric symbol, not a letter. A single vertical column anchors
 * the left — the column of record, the institution. From its mid-point, a
 * precise wedge of light opens to the right in two layered planes: the
 * outer plane wide and faint, the inner plane narrower and solid. The two
 * planes converge on the column at a single point of contact.
 *
 * Read literally, the column + wedge silhouette is a stylised K — but never
 * obvious. Read symbolically, it is an aperture opening, a signal emerging
 * from a fixed reference, information becoming clear. The two stacked planes
 * echo kashf (كشف) — layers being lifted, the hidden becoming seen.
 *
 * Built on a 100-unit grid with a 4-unit stroke system. Reads cleanly from
 * a 16px favicon to a 200px+ hero scale; the wedge collapses gracefully and
 * the column always remains identifiable.
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
      {/* Outer wedge — the wide aperture, faint. Converges on the column pivot (32,50). */}
      <path d="M32 50 L86 16 L86 84 Z" fill={stroke} fillOpacity="0.22" />
      {/* Inner wedge — the focused beam of insight. Same pivot, narrower angle. */}
      <path d="M32 50 L78 30 L78 70 Z" fill={stroke} />
      {/* Column of record — the institutional spine. Subtle round caps. */}
      <rect x="26" y="14" width="8" height="72" rx="1.5" fill={stroke} />
      {/* Pivot accent — the single point where signal meets record. */}
      <circle cx="30" cy="50" r="3" fill="var(--background)" />
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