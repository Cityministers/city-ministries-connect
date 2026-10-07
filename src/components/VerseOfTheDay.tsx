import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sun } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { ScriptureCard } from "@/components/ScriptureCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** A rotating set of NIV verses; one is picked per day of the year. */
const dailyVerses: Array<{ reference: string; text: string }> = [
  {
    reference: "Philippians 4:13",
    text: "I can do all this through him who gives me strength.",
  },
  {
    reference: "Jeremiah 29:11",
    text: "'For I know the plans I have for you,' declares the Lord, 'plans to prosper you and not to harm you, plans to give you hope and a future.'",
  },
  {
    reference: "Proverbs 3:5-6",
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
  },
  {
    reference: "Psalm 23:1",
    text: "The Lord is my shepherd, I lack nothing.",
  },
  {
    reference: "Romans 8:28",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
  },
  {
    reference: "Isaiah 41:10",
    text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
  },
  {
    reference: "Matthew 11:28",
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
  },
  {
    reference: "Joshua 1:9",
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
  },
  {
    reference: "Psalm 46:1",
    text: "God is our refuge and strength, an ever-present help in trouble.",
  },
  {
    reference: "Galatians 6:9",
    text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
  },
  {
    reference: "Micah 6:8",
    text: "He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.",
  },
  {
    reference: "1 Peter 4:10",
    text: "Each of you should use whatever gift you have received to serve others, as faithful stewards of God's grace in its various forms.",
  },
  {
    reference: "Matthew 5:16",
    text: "In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven.",
  },
  {
    reference: "Hebrews 13:16",
    text: "And do not forget to do good and to share with others, for with such sacrifices God is pleased.",
  },
];

function verseForToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  return dailyVerses[dayOfYear % dailyVerses.length] ?? dailyVerses[0]!;
}

const STORAGE_KEY = "cm-verse-of-the-day-seen";

/**
 * Verse-of-the-day popup for the start screen. Opens automatically once per
 * day, only for signed-in members. Signed-out visitors never see it.
 */
export function VerseOfTheDay() {
  const { t } = useTranslation();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const verse = verseForToday();

  useEffect(() => {
    if (!session) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === today) return;
    } catch {
      // storage unavailable — still show the verse
    }
    setOpen(true);
  }, [session]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        window.localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10));
      } catch {
        // storage unavailable
      }
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-mist/20 bg-ink text-sand sm:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lemon/15 text-lemon ring-1 ring-lemon/40">
              <Sun className="size-6" aria-hidden="true" />
            </span>
            <DialogTitle className="font-display text-2xl font-semibold text-sand sm:text-3xl">
              {t("Verse of the day")}
            </DialogTitle>
          </div>
        </DialogHeader>
        <ScriptureCard reference={verse.reference} fallbackText={t(verse.text)} />
        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="inline-flex w-full items-center justify-center rounded-full bg-lemon px-6 py-3 text-xl font-bold text-ink transition-transform hover:-translate-y-0.5"
        >
          {t("Amen — start my day")}
        </button>
      </DialogContent>
    </Dialog>
  );
}
