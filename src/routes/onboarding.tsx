import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Sparkle, LineChart, ArrowRight } from "lucide-react";
import { KashfLogo, KashfWordmark, KashfMarkSvg } from "@/components/KashfLogo";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({ meta: [{ title: "Welcome to Kashf" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const total = 4;

  const finish = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kashf_onboarded", "1");
    }
    navigate({ to: "/welcome", replace: true });
  };
  const next = () => (step < total - 1 ? setStep(step + 1) : finish());
  const ctaLabel = step === 0 ? "Next" : step < total - 1 ? "Next" : "Get Started";

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[55vh] w-[120vw] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)]">
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <KashfMarkSvg size={20} stroke="var(--primary)" />
            <KashfWordmark className="!text-base" />
          </div>
          {step < total - 1 ? (
            <button
              onClick={finish}
              className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          ) : (
            <span />
          )}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center pt-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full flex-col items-center"
            >
              <OnboardingVisual step={step} />
              <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
                {step === 0 ? "Welcome" : `Chapter ${step} of 3`}
              </p>
              <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground">
                {step === 0 ? "Welcome to Kashf" : SLIDES[step - 1].title}
              </h2>
              {step === 0 && (
                <p className="mt-4 max-w-xs font-display text-base font-medium tracking-tight text-foreground/80">
                  Your daily intelligence layer for the Gulf.
                </p>
              )}
              <p className="mt-4 max-w-[18rem] text-[15px] leading-relaxed text-muted-foreground">
                {step === 0
                  ? "Understand the stories, markets, and trends shaping the future of the Gulf region."
                  : SLIDES[step - 1].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pb-10">
          <div className="mb-6 flex justify-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={
                  "h-1 rounded-full transition-all duration-300 " +
                  (i === step ? "w-8 bg-primary" : "w-1.5 bg-white/15")
                }
              />
            ))}
          </div>
          <button
            onClick={next}
            className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold tracking-wide text-primary-foreground shadow-[0_10px_40px_-12px_oklch(0.83_0.13_85/0.55)] transition-transform active:scale-[0.98]"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    title: "Kashf Daily",
    description:
      "Receive AI-powered daily briefings covering Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman, and key developments from Pakistan.",
    Icon: Newspaper,
  },
  {
    title: "Kashf Lens",
    description:
      "Ask questions about markets, companies, economic events, and daily news. Get intelligent answers powered by context.",
    Icon: Sparkle,
  },
  {
    title: "Kashf Pulse",
    description:
      "Track markets, stocks, oil, gold, and major economic indicators in one place.",
    Icon: LineChart,
  },
] as const;

function OnboardingVisual({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl" />
        <KashfLogo size={120} />
      </div>
    );
  }
  const Icon = SLIDES[step - 1].Icon;
  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <div className="absolute inset-2 rounded-[28%] bg-gradient-to-br from-primary/20 via-transparent to-transparent blur-2xl" />
      <div className="relative flex h-28 w-28 items-center justify-center rounded-[26%] border border-white/[0.06] bg-gradient-to-br from-[oklch(0.2_0.01_260)] to-[oklch(0.13_0.008_260)]">
        <Icon className="h-10 w-10 text-primary" strokeWidth={1.4} />
      </div>
    </div>
  );
}