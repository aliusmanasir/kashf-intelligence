import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  resolveCountries,
  type EditionSlot,
  type RegionPreset,
} from "@/lib/personalization";

const StorySchema = z.object({
  category: z.string(),
  region: z.string(),
  headline: z.string(),
  summary: z.string(),
  whyItMatters: z.string(),
  whyMattersToYou: z.string().optional().default(""),
  section: z
    .enum(["top", "business", "tech", "regional", "personal"])
    .optional()
    .default("top"),
  hoursAgo: z.number(),
});
const BriefingSchema = z.object({ stories: z.array(StorySchema) });

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

export type GeneratedStory = z.infer<typeof StorySchema> & { id: string };
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

export const generateDailyBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<GeneratedBriefing> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { supabase, userId } = context;

    // Load preferences (best-effort; fall back to defaults)
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

    // Recent engagement signals (last 200 rows)
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
        ? "Cover the most consequential global stories with strong Gulf relevance."
        : `Prioritize stories from: ${countries.join(", ")}. Include limited global context (oil, Fed, China) only when materially relevant.`;

    const personaLines: string[] = [];
    if (education) personaLines.push(`Education: ${education}.`);
    if (interests.length) personaLines.push(`Interests: ${interests.join(", ")}.`);
    if (goals.length) personaLines.push(`Long-term goals: ${goals.join(", ")}.`);
    if (topCats.length) personaLines.push(`Recently engaged categories: ${topCats.join(", ")}.`);
    if (topRegs.length) personaLines.push(`Recently engaged regions: ${topRegs.join(", ")}.`);
    const personaBlock =
      personaLines.length > 0
        ? personaLines.join("\n")
        : "No stated interests yet — write whyMattersToYou as a concise, smart general explanation for an ambitious, curious reader.";

    const prompt = `You are the editor-in-chief of Kashf, a premium daily intelligence briefing on Gulf and globally consequential finance, business, markets, technology, policy, and society.

Generate a FRESH ${edition} for ${now.toUTCString()} (seed: ${seed}).
Each refresh must produce different, non-duplicate stories — vary angles, regions, sectors.

Geography rules:
${geoLine}

Reader profile (use to write a SPECIFIC, personal whyMattersToYou for each story — never generic):
${personaBlock}

Produce EXACTLY 18 stories distributed across these sections (use the "section" field):
- "top": 4 of today's most consequential stories.
- "business": 4 business, finance, markets, banking, real estate, energy stories.
- "tech": 3 technology, AI, startups, VC stories.
- "regional": 4 stories specifically from the user's selected geography (or major regional moves if geography is global).
- "personal": 3 stories chosen to align with the reader's interests and goals above.

Each story must include:
- headline: tight, Bloomberg/FT style, max ~110 chars, no clickbait.
- summary: 3-5 concise sentences of factual reporting. State what happened, who is involved, key numbers, immediate context. Use plausible figures as indicative; do not fabricate named-person quotes.
- whyItMatters: 2-3 sentences of institutional analyst insight — structural implication and what sophisticated readers should watch next.
- whyMattersToYou: 1-3 sentences addressing the reader DIRECTLY ("you", "your") and tying THIS story to THEIR stated interests / goals / education / engagement signals above. Reference at least one specific element from their profile. Never generic, never repeat whyItMatters.
- section: one of "top" | "business" | "tech" | "regional" | "personal".
- category: short label such as Markets, Energy, Real Estate, Tech & VC, Banking, Policy, Macro, Startups, Commodities, AI, Geopolitics.
- region: country or region name.
- hoursAgo: integer 0-24 indicating recency.

Tone: institutional, sober, precise. Never hype. Treat the reader as ambitious and intelligent.

Return ONLY a valid JSON object — no prose, no markdown fences — shape:
{"stories":[{"section":string,"category":string,"region":string,"headline":string,"summary":string,"whyItMatters":string,"whyMattersToYou":string,"hoursAgo":number}]}`;

    const runModel = async (model: string) => {
      const res = await generateText({
        model: gateway(model),
        prompt,
        temperature: 0.9,
      });
      return BriefingSchema.parse(extractJSON(res.text));
    };

    let object: z.infer<typeof BriefingSchema>;
    try {
      object = await runModel("google/gemini-3-flash-preview");
    } catch {
      object = await runModel("google/gemini-2.5-flash");
    }

    const stories = (object.stories ?? []).slice(0, 22);

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
      stories: stories.map((s, i) => ({
        ...s,
        hoursAgo: Math.min(24, Math.max(0, Math.round(s.hoursAgo ?? 0))),
        id: `${seed}-${i}`,
      })),
    };
  });