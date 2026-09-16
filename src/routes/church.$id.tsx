import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Check,
  Clock,
  Globe,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  Settings2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/AccountMenu";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { useSession } from "@/hooks/useSession";
import { CHURCH_ICONS, churchIcon } from "@/lib/church-icons";
import {
  getChurch,
  listChurchRequests,
  mockSubscribe,
  relocateChurch,
  setChurchPostStatus,
  updateChurch,
  type ChurchPostDTO,
} from "@/lib/churches.functions";

export const Route = createFileRoute("/church/$id")({
  head: () => ({
    meta: [
      { title: "A church on the map — City Ministers" },
      {
        name: "description",
        content:
          "See the ministries and needs happening at this church, and the neighbors nearby you could serve alongside.",
      },
      { property: "og:title", content: "A church on the map — City Ministers" },
      {
        property: "og:description",
        content: "Every ministry and need happening at this church, in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChurchPage,
});

const inputClass =
  "w-full min-w-0 rounded-xl bg-ink-soft px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50";

function PostRow({ post }: { post: ChurchPostDTO }) {
  return (
    <Link
      to={post.kind === "ministry" ? "/ministries" : "/needs"}
      search={{ place: post.zip || post.city }}
      className="flex w-full flex-col gap-1 rounded-2xl bg-ink-soft p-4 text-left ring-1 ring-mist/10 transition hover:ring-mist/30"
    >
      <span className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
            post.kind === "ministry"
              ? "bg-tone-emerald/15 text-tone-emerald ring-tone-emerald/40"
              : "bg-tone-indigo/15 text-tone-indigo ring-tone-indigo/40"
          }`}
        >
          {post.kind === "ministry" ? "Ministry" : "Need"}
        </span>
        <span className="truncate font-heading text-lg text-sand">{post.title}</span>
      </span>
      <span className="line-clamp-2 text-sm text-mist/70">{post.description}</span>
      <span className="text-xs text-mist/50">
        {post.posterName} · {post.city}
        {post.zip ? ` ${post.zip}` : ""}
      </span>
    </Link>
  );
}

function ChurchPage() {
  const { id } = Route.useParams();
  const session = useSession();
  const queryClient = useQueryClient();

  const fetchChurch = useServerFn(getChurch);
  const fetchRequests = useServerFn(listChurchRequests);
  const decide = useServerFn(setChurchPostStatus);
  const save = useServerFn(updateChurch);
  const pay = useServerFn(mockSubscribe);
  const relocate = useServerFn(relocateChurch);

  const { data, isLoading } = useQuery({
    queryKey: ["church", id],
    queryFn: () => fetchChurch({ data: { id } }),
  });

  const church = data?.church ?? null;
  const isOwner = Boolean(session?.user?.id && church && session.user.id === church.ownerId);

  const { data: requests } = useQuery({
    queryKey: ["church-requests", id],
    queryFn: () => fetchRequests({ data: { churchId: id } }),
    enabled: isOwner,
  });

  const [qr, setQr] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !church) return;
    let alive = true;
    const link = `${window.location.origin}/church/${id}`;
    setPageUrl(link);
    // The scan code is an owner tool — visitors never see or build it.
    if (!isOwner) return;
    void import("qrcode").then(async (mod) => {
      // Big and high-contrast so it still scans from the back of the room.
      const url = await mod.default.toDataURL(link, {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#171320", light: "#ffffff" },
      });
      if (alive) setQr(url);
    });
    return () => {
      alive = false;
    };
  }, [church, id, isOwner]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    iconId: "chapel",
    address: "",
    city: "",
    zip: "",
    serviceTimes: "",
    phone: "",
    website: "",
  });

  const [payOpen, setPayOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  function openEdit() {
    if (!church) return;
    setForm({
      name: church.name,
      description: church.description,
      iconId: church.iconId,
      address: church.address,
      city: church.city,
      zip: church.zip,
      serviceTimes: church.serviceTimes,
      phone: church.phone,
      website: church.website,
    });
    setEditing(true);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          id,
          ...form,
          iconId: form.iconId as "chapel" | "cross" | "hall",
          avatarPath: "",
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["church", id] });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function reactivate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await pay({ data: { id, cardName: cardName.trim(), cardNumber: cardNumber.trim() } });
      await queryClient.invalidateQueries({ queryKey: ["church", id] });
      setPayOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function tryAddressAgain() {
    setBusy(true);
    setError(null);
    try {
      const result = await relocate({ data: { id } });
      if (!result.located) {
        setError(
          "We still couldn't find that street address. Open Edit details and correct it, then try again.",
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["church", id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function respond(linkId: string, status: "approved" | "declined") {
    await decide({ data: { linkId, status } });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["church-requests", id] }),
      queryClient.invalidateQueries({ queryKey: ["church", id] }),
    ]);
  }

  const Icon = churchIcon(church?.iconId);

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 sm:px-6">
          <Link
            to="/map"
            className="grid size-9 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to the map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <div className="flex justify-end">
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-mist/60">Loading…</p>
        ) : !church ? (
          <div className="rounded-2xl bg-ink-soft p-6 text-center">
            <h1 className="font-display text-2xl font-semibold">We couldn't find that church</h1>
            <p className="mt-2 text-base text-mist/70">
              It may have been taken down.{" "}
              <Link to="/map" className="text-lemon underline underline-offset-2">
                Back to the map
              </Link>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <section className="overflow-hidden rounded-2xl bg-ink-soft ring-1 ring-mist/15">
              {church.photoUrl && (
                <img
                  src={church.photoUrl}
                  alt={`${church.name}`}
                  className="h-48 w-full object-cover sm:h-64"
                />
              )}
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lemon/12 text-lemon ring-1 ring-lemon/35">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
                      {church.name}
                    </h1>
                    {church.status !== "active" && (
                      <p className="mt-1 text-sm font-semibold text-rose">
                        Not on the map right now
                      </p>
                    )}
                  </div>
                </div>
                {church.description && (
                  <p className="text-base leading-relaxed text-mist/80">{church.description}</p>
                )}
                <ul className="flex flex-col gap-1.5 text-base text-mist/70">
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-lemon" aria-hidden="true" />
                    {[church.address, church.city, church.zip].filter(Boolean).join(", ")}
                  </li>
                  {church.serviceTimes && (
                    <li className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0 text-lemon" aria-hidden="true" />
                      {church.serviceTimes}
                    </li>
                  )}
                  {church.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="size-4 shrink-0 text-lemon" aria-hidden="true" />
                      {church.phone}
                    </li>
                  )}
                  {church.website && (
                    <li className="flex items-center gap-2">
                      <Globe className="size-4 shrink-0 text-lemon" aria-hidden="true" />
                      <a
                        href={
                          church.website.startsWith("http")
                            ? church.website
                            : `https://${church.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-mist/30 underline-offset-2"
                      >
                        {church.website}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </section>

            {church.gallery.length > 0 && (
              <section className="flex flex-col gap-3 rounded-2xl bg-ink-soft p-5 ring-1 ring-mist/15">
                <h2 className="font-display text-xl font-semibold">Photos and video</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {church.gallery.map((item) =>
                    item.kind === "video" ? (
                      <video
                        key={item.url}
                        src={item.url}
                        controls
                        playsInline
                        className="col-span-2 w-full rounded-xl bg-ink ring-1 ring-mist/20 sm:col-span-3"
                      />
                    ) : (
                      <img
                        key={item.url}
                        src={item.url}
                        alt={`${church.name}`}
                        loading="lazy"
                        className="aspect-square w-full rounded-xl object-cover ring-1 ring-mist/20"
                      />
                    ),
                  )}
                </div>
              </section>
            )}


            {!isOwner && (
              <section className="flex flex-col gap-3 rounded-2xl bg-ink-soft p-5 ring-1 ring-mist/15">
                <h2 className="font-display text-xl font-semibold">Serving at this church</h2>
                <p className="text-base text-mist/75">
                  Share what you can offer, or what you need. {church.name} reviews each post
                  before it shows up here.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/create-ministry"
                    search={{ city: church.city, zip: church.zip, church: church.id }}
                    className="rounded-full bg-lemon px-5 py-2.5 text-base font-semibold text-ink transition hover:opacity-90"
                  >
                    Post your ministry here
                  </Link>
                  <Link
                    to="/post-need"
                    search={{ church: church.id }}
                    className="rounded-full bg-ember px-5 py-2.5 text-base font-semibold text-ink shadow-[0_0_18px_-4px_var(--color-ember)] transition hover:opacity-90"
                  >
                    Post your need here
                  </Link>
                  <button
                    type="button"
                    onClick={() => void copyLink()}
                    className="rounded-full bg-ink px-5 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft"
                  >
                    {copied ? "Link copied" : "Copy link"}
                  </button>
                </div>
              </section>
            )}

            {isOwner && (
              <section className="flex flex-col gap-4 rounded-2xl bg-ink-soft/60 p-5 ring-1 ring-lemon/25">
                <h2 className="font-display text-xl font-semibold">Church tools</h2>

                <div className="flex flex-col gap-4 rounded-xl bg-ink p-4 ring-1 ring-mist/15 sm:flex-row sm:items-center">
                  <div className="grid size-40 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white">
                    {qr ? (
                      <img
                        src={qr}
                        alt={`QR code that opens the page for ${church.name}`}
                        className="size-full object-contain p-2"
                      />
                    ) : (
                      <QrCode className="size-10 text-ink/30" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-3">
                    <h3 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
                      <QrCode className="size-5 text-lemon" aria-hidden="true" />
                      Scan to open this page
                    </h3>
                    <p className="text-base text-mist/75">
                      Put this on your overhead, screen or bulletin. Anyone who scans it lands
                      right here, on your page.
                    </p>
                    {pageUrl && (
                      <p className="truncate rounded-lg bg-ink-soft px-3 py-2 text-sm text-mist/70 ring-1 ring-mist/15">
                        {pageUrl}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {qr && (
                        <a
                          href={qr}
                          download={`${church.name.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
                          className="rounded-full bg-lemon px-5 py-2.5 text-base font-semibold text-ink transition hover:opacity-90"
                        >
                          Download QR code
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => void copyLink()}
                        className="rounded-full bg-ink-soft px-5 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink"
                      >
                        {copied ? "Link copied" : "Copy link"}
                      </button>
                    </div>
                  </div>
                </div>


                {church.lat == null && (
                  <div className="rounded-xl bg-ink p-4 ring-1 ring-rose/30">
                    <p className="text-base text-mist/80">
                      We couldn't find{" "}
                      <span className="text-sand">
                        {[church.address, church.city, church.zip].filter(Boolean).join(", ")}
                      </span>
                      , so your icon isn't on the map yet. Correct the address below, then try
                      again. Your page, link and QR code still work.
                    </p>
                    <button
                      type="button"
                      onClick={() => void tryAddressAgain()}
                      disabled={busy}
                      className="mt-3 inline-flex items-center justify-center rounded-full bg-lemon px-5 py-2.5 text-base font-semibold text-ink transition hover:opacity-90 disabled:opacity-60"
                    >
                      Try again
                    </button>
                  </div>
                )}


                {church.status !== "active" && (
                  <div className="rounded-xl bg-ink p-4 ring-1 ring-rose/30">
                    <p className="text-base text-mist/80">
                      Your $49 monthly listing isn't active, so your pin is off the map. This page
                      and your QR code still work.
                    </p>
                    {payOpen ? (
                      <form className="mt-3 flex flex-col gap-2" onSubmit={(e) => void reactivate(e)}>
                        <input
                          className={inputClass}
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Name on card"
                        />
                        <input
                          className={inputClass}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          inputMode="numeric"
                        />
                        <button
                          type="submit"
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-3 text-base font-semibold text-ink disabled:opacity-60"
                        >
                          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                          Pay $49 and go back on the map
                        </button>
                        <p className="text-center text-xs text-mist/50">
                          Test checkout — no card is charged.
                        </p>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPayOpen(true)}
                        className="mt-3 rounded-full bg-lemon px-5 py-2.5 text-base font-semibold text-ink"
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                )}


                <div className="flex flex-col gap-3 rounded-xl bg-ink p-4 ring-1 ring-mist/15">
                  <p className="font-semibold text-sand">Your church board</p>
                  <p className="text-sm text-mist/60">
                    {(requests ?? []).length === 0
                      ? "No one is waiting right now."
                      : `${(requests ?? []).length} ${
                          (requests ?? []).length === 1 ? "post is" : "posts are"
                        } waiting for your approval.`}
                  </p>
                  <Link
                    to="/church-board/$id"
                    params={{ id }}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full bg-lemon px-5 py-2.5 text-sm font-semibold text-ink"
                  >
                    <Check className="size-4" aria-hidden="true" />
                    Review requests
                  </Link>
                </div>

                {editing ? (
                  <form
                    className="flex flex-col gap-2 rounded-xl bg-ink p-4 ring-1 ring-mist/15"
                    onSubmit={(e) => void saveEdit(e)}
                  >
                    <p className="font-semibold text-sand">Edit your church</p>
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Church name"
                    />
                    <textarea
                      className={`${inputClass} min-h-28`}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="About your church"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      {CHURCH_ICONS.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => setForm({ ...form, iconId: choice.id })}
                          aria-pressed={form.iconId === choice.id}
                          className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition ${
                            form.iconId === choice.id
                              ? "bg-ink-soft text-lemon ring-1 ring-lemon"
                              : "bg-ink-soft/70 text-sand ring-1 ring-mist/35"
                          }`}
                        >
                          <choice.icon className="size-5" aria-hidden="true" />
                          {choice.label}
                        </button>
                      ))}
                    </div>
                    <input
                      className={inputClass}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Street address"
                    />
                    <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                      <input
                        className={inputClass}
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="City"
                      />
                      <input
                        className={inputClass}
                        value={form.zip}
                        onChange={(e) => setForm({ ...form, zip: e.target.value })}
                        placeholder="ZIP"
                        inputMode="numeric"
                      />
                    </div>
                    <input
                      className={inputClass}
                      value={form.serviceTimes}
                      onChange={(e) => setForm({ ...form, serviceTimes: e.target.value })}
                      placeholder="Service times"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className={inputClass}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Phone"
                      />
                      <input
                        className={inputClass}
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        placeholder="Website"
                      />
                    </div>
                    {error && <p className="text-sm text-rose">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-full bg-lemon px-5 py-2.5 text-base font-semibold text-ink disabled:opacity-60"
                      >
                        {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="rounded-full bg-ink-soft px-5 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/25"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={openEdit}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/25"
                  >
                    <Settings2 className="size-4" aria-hidden="true" />
                    Edit church details
                  </button>
                )}
              </section>
            )}

            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold">Posts at this church</h2>
              {(data?.posts ?? []).length === 0 ? (
                <p className="rounded-2xl bg-ink-soft p-4 text-base text-mist/70">
                  No posts here yet. When neighbors post a ministry or a need they can ask to list
                  it at this church.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(data?.posts ?? []).map((p) => (
                    <li key={p.linkId}>
                      <PostRow post={p} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-semibold">Public posts nearby</h2>
              {(data?.nearby ?? []).length === 0 ? (
                <p className="rounded-2xl bg-ink-soft p-4 text-base text-mist/70">
                  Nothing posted nearby yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {(data?.nearby ?? []).map((p) => (
                    <li key={p.linkId}>
                      <PostRow post={p} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
