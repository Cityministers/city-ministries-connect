import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { countryFlag, countryOptions } from "@/lib/country";

export function CountrySelect({ value, onChange, className, compact = false }: { value: string; onChange: (code: string) => void; className: string; compact?: boolean }) {
  const { t } = useTranslation();
  if (compact) {
    return (
      <label className={`relative inline-grid h-10 shrink-0 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 ${className ?? ""}`} title={t("Country")} style={{ width: "3.25rem" }}>
        <span aria-hidden="true" className="pointer-events-none flex items-center gap-0.5 text-lg leading-none">
          {countryFlag(value)}
          <ChevronDown className="size-3 text-mist/60" />
        </span>
        <select required aria-label={t("Country")} value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0">
          {countryOptions.map((country) => <option key={country.code} value={country.code}>{countryFlag(country.code)} {country.name}</option>)}
        </select>
      </label>
    );
  }
  return <label className={compact ? "min-w-0 shrink-0" : "flex min-w-0 flex-col gap-2 text-base text-mist/80"}>
    {!compact && <span>{t("Country")}</span>}
    <select required aria-label={t("Country")} value={value} onChange={(event) => onChange(event.target.value)} className={className}>
      {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
    </select>
  </label>;
}
