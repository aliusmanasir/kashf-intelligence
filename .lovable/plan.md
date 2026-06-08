
# Kashf Premium Upgrade Plan

Transform Kashf from prototype into an App Store-ready premium financial intelligence app for the Gulf.

## 1. Authentication & Onboarding

**Welcome screen** (`/` redesign or new `/welcome`)
- Centered Kashf wordmark, tagline "Clarity in Gulf Markets"
- "Get Started" + "Sign In" CTAs
- Subtle gold accent, dark institutional feel

**Auth** (`/auth`)
- Email/password sign up + sign in (Lovable Cloud)
- Google sign-in via Lovable managed OAuth
- Configure social auth (Google enabled, email kept)

**First-time onboarding** (`/onboarding`)
- 3-slide carousel: Daily → Lens → Pulse
- Skip + Continue, dots indicator
- Stored in localStorage flag so it only shows once

**Auth gate**
- Move main app routes under `_authenticated/` layout (Daily/Lens/Pulse/Voice)
- `/`, `/welcome`, `/auth`, `/onboarding` remain public

## 2. Kashf Daily — AI-generated news feed

- Redesigned scrollable feed: Apple News / Bloomberg / FT styling
- Each card: category chip (Saudi / UAE / Oil / Markets / Startup), headline, 2–3 line summary, "Why it matters" callout, timestamp
- **Refresh system:**
  - Desktop: Refresh button top-right
  - Mobile: pull-to-refresh gesture ("Refreshing Kashf Daily…")
- **AI generation:**
  - New server function `generateDailyBriefing` calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with structured-output schema returning 6–8 fresh stories
  - Each refresh seeded with timestamp + randomness so no duplicates
  - Returns array of `{category, headline, summary, whyItMatters, timestamp}`
- TanStack Query caches per session; "Refresh" invalidates

## 3. Kashf Lens — Analyst AI chat

- Polished chat UI using AI Elements (Conversation, Message, PromptInput, Shimmer)
- Suggested prompts shown when empty: "Why did oil prices change today?", "Summarize today's Saudi market", "Explain this news simply"
- System prompt: senior Gulf markets analyst tone, grounded in latest daily briefing context
- Streaming via existing `/api/chat` route, updated system prompt + suggested prompts

## 4. Kashf Pulse — Clean dashboard

- Card grid: TASI, Aramco, SABIC, UAE (ADX), Oil (Brent), Gold, Bitcoin
- Each card: name, current price (JetBrains Mono), % change with green/red indicator, mini sparkline
- Lightweight inline SVG sparkline (no chart lib needed) seeded from mock data

## 5. Kashf Voice

- Clean media list: thumbnail, title, duration, play button
- Larger featured episode at top, scrollable list below

## 6. Navigation & Design

- Bottom tab bar polished (Daily/Lens/Pulse/Voice) — only shown on authenticated routes
- Refine `styles.css` tokens: deeper institutional bg, gold accent, refined card surfaces, subtle dividers
- Smooth framer-motion transitions on tab switch, card entry, pull-to-refresh
- Consistent header pattern across sections

## Technical Details

- **New files:**
  - `src/routes/welcome.tsx`, `src/routes/auth.tsx`, `src/routes/onboarding.tsx`
  - `src/routes/_authenticated/route.tsx` (managed pattern), `_authenticated/daily.tsx`, `_authenticated/lens.tsx`, `_authenticated/pulse.tsx`, `_authenticated/voice.tsx`
  - `src/lib/daily-briefing.functions.ts` — `generateDailyBriefing` serverFn using Lovable AI
  - `src/components/NewsCard.tsx`, `MarketCard.tsx`, `Sparkline.tsx`, `EpisodeCard.tsx`, `PullToRefresh.tsx`, `KashfLogo.tsx`
  - AI Elements installed: conversation, message, prompt-input, shimmer
- **Updated:** `src/routes/index.tsx` (redirect to welcome or daily based on auth), `__root.tsx` (auth listener, hide tabs on public routes), `BottomTabs.tsx`, `styles.css`, `start.ts` (attachSupabaseAuth), `api/chat.ts` (improved system prompt + briefing context)
- **Auth:** `supabase--configure_social_auth` with Google
- **AI:** Lovable AI Gateway, structured output via Zod schema for daily briefing
- No payments, no extra secrets needed (LOVABLE_API_KEY present)
