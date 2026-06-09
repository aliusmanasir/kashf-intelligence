import { markets, type MarketTick } from "@/lib/kashf-data";

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y";

export const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"];

const POINTS: Record<Timeframe, number> = {
  "1D": 78,
  "1W": 56,
  "1M": 60,
  "3M": 90,
  "6M": 120,
  "1Y": 180,
  "5Y": 240,
};

const VOL: Record<Timeframe, number> = {
  "1D": 0.003,
  "1W": 0.006,
  "1M": 0.012,
  "3M": 0.022,
  "6M": 0.035,
  "1Y": 0.06,
  "5Y": 0.18,
};

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type PricePoint = { t: number; p: number; label: string };

export function getMarket(symbol: string): MarketTick | undefined {
  return markets.find((m) => m.symbol.toLowerCase() === symbol.toLowerCase());
}

function formatLabel(date: Date, tf: Timeframe): string {
  if (tf === "1D")
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (tf === "1W" || tf === "1M")
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (tf === "5Y")
    return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function priceSeries(symbol: string, tf: Timeframe, endPrice: number): PricePoint[] {
  const n = POINTS[tf];
  const vol = VOL[tf];
  const rng = mulberry32(hash(symbol + tf));
  // Build a relative walk, then scale so the final point equals endPrice
  const rel: number[] = [1];
  let drift = (rng() - 0.5) * 0.001;
  for (let i = 1; i < n; i++) {
    drift += (rng() - 0.5) * 0.0008;
    const step = (rng() - 0.5) * vol * 0.4 + drift * 0.5;
    rel.push(Math.max(0.2, rel[i - 1] * (1 + step)));
  }
  // Anchor: scale so last point matches endPrice
  const scale = endPrice / rel[n - 1];
  const now = Date.now();
  const spanMs =
    tf === "1D"
      ? 7 * 60 * 60 * 1000
      : tf === "1W"
        ? 7 * 24 * 60 * 60 * 1000
        : tf === "1M"
          ? 30 * 24 * 60 * 60 * 1000
          : tf === "3M"
            ? 90 * 24 * 60 * 60 * 1000
            : tf === "6M"
              ? 182 * 24 * 60 * 60 * 1000
              : tf === "1Y"
                ? 365 * 24 * 60 * 60 * 1000
                : 5 * 365 * 24 * 60 * 60 * 1000;
  const start = now - spanMs;
  return rel.map((r, i) => {
    const t = start + (i * spanMs) / (n - 1);
    const d = new Date(t);
    return { t, p: r * scale, label: formatLabel(d, tf) };
  });
}

export function changeForTimeframe(symbol: string, tf: Timeframe, endPrice: number) {
  const s = priceSeries(symbol, tf, endPrice);
  const first = s[0].p;
  const last = s[s.length - 1].p;
  const abs = last - first;
  const pct = (abs / first) * 100;
  return { abs, pct };
}