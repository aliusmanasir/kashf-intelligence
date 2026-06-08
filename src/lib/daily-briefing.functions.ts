import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const StorySchema = z.object({
  category: z.enum([
    "Markets",
    "Energy",
    "Real Estate",
    "Tech & VC",
    "Banking",
    "Policy",
    "Macro",
    "Startups",
    "Commodities",
  ]),
  region: z.enum([
    "Saudi Arabia",
    "UAE",
    "Qatar",
    "Kuwait",
    "Bahrain",
    "Oman",
    "GCC",
    "Global",
  ]),
  headline: z.string(),
  summary: z.string(),
  whyItMatters: z.string(),
  hoursAgo: z.number().min(0).max(24),
});

const BriefingSchema = z.object({
  stories: z.array(StorySchema).min(6).max(8),
});

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
- summary: 2-3 sentences of factual reporting tone. Use plausible figures but mark them as indicative; do not fabricate quotes from named individuals.
- whyItMatters: 1-2 sentences of analyst insight — the structural implication for Gulf markets/power/economy.
- region & category from the allowed enums.
- hoursAgo: integer 0-24 indicating recency.

Tone: institutional, sober, precise. Never hype. Avoid speculation framed as fact. Treat the reader as a sophisticated GCC investor or policymaker.`;

    const { object } = await generateObject({
      model: gateway("google/gemini-3-flash-preview"),
      schema: BriefingSchema,
      prompt,
      temperature: 0.9,
    });

    return {
      date: now.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      edition,
      generatedAt: now.toISOString(),
      stories: object.stories.map((s, i) => ({ ...s, id: `${seed}-${i}` })),
    };
  });