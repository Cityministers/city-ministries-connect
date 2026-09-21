import type { Tone } from "@/data/ministries";

/** Pin colours matching the jewel tones used across the site. */
export const toneHex: Record<Tone, string> = {
  rose: "#f0697f",
  blue: "#7ba2f2",
  cyan: "#5cc4dd",
  pink: "#f2557f",
  orange: "#f0964c",
  amber: "#eec45f",
  purple: "#b98af0",
  emerald: "#4fcfa3",
  indigo: "#8b94ee",
  need: "#d6d9e4",
};

/** Prayer pins share one violet so they read as their own layer on the map. */
export const PRAYER_PIN_COLOR = "#5aa9ff";
