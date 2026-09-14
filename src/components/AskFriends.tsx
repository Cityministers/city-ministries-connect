import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, MessageSquare, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createGiftReference,
  listGiftReferences,
  type GiftReference,
} from "@/lib/gift-references.functions";

export default function AskFriends({
  onAddGifts,
  showHeading = true,
}: {
  onAddGifts: (gifts: string[]) => void;
  showHeading?: boolean;
}) {
  const create = useServerFn(createGiftReference);
  const list = useServerFn(listGiftReferences);

  const [open, setOpen] = useState(true);
  const [contactName, setContactName] = useState("");
  const [references, setReferences] = useState<GiftReference[] | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    void list()
      .then((res) => setReferences(res.references))
      .catch(() => {});
  }

  useEffect(() => {
    if (open && references === null) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = contactName.trim();
    if (name.length < 1) {
      setError("Add your contact's first name.");
      return;
    }
    setBusy(true);
    try {
      await create({ data: { contactName: name } });
      setContactName("");
      refresh();
    } catch {
      setError("Couldn't create that link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(code: string, contactName: string, mode: "url" | "text") {
    const url = `${window.location.origin}/gift-reference/${code}`;
    const text =
      mode === "text"
        ? `Hi ${contactName}, I'm trying to discover my spiritual gifts and where I might serve. Would you take a minute to share what you see in me? ${url}`
        : url;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(`${mode}:${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      window.prompt("Copy this link and send it to your friend:", text);
    }
  }

  return (
    <div className="rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15">
      {showHeading && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 text-left"
        >
          <Users className="size-5 text-lemon" aria-hidden="true" />
          <span className="text-lg font-semibold text-sand">
            Ask friends, family and church leaders
          </span>
        </button>
      )}

      {open && (
        <div className="mt-4 flex flex-col gap-5">
          <p className="text-base leading-relaxed text-mist/80">
            Send this link to anyone so they can contribute to helping you discover your spiritual
            gifts and potential ministries.
          </p>

          <div className="rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
            <span className="text-sm uppercase tracking-wider text-mist/60">
              Sample text they'll receive
            </span>
            <p className="mt-2 text-lg leading-relaxed text-sand">
              “Hi Maria, I'm trying to discover my spiritual gifts and where I might serve. Would
              you take a minute to share what you see in me?{" "}
              <span className="text-lemon underline underline-offset-2">
                cityministers.com/gift-reference/abc123
              </span>
              ”
            </p>
          </div>

          <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col gap-3">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              maxLength={60}
              placeholder="Their first name, e.g. Maria"
              aria-label="Contact first name"
              className="rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-soft px-5 py-3.5 text-lg font-semibold text-sand ring-1 ring-mist/25 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-5" aria-hidden="true" />
              )}
              Create their link
            </button>
            {error && (
              <p className="rounded-xl bg-rose/15 px-4 py-3 text-base text-rose ring-1 ring-rose/30">
                {error}
              </p>
            )}
          </form>

          {references === null ? (
            <p className="flex items-center gap-2 text-base text-mist/70">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading your invites…
            </p>
          ) : references.length === 0 ? (
            <p className="text-base text-mist/60">No invites yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {references.map((ref) => (
                <li
                  key={ref.id}
                  className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-sand">{ref.contactName}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        ref.respondedAt
                          ? "bg-lemon/15 text-lemon"
                          : "bg-ink text-mist/70 ring-1 ring-mist/20"
                      }`}
                    >
                      {ref.respondedAt ? "Answered" : "Waiting"}
                    </span>
                  </div>

                  {ref.respondedAt ? (
                    <>
                      {ref.gifts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {ref.gifts.map((gift) => (
                            <span
                              key={gift}
                              className="rounded-full bg-ink px-3 py-1.5 text-base text-sand ring-1 ring-mist/20"
                            >
                              {gift}
                            </span>
                          ))}
                        </div>
                      )}
                      {ref.note && (
                        <p className="border-l-2 border-lemon/40 bg-lemon/5 px-3 py-2 text-lg italic leading-relaxed text-sand/90">
                          “{ref.note}”
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={ref.gifts.length === 0 || addedId === ref.id}
                        onClick={() => {
                          onAddGifts(ref.gifts);
                          setAddedId(ref.id);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink disabled:opacity-60"
                      >
                        {addedId === ref.id ? (
                          <>
                            <Check className="size-4" aria-hidden="true" /> Added to your gifts
                          </>
                        ) : (
                          "Add these gifts"
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => void copyLink(ref.code, ref.contactName, "text")}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink"
                      >
                        {copiedCode === `text:${ref.code}` ? (
                          <>
                            <Check className="size-4" aria-hidden="true" />
                            Copied for texting
                          </>
                        ) : (
                          <>
                            <MessageSquare className="size-4" aria-hidden="true" />
                            Copy link to text
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyLink(ref.code, ref.contactName, "url")}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-base font-semibold text-sand ring-1 ring-mist/25"
                      >
                        {copiedCode === `url:${ref.code}` ? (
                          <>
                            <Check className="size-4 text-lemon" aria-hidden="true" />
                            Link copied
                          </>
                        ) : (
                          "Copy link only"
                        )}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
