import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { XMLParser } from "fast-xml-parser";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  resolveCountries,
  type EditionSlot,
  type RegionPreset,
} from "@/lib/personalization";
import { NEWS_FEEDS, type NewsFeed } from "@/lib/news-feeds";

const EnrichmentSchema = z.object({
  idx: z.number(),
  section: z
    .enum(["top", "business", "tech", "regional", "personal"])
    .optional()
    .default("business"),
  category: z.string().optional().default(""),
  whyItMatters: z.string(),
  whyMattersToYou: z.string().optional().default(""),
});
const EnrichmentBatchSchema = z.object({
  items: z.array(EnrichmentSchema),
});

function extractJSON(raw: string): unknown {
  let s = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();
  if (!s.startsWith("{") && !s.startsWith("[")) {
    const o = s.indexOf("{");
    const e = s.lastIndexOf("}");
    if (o !== -1 && e > o) s = s.slice(o, e + 1);
    else throw new Error("No JSON object found in model output");
  }
  return JSON.parse(s);
}

export type GeneratedStory = {
  id: string;
  section: "top" | "business" | "tech" | "regional" | "personal";
  category: string;
  region: string;
  headline: string;
  summary: string;
  whyItMatters: string;
  whyMattersToYou: string;
  hoursAgo: number;
  publisher: string;
  sourceUrl: string;
};
export type GeneratedBriefing = {
  date: string;
  edition: string;
  slot: EditionSlot;
  tagline: string;
  generatedAt: string;
  stories: GeneratedStory[];
};

const InputSchema = z.object({
  seed: z.number().optional(),
  slot: z.enum(["morning", "afternoon", "evening"]).default("morning"),
});

type RawItem = {
  title: string;
  link: string;
  description: string;
  publishedAt: number;
  publisher: string;
  region: string;
  defaultCategory: string;
};

function stripHtml(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(raw: unknown): number {
  if (!raw) return Date.now();
  const d = new Date(String(raw));
  const t = d.getTime();
  return Number.isFinite(t) ? t : Date.now();
}

async function fetchFeed(feed: NewsFeed, parser: XMLParser): Promise<RawItem[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; KashfBot/1.0; +https://kashf.app)",
        accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const xml = await res.text();
    const doc = parser.parse(xml);
    const channelItems = doc?.rss?.channel?.item ?? doc?.feed?.entry ?? [];
    const items = Array.isArray(channelItems) ? channelItems : [channelItems];
    return items
      .map((it: Record<string, unknown>): RawItem | null => {
        const title = stripHtml(String(it.title ?? ""));
        let link = "";
        if (typeof it.link === "string") link = it.link;
        else if (it.link && typeof it.link === "object") {
          const l = it.link as { ["@_href"]?: string; href?: string };
          link = l["@_href"] ?? l.href ?? "";
        }
        const description = stripHtml(
          String(it.description ?? it.summary ?? it["content:encoded"] ?? ""),
        ).slice(0, 600);
        const publishedAt = parseDate(it.pubDate ?? it.published ?? it.updated);
        if (!title || !link) return null;
        return {
          title,
          link,
          description,
          publishedAt,
          publisher: feed.publisher,
          region: feed.region,
          defaultCategory: feed.defaultCategory,
        };
      })
      .filter((x): x is RawItem => x !== null);
  } catch {
    return [];
  }
}

