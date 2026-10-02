import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { completeNeed, listNeedHelpers } from "@/lib/need-completion.functions";

export function NeedMetDialog({ needId, title, onClose, onCompleted }: {
  needId: string;
  title: string;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const fetchHelpers = useServerFn(listNeedHelpers);
  const finish = useServerFn(completeNeed);
  const { data: helpers = [], isLoading, error: loadError } = useQuery({
    queryKey: ["need-helpers", needId], queryFn: () => fetchHelpers({ data: { needId } }),
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function helperDraft(name: string) { return `Thank you, ${name}, for helping with “${title}.” Your kindness meant so much to me!`; }
  function offerDraft(name: string) { return `Thank you, ${name}, for offering to help with “${title}.” My need has been met, but I truly appreciate you reaching out!`; }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const replies = helpers.filter((h) => enabled[h.memberId]).map((h) => ({
        conversationId: h.conversationId,
        body: (drafts[h.memberId] ?? (h.memberId === selected ? helperDraft(h.name) : offerDraft(h.name))).trim(),
      }));
      await finish({ data: {
        needId,
        helperConversationId: helpers.find((h) => h.memberId === selected)?.conversationId ?? null,
        replies,
      } });
      onCompleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not close this need.");
    } finally { setBusy(false); }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Mark need met" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/85 px-3 py-4 sm:items-center">
      <div className="w-full max-w-lg rounded-lg bg-ink-soft p-5 text-sand ring-1 ring-mist/35">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div><h2 className="font-display text-2xl">Need met</h2><p className="mt-1 text-base text-mist">{title}</p></div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button>
        </div>
        <p className="mb-4 text-base text-mist">Who helped meet this need? Choose a member below, or leave it unselected if help came from elsewhere.</p>
        {isLoading && <p className="text-mist">Loading conversations…</p>}
        {loadError && <p className="text-rose">Could not load people who reached out. Please try again.</p>}
        {helpers.length > 0 && <label className="mb-3 flex min-h-11 items-center gap-3 text-base text-sand"><input type="radio" name="helper" checked={selected === null} onChange={() => {
          setSelected(null);
          if (selected) setDrafts((v) => ({ ...v, [selected]: offerDraft(helpers.find((p) => p.memberId === selected)?.name ?? "friend") }));
        }} className="accent-lemon" />Someone outside these conversations helped</label>}
        {helpers.length > 0 && (
          <div className="max-h-[55dvh] space-y-3 overflow-y-auto pr-1">
            {helpers.map((h) => {
              const isHelper = selected === h.memberId;
              const text = drafts[h.memberId] ?? (isHelper ? helperDraft(h.name) : offerDraft(h.name));
              return <div key={h.memberId} className="border-b border-mist/20 pb-3">
                <label className="flex min-h-12 items-center gap-3 text-base font-semibold">
                  <input type="radio" name="helper" checked={isHelper} onChange={() => {
                    setSelected(h.memberId);
                    setEnabled((v) => ({ ...v, [h.memberId]: true }));
                    setDrafts((v) => ({ ...v, [h.memberId]: helperDraft(h.name), ...(selected && selected !== h.memberId ? { [selected]: offerDraft(helpers.find((p) => p.memberId === selected)?.name ?? "friend") } : {}) }));
                  }} className="accent-lemon" />
                  {h.avatarUrl ? <img src={h.avatarUrl} alt="" className="size-9 rounded-full object-cover" /> : <span className="grid size-9 place-items-center rounded-full bg-ink text-lemon">{h.name.charAt(0)}</span>}
                  {h.name}
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm text-mist">
                  <input type="checkbox" checked={Boolean(enabled[h.memberId])} onChange={(e) => setEnabled((v) => ({ ...v, [h.memberId]: e.target.checked }))} className="accent-lemon" />
                  {isHelper ? "Send a thank-you to the person who helped" : "Thank them for offering to help"}
                </label>
                {enabled[h.memberId] && <textarea value={text} maxLength={1000} rows={3} aria-label={`Message to ${h.name}`} onChange={(e) => setDrafts((v) => ({ ...v, [h.memberId]: e.target.value }))} className="mt-2 w-full rounded-md bg-ink p-3 text-base text-sand ring-1 ring-mist/35 focus:outline-none focus:ring-lemon" />}
              </div>;
            })}
          </div>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-rose">{error}</p>}
        <p className="mt-4 text-sm text-mist">The need will leave open lists and maps. Only checked messages will be sent.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="h-12 flex-1 border-mist/30 bg-ink text-sand" onClick={onClose}>Cancel</Button>
          <Button className="h-12 flex-1 bg-lemon text-ink hover:bg-lemon/90" disabled={busy || isLoading || Boolean(loadError) || helpers.some((h) => enabled[h.memberId] && !(drafts[h.memberId] ?? (h.memberId === selected ? helperDraft(h.name) : offerDraft(h.name))).trim())} onClick={() => void confirm()}>
            {busy ? <Loader2 className="animate-spin" /> : <Check />} Confirm need met
          </Button>
        </div>
      </div>
    </div>
  );
}