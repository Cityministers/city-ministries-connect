import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(1000),
  location: z.string().trim().min(3).max(200),
  zip: z.string().trim().max(12),
  starts_at: z.string().min(1),
});

const field = "w-full rounded-xl bg-ink px-3 py-3 text-lg text-sand ring-1 ring-mist/25 focus:outline-none focus:ring-lemon/60";

export function PostProjectForm({ userId, city, onPosted }: { userId: string; city: string; onPosted: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ title: "", description: "", location: "", zip: "", starts_at: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast.error(t("Please fill in a title, description, place and date.")); return; }
    const when = new Date(parsed.data.starts_at);
    if (isNaN(when.getTime()) || when.getTime() < Date.now()) { toast.error(t("Pick a future date and time.")); return; }
    setBusy(true);
    const { error } = await supabase.from("volunteer_projects").insert({
      owner_id: userId, status: "pending", city, title: parsed.data.title, description: parsed.data.description,
      location: parsed.data.location, zip: parsed.data.zip, starts_at: when.toISOString(),
    });
    setBusy(false);
    if (error) { toast.error(t("Could not post the project.")); return; }
    toast.success(t("Thanks! Your project was sent for approval. Volunteers are alerted once it's approved."));
    setF({ title: "", description: "", location: "", zip: "", starts_at: "" });
    setOpen(false);
    onPosted();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-tone-emerald/25 px-6 py-3 text-lg font-bold text-sand ring-1 ring-tone-emerald/60">
        <PlusCircle className="size-5" aria-hidden="true" />{t("Post a group project")}
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3 rounded-2xl bg-ink-soft/50 p-5 ring-1 ring-tone-emerald/50">
      <h3 className="font-display text-2xl font-semibold">{t("Post a group project")}</h3>
      <label className="flex flex-col gap-1 text-base text-mist/90">{t("Project title")}
        <input className={field} maxLength={120} value={f.title} onChange={set("title")} placeholder={t("e.g. Park cleanup")} />
      </label>
      <label className="flex flex-col gap-1 text-base text-mist/90">{t("What will volunteers do?")}
        <textarea className={`${field} min-h-28`} maxLength={1000} value={f.description} onChange={set("description")} />
      </label>
      <label className="flex flex-col gap-1 text-base text-mist/90">{t("Date and time")}
        <input type="datetime-local" className={field} value={f.starts_at} onChange={set("starts_at")} />
      </label>
      <label className="flex flex-col gap-1 text-base text-mist/90">{t("Meeting place")}
        <input className={field} maxLength={200} value={f.location} onChange={set("location")} placeholder={t("Address or landmark")} />
      </label>
      <label className="flex flex-col gap-1 text-base text-mist/90">{t("Postal code (optional)")}
        <input className={field} maxLength={12} value={f.zip} onChange={set("zip")} />
      </label>
      <p className="text-sm text-mist/75">{t("Projects appear after an admin approves them.")} · {city}</p>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="rounded-full bg-lemon px-6 py-3 text-lg font-bold text-ink disabled:opacity-60">{t("Submit for approval")}</button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-3 text-lg text-mist/85 ring-1 ring-mist/30">{t("Cancel")}</button>
      </div>
    </form>
  );
}
