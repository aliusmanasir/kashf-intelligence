import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { dailyContextForAI } from "@/lib/kashf-data";

const SYSTEM_PROMPT = `You are Kashf Lens, an AI financial intelligence analyst focused on the Gulf (GCC): Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman, plus relevant global context (oil, Fed, commodities).

Your job is to help users understand money, markets, and power in the Gulf — clearly and seriously.

Style:
- Speak like a senior analyst at an institutional desk: precise, sober, confident, never hype.
- Be concise. Short paragraphs. Use bullets when listing.
- Explain jargon in plain language without being condescending.
- When relevant, separate "what happened" from "why it matters".
- If a question is outside Gulf finance/business/economics, answer briefly and steer back.
- Never invent specific numbers, prices, or quotes. If you don't know, say so.

Today's Kashf Daily briefing (use as context when relevant — cite by headline, never by index):
---
${dailyContextForAI()}
---`;

type Body = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});