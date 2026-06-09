import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { dailyContextForAI } from "@/lib/kashf-data";

const AssetInput = z.object({
  symbol: z.string().min(1).max(32),
  name: z.string().min(1).max(120),
  price: z.number(),
  changePct: z.number(),
  currency: z.string().min(1).max(16),
  group: z.string().min(1).max(32),
});

function gateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

async function callModel(prompt: string, system: string) {
  const g = gateway();
  try {
    const r = await generateText({
      model: g("google/gemini-3-flash-preview"),
      system,
      prompt,
      temperature: 0.7,
    });
    return r.text;
  } catch {
    const r = await generateText({
      model: g("google/gemini-2.5-flash"),
      system,
      prompt,
    });
    return r.text;
  }
}

export type AnalystBrief = {
  summary: string;
  drivers: string[];
  risks: string[];
  watch: string[];
};

const BriefSchema = z.object({
  summary: z.string(),
  drivers: z.array(z.string()),
  risks: z.array(z.string()),
  watch: z.array(z.string()),
});

function extractJSON(raw: string): unknown {
  let s = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();
  if (!s.startsWith("{")) {
    const o = s.indexOf("{");
    const e = s.lastIndexOf("}");
    if (o !== -1 && e > o) s = s.slice(o, e + 1);
    else throw new Error("No JSON object found");
  }
  return JSON.parse(s);
}

export const getMarketAnalystBrief = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AssetInput.parse(d))
  .handler(async ({ data }): Promise<AnalystBrief> => {
    const system = `You are Kashf's lead Gulf markets analyst. Write like a senior FT / Bloomberg desk strategist: precise, sober, structural. No hype, no emoji, no disclaimers. Cite plausible drivers but never fabricate named quotes or specific transactions.`;
    const prompt = `Asset: ${data.name} (${data.symbol})
Group: ${data.group}
Last price: ${data.price} ${data.currency}
Session change: ${data.changePct.toFixed(2)}%

Today's Gulf intelligence context:
${dailyContextForAI()}

Return ONLY a valid JSON object with this exact shape:
{
  "summary": "2-3 sentence explanation of why this asset is moving today and what it means for Gulf investors.",
  "drivers": ["3-4 short bullet points naming the specific forces moving the price"],
  "risks": ["2-3 short bullets of the key downside risks to watch"],
  "watch": ["2-3 short bullets — upcoming catalysts or data points investors are watching next"]
}`;
    const raw = await callModel(prompt, system);
    const parsed = BriefSchema.parse(extractJSON(raw));
    return parsed;
  });

export const askMarketAnalyst = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        asset: AssetInput,
        question: z.string().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ answer: string }> => {
    const system = `You are Kashf's market analyst speaking directly to a sophisticated Gulf investor. Answer in 3-6 tight sentences. Be specific. No hedging filler, no "as an AI". No emoji. Plain prose, no markdown headings.`;
    const prompt = `Asset: ${data.asset.name} (${data.asset.symbol}) — ${data.asset.price} ${data.asset.currency}, session change ${data.asset.changePct.toFixed(2)}%.

Context from today's Kashf briefing:
${dailyContextForAI()}

User question: ${data.question}`;
    const answer = await callModel(prompt, system);
    return { answer: answer.trim() };
  });