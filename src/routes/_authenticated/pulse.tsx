import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, KashfMark } from "@/components/BottomTabs";
import { markets, type MarketTick } from "@/lib/kashf-data";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Sparkline, seededSeries } from "@/components/Sparkline";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/pulse")({
  head: () => ({
    meta: [{ title: "Kashf Pulse — Gulf & Global Markets" }],
  }),
  component: KashfPulse,
});

function KashfPulse() {
  const featured = ["TASI", "ADX", "BRENT", "GOLD"]
    .map((s) => markets.find((m) => m.symbol === s)!)
    .filter(Boolean);

  const indices = markets.filter((m) => m.group === "Index");
  const equities = markets.filter((m) => m.group === "Equity");
  const commodities = markets.filter((m) => m.group === "Commodity");
  const crypto = markets.filter((m) => m.group === "Crypto");

  const gainers = markets.filter((m) => m.change > 0).length;
  const losers = markets.length - gainers;

  return (
    <div>
      <AppHeader eyebrow="Live snapshot" title="Kashf Pulse" right={<KashfMark />} />

      <div className="px-5 pt-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-4">
          <Stat label="Gainers" value={gainers} tone="success" />
          <Stat label="Losers" value={losers} tone="destructive" />
          <Stat label="Tracked" value={markets.length} />
        </div>
      </div>

      <section className="mt-6 px-5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Featured
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {featured.map((m, i) => (
            <FeaturedCard key={m.symbol} m={m} delay={i * 0.05} />
          ))}
        </div>
      </section>

      <Group title="Gulf Indices" items={indices} />
      <Group title="Saudi & UAE Equities" items={equities} />
      <Group title="Commodities" items={commodities} />
      <Group title="Crypto" items={crypto} />
      <p className="px-5 py-8 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        Demo data · Indicative pricing
      </p>
    </div>
  );
}

function FeaturedCard({ m, delay }: { m: MarketTick; delay: number }) {
  const up = m.change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-medium text-primary">{m.symbol}</p>
        <span
          className={
            "inline-flex items-center gap-0.5 text-[11px] font-medium " +
            (up ? "text-success" : "text-destructive")
          }
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {up ? "+" : ""}
          {m.changePct.toFixed(2)}%
        </span>
      </div>
      <p className="mt-2 font-display text-xl font-semibold tabular text-foreground">
        {m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.currency}</p>
      <div className="mt-3">
        <Sparkline data={seededSeries(m.symbol, 24, up ? 1 : -1)} positive={up} width={140} height={32} />
      </div>
    </motion.div>
  );
}

function Group({ title, items }: { title: string; items: MarketTick[] }) {
  return (
    <section className="mt-6">
      <h2 className="px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </h2>
      <ul className="mt-2 divide-y divide-border border-y border-border bg-card">
        {items.map((m) => {
          const up = m.change >= 0;
          return (
            <li key={m.symbol} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs font-medium text-primary">{m.symbol}</p>
                <p className="truncate text-sm text-foreground">{m.name}</p>
              </div>
              <div className="mx-3 hidden sm:block">
                <Sparkline data={seededSeries(m.symbol, 18, up ? 1 : -1)} positive={up} width={60} height={22} />
              </div>
              <div className="ml-2 text-right tabular">
                <p className="font-display text-sm font-semibold text-foreground">
                  {m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p
                  className={
                    "mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium " +
                    (up ? "text-success" : "text-destructive")
                  }
                >
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {up ? "+" : ""}
                  {m.changePct.toFixed(2)}%
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" | "destructive" }) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="text-center">
      <p className={"font-display text-xl font-semibold tabular " + toneClass}>{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}