import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppHeader, KashfMark } from "@/components/BottomTabs";
import { ArrowUp, Sparkle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/lens")({
  head: () => ({
    meta: [{ title: "Kashf Lens — AI Financial Intelligence" }],
  }),
  component: KashfLens,
});

const suggestions = [
  "Why did oil prices change today?",
  "Summarize today's Saudi market",
  "Explain this news simply",
  "What's the most important Gulf story this week?",
];

function KashfLens() {
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" })).current;
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    setInput("");
    await sendMessage({ text: t });
  };

  return (
    <div className="flex h-[100dvh] flex-col">
      <AppHeader eyebrow="AI analyst" title="Kashf Lens" right={<KashfMark />} />

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 pb-40 pt-4">
        {messages.length === 0 ? (
          <EmptyState onPick={submit} />
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
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
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