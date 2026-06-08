import { createFileRoute } from "@tanstack/react-router";
import { AppHeader, KashfMark } from "@/components/BottomTabs";
import { dailyBriefing } from "@/lib/kashf-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kashf Daily — Gulf Financial Briefing" },
      { name: "description", content: "Today's most important Gulf finance and business stories, explained." },
      { property: "og:title", content: "Kashf Daily" },
      { property: "og:description", content: "Your daily intelligence briefing on Gulf markets." },
    ],
  }),
  component: KashfDaily,
});

function KashfDaily() {
  return (
    <div>
      <AppHeader
        eyebrow={dailyBriefing.edition}
        title="Kashf Daily"
        right={<KashfMark />}
      />
      <div className="px-5 pt-4">
        <p className="text-sm text-muted-foreground">{dailyBriefing.date}</p>
        <p className="mt-1 text-sm text-foreground/80">
          {dailyBriefing.stories.length} stories that matter for the Gulf today.
        </p>
      </div>

      <ol className="mt-6 space-y-3 px-5">
        {dailyBriefing.stories.map((s, i) => (
          <li
            key={s.id}
            className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
          >
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em]">
              <span className="text-primary">
                {String(i + 1).padStart(2, "0")} · {s.category}
              </span>
              <span className="text-muted-foreground">{s.region}</span>
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
              {s.headline}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">{s.summary}</p>
            <div className="mt-4 rounded-xl border border-border/70 bg-background/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Why it matters
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.whyItMatters}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="px-5 py-8 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        End of briefing · Updated daily 06:00 GST
      </p>
    </div>
  );
}
