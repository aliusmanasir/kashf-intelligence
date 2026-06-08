import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { KashfLogo, KashfWordmark } from "@/components/KashfLogo";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Kashf — Clarity in Gulf Markets" },
      { name: "description", content: "AI-powered financial intelligence for the Gulf." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/daily", replace: true });
    });
  }, [navigate]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[60vh] w-[120vw] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-10 pt-[max(env(safe-area-inset-top),3rem)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-1 flex-col items-center justify-center text-center"
        >
          <KashfLogo size={88} />
          <div className="mt-10">
            <KashfWordmark className="!text-4xl" />
          </div>
          <h1 className="sr-only">Kashf — Clarity in Gulf Markets</h1>
          <p className="mt-4 font-display text-xl font-medium tracking-tight text-foreground/90">
            Clarity in Gulf Markets
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A daily intelligence layer for understanding money, markets, and power in the Gulf.
          </p>

          <div className="mt-10 grid w-full gap-2 px-2 text-left">
            {[
              "AI-generated daily briefings",
              "Live Gulf market pulse",
              "Ask the analyst, instantly",
            ].map((t) => (
              <div
                key={t}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/50 px-4 py-3 text-sm text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 space-y-3"
        >
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="group flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold tracking-wide text-primary-foreground transition-transform active:scale-[0.98]"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="flex h-12 items-center justify-center rounded-xl border border-border bg-card/40 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
          >
            Sign In
          </Link>
          <p className="pt-2 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            For Gulf investors, operators &amp; policymakers
          </p>
        </motion.div>
      </div>
    </div>
  );
}