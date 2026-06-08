import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Sparkle, LineChart, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome to Kashf" }] }),
  component: Onboarding,
});

const slides = [
  {
    Icon: Newspaper,
    title: "Kashf Daily",
    description:
      "Your daily Gulf market intelligence. AI-curated briefings on what's moving Saudi, UAE, Qatar — and why it matters.",
  },
  {
    Icon: Sparkle,
    title: "Kashf Lens",
    description:
      "Ask the analyst. Get clear, institutional-grade answers on markets, oil, banks, and today's news in seconds.",
  },
  {
    Icon: LineChart,
    title: "Kashf Pulse",
    description:
      "Live market insights. TASI, Aramco, Brent, gold — the GCC and global signals at a glance.",
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const finish = () => navigate({ to: "/daily", replace: true });
  const next = () => (step < slides.length - 1 ? setStep(step + 1) : finish());

  const slide = slides[step];
  const Icon = slide.Icon;

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-80 w-[120vw] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="flex items-center justify-end pt-3">
          <button
            onClick={finish}
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            Skip
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/25 to-transparent">
                <Icon className="h-9 w-9 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="mt-8 font-display text-3xl font-semibold tracking-tight text-foreground">
                {slide.title}
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pb-8">
          <div className="mb-6 flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (i === step ? "w-6 bg-primary" : "w-1.5 bg-muted")
                }
              />
            ))}
          </div>
          <button
            onClick={next}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            {step < slides.length - 1 ? "Continue" : "Enter Kashf"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}