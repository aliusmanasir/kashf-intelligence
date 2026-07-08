import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, BookmarkX, ExternalLink, Inbox } from "lucide-react";
import { AppHeader } from "@/components/BottomTabs";
import {
  listSavedStories,
  unsaveStory,
  type SavedStory,
} from "@/lib/saved-stories.functions";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved — Kashf" },
      { name: "description", content: "Your bookmarked briefings and analyses." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const fetchSaved = useServerFn(listSavedStories);
  const unsave = useServerFn(unsaveStory);
  const qc = useQueryClient();

  const query = useQuery<SavedStory[]>({
    queryKey: ["saved-stories"],
    queryFn: () => fetchSaved(),
  });

  const remove = async (story_id: string) => {
    await unsave({ data: { story_id } });
    await qc.invalidateQueries({ queryKey: ["saved-stories"] });
    await qc.invalidateQueries({ queryKey: ["saved-story-ids"] });
  };

  return (
    <div>
      <AppHeader
        eyebrow="Your library"
        title="Saved"
        right={
          <Link
            to="/daily"
            aria-label="Back to Daily"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      {query.isLoading && (
        <div className="mt-6 space-y-3 px-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      )}

      {query.data && query.data.length === 0 && (
        <div className="mx-5 mt-16 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="mt-4 font-display text-lg text-foreground">No saved stories yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Tap the bookmark icon on any story in Kashf Daily to keep it here.
          </p>
          <Link
            to="/daily"
            className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Browse Daily
          </Link>
        </div>
      )}

      {query.data && query.data.length > 0 && (
        <ol className="space-y-3 px-5 py-6">
          {query.data.map((s, i) => (
            <li
              key={s.id}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="px-5 pt-4">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
                  <span className="text-primary">
                    №{String(i + 1).padStart(2, "0")} · {s.publisher ?? s.category ?? "Kashf"}
                  </span>
                  <span className="text-muted-foreground">{s.region ?? ""}</span>
                </div>
                <h2 className="mt-2.5 font-display text-[17px] font-semibold leading-[1.25] tracking-[-0.01em] text-foreground">
                  {s.headline}
                </h2>
                {s.why_it_matters && (
                  <p className="mt-2 text-[13px] leading-[1.55] text-muted-foreground">
                    {s.why_it_matters}
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border/70 px-5 py-2.5 text-[11px]">
                {s.source_url ? (
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Read on {s.publisher ?? "source"}
                  </a>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => remove(s.story_id)}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
                >
                  <BookmarkX className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}