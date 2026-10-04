import countries from "world-countries";
import { z } from "zod";

export const countryOptions = countries.map((country) => ({ code: country.cca2, name: country.name.common })).sort((a, b) => a.name.localeCompare(b.name));
export const countryCodes = new Set(countryOptions.map((country) => country.code));
export const countrySchema = z.string().trim().toUpperCase().refine((code) => countryCodes.has(code), "Choose a valid country.");
export const postalSchema = z.string().trim().max(20).refine((value) => !value || /^[\p{L}\p{N}][\p{L}\p{N} -]*$/u.test(value), "Enter a valid postal code.");
export const validLocation = (city: string, zip: string) => city.trim().length >= 2 || zip.trim().length >= 3;
export const countryName = (code: string) => countryOptions.find((item) => item.code === code)?.name ?? "United States";
export const placeLabel = (city: string, zip: string, country: string) => [city, zip, countryName(country)].filter(Boolean).join(", ");
