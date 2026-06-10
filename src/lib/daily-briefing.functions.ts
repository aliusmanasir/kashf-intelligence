import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const StorySchema = z.object({
  category: z.string(),
  region: z.string(),
  headline: z.string(),
  summary: z.string(),
  whyItMatters: z.string(),
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
  generatedAt: string;
  stories: GeneratedStory[];
};

export const generateDailyBriefing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const parsed = z
      .object({ seed: z.number().optional() })
      .parse(d ?? {});
    return parsed;
  })
  .handler(async ({ data }): Promise<GeneratedBriefing> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const now = new Date();
    const seed = data.seed ?? Date.now();
    const edition =
      now.getUTCHours() < 11
        ? "Morning Edition"
        : now.getUTCHours() < 16
          ? "Midday Edition"
          : "Evening Edition";

    const prompt = `You are the editor-in-chief of Kashf, a premium daily intelligence briefing on Gulf (GCC) finance, business, markets, and economic policy.

Generate a FRESH briefing for ${now.toUTCString()} (seed: ${seed}).
Each refresh must produce different, non-duplicate stories — vary angles, regions, sectors.

Produce 6-8 stories spanning a mix of:
- Saudi Arabia, UAE, Qatar, Kuwait, GCC, and relevant Global (oil/Fed) context.
- Categories: Markets, Energy, Real Estate, Tech & VC, Banking, Policy, Macro, Startups, Commodities.

Each story must include:
- headline: tight, Bloomberg/FT style, max ~110 chars, no clickbait.
- summary: EXACTLY 3 to 5 concise sentences of factual reporting. State what happened, who is involved, the key numbers, and the immediate context. Use plausible figures but mark them as indicative; do not fabricate quotes from named individuals.
- whyItMatters: EXACTLY 2 to 3 concise sentences of analyst insight — the structural implication for Gulf markets, business, or policy, and what sophisticated investors should now watch.
- region & category from the allowed enums.
- hoursAgo: integer 0-24 indicating recency.

Tone: institutional, sober, precise. Never hype. Avoid speculation framed as fact. Treat the reader as a sophisticated GCC investor or policymaker.

Return ONLY a valid JSON object — no prose, no markdown fences — with this exact shape:
{"stories":[{"category":string,"region":string,"headline":string,"summary":string,"whyItMatters":string,"hoursAgo":number}]}`;

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

    const stories = (object.stories ?? []).slice(0, 8);

    return {
      date: now.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      edition,
      generatedAt: now.toISOString(),
      stories: stories.map((s, i) => ({
        ...s,
        hoursAgo: Math.min(24, Math.max(0, Math.round(s.hoursAgo ?? 0))),
        id: `${seed}-${i}`,
      })),
    };
  });