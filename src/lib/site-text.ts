import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getSiteText } from "@/lib/cms.functions";

/** Every piece of page wording the owner can edit from the CMS. */
export const SITE_TEXT_FIELDS = [
  { key: "home.tagline", page: "Homepage", label: "What City Ministers is", fallback: "City Ministers is a neighborhood map of everyday ministry opportunities. People post their spiritual or practical gifts to share, or the needs they carry, then message each other directly to share the love of Christ — no committee, no building, just neighbors." },
  { key: "about.heading", page: "About Us", label: "Heading", fallback: "We are City Ministers" },
  { key: "about.intro", page: "About Us", label: "Intro line", fallback: "A simple way for neighbors to share their gifts and meet each other's needs." },
  { key: "about.mission", page: "About Us", label: "Our mission", fallback: "To put every believer's gift on the map, so that no need in our city goes unseen and no gift goes unused. We exist to turn quiet willingness into a knock on a real door." },
  { key: "about.vision", page: "About Us", label: "Our vision", fallback: "A city where help is never more than a few blocks away — where the church is known by the streets it serves, and where asking for help is as normal as offering it." },
  { key: "contact.heading", page: "Contact", label: "Heading", fallback: "We'd love to hear from you" },
  { key: "contact.intro", page: "Contact", label: "Intro line", fallback: "Questions, ideas, or prayer requests — send them our way." },
  { key: "donate.heading", page: "Donate", label: "Heading", fallback: "Help us keep serving" },
  { key: "donate.intro", page: "Donate", label: "Intro line", fallback: "City Ministers is built to connect neighbors for free. Your donation keeps the lights on and the map growing." },
] as const;

export type SiteTextKey = (typeof SITE_TEXT_FIELDS)[number]["key"];

export const siteTextQuery = { queryKey: ["site-text"], queryFn: () => getSiteText(), staleTime: 60_000 };

/** Returns owner-edited wording when set, otherwise the translated default. */
export function useSiteText() {
  const { t } = useTranslation();
  const { data } = useQuery(siteTextQuery);
  return (key: SiteTextKey) => {
    const custom = data?.[key];
    if (custom) return custom;
    const f = SITE_TEXT_FIELDS.find((x) => x.key === key)!;
    return t(f.fallback);
  };
}
