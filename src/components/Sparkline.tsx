export function Sparkline({
  data,
  positive,
  width = 80,
  height = 28,
}: {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`)
    .join(" ");

  const stroke = positive ? "var(--success)" : "var(--destructive)";
  const fill = positive ? "var(--success)" : "var(--destructive)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={fill}
        opacity={0.08}
      />
    </svg>
  );
}

// Deterministic pseudo-random sparkline seeded by symbol
export function seededSeries(seed: string, length = 24, trend = 0): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  let v = 50;
  for (let i = 0; i < length; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const r = (h / 0xffffffff) - 0.5;
    v += r * 4 + trend * 0.15;
    out.push(v);
  }
  return out;
}