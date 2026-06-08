import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, LogOut, Loader2 } from "lucide-react";
import { AppHeader, KashfMark } from "@/components/BottomTabs";
import {
  generateDailyBriefing,
  type GeneratedBriefing,
} from "@/lib/daily-briefing.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/daily")({
  head: () => ({
    meta: [
      { title: "Kashf Daily — Gulf Financial Briefing" },
      {
        name: "description",
        content: "Today's most important Gulf finance and business stories, explained.",
      },
    ],
  }),
  component: KashfDaily,
});

function KashfDaily() {
  const fetchBriefing = useServerFn(generateDailyBriefing);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const query = useQuery<GeneratedBriefing>({
    queryKey: ["kashf-daily"],
    queryFn: () => fetchBriefing({ data: { seed: Date.now() } }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const refresh = () =>
    qc.fetchQuery({
      queryKey: ["kashf-daily"],
      queryFn: () => fetchBriefing({ data: { seed: Date.now() } }),
    });

  // Pull-to-refresh
  const scrollerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPullY(Math.min(dy * 0.5, 80));
  };
  const onTouchEnd = async () => {
    if (pullY > 50 && !refreshing) {
      setRefreshing(true);
      try {
        await refresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullY(0);
    startY.current = null;
  };

  const isFetching = query.isFetching || refreshing;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/welcome", replace: true });
  };

  return (
    <div
      ref={scrollerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="touch-pan-y"
    >
      <AppHeader
        eyebrow={query.data?.edition ?? "Morning Edition"}
        title="Kashf Daily"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={isFetching}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
              aria-label="Refresh"
            >
              <RefreshCw className={"h-4 w-4 " + (isFetching ? "animate-spin" : "")} />
            </button>
            <button
              onClick={signOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <KashfMark />
          </div>
        }
      />

      {/* Pull indicator */}
      <div
        style={{ height: pullY }}
        className="flex items-end justify-center overflow-hidden text-xs text-muted-foreground"
      >
        {pullY > 50 ? "Release to refresh…" : pullY > 10 ? "Pull to refresh" : ""}
      </div>

      <div className="px-5 pt-4">
        <p className="text-sm text-muted-foreground">
          {query.data?.date ?? "Generating today's briefing…"}
        </p>
        <p className="mt-1 text-sm text-foreground/80">
          {query.data
            ? `${query.data.stories.length} stories that matter for the Gulf today.`
            : "Kashf is curating the Gulf's most important stories."}
        </p>
      </div>

      {query.isLoading && <BriefingSkeleton />}

      {query.error && (
        <div className="mx-5 mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn't load briefing. {(query.error as Error).message}
          <button onClick={refresh} className="ml-2 underline">
            Retry
          </button>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {query.data && (
          <motion.ol
            key={query.data.generatedAt}
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.06 } },
              hidden: {},
            }}
            className="mt-6 space-y-3 px-5"
          >
            {query.data.stories.map((s, i) => (
              <motion.li
                key={s.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0 },
                }}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em]">
                  <span className="text-primary">
                    {String(i + 1).padStart(2, "0")} · {s.category}
                  </span>
                  <span className="text-muted-foreground">
                    {s.region} · {timeAgo(s.hoursAgo)}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
                  {s.headline}
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
                  {s.summary}
                </p>
                <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    Why it matters
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {s.whyItMatters}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>

      {query.data && (
        <p className="px-5 py-10 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          End of briefing · Pull down or tap refresh
        </p>
      )}
    </div>
  );
}

function timeAgo(hours: number) {
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return "Today";
}

function BriefingSkeleton() {
  return (
    <div className="mt-6 space-y-3 px-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-5">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-16 animate-pulse rounded bg-muted/60" />
        </div>
      ))}
      <p className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating today's briefing
      </p>
    </div>
  );
}