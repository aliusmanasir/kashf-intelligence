import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { AppHeader, KashfMark } from "@/components/BottomTabs";
import {
  checkIsAdmin,
  claimFirstAdmin,
  createUploadUrl,
  deleteEpisode,
  listAllEpisodes,
  upsertEpisode,
  type VoiceEpisode,
} from "@/lib/voice-content.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Plus,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Kashf · Studio" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const fetchAdmin = useServerFn(checkIsAdmin);
  const claim = useServerFn(claimFirstAdmin);
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const admin = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => fetchAdmin(),
    staleTime: 5 * 60_000,
  });

  if (admin.isLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  if (!admin.data?.isAdmin)
    return (
      <div className="mx-auto max-w-sm px-6 py-20 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-primary">
          Studio access
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          Restricted area
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The Kashf Studio is reserved for editorial administrators. If you are
          the first member of this workspace, you can claim admin access now.
        </p>
        <button
          disabled={claiming}
          onClick={async () => {
            setClaiming(true);
            try {
              const res = await claim();
              if (res.granted) {
                qc.invalidateQueries({ queryKey: ["is-admin"] });
              } else {
                setClaimMsg(res.reason ?? "An admin already exists.");
              }
            } catch (e) {
              setClaimMsg(e instanceof Error ? e.message : "Failed");
            } finally {
              setClaiming(false);
            }
          }}
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
          Claim admin access
        </button>
        {claimMsg && <p className="mt-4 text-xs text-muted-foreground">{claimMsg}</p>}
        <button
          onClick={() => navigate({ to: "/voice" })}
          className="mt-6 block w-full text-xs text-muted-foreground hover:text-foreground"
        >
          Back to Kashf Voice
        </button>
      </div>
    );

  return <AdminInner />;
}

function AdminInner() {
  const fetchAll = useServerFn(listAllEpisodes);
  const removeFn = useServerFn(deleteEpisode);
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin-episodes"],
    queryFn: () => fetchAll(),
  });
  const [editing, setEditing] = useState<VoiceEpisode | "new" | null>(null);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this episode?")) return;
    await removeFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-episodes"] });
    qc.invalidateQueries({ queryKey: ["voice-episodes"] });
  };

  return (
    <div>
      <AppHeader
        eyebrow="Studio · Admin"
        title="Voice Content"
        right={<KashfMark />}
      />

      <div className="px-5 pt-4">
        <button
          onClick={() => setEditing("new")}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New episode
        </button>
      </div>

      <ul className="mt-6 space-y-2 px-5">
        {list.isLoading && (
          <li className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </li>
        )}
        {list.data?.length === 0 && (
          <li className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            No episodes yet. Publish the first one and Kashf Voice will go live.
          </li>
        )}
        {list.data?.map((ep) => (
          <li
            key={ep.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {ep.thumbnail_url && (
                <img src={ep.thumbnail_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {ep.content_type} {ep.published ? "· Published" : "· Draft"}
              </p>
              <p className="truncate text-sm font-medium text-foreground">{ep.title}</p>
            </div>
            <button
              onClick={() => setEditing(ep)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(ep.id)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {editing && (
        <EpisodeEditor
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["admin-episodes"] });
            qc.invalidateQueries({ queryKey: ["voice-episodes"] });
          }}
        />
      )}
    </div>
  );
}

type Form = {
  id?: string;
  title: string;
  show_name: string;
  description: string;
  content_type: "podcast" | "video" | "analysis";
  duration: string;
  thumbnail_url: string;
  media_url: string;
  published: boolean;
  publish_at: string;
};

function EpisodeEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: VoiceEpisode | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const save = useServerFn(upsertEpisode);
  const signUpload = useServerFn(createUploadUrl);
  const [form, setForm] = useState<Form>({
    id: initial?.id,
    title: initial?.title ?? "",
    show_name: initial?.show_name ?? "Kashf",
    description: initial?.description ?? "",
    content_type: initial?.content_type ?? "podcast",
    duration: initial?.duration ?? "",
    thumbnail_url: initial?.thumbnail_url ?? "",
    media_url: initial?.media_url ?? "",
    published: initial?.published ?? false,
    publish_at: initial?.publish_at?.slice(0, 16) ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (bucket: "kashf-thumbnails" | "kashf-media", file: File) => {
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
    const sig = await signUpload({ data: { bucket, filename: safeName } });
    const { error } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(sig.path, sig.token, file, { contentType: file.type });
    if (error) throw error;
    return sig.readUrl;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await save({
        data: {
          id: form.id,
          title: form.title,
          show_name: form.show_name || null,
          description: form.description || null,
          content_type: form.content_type,
          duration: form.duration || null,
          thumbnail_url: form.thumbnail_url || null,
          media_url: form.media_url || null,
          published: form.published,
          publish_at: form.publish_at ? new Date(form.publish_at).toISOString() : null,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-md sm:items-center">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold tracking-tight">
            {form.id ? "Edit episode" : "New episode"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <Field label="Title" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Field label="Show" value={form.show_name} onChange={(v) => setForm({ ...form, show_name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Type
              </span>
              <select
                value={form.content_type}
                onChange={(e) => setForm({ ...form, content_type: e.target.value as Form["content_type"] })}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="podcast">Podcast</option>
                <option value="video">Video</option>
                <option value="analysis">Analysis</option>
              </select>
            </label>
            <Field label="Duration" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} placeholder="32 min" />
          </div>
          <TextArea
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />

          <FileField
            label="Thumbnail"
            url={form.thumbnail_url}
            accept="image/*"
            onUpload={async (f) => setForm({ ...form, thumbnail_url: await upload("kashf-thumbnails", f) })}
          />
          <FileField
            label="Media (audio / video)"
            url={form.media_url}
            accept="audio/*,video/*"
            onUpload={async (f) => setForm({ ...form, media_url: await upload("kashf-media", f) })}
          />

          <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <span className="flex flex-1 items-center gap-2 text-sm">
              {form.published ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              Published
            </span>
          </label>
          <Field
            label="Schedule (optional)"
            type="datetime-local"
            value={form.publish_at}
            onChange={(v) => setForm({ ...form, publish_at: v })}
          />

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            disabled={busy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {form.id ? "Save changes" : "Create episode"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function FileField({
  label,
  url,
  accept,
  onUpload,
}: {
  label: string;
  url: string;
  accept: string;
  onUpload: (f: File) => Promise<void>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background text-xs text-muted-foreground hover:border-primary/50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {url ? "Replace file" : "Upload file"}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline"
          >
            Preview
          </a>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            await onUpload(f);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
            if (ref.current) ref.current.value = "";
          }
        }}
      />
    </div>
  );
}