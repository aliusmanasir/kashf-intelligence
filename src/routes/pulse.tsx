import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/BottomTabs";
import { markets, type MarketTick } from "@/lib/kashf-data";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/pulse")({
  head: () => ({
    meta: [
      { title: "Kashf Pulse — Gulf & Global Markets" },
      { name: "description", content: "Live-style market dashboard for Gulf indices, equities, commodities, and crypto." },
      { property: "og:title", content: "Kashf Pulse" },
      { property: "og:description", content: "Markets at a glance — TASI, ADX, oil, gold, and more." },
    ],
  }),
  component: KashfPulse,
});

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
              <div className="min-w-0">
                <p className="font-mono text-xs font-medium text-primary">{m.symbol}</p>
                <p className="truncate text-sm text-foreground">{m.name}</p>
              </div>
              <div className="ml-4 text-right tabular">
                <p className="font-display text-base font-semibold text-foreground">
                  {m.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">{m.currency}</span>
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

function KashfPulse() {
  const indices = markets.filter((m) => m.group === "Index");
  const equities = markets.filter((m) => m.group === "Equity");
  const commodities = markets.filter((m) => m.group === "Commodity");
  const crypto = markets.filter((m) => m.group === "Crypto");

  const gainers = markets.filter((m) => m.change > 0).length;
  const losers = markets.length - gainers;

  return (
    <div>
      <AppHeader eyebrow="Live snapshot" title="Kashf Pulse" />
      <div className="px-5 pt-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-4">
          <Stat label="Gainers" value={gainers} tone="success" />
          <Stat label="Losers" value={losers} tone="destructive" />
          <Stat label="Tracked" value={markets.length} />
        </div>
      </div>
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