import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Expand, Send, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMarket } from "@/lib/market-history";
import { priceSeries, changeForTimeframe, TIMEFRAMES, type Timeframe } from "@/lib/market-history";
import { getMarketAnalystBrief, askMarketAnalyst } from "@/lib/market-analyst.functions";

export const Route = createFileRoute("/_authenticated/pulse/$symbol")({
  loader: ({ params }) => {
    const m = getMarket(params.symbol);
    if (!m) throw notFound();
    return { market: m };
  },
  notFoundComponent: () => (
    <div className="px-5 py-20 text-center">
      <p className="text-sm text-muted-foreground">Asset not found.</p>
      <Link to="/pulse" className="mt-4 inline-block text-sm text-primary underline">
        Back to Pulse
      </Link>
    </div>
  ),
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="px-5 py-20 text-center">
        <p className="text-sm text-muted-foreground">This asset failed to load.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    );
  },
  component: AssetDetail,
});

function AssetDetail() {
  const { market } = Route.useLoaderData();
  const [tf, setTf] = useState<Timeframe>("1D");
  const [fullscreen, setFullscreen] = useState(false);
  const series = useMemo(() => priceSeries(market.symbol, tf, market.price), [market.symbol, tf, market.price]);
  const change = useMemo(() => changeForTimeframe(market.symbol, tf, market.price), [market.symbol, tf, market.price]);
  const up = change.pct >= 0;

  // Multi-timeframe change snapshot
  const snap = useMemo(() => {
    return (["1D", "1W", "1M", "1Y"] as Timeframe[]).map((t) => ({
      tf: t,
      ...changeForTimeframe(market.symbol, t, market.price),
    }));
  }, [market.symbol, market.price]);

  return (
    <div className="pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <Link
            to="/pulse"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Pulse
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {market.group}
          </p>
        </div>
      </header>

      {/* Price block */}
      <section className="px-5 pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">{market.symbol}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">{market.name}</h1>
        <div className="mt-4 flex items-baseline gap-3">
          <p className="font-display text-4xl font-semibold tabular text-foreground">
            {market.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{market.currency}</p>
        </div>
        <p
          className={
            "mt-1 inline-flex items-center gap-1 text-sm font-medium " +
            (up ? "text-success" : "text-destructive")
          }
        >
          {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {up ? "+" : ""}
          {change.abs.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({up ? "+" : ""}
          {change.pct.toFixed(2)}%) · {tf}
        </p>
      </section>

      {/* Chart */}
      <section className="mt-5 px-5">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Price · {tf}</p>
            <button
              onClick={() => setFullscreen(true)}
              aria-label="Expand chart"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Expand className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2">
            <KashfChart series={series} up={up} height={220} />
          </div>
          <TimeframeBar tf={tf} onChange={setTf} />
        </div>

        {/* Performance snapshot */}
        <div className="mt-3 grid grid-cols-4 gap-2 rounded-2xl border border-border bg-card p-3">
          {snap.map((s) => {
            const u = s.pct >= 0;
            return (
              <div key={s.tf} className="text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.tf}</p>
                <p className={"mt-1 font-display text-sm font-semibold tabular " + (u ? "text-success" : "text-destructive")}>
                  {u ? "+" : ""}
                  {s.pct.toFixed(2)}%
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <AnalystSection market={market} />
      <AskAISection market={market} />

      {fullscreen && (
        <FullscreenChart
          symbol={market.symbol}
          name={market.name}
          endPrice={market.price}
          initialTf={tf}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}

function TimeframeBar({ tf, onChange }: { tf: Timeframe; onChange: (t: Timeframe) => void }) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-lg bg-background/60 p-1">
      {TIMEFRAMES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors " +
            (t === tf
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function KashfChart({
  series,
  up,
  height,
}: {
  series: { t: number; p: number; label: string }[];
  up: boolean;
  height: number;
}) {
  const color = up ? "var(--success)" : "var(--destructive)";
  const prices = series.map((d) => d.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min) * 0.08 || max * 0.01;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="kashf-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} opacity={0.4} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          />
          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "2 4" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            formatter={(v: number) => [v.toLocaleString(undefined, { maximumFractionDigits: 2 }), "Price"]}
          />
          <ReferenceLine y={series[0]?.p} stroke="var(--muted-foreground)" strokeDasharray="3 3" opacity={0.4} />
          <Area
            type="monotone"
            dataKey="p"
            stroke={color}
            strokeWidth={2}
            fill="url(#kashf-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FullscreenChart({
  symbol,
  name,
  endPrice,
  initialTf,
  onClose,
}: {
  symbol: string;
  name: string;
  endPrice: number;
  initialTf: Timeframe;
  onClose: () => void;
}) {
  const [tf, setTf] = useState<Timeframe>(initialTf);
  const series = useMemo(() => priceSeries(symbol, tf, endPrice), [symbol, tf, endPrice]);
  const ch = useMemo(() => changeForTimeframe(symbol, tf, endPrice), [symbol, tf, endPrice]);
  const up = ch.pct >= 0;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{symbol}</p>
          <p className="text-sm font-medium text-foreground">{name}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close fullscreen chart"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-baseline justify-between px-5 pt-3">
        <p className="font-display text-2xl font-semibold tabular text-foreground">
          {endPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className={"text-sm font-medium " + (up ? "text-success" : "text-destructive")}>
          {up ? "+" : ""}
          {ch.pct.toFixed(2)}% · {tf}
        </p>
      </div>
      <div className="flex-1 px-3 py-3">
        <KashfChart series={series} up={up} height={typeof window !== "undefined" ? window.innerHeight - 220 : 480} />
      </div>
      <div className="px-5 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <TimeframeBar tf={tf} onChange={setTf} />
      </div>
    </div>
  );
}

function AnalystSection({ market }: { market: ReturnType<typeof getMarket> & object }) {
  const fn = useServerFn(getMarketAnalystBrief);
  const q = useQuery({
    queryKey: ["analyst", market.symbol, market.price, market.changePct],
    queryFn: () =>
      fn({
        data: {
          symbol: market.symbol,
          name: market.name,
          price: market.price,
          changePct: market.changePct,
          currency: market.currency,
          group: market.group,
        },
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <section className="mt-6 px-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-display text-base font-semibold text-foreground">Kashf Market Analyst</h2>
      </div>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        AI-generated · institutional tone
      </p>

      <div className="mt-3 rounded-2xl border border-border bg-card p-4">
        {q.isLoading && <SkeletonLines />}
        {q.isError && (
          <p className="text-sm text-muted-foreground">
            Analyst is unavailable right now.{" "}
            <button onClick={() => q.refetch()} className="text-primary underline">
              Retry
            </button>
          </p>
        )}
        {q.data && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">{q.data.summary}</p>
            <BriefBlock title="Drivers" items={q.data.drivers} />
            <BriefBlock title="Risks" items={q.data.risks} />
            <BriefBlock title="What to watch" items={q.data.watch} />
          </div>
        )}
      </div>
    </section>
  );
}

function BriefBlock({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-snug text-foreground">
            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SkeletonLines() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
      <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-3 w-10/12 animate-pulse rounded bg-muted" />
    </div>
  );
}

function AskAISection({ market }: { market: ReturnType<typeof getMarket> & object }) {
  const fn = useServerFn(askMarketAnalyst);
  const [input, setInput] = useState("");
  const [thread, setThread] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const suggestions = [
    `Why did ${market.name} move today?`,
    `Summarize today's news affecting ${market.symbol}.`,
    `Explain this chart simply.`,
    `What should investors watch next?`,
  ];

  const mutation = useMutation({
    mutationFn: async (q: string) =>
      fn({
        data: {
          asset: {
            symbol: market.symbol,
            name: market.name,
            price: market.price,
            changePct: market.changePct,
            currency: market.currency,
            group: market.group,
          },
          question: q,
        },
      }),
    onSuccess: (res) => {
      setThread((t) => [...t, { role: "assistant", content: res.answer }]);
    },
    onError: () => {
      setThread((t) => [
        ...t,
        { role: "assistant", content: "Sorry — I couldn't reach the analyst. Try again in a moment." },
      ]);
    },
  });

  const send = (q: string) => {
    const text = q.trim();
    if (!text || mutation.isPending) return;
    setThread((t) => [...t, { role: "user", content: text }]);
    setInput("");
    mutation.mutate(text);
  };

  return (
    <section className="mt-6 px-5">
      <h2 className="font-display text-base font-semibold text-foreground">Ask Kashf</h2>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        Ask anything about {market.symbol}
      </p>

      <div className="mt-3 rounded-2xl border border-border bg-card">
        {thread.length === 0 ? (
          <div className="flex flex-wrap gap-2 p-3">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary/40"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="max-h-[420px] space-y-3 overflow-y-auto p-3">
            {thread.map((m, i) => (
              <div
                key={i}
                className={
                  "rounded-xl px-3 py-2 text-sm leading-relaxed " +
                  (m.role === "user"
                    ? "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                    : "max-w-[92%] bg-background text-foreground")
                }
              >
                {m.content}
              </div>
            ))}
            {mutation.isPending && (
              <div className="max-w-[92%] rounded-xl bg-background px-3 py-2">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:240ms]" />
                </span>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${market.symbol}…`}
            className="flex-1 rounded-lg bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!input.trim() || mutation.isPending}
            aria-label="Send"
            className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}