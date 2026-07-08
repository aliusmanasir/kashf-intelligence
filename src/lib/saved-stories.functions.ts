import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaveSchema = z.object({
  story_id: z.string().max(200),
  headline: z.string().max(500),
  summary: z.string().max(2000).nullable().optional(),
  why_it_matters: z.string().max(2000).nullable().optional(),
  why_matters_to_you: z.string().max(2000).nullable().optional(),
  category: z.string().max(80).nullable().optional(),
  region: z.string().max(80).nullable().optional(),
  publisher: z.string().max(120).nullable().optional(),
  source_url: z.string().max(1000).nullable().optional(),
  section: z.string().max(40).nullable().optional(),
});

export type SavedStory = {
  id: string;
  story_id: string;
  headline: string;
  summary: string | null;
  why_it_matters: string | null;
  why_matters_to_you: string | null;
  category: string | null;
  region: string | null;
  publisher: string | null;
  source_url: string | null;
  section: string | null;
  created_at: string;
};

export const saveStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("saved_stories")
      .upsert(
        {
          user_id: userId,
          story_id: data.story_id,
          headline: data.headline,
          summary: data.summary ?? null,
          why_it_matters: data.why_it_matters ?? null,
          why_matters_to_you: data.why_matters_to_you ?? null,
          category: data.category ?? null,
          region: data.region ?? null,
          publisher: data.publisher ?? null,
          source_url: data.source_url ?? null,
          section: data.section ?? null,
        },
        { onConflict: "user_id,story_id" },
      );
    if (error) throw error;
    return { ok: true };
  });

export const unsaveStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ story_id: z.string().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("saved_stories")
      .delete()
      .eq("user_id", userId)
      .eq("story_id", data.story_id);
    if (error) throw error;
    return { ok: true };
  });

export const listSavedStories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SavedStory[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("saved_stories")
      .select("id, story_id, headline, summary, why_it_matters, why_matters_to_you, category, region, publisher, source_url, section, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as SavedStory[];
  });

export const listSavedStoryIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("saved_stories")
      .select("story_id")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.story_id as string);
  });