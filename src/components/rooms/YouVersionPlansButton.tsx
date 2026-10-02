import { useState } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROOM_YOUVERSION } from "@/data/room-youversion";

export function YouVersionPlansButton({ slug, roomTitle }: { slug: string; roomTitle: string }) {
  const [open, setOpen] = useState(false);
  const plans = ROOM_YOUVERSION[slug];
  if (!plans?.length) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-youversion px-5 py-2.5 text-base font-semibold text-parchment hover:opacity-90"
      >
        <BookOpen className="size-5" aria-hidden="true" />
        YouVersion reading plans
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Reading plans for {roomTitle}</DialogTitle>
          </DialogHeader>
          <ul className="space-y-3">
            {plans.map((p) => (
              <li key={p.url}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-mist/30 bg-ink-soft p-4 hover:border-youversion"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-lg font-bold leading-snug text-sand">{p.title}</span>
                    <ExternalLink className="mt-1 size-4 shrink-0 text-mist" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-base text-mist">{p.blurb}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-sm text-mist">Opens in the YouVersion Bible App on bible.com.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
