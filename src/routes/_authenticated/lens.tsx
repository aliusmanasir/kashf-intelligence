import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppHeader, KashfMark } from "@/components/BottomTabs";
import { ArrowUp, Sparkle, X, Lock } from "lucide-react";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  consumeLensMessage,
  getLensQuota,
  type LensQuota,
} from "@/lib/pro.functions";

export const Route = createFileRoute("/_authenticated/lens")({
  head: () => ({
    meta: [{ title: "Kashf Lens — AI Financial Intelligence" }],
  }),
  validateSearch: (s: Record<string, unknown>) =>
    z.object({ ctx: z.string().optional() }).parse(s),
  component: KashfLens,
});

type LensContext = {
  headline: string;
  category: string;
  region: string;
  summary: string;
  whyItMatters: string;
  initialPrompt?: string;
};

const suggestions = [
  "What happened in Saudi markets today?",
  "Explain today's oil movement",
  "Summarize today's top stories",
  "What should investors watch next?",
];

function KashfLens() {
  const { ctx } = Route.useSearch();
  const navigate = useNavigate();
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" })).current;
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const [article, setArticle] = useState<LensContext | null>(null);
  const [paywall, setPaywall] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  const fetchQuota = useServerFn(getLensQuota);
  const doConsume = useServerFn(consumeLensMessage);
  const qc = useQueryClient();
  const quotaQuery = useQuery<LensQuota>({
    queryKey: ["lens-quota"],
    queryFn: () => fetchQuota(),
    staleTime: 30_000,
  });

  // Pull article context handed off from Kashf Daily
  useEffect(() => {
    if (ctx !== "1" || typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("kashf_lens_context");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as LensContext;
      setArticle(parsed);
      // Keep until user clears, but strip ctx from URL
      navigate({ to: "/lens", search: {} as never, replace: true });
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      // ignore
    }
  }, [ctx, navigate]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const clearArticle = () => {
    setArticle(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("kashf_lens_context");
    }
  };

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    // Enforce free-tier quota
    try {
      const q = await doConsume();
      qc.setQueryData(["lens-quota"], q);
      if (!q.allowed) {
        setPaywall(true);
        return;
      }
    } catch {
      // Fail-open: still allow send if quota check fails
    }
    let payload = t;
    // Inject article context once on the first send
    if (article && messages.length === 0) {
      payload = `Article context — ${article.region} · ${article.category}\nHeadline: ${article.headline}\nSummary: ${article.summary}\nWhy it matters: ${article.whyItMatters}\n\nMy question: ${t}`;
    }
    setInput("");
    await sendMessage({ text: payload });
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      <AppHeader eyebrow="AI analyst" title="Kashf Lens" right={<KashfMark />} />

      {quotaQuery.data && !quotaQuery.data.isPro && (
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-5 pt-2 text-[11px]">
          <span className="font-mono uppercase tracking-[0.18em] text-muted-foreground">
            {quotaQuery.data.remaining} / {quotaQuery.data.limit} today
          </span>
          <Link
            to="/pro"
            className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 font-mono uppercase tracking-[0.18em] text-primary"
          >
            <Sparkle className="h-3 w-3" />
            Unlimited with Pro
          </Link>
        </div>
      )}

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 pb-40 pt-4">
        {article && (
          <ContextCard article={article} onClear={clearArticle} />
        )}
        {messages.length === 0 ? (
          <EmptyState onPick={submit} article={article} />
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>
            )}
            {error && (
              <p className="text-sm text-destructive">
                {error.message || "Something went wrong. Please try again."}
              </p>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="fixed inset-x-0 bottom-[72px] z-30 border-t border-border bg-background/90 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-md items-end gap-2 px-4 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="Ask Kashf Lens anything…"
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </form>
      {paywall && (
        <PaywallModal
          quota={quotaQuery.data}
          onClose={() => setPaywall(false)}
          onUpgrade={() => navigate({ to: "/pro" })}
        />
      )}
    </div>
  );
}

function PaywallModal({
  quota,
  onClose,
  onUpgrade,
}: {
  quota: LensQuota | undefined;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 sm:rounded-3xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-center font-display text-xl font-semibold tracking-tight text-foreground">
          You&apos;ve reached today&apos;s Lens limit
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Free plan includes {quota?.limit ?? 15} Lens messages per day. Upgrade to Kashf
          Pro for unlimited AI-powered financial guidance.
        </p>
        <button
          onClick={onUpgrade}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          <Sparkle className="h-4 w-4" />
          See Kashf Pro
        </button>
        <button
          onClick={onClose}
          className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-border bg-background/40 py-2.5 text-sm text-muted-foreground"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function ContextCard({ article, onClear }: { article: LensContext; onClear: () => void }) {
  return (
    <div className="mb-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/8 to-transparent p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Currently discussing
          </p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground">
            {article.headline}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {article.region} · {article.category}
          </p>
        </div>
        <button
          onClick={onClear}
          aria-label="Clear article context"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  article,
}: {
  onPick: (s: string) => void;
  article: LensContext | null;
}) {
  if (article) {
    const starters = [
      `Why does "${truncate(article.headline, 60)}" matter?`,
      "What happens next?",
      `How does this affect ${article.region} markets?`,
      "Explain this simply",
    ];
    return (
      <div className="pt-2">
        <p className="px-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Starter questions
        </p>
        <div className="mt-3 grid gap-2">
          {starters.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-primary/40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-transparent">
        <Sparkle className="h-6 w-6 text-primary" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-foreground">
        Your financial intelligence analyst
      </h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Ask about today's Gulf markets, oil, banks, real estate, or anything in the Kashf Daily briefing.
      </p>
      <div className="mt-6 grid w-full gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-primary/40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function MessageBubble({ message }: { message: UIMessage }) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-transparent font-display text-xs font-bold text-primary">
        K
      </div>
      <div className="prose prose-sm prose-invert max-w-none flex-1 text-[15px] leading-relaxed text-foreground prose-p:my-2 prose-strong:text-foreground prose-headings:text-foreground prose-li:my-0.5">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}