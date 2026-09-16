import { Church, Cross, Landmark, type LucideIcon } from "lucide-react";

/** The three icons a church can choose for its map pin. */
export const CHURCH_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "chapel", label: "Chapel", icon: Church },
  { id: "cross", label: "Cross", icon: Cross },
  { id: "hall", label: "Meeting hall", icon: Landmark },
];

export function churchIcon(id: string | null | undefined): LucideIcon {
  return CHURCH_ICONS.find((c) => c.id === id)?.icon ?? Church;
}

/** Jewel tone used for church pins so they read differently from posts. */
export const CHURCH_PIN_COLOR = "#e8c45c";
