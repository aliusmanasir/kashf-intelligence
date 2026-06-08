export type DailyStory = {
  id: string;
  category: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  region: "Saudi Arabia" | "UAE" | "Qatar" | "Kuwait" | "Bahrain" | "Oman" | "GCC" | "Global";
};

export const dailyBriefing = {
  date: "Monday, June 8, 2026",
  edition: "Morning Edition",
  stories: [
    {
      id: "1",
      category: "Energy",
      region: "Saudi Arabia",
      headline: "Aramco signals expanded LNG push as Q2 capex climbs 14%",
      summary:
        "Saudi Aramco committed an additional $4.2B to gas infrastructure this quarter, accelerating its 2030 LNG export target.",
      whyItMatters:
        "This is a structural pivot. Aramco moving aggressively into gas means the Kingdom is diversifying revenue away from crude — and competing directly with Qatar in global LNG markets.",
    },
    {
      id: "2",
      category: "Markets",
      region: "GCC",
      headline: "TASI closes at record high, led by financials and PIF-linked names",
      summary:
        "The Saudi benchmark gained 1.8% to close at 13,420, with Al Rajhi and SNB driving most of the move on strong loan growth data.",
      whyItMatters:
        "Liquidity from Vision 2030 spending is rotating into the banking sector. Watch for continued strength if H2 IPO pipeline materializes.",
    },
    {
      id: "3",
      category: "Real Estate",
      region: "UAE",
      headline: "Dubai off-plan transactions hit AED 38B in May — a new monthly record",
      summary:
        "Off-plan sales now account for 67% of total Dubai property volume, with end-users outpacing investors for the first time since 2022.",
      whyItMatters:
        "End-user dominance is a healthier signal than speculator-led cycles. But the supply pipeline through 2028 is the largest in a decade — concentration risk is building.",
    },
    {
      id: "4",
      category: "Commodities",
      region: "Global",
      headline: "Brent crude steady at $84 ahead of OPEC+ technical meeting",
      summary:
        "Traders are positioned cautiously as the JMMC reviews compliance data Wednesday. No production change is expected, but Saudi-Russia signaling will set tone.",
      whyItMatters:
        "Price stability near $80 is the Kingdom's fiscal sweet spot — enough to fund giga-projects without provoking demand destruction.",
    },
    {
      id: "5",
      category: "Tech & VC",
      region: "Saudi Arabia",
      headline: "PIF-backed Humain raises $1.5B in largest MENA AI round to date",
      summary:
        "The Riyadh-based AI infrastructure company closed funding at a $12B valuation, with NVIDIA and AMD participating.",
      whyItMatters:
        "Saudi Arabia is positioning to become the AI compute hub between Asia and Europe. This raise validates the sovereign-tech playbook PIF has been running for two years.",
    },
    {
      id: "6",
      category: "Policy",
      region: "UAE",
      headline: "UAE CBUAE holds rates, hints at first cut before Fed",
      summary:
        "The central bank kept its base rate at 5.40%, but the policy statement removed prior language about 'continued vigilance' on inflation.",
      whyItMatters:
        "A pre-Fed cut would be a notable departure from the dirham peg playbook. Mortgage rates and bank margins would re-price quickly.",
    },
  ] satisfies DailyStory[],
};

export function dailyContextForAI(): string {
  return dailyBriefing.stories
    .map(
      (s, i) =>
        `[${i + 1}] (${s.region} • ${s.category}) ${s.headline}\nSummary: ${s.summary}\nWhy it matters: ${s.whyItMatters}`,
    )
    .join("\n\n");
}

export type MarketTick = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  group: "Index" | "Equity" | "Commodity" | "Crypto";
};

export const markets: MarketTick[] = [
  { symbol: "TASI", name: "Saudi Tadawul All Share", price: 13420.55, change: 237.4, changePct: 1.8, currency: "pts", group: "Index" },
  { symbol: "ADX", name: "Abu Dhabi Securities", price: 9612.1, change: 42.8, changePct: 0.45, currency: "pts", group: "Index" },
  { symbol: "DFM", name: "Dubai Financial Market", price: 5210.34, change: -11.2, changePct: -0.21, currency: "pts", group: "Index" },
  { symbol: "QE", name: "Qatar Exchange", price: 10880.2, change: 64.5, changePct: 0.6, currency: "pts", group: "Index" },
  { symbol: "2222.SR", name: "Saudi Aramco", price: 28.65, change: 0.35, changePct: 1.24, currency: "SAR", group: "Equity" },
  { symbol: "2010.SR", name: "SABIC", price: 74.2, change: -0.6, changePct: -0.8, currency: "SAR", group: "Equity" },
  { symbol: "1120.SR", name: "Al Rajhi Bank", price: 92.15, change: 2.1, changePct: 2.33, currency: "SAR", group: "Equity" },
  { symbol: "EMAAR.AE", name: "Emaar Properties", price: 8.42, change: 0.14, changePct: 1.69, currency: "AED", group: "Equity" },
  { symbol: "BRENT", name: "Brent Crude", price: 84.12, change: 0.45, changePct: 0.54, currency: "USD/bbl", group: "Commodity" },
  { symbol: "GOLD", name: "Gold Spot", price: 2412.8, change: 18.3, changePct: 0.76, currency: "USD/oz", group: "Commodity" },
  { symbol: "BTC", name: "Bitcoin", price: 71240, change: -890, changePct: -1.23, currency: "USD", group: "Crypto" },
];

export type Episode = {
  id: string;
  title: string;
  show: string;
  type: "Podcast" | "Video" | "Analysis";
  duration: string;
  date: string;
  description: string;
};

export const episodes: Episode[] = [
  {
    id: "e1",
    title: "The Aramco–Qatar LNG showdown, decoded",
    show: "Kashf Weekly",
    type: "Podcast",
    duration: "32 min",
    date: "Jun 7, 2026",
    description: "Inside Saudi Arabia's gas pivot and what it means for the next decade of energy geopolitics.",
  },
  {
    id: "e2",
    title: "Why TASI keeps making new highs",
    show: "Pulse Check",
    type: "Video",
    duration: "12 min",
    date: "Jun 6, 2026",
    description: "A simple breakdown of the liquidity, IPO pipeline, and bank earnings driving Saudi markets.",
  },
  {
    id: "e3",
    title: "Dubai property in 2026: bubble or boom?",
    show: "Kashf Deep Dive",
    type: "Analysis",
    duration: "48 min",
    date: "Jun 3, 2026",
    description: "Off-plan records, end-user share, and the supply pipeline through 2028.",
  },
  {
    id: "e4",
    title: "The rise of PIF-tech: Humain, Lucid, Neom",
    show: "Kashf Weekly",
    type: "Podcast",
    duration: "41 min",
    date: "May 31, 2026",
    description: "How sovereign capital is rewriting the rules of venture and industrial strategy.",
  },
  {
    id: "e5",
    title: "Monthly macro: Gulf vs. the Fed",
    show: "Kashf Monthly",
    type: "Analysis",
    duration: "55 min",
    date: "May 30, 2026",
    description: "Dollar pegs, real rates, and why the GCC may cut first.",
  },
];