import { BookOpen, Globe2, Heart, Hourglass, Newspaper, type LucideIcon } from "lucide-react";

export const ROOMS: { slug: string; title: string; icon: LucideIcon }[] = [
  { slug: "christian-world-news", title: "Christian World News", icon: Newspaper },
  { slug: "bible-theology", title: "Bible & Theology Questions", icon: BookOpen },
  { slug: "world-missions", title: "World Missions", icon: Globe2 },
  { slug: "end-times", title: "End Times Conversations", icon: Hourglass },
  { slug: "faith-hope-love", title: "Faith, Hope & Love", icon: Heart },
];

export function roomIcon(slug: string): LucideIcon {
  return ROOMS.find((r) => r.slug === slug)?.icon ?? Globe2;
}

const ICON_BY_ID: Record<string, LucideIcon> = { newspaper: Newspaper, book: BookOpen, globe: Globe2, hourglass: Hourglass, heart: Heart };
export function roomIconById(id: string): LucideIcon {
  return ICON_BY_ID[id] ?? Globe2;
}
