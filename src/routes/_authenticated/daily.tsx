import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Loader2, Sparkle, ArrowUpRight, ChevronDown } from "lucide-react";
import { AppHeader, KashfMark } from "@/components/BottomTabs";
import {
  generateDailyBriefing,
  type GeneratedBriefing,
  type GeneratedStory,
} from "@/lib/daily-briefing.functions";

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

  const askLensAbout = (story: GeneratedStory) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "kashf_lens_context",
        JSON.stringify({
          headline: story.headline,
          category: story.category,
          region: story.region,
          summary: story.summary,
          whyItMatters: story.whyItMatters,
        }),
      );
    }
    navigate({ to: "/lens", search: { ctx: "1" } as never });
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

      <div className="px-5 pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {query.data?.date ?? "Generating today's briefing…"}
        </p>
        <p className="mt-2 max-w-[28ch] font-display text-[15px] leading-snug text-foreground/85">
          {query.data
            ? `${query.data.stories.length} stories shaping business, markets, and policy across the Gulf today.`
            : "Kashf is curating the Gulf's most important stories."}
        </p>
        <div className="mt-5 h-px w-full bg-border" />
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
              show: { transition: { staggerChildren: 0.04 } },
              hidden: {},
            }}
            className="mt-6 space-y-3 px-5"
          >
            {query.data.stories.map((s, i) => (
              <StoryCard
                key={s.id}
                index={i}
                story={s}
                onAskLens={() => askLensAbout(s)}
              />
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

function firstSentence(text: string): string {
  const m = text.match(/^(.+?[.!?])(\s|$)/);
  return (m ? m[1] : text).trim();
}

function StoryCard({
  story,
  index,
  onAskLens,
}: {
  story: GeneratedStory;
  index: number;
  onAskLens: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 },
      }}
      className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/30"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="block w-full text-left"
        aria-expanded={open}
      >
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
            <span className="text-primary">
              №{String(index + 1).padStart(2, "0")} · {story.category}
            </span>
            <span className="text-muted-foreground">
              {story.region} · {timeAgo(story.hoursAgo)}
            </span>
          </div>
          <h2 className="mt-2.5 font-display text-[18px] font-semibold leading-[1.25] tracking-[-0.01em] text-foreground">
            {story.headline}
          </h2>
          {!open && (
            <p className="mt-2 text-[14px] leading-[1.55] text-muted-foreground">
              {firstSentence(story.summary)}
            </p>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between px-5 pb-3 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
          <span>{open ? "Collapse" : "Read more"}</span>
          <ChevronDown
            className={
              "h-3.5 w-3.5 transition-transform " + (open ? "rotate-180" : "")
            }
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-border/70"
          >
            <div className="px-5 py-4">
              <p className="text-[15px] leading-[1.65] text-foreground/85">
                {story.summary}
              </p>
              <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                  Why it matters
                </p>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-muted-foreground">
                  {story.whyItMatters}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAskLens();
                }}
                className="mt-4 inline-flex w-full items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkle className="h-3.5 w-3.5 text-primary" />
                  Ask Kashf Lens
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
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