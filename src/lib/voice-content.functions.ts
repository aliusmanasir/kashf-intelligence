import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VoiceEpisode = {
  id: string;
  title: string;
  show_name: string | null;
  description: string | null;
  content_type: "podcast" | "video" | "analysis";
  thumbnail_url: string | null;
  media_url: string | null;
  duration: string | null;
  published: boolean;
  publish_at: string | null;
  created_at: string;
  updated_at: string;
};

// Public: published episodes only (visible to any signed-in user via RLS)
export const listPublishedEpisodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VoiceEpisode[]> => {
    const { data, error } = await context.supabase
      .from("voice_content")
      .select("*")
      .eq("published", true)
      .or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as VoiceEpisode[];
  });

// Admin: all episodes including drafts
export const listAllEpisodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VoiceEpisode[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("voice_content")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as VoiceEpisode[];
  });

const EpisodeInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  show_name: z.string().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  content_type: z.enum(["podcast", "video", "analysis"]),
  thumbnail_url: z.string().url().nullable().optional(),
  media_url: z.string().url().nullable().optional(),
  duration: z.string().max(20).nullable().optional(),
  published: z.boolean().default(false),
  publish_at: z.string().datetime().nullable().optional(),
});

export const upsertEpisode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EpisodeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.userId);
    const payload = { ...data, created_by: context.userId };
    const { data: row, error } = data.id
      ? await supabaseAdmin.from("voice_content").update(payload).eq("id", data.id).select().single()
      : await supabaseAdmin.from("voice_content").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteEpisode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("voice_content").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

// One-time bootstrap: the first signed-in user to call this becomes admin.
// After any admin exists, this is a no-op.
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ granted: boolean; reason?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) > 0) return { granted: false, reason: "Admin already exists" };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { granted: true };
  });

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

// Signed upload URL — admins request a path inside the bucket
export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        bucket: z.enum(["kashf-thumbnails", "kashf-media"]),
        filename: z.string().min(1).max(200).regex(/^[A-Za-z0-9._-]+$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.userId);
    const path = `${context.userId}/${Date.now()}-${data.filename}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from(data.bucket).getPublicUrl(path);
    // Buckets are private — generate a long-lived signed URL for read access
    const { data: read } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    return {
      uploadUrl: signed.signedUrl,
      token: signed.token,
      path,
      readUrl: read?.signedUrl ?? pub.publicUrl,
    };
  });