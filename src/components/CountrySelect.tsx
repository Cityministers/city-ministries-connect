import { useTranslation } from "react-i18next";
import { countryOptions } from "@/lib/country";

export function CountrySelect({ value, onChange, className }: { value: string; onChange: (code: string) => void; className: string }) {
  const { t } = useTranslation();
  return <label className="flex min-w-0 flex-col gap-2 text-base text-mist/80">
    <span>{t("Country")}</span>
    <select required aria-label={t("Country")} value={value} onChange={(event) => onChange(event.target.value)} className={className}>
      {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
    </select>
  </label>;
}