function dedupe(items: RawItem[]): RawItem[] {
  const seen = new Set<string>();
  const out: RawItem[] = [];
  for (const it of items) {
    const key = it.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").slice(0, 70);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

export const generateDailyBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<GeneratedBriefing> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { supabase, userId } = context;

    const { data: prefRow } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const preset = (prefRow?.region_preset as RegionPreset) ?? "global";
    const customCountries = prefRow?.countries ?? [];
    const interests = (prefRow?.interests ?? []) as string[];
    const goals = (prefRow?.goals ?? []) as string[];
    const education = (prefRow?.education ?? "") as string;
    const countries = resolveCountries(preset, customCountries);

    const { data: activity } = await supabase
      .from("reading_activity")
      .select("category, region")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    const catTally = new Map<string, number>();
    const regTally = new Map<string, number>();
    for (const row of activity ?? []) {
      if (row.category) catTally.set(row.category, (catTally.get(row.category) ?? 0) + 1);
      if (row.region) regTally.set(row.region, (regTally.get(row.region) ?? 0) + 1);
    }
    const topCats = [...catTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);
    const topRegs = [...regTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);

    // 1) Fetch real news in parallel
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const fetched = await Promise.all(
      NEWS_FEEDS.map((f) => fetchFeed(f, parser)),
    );
    let pool = dedupe(fetched.flat()).filter(
      (it) => Date.now() - it.publishedAt < 48 * 3600 * 1000,
    );
    pool.sort((a, b) => b.publishedAt - a.publishedAt);
    pool = pool.slice(0, 30);

    if (pool.length === 0) {
      throw new Error("No news available right now. Please try again shortly.");
    }

    const gateway = createLovableAiGatewayProvider(key);
    const now = new Date();
    const seed = data.seed ?? Date.now();
    const slot = data.slot;
    const edition =
      slot === "morning" ? "Morning Brief" : slot === "afternoon" ? "Afternoon Brief" : "Evening Recap";
    const tagline =
      slot === "morning"
        ? "What happened while you were asleep."
        : slot === "afternoon"
          ? "Most important developments today."
          : "What mattered today.";

    const geoLine =
      countries.length === 0
        ? "Reader has no geographic preference; treat any region as relevant."
        : `Reader's geographic focus: ${countries.join(", ")}.`;

    const personaLines: string[] = [];
    if (education) personaLines.push(`Education: ${education}.`);
    if (interests.length) personaLines.push(`Interests: ${interests.join(", ")}.`);
    if (goals.length) personaLines.push(`Long-term goals: ${goals.join(", ")}.`);
    if (topCats.length) personaLines.push(`Recently engaged categories: ${topCats.join(", ")}.`);
    if (topRegs.length) personaLines.push(`Recently engaged regions: ${topRegs.join(", ")}.`);
    const personaBlock =
      personaLines.length > 0
        ? personaLines.join("\n")
        : "No stated interests yet — write whyMattersToYou as a concise, smart general explanation for an ambitious, curious Gulf-region reader.";

    const articlesBlock = pool
      .map(
        (it, i) =>
          `[${i}] (${it.publisher} \u00b7 ${it.region}) ${it.title}\n${it.description}`,
      )
      .join("\n\n");

    const prompt = `You are the editor-in-chief of Kashf, a premium daily intelligence briefing for ambitious Gulf-region readers covering finance, business, markets, technology, policy, and macro.

You are given ${pool.length} REAL news articles published in the last 48 hours, each prefixed with [idx]. Do NOT invent stories. Do NOT change the headlines.
For each article, decide whether it deserves inclusion in today's ${edition}. Select the BEST 16-20 articles (skip duplicates, fluff, low-signal pieces), and for each selected article produce an enrichment object.

${geoLine}

Reader profile — use to write a SPECIFIC personal whyMattersToYou per story:
${personaBlock}

Section assignment rules:
- "top" -> 3-4 of the highest-impact stories overall.
- "regional" -> 3-4 stories in the reader's geographic focus (or major Gulf moves if focus is global).
- "tech" -> 2-3 technology, AI, startup, or VC stories.
- "personal" -> 2-3 stories that best align with the reader's stated interests/goals.
- "business" -> remaining selected business/finance/markets/energy stories.

For each selected article output:
- idx: original [idx] integer (REQUIRED).
- section: one of top|business|tech|regional|personal.
- category: short Bloomberg-style label (Markets, Energy, Real Estate, Tech & VC, Banking, Policy, Macro, Startups, Commodities, AI, Geopolitics, Crypto).
- whyItMatters: 2-3 sentences of institutional analyst insight — structural implication, what sophisticated readers watch next. Sober, precise, no hype.
- whyMattersToYou: 1-3 sentences addressed directly to the reader ("you", "your"), tying this story to a SPECIFIC element of the profile above. Never generic. Never repeat whyItMatters.

Seed: ${seed}. Articles:
${articlesBlock}

Return ONLY valid JSON, no prose, no markdown fences:
{"items":[{"idx":number,"section":string,"category":string,"whyItMatters":string,"whyMattersToYou":string}]}`;

    const runModel = async (model: string) => {
      const res = await generateText({
        model: gateway(model),
        prompt,
        temperature: 0.6,
      });
      return EnrichmentBatchSchema.parse(extractJSON(res.text));
    };

    let object: z.infer<typeof EnrichmentBatchSchema>;
    try {
      object = await runModel("google/gemini-3-flash-preview");
    } catch {
      object = await runModel("google/gemini-2.5-flash");
    }

    const stories: GeneratedStory[] = [];
    const usedIdx = new Set<number>();
    for (const en of object.items ?? []) {
      const src = pool[en.idx];
      if (!src || usedIdx.has(en.idx)) continue;
      usedIdx.add(en.idx);
      const hoursAgo = Math.max(
        0,
        Math.min(48, Math.round((Date.now() - src.publishedAt) / 3600_000)),
      );
      stories.push({
        id: `${seed}-${en.idx}`,
        section: en.section,
        category: en.category || src.defaultCategory,
        region: src.region,
        headline: src.title,
        summary: src.description || src.title,
        whyItMatters: en.whyItMatters,
        whyMattersToYou: en.whyMattersToYou ?? "",
        hoursAgo,
        publisher: src.publisher,
        sourceUrl: src.link,
      });
      if (stories.length >= 22) break;
    }

    return {
      date: now.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      edition,
      slot,
      tagline,
      generatedAt: now.toISOString(),
      stories,
    };
  });