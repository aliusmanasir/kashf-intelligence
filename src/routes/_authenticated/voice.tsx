import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/BottomTabs";
import { KashfMarkSvg } from "@/components/KashfLogo";
import {
  listPublishedEpisodes,
  checkIsAdmin,
  type VoiceEpisode,
} from "@/lib/voice-content.functions";
import { Play, Headphones, Video, BookOpen, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/voice")({
  head: () => ({
    meta: [{ title: "Kashf Voice — Original Reporting & Analysis" }],
  }),
  component: KashfVoice,
});

function KashfVoice() {
  const fetchEpisodes = useServerFn(listPublishedEpisodes);
  const fetchAdmin = useServerFn(checkIsAdmin);

  const episodes = useQuery({
    queryKey: ["voice-episodes"],
    queryFn: () => fetchEpisodes(),
    staleTime: 60_000,
  });
  const admin = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => fetchAdmin(),
    staleTime: 5 * 60_000,
  });

  const hasContent = (episodes.data?.length ?? 0) > 0;

  return (
    <div>
      <AppHeader
        eyebrow="Original reporting"
        title="Kashf Voice"
        right={
          <div className="flex items-center gap-2">
            {admin.data?.isAdmin && (
              <Link
                to="/admin"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
                aria-label="Admin"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>
        }
      />

      {hasContent ? (
        <EpisodeFeed episodes={episodes.data!} />
      ) : (
        <ComingSoon />
      )}
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="relative px-6 pb-16 pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-[oklch(0.13_0.01_260)]">
          <KashfMarkSvg size={44} stroke="var(--primary)" />
        </div>
        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
          Coming Soon
        </p>
        <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
          Kashf Voice
        </h2>
        <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Original podcasts, founder interviews, market breakdowns, and
          documentary-style business stories from across the Gulf — currently in
          development by the Kashf editorial team.
        </p>

        <div className="mt-12 grid w-full max-w-sm gap-px overflow-hidden rounded-2xl border border-border bg-border">
          {[
            { Icon: Headphones, label: "Podcasts", note: "Weekly long-form" },
            { Icon: Video, label: "Video", note: "Interviews & explainers" },
            { Icon: BookOpen, label: "Analysis", note: "Deep dives & reports" },
          ].map(({ Icon, label, note }) => (
            <div
              key={label}
              className="flex items-center gap-4 bg-card px-5 py-4 text-left"
            >
              <Icon
                className="h-4 w-4 text-primary"
                strokeWidth={1.75}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{note}</p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Soon
              </span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Built in the Gulf · for the Gulf
        </p>
      </div>
    </div>
  );
}

function EpisodeFeed({ episodes }: { episodes: VoiceEpisode[] }) {
  const [featured, ...rest] = episodes;
  return (
    <>
      <div className="px-5 pt-4">
        <FeaturedEpisode ep={featured} />
      </div>
      {rest.length > 0 && (
        <>
          <h3 className="mt-10 px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Recent episodes
          </h3>
          <ul className="mt-3 space-y-2 px-5">
            {rest.map((e) => (
              <EpisodeRow key={e.id} ep={e} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function iconFor(t: VoiceEpisode["content_type"]) {
  return t === "podcast" ? Headphones : t === "video" ? Video : BookOpen;
}

function FeaturedEpisode({ ep }: { ep: VoiceEpisode }) {
  const Icon = iconFor(ep.content_type);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      {ep.thumbnail_url && (
        <img
          src={ep.thumbnail_url}
          alt=""
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          <Icon className="h-3.5 w-3.5" /> {ep.show_name ?? "Kashf"} · {ep.content_type}
        </div>
        <h2 className="mt-3 font-display text-xl font-semibold leading-snug tracking-[-0.02em] text-foreground">
          {ep.title}
        </h2>
        {ep.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ep.description}</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {new Date(ep.created_at).toLocaleDateString()} {ep.duration ? `· ${ep.duration}` : ""}
          </span>
          {ep.media_url && (
            <a
              href={ep.media_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Play
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function EpisodeRow({ ep }: { ep: VoiceEpisode }) {
  const Icon = iconFor(ep.content_type);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
        {ep.thumbnail_url ? (
          <img src={ep.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {ep.show_name ?? "Kashf"} · {ep.content_type}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{ep.title}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(ep.created_at).toLocaleDateString()} {ep.duration ? `· ${ep.duration}` : ""}
        </p>
      </div>
      {ep.media_url && (
        <a
          href={ep.media_url}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
        </a>
      )}
    </li>
  );
}