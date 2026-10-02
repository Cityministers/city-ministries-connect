import { BookOpen, Compass, Globe2, Heart, Hourglass, Lightbulb, Newspaper, type LucideIcon } from "lucide-react";
import { ministries } from "@/data/ministries";

export const ROOMS: { slug: string; title: string; icon: LucideIcon }[] = [
  { slug: "christian-world-news", title: "Christian World News", icon: Newspaper },
  { slug: "bible-theology", title: "Bible & Theology Questions", icon: BookOpen },
  { slug: "world-missions", title: "World Missions", icon: Globe2 },
  { slug: "end-times", title: "End Times Conversations", icon: Hourglass },
  { slug: "faith-hope-love", title: "Faith, Hope & Love", icon: Heart },
];

export function roomIcon(slug: string): LucideIcon {
  if (slug === "how-to-get-started") return Compass;
  if (slug === "words-of-wisdom") return Lightbulb;
  if (slug.startsWith("serve-")) return roomIconById(`ministry:${slug.slice(6)}`);
  return ROOMS.find((r) => r.slug === slug)?.icon ?? Globe2;
}

const ICON_BY_ID: Record<string, LucideIcon> = { compass: Compass, lightbulb: Lightbulb, newspaper: Newspaper, book: BookOpen, globe: Globe2, hourglass: Hourglass, heart: Heart };
export function roomIconById(id: string): LucideIcon {
  if (id.startsWith("ministry:")) return ministries.find((m) => m.id === id.slice(9))?.icon ?? Globe2;
  return ICON_BY_ID[id] ?? Globe2;
}
