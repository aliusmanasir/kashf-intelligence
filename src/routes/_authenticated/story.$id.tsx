import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkle,
} from "lucide-react";
import type { GeneratedStory } from "@/lib/daily-briefing.functions";
import { logActivity } from "@/lib/preferences.functions";
import {
  listSavedStoryIds,
  saveStory,
  unsaveStory,
} from "@/lib/saved-stories.functions";

export const Route = createFileRoute("/_authenticated/story/$id")({
  head: () => ({
    meta: [
      { title: "Story · Kashf" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StoryDetail,
});

function readStoryFromStorage(id: string): GeneratedStory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`kashf_story_${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as GeneratedStory;
  } catch {
    return null;
  }
}

function timeAgo(hours: number) {
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return "Today";
}

function StoryDetail() {
  const { id } = useParams({ from: "/_authenticated/story/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [notFound, setNotFound] = useState(false);

  const trackActivity = useServerFn(logActivity);
  const doSave = useServerFn(saveStory);
  const doUnsave = useServerFn(unsaveStory);
  const fetchSavedIds = useServerFn(listSavedStoryIds);

  useEffect(() => {
    const s = readStoryFromStorage(id);
    if (s) {
      setStory(s);
      void trackActivity({
        data: {
          story_id: s.id,
          headline: s.headline,
          category: s.category,
          region: s.region,
          action: "expand",
        },
      }).catch(() => {});
    } else {
      setNotFound(true);
    }
  }, [id, trackActivity]);

  const savedIdsQuery = useQuery<string[]>({
    queryKey: ["saved-story-ids"],
    queryFn: () => fetchSavedIds(),
    staleTime: 60_000,
  });
  const saved = (savedIdsQuery.data ?? []).includes(id);

  const toggleSave = async () => {
    if (!story) return;
    if (saved) {
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
    }
    await qc.invalidateQueries({ queryKey: ["saved-story-ids"] });
    await qc.invalidateQueries({ queryKey: ["saved-stories"] });
  };

  const askLens = () => {
    if (!story) return;
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

  if (notFound) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-md px-5 pt-6">
          <button
            onClick={() => navigate({ to: "/daily" })}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Daily
          </button>
          <div className="mt-16 rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-display text-lg text-foreground">Story unavailable</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This briefing story is no longer in your session. Return to Daily to reload today's stories.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen px-5 pt-10">
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mx-auto mt-4 h-8 w-full max-w-md animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 pt-5 pb-24">
        <div className="flex items-center justify-between">
          <button
            onClick={() => history.length > 1 ? history.back() : navigate({ to: "/daily" })}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={toggleSave}
            aria-label={saved ? "Remove from saved" : "Save story"}
            className={
              "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors " +
              (saved
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary")
            }
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mt-6"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.22em]">
            <span className="text-primary">{story.category}</span>
            <span className="text-muted-foreground">
              {story.region} · {timeAgo(story.hoursAgo)}
            </span>
            {story.publisher && (
              <span className="text-muted-foreground">· {story.publisher}</span>
            )}
          </div>
          <h1 className="mt-3 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.015em] text-foreground">
            {story.headline}
          </h1>
          <p className="mt-5 text-[16px] leading-[1.7] text-foreground/85">
            {story.summary}
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              Why it matters
            </p>
            <p className="mt-2 text-[15px] leading-[1.65] text-foreground/80">
              {story.whyItMatters}
            </p>
          </div>

          {story.whyMattersToYou && (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/[0.06] p-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                Why this matters to you
              </p>
              <p className="mt-2 text-[15px] leading-[1.65] text-foreground/90">
                {story.whyMattersToYou}
              </p>
            </div>
          )}

          <button
            onClick={askLens}
            className="mt-5 inline-flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-primary" />
              Ask Kashf Lens about this
            </span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {story.sourceUrl && (
            <a
              href={story.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <span className="inline-flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-primary" />
                Read on {story.publisher || "publisher"}
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </a>
          )}
        </motion.div>
      </div>
    </div>
  );
}