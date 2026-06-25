import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, BookmarkCheck, CreditCard, LogOut, Star, ShieldCheck, Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getMyPreferences,
  saveMyPreferences,
  getIntelligenceSignals,
  type UserPreferences,
} from "@/lib/preferences.functions";
import {
  INTEREST_OPTIONS,
  GOAL_OPTIONS,
  EDUCATION_OPTIONS,
  COUNTRY_OPTIONS,
  REGION_PRESETS,
  type RegionPreset,
} from "@/lib/personalization";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Kashf" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [user, setUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        const name = (u.user_metadata?.full_name as string | undefined) ?? "";
        setUser({ id: u.id, email: u.email ?? undefined, full_name: name });
        setFullName(name);
        setEmail(u.email ?? "");
      }
    });
  }, []);

  const flash = (tone: "ok" | "err", text: string) => {
    setMessage({ tone, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSavingProfile(false);
    if (error) flash("err", error.message);
    else flash("ok", "Name updated.");
  };

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email });
    setSavingEmail(false);
    if (error) flash("err", error.message);
    else flash("ok", "Confirmation sent to your new email.");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      flash("err", "Password must be at least 8 characters.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) flash("err", error.message);
    else {
      setPassword("");
      flash("ok", "Password updated.");
    }
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  const initials =
    (fullName || email || "K")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "K";

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
          <Link
            to="/daily"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Account</p>
        </div>
      </header>

      <section className="px-5 pt-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card font-display text-xl font-semibold text-foreground">
          {initials}
        </div>
        <h1 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground">
          {fullName || "Welcome"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{user?.email ?? ""}</p>
      </section>

      {message && (
        <div className="mx-5 mt-4">
          <p
            className={
              "rounded-lg border px-3 py-2 text-xs " +
              (message.tone === "ok"
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive")
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <PreferencesPanel onSaved={() => flash("ok", "Preferences saved.")} />
      <IntelligencePanel />

      <Section title="Profile">
        <form onSubmit={saveName} className="space-y-3 p-4">
          <Field label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {savingProfile ? "Saving…" : "Save name"}
          </button>
        </form>
      </Section>

      <Section title="Email">
        <form onSubmit={saveEmail} className="space-y-3 p-4">
          <Field label="Email address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
          <button
            type="submit"
            disabled={savingEmail || email === user?.email}
            className="w-full rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            {savingEmail ? "Sending…" : "Update email"}
          </button>
        </form>
      </Section>

      <Section title="Password">
        <form onSubmit={savePassword} className="space-y-3 p-4">
          <Field label="New password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </Field>
          <button
            type="submit"
            disabled={savingPassword || !password}
            className="w-full rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground disabled:opacity-50"
          >
            {savingPassword ? "Updating…" : "Change password"}
          </button>
        </form>
      </Section>

      <Section title="Coming soon">
        <ul className="divide-y divide-border">
          <Row icon={Bell} label="Notification settings" hint="Daily briefing alerts, market triggers" />
          <Row icon={CreditCard} label="Subscription" hint="Manage your Kashf plan" />
          <Row icon={BookmarkCheck} label="Saved articles" hint="Briefings you bookmarked" />
          <Row icon={Star} label="Saved assets" hint="Custom watchlists" />
          <Row icon={ShieldCheck} label="Security & sessions" hint="Devices, 2FA" />
        </ul>
      </Section>

      <div className="px-5 pt-6">
        <button
          onClick={signOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <p className="px-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
      <div className="mt-2 border-y border-border bg-card">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({ icon: Icon, label, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
      </div>
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Soon</span>
    </li>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function PreferencesPanel({ onSaved }: { onSaved: () => void }) {
  const loadPrefs = useServerFn(getMyPreferences);
  const savePrefs = useServerFn(saveMyPreferences);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<UserPreferences>({
    queryKey: ["my-preferences"],
    queryFn: () => loadPrefs(),
  });

  const [education, setEducation] = useState<string>("");
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [preset, setPreset] = useState<RegionPreset>("global");
  const [countries, setCountries] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEducation(data.education ?? "");
    setInterests(data.interests);
    setGoals(data.goals);
    setPreset(data.region_preset);
    setCountries(data.countries);
  }, [data]);

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) => {
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await savePrefs({
        data: {
          education: education || null,
          interests,
          goals,
          countries,
          region_preset: preset,
          onboarded: true,
        },
      });
      await qc.invalidateQueries({ queryKey: ["my-preferences"] });
      await qc.invalidateQueries({ queryKey: ["kashf-daily"] });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="What you care about">
      <div className="space-y-5 p-4">
        <p className="text-[12px] text-muted-foreground">
          Kashf personalizes every briefing — including a "Why this matters to you" line on
          every story — using your profile below.
        </p>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Education</p>
          <div className="flex flex-wrap gap-1.5">
            {EDUCATION_OPTIONS.map((opt) => (
              <Chip key={opt} active={education === opt} onClick={() => setEducation(education === opt ? "" : opt)}>
                {opt}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_OPTIONS.map((opt) => (
              <Chip key={opt} active={interests.includes(opt)} onClick={() => toggle(interests, setInterests, opt)}>
                {opt}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Long-term goals</p>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_OPTIONS.map((opt) => (
              <Chip key={opt} active={goals.includes(opt)} onClick={() => toggle(goals, setGoals, opt)}>
                {opt}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Region focus</p>
          <div className="flex flex-wrap gap-1.5">
            {REGION_PRESETS.map((p) => (
              <Chip key={p.id} active={preset === p.id} onClick={() => setPreset(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {REGION_PRESETS.find((p) => p.id === preset)?.hint}
          </p>
        </div>

        {preset === "custom" && (
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Countries</p>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRY_OPTIONS.map((opt) => (
                <Chip key={opt} active={countries.includes(opt)} onClick={() => toggle(countries, setCountries, opt)}>
                  {opt}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={save}
          disabled={saving || isLoading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </Section>
  );
}

function IntelligencePanel() {
  const loadSignals = useServerFn(getIntelligenceSignals);
  const { data } = useQuery({
    queryKey: ["kashf-intelligence"],
    queryFn: () => loadSignals(),
  });

  const score = Math.min(100, (data?.totalEngagements ?? 0) * 2);

  return (
    <Section title="Kashf Intelligence Score">
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-foreground">Personalization signal</p>
              <p className="font-mono text-[12px] text-primary">{score}/100</p>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The more you read, expand, and ask Lens about stories, the sharper Kashf gets at
          surfacing what matters to you.
        </p>
        {data && data.topCategories.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">You read most</p>
            <div className="flex flex-wrap gap-1.5">
              {data.topCategories.slice(0, 5).map((c) => (
                <span key={c.name} className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-foreground">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}