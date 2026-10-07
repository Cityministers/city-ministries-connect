import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Curated daily rotation, independent of the YouVersion daily feed.
const verses = [
  ["Galatians 6:2", "GAL.6.2", "Bear ye one another's burdens, and so fulfil the law of Christ."],
  ["1 Corinthians 12:27", "1CO.12.27", "Now ye are the body of Christ, and members in particular."],
  ["1 John 4:19", "1JN.4.19", "We love him, because he first loved us."],
  ["Matthew 23:11", "MAT.23.11", "But he that is greatest among you shall be your servant."],
  ["Psalm 119:105", "PSA.119.105", "Thy word is a lamp unto my feet, and a light unto my path."],
  ["Romans 12:21", "ROM.12.21", "Be not overcome of evil, but overcome evil with good."],
  ["1 Thessalonians 5:11", "1TH.5.11", "Wherefore comfort yourselves together, and edify one another, even as also ye do."],
];

export function VerseOfTheDay() {
  const [verse, setVerse] = useState(verses[0]);
  return (
    <Dialog onOpenChange={(open) => {
      if (!open) return;
      const now = new Date();
      const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
      setVerse(verses[day % verses.length]);
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="mt-5 rounded-full bg-ink-soft text-sand ring-1 ring-gold/45 hover:bg-ink-soft/80">
          <BookOpen aria-hidden="true" /> Verse of the Day
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg border-gold/35 bg-ink text-sand">
        <DialogHeader className="sm:pr-12">
          <DialogTitle className="font-display text-3xl">Verse of the Day</DialogTitle>
          <DialogDescription className="text-base text-mist">{verse?.[0]} · KJV</DialogDescription>
        </DialogHeader>
        <blockquote className="text-2xl leading-relaxed text-sand">“{verse?.[2]}”</blockquote>
        <Button asChild className="mt-2 h-auto whitespace-normal rounded-full bg-youversion py-3 text-parchment hover:bg-youversion/90">
          <a href={`https://www.bible.com/bible/1/${verse?.[1]}.KJV`} target="_blank" rel="noopener noreferrer">Read in context on YouVersion</a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}