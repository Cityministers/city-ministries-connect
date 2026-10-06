import countries from "world-countries";
import { z } from "zod";

export const countryOptions = countries.map((country) => ({ code: country.cca2, name: country.name.common })).sort((a, b) => a.name.localeCompare(b.name));
export const countryCodes = new Set(countryOptions.map((country) => country.code));
export const countrySchema = z.string().trim().toUpperCase().refine((code) => countryCodes.has(code), "Choose a valid country.");
export const postalSchema = z.string().trim().max(20).refine((value) => !value || /^[\p{L}\p{N}][\p{L}\p{N} -]*$/u.test(value), "Enter a valid postal code.");
export const validLocation = (city: string, zip: string) => city.trim().length >= 2 || zip.trim().length >= 3;
export const countryName = (code: string) => countryOptions.find((item) => item.code === code)?.name ?? "United States";
/** Visitor's own country from the browser locale, so the map and forms open on their part of the world. */
export function defaultCountry(): string {
  try {
    if (typeof navigator === "undefined") return "US";
    const region = new Intl.Locale(navigator.language).region;
    if (region && countryCodes.has(region)) return region;
  } catch { /* Fall through to US. */ }
  return "US";
}
const flagsByCode = new Map(countries.map((country) => [country.cca2, country.flag]));
export const countryFlag = (code: string) => flagsByCode.get(code) ?? "🌐";
export const placeLabel = (city: string, zip: string, country: string) => [city, zip, countryName(country)].filter(Boolean).join(", ");
