import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Loader2,
  Sparkle,
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Search,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/BottomTabs";
import {
  generateDailyBriefing,
  type GeneratedBriefing,
  type GeneratedStory,
} from "@/lib/daily-briefing.functions";
import { logActivity } from "@/lib/preferences.functions";
import {
  saveStory,
  unsaveStory,
  listSavedStoryIds,
} from "@/lib/saved-stories.functions";
import {
  EDITION_SLOTS,
  FEED_CATEGORIES,
  currentEditionSlot,
  type EditionSlot,
  type FeedCategory,
} from "@/lib/personalization";

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
  const trackActivity = useServerFn(logActivity);
  const doSave = useServerFn(saveStory);
  const doUnsave = useServerFn(unsaveStory);
  const fetchSavedIds = useServerFn(listSavedStoryIds);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<EditionSlot>("morning");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  useEffect(() => {
    setSlot(currentEditionSlot());
  }, []);

  const savedIdsQuery = useQuery<string[]>({
    queryKey: ["saved-story-ids"],
    queryFn: () => fetchSavedIds(),
    staleTime: 60_000,
  });
  const savedSet = useMemo(
    () => new Set(savedIdsQuery.data ?? []),
    [savedIdsQuery.data],
  );

  const toggleSave = async (story: GeneratedStory) => {
    const wasSaved = savedSet.has(story.id);
    if (wasSaved) {
      await doUnsave({ data: { story_id: story.id } });
    } else {
      await doSave({
        data: {
          story_id: story.id,
          headline: story.headline,
          summary: story.summary,
          why_it_matters: story.whyItMatters,
          why_matters_to_you: story.whyMattersToYou,
          category: story.category,
          region: story.region,
          publisher: story.publisher,
          source_url: story.sourceUrl,
          section: story.section,
        },
      });
      void trackActivity({
        data: {
          story_id: story.id,
          headline: story.headline,
          category: story.category,
          region: story.region,
          action: "save",
        },
      }).catch(() => {});
    }
    await qc.invalidateQueries({ queryKey: ["saved-story-ids"] });
    await qc.invalidateQueries({ queryKey: ["saved-stories"] });
  };

  const query = useQuery<GeneratedBriefing>({
    queryKey: ["kashf-daily", slot],
    queryFn: () => fetchBriefing({ data: { seed: Date.now(), slot } }),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const refresh = () =>
    qc.fetchQuery({
      queryKey: ["kashf-daily", slot],
      queryFn: () => fetchBriefing({ data: { seed: Date.now(), slot } }),
    });

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

  const trackExpand = (story: GeneratedStory) => {
    void trackActivity({
      data: {
        story_id: story.id,
        headline: story.headline,
        category: story.category,
        region: story.region,
        action: "expand",
      },
    }).catch(() => {});
  };

  const askLensAbout = (story: GeneratedStory) => {
    void trackActivity({
      data: {
        story_id: story.id,
        headline: story.headline,
        category: story.category,
        region: story.region,
        action: "ask_lens",
      },
    }).catch(() => {});
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

  const grouped = useMemo(() => {
    const map = new Map<FeedCategory, GeneratedStory[]>();
    const q = search.trim().toLowerCase();
    const filtered = (query.data?.stories ?? []).filter((s) => {
      if (!q) return true;
      return (
        s.headline.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q) ||
        (s.publisher ?? "").toLowerCase().includes(q)
      );
    });
    for (const s of filtered) {
      const sec = ((s.section as FeedCategory) ?? "top") as FeedCategory;
      const arr = map.get(sec) ?? [];
      arr.push(s);
      map.set(sec, arr);
    }
    return map;
  }, [query.data, search]);

  return (
    <div
      ref={scrollerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="touch-pan-y"
    >
      <AppHeader
        eyebrow={query.data?.edition ?? "Daily Briefing"}
        title="Kashf Daily"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={refresh}
              disabled={isFetching}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
              aria-label="Refresh"
            >
              <RefreshCw className={"h-4 w-4 " + (isFetching ? "animate-spin" : "")} />
            </button>
          </div>
        }
      />

      {showSearch && (
        <div className="mx-auto max-w-md px-5 pt-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search today's briefing…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

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
        <p className="mt-2 max-w-[32ch] font-display text-[15px] leading-snug text-foreground/85">
          {query.data?.tagline ?? "Kashf is curating today's most important stories for you."}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1">
          {EDITION_SLOTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSlot(s.id)}
              className={
                "rounded-lg py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors " +
                (slot === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {s.id === "morning" ? "Morning" : s.id === "afternoon" ? "Afternoon" : "Evening"}
            </button>
          ))}
        </div>
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

      {query.data && (
        <div className="mt-6 space-y-8 px-5">
          {FEED_CATEGORIES.map((cat) => {
            const items = grouped.get(cat.id) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={cat.id}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-foreground">
                    {cat.label}
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {items.length} {items.length === 1 ? "story" : "stories"}
                  </span>
                </div>
                <ol className="space-y-3">
                  {items.map((s, i) => (
                    <StoryCard
                      key={s.id}
                      index={i}
                      story={s}
                      saved={savedSet.has(s.id)}
                      onToggleSave={() => toggleSave(s)}
                      onAskLens={() => askLensAbout(s)}
                      onExpand={() => trackExpand(s)}
                      onOpen={() => {
                        if (typeof window !== "undefined") {
                          window.sessionStorage.setItem(
                            `kashf_story_${s.id}`,
                            JSON.stringify(s),
                          );
                        }
                        trackExpand(s);
                        navigate({
                          to: "/story/$id",
                          params: { id: s.id },
                        });
                      }}
                    />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}

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
  saved,
  onToggleSave,
  onAskLens,
  onExpand,
  onOpen,
}: {
  story: GeneratedStory;
  index: number;
  saved: boolean;
  onToggleSave: () => void;
  onAskLens: () => void;
  onExpand: () => void;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 4) * 0.03 }}
      className="overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/30"
    >
      <div className="relative">
        <button
          onClick={() => {
            setOpen((v) => {
              if (!v) onExpand();
              return !v;
            });
          }}
          className="block w-full text-left"
          aria-expanded={open}
        >
          <div className="px-5 pt-4 pr-14">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
              <span className="text-primary">
                №{String(index + 1).padStart(2, "0")} · {story.publisher || story.category}
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
            <span>{open ? "Collapse" : "Preview"}</span>
            <ChevronDown
              className={
                "h-3.5 w-3.5 transition-transform " + (open ? "rotate-180" : "")
              }
            />
          </div>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          aria-label={saved ? "Remove from saved" : "Save story"}
          className={
            "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors " +
            (saved
              ? "border-primary/60 bg-primary/10 text-primary"
              : "border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-primary")
          }
        >
          {saved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                className="mt-4 inline-flex w-full items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
              >
                <span>Open full story</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                  Why it matters
                </p>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-muted-foreground">
                  {story.whyItMatters}
                </p>
              </div>
              {story.whyMattersToYou && (
                <div className="mt-3 rounded-xl border border-primary/30 bg-primary/[0.06] p-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                    Why this matters to you
                  </p>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-foreground/90">
                    {story.whyMattersToYou}
                  </p>
                </div>
              )}
              {story.sourceUrl && (
                <a
                  href={story.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 inline-flex w-full items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="inline-flex items-center gap-2">
                    <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    Read on {story.publisher}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
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
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Curating your briefing
      </p>
    </div>
  );
}