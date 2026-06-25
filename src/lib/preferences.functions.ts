import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PrefsSchema = z.object({
  education: z.string().max(120).nullable().optional(),
  interests: z.array(z.string().max(40)).max(40).default([]),
  goals: z.array(z.string().max(60)).max(20).default([]),
  countries: z.array(z.string().max(60)).max(50).default([]),
  region_preset: z.enum(["global", "arab", "gcc", "custom"]).default("global"),
  onboarded: z.boolean().optional(),
});

export type UserPreferences = z.infer<typeof PrefsSchema> & {
  user_id: string;
  onboarded: boolean;
};

export const getMyPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserPreferences> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return {
        user_id: userId,
        education: null,
        interests: [],
        goals: [],
        countries: [],
        region_preset: "global",
        onboarded: false,
      };
    }
    return {
      user_id: data.user_id,
      education: data.education,
      interests: data.interests ?? [],
      goals: data.goals ?? [],
      countries: data.countries ?? [],
      region_preset: (data.region_preset as UserPreferences["region_preset"]) ?? "global",
      onboarded: data.onboarded ?? false,
    };
  });

export const saveMyPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PrefsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      education: data.education ?? null,
      interests: data.interests,
      goals: data.goals,
      countries: data.countries,
      region_preset: data.region_preset,
      onboarded: data.onboarded ?? true,
    };
    const { error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });

const ActivitySchema = z.object({
  story_id: z.string().max(120).optional(),
  headline: z.string().max(280).optional(),
  category: z.string().max(60).optional(),
  region: z.string().max(60).optional(),
  action: z.enum(["view", "expand", "ask_lens", "save", "skip"]),
});

export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ActivitySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("reading_activity").insert({
      user_id: userId,
      story_id: data.story_id ?? null,
      headline: data.headline ?? null,
      category: data.category ?? null,
      region: data.region ?? null,
      action: data.action,
    });
    if (error) throw error;
    return { ok: true };
  });

export type IntelligenceSignals = {
  topCategories: { name: string; count: number }[];
  topRegions: { name: string; count: number }[];
  totalEngagements: number;
};

export const getIntelligenceSignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntelligenceSignals> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("reading_activity")
      .select("category, region, action")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    const cat = new Map<string, number>();
    const reg = new Map<string, number>();
    for (const row of data ?? []) {
      const weight = row.action === "ask_lens" || row.action === "save" ? 3 : row.action === "expand" ? 2 : 1;
      if (row.category) cat.set(row.category, (cat.get(row.category) ?? 0) + weight);
      if (row.region) reg.set(row.region, (reg.get(row.region) ?? 0) + weight);
    }
    const sort = (m: Map<string, number>) =>
      [...m.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    return {
      topCategories: sort(cat),
      topRegions: sort(reg),
      totalEngagements: data?.length ?? 0,
    };
  });