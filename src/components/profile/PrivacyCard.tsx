import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Switch } from "@/components/ui/switch";
import { getMyPrivacy, updateMyPrivacy } from "@/lib/profile.functions";

const ROWS = [
  { field: "show_ministries", key: "showMinistries", label: "Show my ministries" },
  { field: "show_needs", key: "showNeeds", label: "Show my needs" },
  { field: "show_prayers", key: "showPrayers", label: "Show my prayers" },
] as const;

export function PrivacyCard() {
  const qc = useQueryClient();
  const fetch = useServerFn(getMyPrivacy);
  const save = useServerFn(updateMyPrivacy);
  const { data } = useQuery({ queryKey: ["my-privacy"], queryFn: () => fetch() });
  if (!data) return null;
  return (
    <section className="rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
      <h2 className="font-display text-xl font-semibold text-sand">Profile privacy</h2>
      <p className="mt-1 text-base text-mist/80">Choose what other members see on your profile. Anonymous prayers never show.</p>
      <div className="mt-3 flex flex-col gap-3">
        {ROWS.map((r) => (
          <label key={r.field} className="flex items-center justify-between gap-3 text-base text-sand">
            {r.label}
            <Switch
              checked={data[r.key]}
              onCheckedChange={async (v) => {
                qc.setQueryData(["my-privacy"], { ...data, [r.key]: v });
                try { await save({ data: { field: r.field, value: v } }); }
                catch { qc.setQueryData(["my-privacy"], data); }
              }}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
