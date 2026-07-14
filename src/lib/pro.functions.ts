import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FREE_LENS_DAILY_LIMIT = 15;

export type ProStatus = {
  isPro: boolean;
  status: "inactive" | "trialing" | "active" | "canceled";
  plan: "monthly" | "yearly" | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeIsPro(row: {
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
} | null): boolean {
  if (!row) return false;
  const now = Date.now();
  if (row.status === "active") {
    if (!row.current_period_end) return true;
    return new Date(row.current_period_end).getTime() > now;
  }
  if (row.status === "trialing") {
    if (!row.trial_end) return true;
    return new Date(row.trial_end).getTime() > now;
  }
  return false;
}

export const getMyProStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProStatus> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      isPro: computeIsPro(data as never),
      status: ((data?.status ?? "inactive") as ProStatus["status"]) ?? "inactive",
      plan: ((data?.plan as ProStatus["plan"]) ?? null),
      trialEnd: (data?.trial_end as string | null) ?? null,
      currentPeriodEnd: (data?.current_period_end as string | null) ?? null,
      cancelAtPeriodEnd: !!data?.cancel_at_period_end,
    };
  });

export const startProTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ plan: z.enum(["monthly", "yearly"]).default("yearly") }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<ProStatus> => {
    const { supabase, userId } = context;
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: row, error } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          status: "trialing",
          plan: data.plan,
          trial_end: trialEnd,
          current_period_end: trialEnd,
          cancel_at_period_end: false,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return {
      isPro: computeIsPro(row as never),
      status: row.status as ProStatus["status"],
      plan: (row.plan as ProStatus["plan"]) ?? null,
      trialEnd: row.trial_end,
      currentPeriodEnd: row.current_period_end,
      cancelAtPeriodEnd: !!row.cancel_at_period_end,
    };
  });

export const cancelPro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    await supabase
      .from("subscriptions")
      .update({ cancel_at_period_end: true, status: "canceled" })
      .eq("user_id", userId);
    return { ok: true };
  });

export type LensQuota = {
  isPro: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string; // ISO for next UTC midnight
};

function nextUtcMidnightISO(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.toISOString();
}

export const getLensQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LensQuota> => {
    const { supabase, userId } = context;
    const [{ data: sub }, { data: usage }] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("lens_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("day", todayUTC())
        .maybeSingle(),
    ]);
    const isPro = computeIsPro(sub as never);
    const used = usage?.message_count ?? 0;
    const limit = isPro ? Number.POSITIVE_INFINITY : FREE_LENS_DAILY_LIMIT;
    return {
      isPro,
      used,
      limit,
      remaining: isPro ? Number.POSITIVE_INFINITY : Math.max(0, FREE_LENS_DAILY_LIMIT - used),
      resetsAt: nextUtcMidnightISO(),
    };
  });

/** Atomically records a Lens message. Returns updated quota; blocks free users past limit. */
export const consumeLensMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LensQuota & { allowed: boolean }> => {
    const { supabase, userId } = context;
    const day = todayUTC();

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const isPro = computeIsPro(sub as never);

    const { data: existing } = await supabase
      .from("lens_usage")
      .select("id, message_count")
      .eq("user_id", userId)
      .eq("day", day)
      .maybeSingle();

    const currentUsed = existing?.message_count ?? 0;
    if (!isPro && currentUsed >= FREE_LENS_DAILY_LIMIT) {
      return {
        isPro: false,
        used: currentUsed,
        limit: FREE_LENS_DAILY_LIMIT,
        remaining: 0,
        resetsAt: nextUtcMidnightISO(),
        allowed: false,
      };
    }

    const nextCount = currentUsed + 1;
    if (existing) {
      await supabase
        .from("lens_usage")
        .update({ message_count: nextCount })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("lens_usage")
        .insert({ user_id: userId, day, message_count: nextCount });
    }

    return {
      isPro,
      used: nextCount,
      limit: isPro ? Number.POSITIVE_INFINITY : FREE_LENS_DAILY_LIMIT,
      remaining: isPro ? Number.POSITIVE_INFINITY : Math.max(0, FREE_LENS_DAILY_LIMIT - nextCount),
      resetsAt: nextUtcMidnightISO(),
      allowed: true,
    };
  });