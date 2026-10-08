import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GIFT_GROUPS } from "@/data/gift-groups";

/**
 * Grouped spiritual-gift picker. Each card may stand for several stored
 * gift names (merged duplicates), so older saved answers still show as picked.
 */
export function GiftGroupPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation();
  const count = GIFT_GROUPS.flatMap((g) => g.items).filter((item) =>
    item.values.some((v) => value.includes(v)),
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-base text-mist/80">
        {t("Choose your top 3 to 5 gifts")}
        <span className={`ml-2 font-semibold ${count >= 3 && count <= 5 ? "text-lemon" : "text-mist/70"}`}>
          · {t("{{count}} selected", { count })}
        </span>
      </p>
      {GIFT_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="font-display text-lg font-semibold text-sand">{t(group.title)}</h3>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {group.items.map((item) => {
              const on = item.values.some((v) => value.includes(v));
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    onChange(
                      on
                        ? value.filter((v) => !item.values.includes(v))
                        : [...value, ...item.values.filter((v) => !value.includes(v))],
                    )
                  }
                  className={`flex min-h-12 flex-col items-start gap-1 rounded-xl px-4 py-3 text-left transition active:scale-[0.98] ${
                    on
                      ? "bg-ink-soft shadow-[0_0_0_2px_var(--color-lemon)] ring-1 ring-lemon"
                      : "bg-ink-soft/70 ring-1 ring-mist/40 hover:bg-ink-soft hover:ring-mist/60"
                  }`}
                >
                  <span className="flex items-center gap-2 text-base font-semibold text-sand">
                    {on && <Check className="size-4 text-lemon" aria-hidden="true" />}
                    {t(item.label)}
                  </span>
                  <span className="text-sm leading-snug text-mist/75">{t(item.desc)}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
