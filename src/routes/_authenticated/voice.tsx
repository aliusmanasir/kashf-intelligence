import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, KashfMark } from "@/components/BottomTabs";
import { episodes, type Episode } from "@/lib/kashf-data";
import { Play, Headphones, Video, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/voice")({
  head: () => ({
    meta: [{ title: "Kashf Voice — Podcasts, Video & Analysis" }],
  }),
  component: KashfVoice,
});

const iconFor = (t: Episode["type"]) =>
  t === "Podcast" ? Headphones : t === "Video" ? Video : BookOpen;

function KashfVoice() {
  const featured = episodes[0];
  const rest = episodes.slice(1);
  const FeatIcon = iconFor(featured.type);

  return (
    <div>
      <AppHeader eyebrow="Listen & watch" title="Kashf Voice" right={<KashfMark />} />

      <div className="px-5 pt-4">
        <article className="overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-5">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            <FeatIcon className="h-3.5 w-3.5" /> Featured · {featured.show}
          </div>
          <h2 className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight text-foreground">
            {featured.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{featured.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {featured.date} · {featured.duration}
            </span>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-95">
              <Play className="h-3.5 w-3.5 fill-current" /> Play
            </button>
          </div>
        </article>
      </div>

      <h3 className="mt-8 px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Recent episodes
      </h3>
      <ul className="mt-2 space-y-2 px-5">
        {rest.map((e) => {
          const Icon = iconFor(e.type);
          return (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-transparent">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {e.show} · {e.type}
                </p>
                <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date} · {e.duration}</p>
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="px-5 py-8 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        New episodes every Sunday
      </p>
    </div>
  );
}