import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Sparkle,
  Infinity as InfinityIcon,
  Bell,
  BarChart3,
  Compass,
  Newspaper,
  Radio,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import {
  cancelPro,
  getMyProStatus,
  startProTrial,
  type ProStatus,
} from "@/lib/pro.functions";

export const Route = createFileRoute("/_authenticated/pro")({
  head: () => ({
    meta: [
      { title: "Kashf Pro — Go Beyond The Headlines" },
      {
        name: "description",
        content:
          "AI-powered financial intelligence for investors, founders, and decision-makers across the Gulf.",
      },
    ],
  }),
  component: KashfProPage,
});

type Plan = "monthly" | "yearly";

const FEATURES = [
  {
    Icon: InfinityIcon,
    title: "Unlimited Kashf Lens",
    body: "Ask deeper questions, explore complex topics, and get unlimited AI-powered financial guidance.",
  },
  {
    Icon: Newspaper,
    title: "Personalized Daily Brief",
    body: "Your morning briefing, rebuilt each day from your interests, regions, and long-term goals.",
  },
  {
    Icon: BarChart3,
    title: "AI Portfolio Intelligence",
    body: "Build a watchlist. Every day Kashf explains what happened, why it matters, and the risks and opportunities.",
  },
  {
    Icon: Compass,
    title: "Deep Research Reports",
    body: "Long-form AI research on companies, sectors, and macro themes — structured, sourced, decision-ready.",
  },
  {
    Icon: Radio,
    title: "Kashf Signal",
    body: "Three items to watch each week: the setup, the catalyst, the risk. Plain English, no spreadsheets.",
  },
  {
    Icon: Bell,
    title: "Smart Alerts",
    body: "Follow companies, sectors, or commodities. We notify you only when something meaningful happens.",
  },
  {
    Icon: FlaskConical,
    title: "Research Mode in Lens",
    body: "Ask Lens to research Vision 2030, GCC AI investment, or UAE banking — get structured reports back.",
  },
  {
    Icon: ShieldCheck,
    title: "Earnings Explainer",
    body: "When a major company reports, Kashf explains revenue, expectations, and market reaction in plain English.",
  },
];

const COMPARISON = [
  { row: "Kashf Daily", free: true, pro: true },
  { row: "Kashf Pulse", free: true, pro: true },
  { row: "Kashf Voice", free: true, pro: true },
  { row: "Kashf Lens", free: "15 / day", pro: "Unlimited" },
  { row: "Personalized Daily", free: false, pro: true },
  { row: "Portfolio Intelligence", free: false, pro: true },
  { row: "Deep Research Reports", free: false, pro: true },
  { row: "Kashf Signal (weekly)", free: false, pro: true },
  { row: "Smart Alerts", free: false, pro: true },
  { row: "Research Mode", free: false, pro: true },
] as const;

function KashfProPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchStatus = useServerFn(getMyProStatus);
  const doStartTrial = useServerFn(startProTrial);
  const doCancel = useServerFn(cancelPro);
  const [plan, setPlan] = useState<Plan>("yearly");
  const [submitting, setSubmitting] = useState(false);

  const statusQuery = useQuery<ProStatus>({
    queryKey: ["pro-status"],
    queryFn: () => fetchStatus(),
  });
  const isPro = statusQuery.data?.isPro ?? false;

  const startTrial = async () => {
    setSubmitting(true);
    try {
      await doStartTrial({ data: { plan } });
      await qc.invalidateQueries({ queryKey: ["pro-status"] });
      await qc.invalidateQueries({ queryKey: ["lens-quota"] });
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    setSubmitting(true);
    try {
      await doCancel();
      await qc.invalidateQueries({ queryKey: ["pro-status"] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => (history.length > 1 ? history.back() : navigate({ to: "/daily" }))}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Kashf Pro
          </span>
        </div>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mt-6 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.10] via-transparent to-primary/[0.04] p-6"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl" />
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            <Sparkle className="h-3 w-3" />
            Go Beyond The Headlines
          </div>
          <h1 className="mt-4 font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground">
            Think beyond today&apos;s news.
          </h1>
          <p className="mt-3 text-[15px] leading-[1.55] text-muted-foreground">
            Upgrade to Kashf Pro and unlock AI-powered financial intelligence built for
            investors, founders, and decision-makers across the Gulf.
          </p>

          {isPro ? (
            <div className="mt-5 rounded-xl border border-primary/40 bg-primary/10 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                You&apos;re on Kashf Pro
              </p>
              <p className="mt-1.5 text-sm text-foreground">
                {statusQuery.data?.status === "trialing"
                  ? `Free trial active — ${formatDate(statusQuery.data.trialEnd)}`
                  : `Renews ${formatDate(statusQuery.data?.currentPeriodEnd ?? null)}`}
              </p>
            </div>
          ) : null}
        </motion.section>

        {/* Features */}
        <section className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            What you unlock
          </p>
          <div className="mt-3 grid gap-2.5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <f.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                      {f.title}
                    </p>
                    <p className="mt-1 text-[13.5px] leading-[1.55] text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="mt-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Free vs Pro
          </p>
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-[1fr_84px_84px] items-center border-b border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Feature</span>
              <span className="text-center">Free</span>
              <span className="text-center text-primary">Pro</span>
            </div>
            {COMPARISON.map((r, i) => (
              <div
                key={r.row}
                className={
                  "grid grid-cols-[1fr_84px_84px] items-center px-4 py-3 text-[13.5px] text-foreground " +
                  (i % 2 === 1 ? "bg-background/40" : "")
                }
              >
                <span>{r.row}</span>
                <span className="text-center">
                  <Cell value={r.free} />
                </span>
                <span className="text-center text-primary">
                  <Cell value={r.pro} accent />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        {!isPro && (
          <section className="mt-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Choose your plan
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <PlanCard
                selected={plan === "monthly"}
                onSelect={() => setPlan("monthly")}
                title="Monthly"
                price="$8.99"
                unit="/month"
              />
              <PlanCard
                selected={plan === "yearly"}
                onSelect={() => setPlan("yearly")}
                title="Yearly"
                price="$79"
                unit="/year"
                badge="Best value · Save 27%"
              />
            </div>
            <button
              onClick={startTrial}
              disabled={submitting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {submitting ? "Starting your trial…" : "Start 7-day free trial"}
            </button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Cancel anytime · No commitment · Billing activates after payments launch
            </p>
          </section>
        )}

        {isPro && (
          <section className="mt-10 rounded-2xl border border-border bg-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Manage subscription
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                to="/daily"
                className="flex-1 rounded-lg border border-border bg-background/40 py-2 text-center text-sm text-foreground"
              >
                Back to Daily
              </Link>
              {!statusQuery.data?.cancelAtPeriodEnd &&
                statusQuery.data?.status !== "canceled" && (
                  <button
                    onClick={cancel}
                    disabled={submitting}
                    className="flex-1 rounded-lg border border-destructive/30 bg-destructive/5 py-2 text-sm font-medium text-destructive disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}
            </div>
          </section>
        )}

        <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
          The free version tells you what happened.
          <br />
          Kashf Pro helps you decide what to do next.
        </p>
      </div>
    </div>
  );
}

function Cell({ value, accent }: { value: string | boolean; accent?: boolean }) {
  if (value === true)
    return <Check className={"mx-auto h-4 w-4 " + (accent ? "text-primary" : "text-foreground")} />;
  if (value === false)
    return <span className="text-muted-foreground/60">—</span>;
  return <span className="text-[12px] font-medium">{value}</span>;
}

function PlanCard({
  selected,
  onSelect,
  title,
  price,
  unit,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: string;
  unit: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={
        "relative rounded-2xl border p-4 text-left transition-colors " +
        (selected
          ? "border-primary bg-primary/[0.06]"
          : "border-border bg-card hover:border-primary/40")
      }
    >
      {badge && (
        <span className="absolute -top-2 left-3 rounded-full border border-primary/40 bg-background px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
          {badge}
        </span>
      )}
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-1.5">
        <span className="font-display text-[22px] font-semibold tracking-tight text-foreground">
          {price}
        </span>
        <span className="ml-0.5 text-[12px] text-muted-foreground">{unit}</span>
      </p>
    </button>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}