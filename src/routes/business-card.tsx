import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Download, HandHeart, Heart, Loader2 } from "lucide-react";
import seal from "@/assets/cm-seal.png";
import skyline from "@/assets/card-skyline.jpg";

export const Route = createFileRoute("/business-card")({
  head: () => ({
    meta: [
      { title: "Business Card Downloads — City Ministers" },
      {
        name: "description",
        content: "Download print-ready City Ministers business cards, front and back, as PNG or PDF.",
      },
      { property: "og:title", content: "Business Card Downloads — City Ministers" },
      {
        property: "og:description",
        content: "Print-ready 3.5 x 2 in City Ministers cards to share in your city.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fraunces:opsz,wght@9..144,600&family=Karla:wght@400;600;700;800&display=swap",
      },
    ],
  }),
  component: BusinessCardPage,
});

// Print artwork uses fixed brand colors so exports match exactly.
const GOLD = "#E2B04A";
const SAND = "#F3D9A4";
const PRAYER = "#4A6FA5";
const NEED = "#7B6BC4";
const W = 1050; // 3.5in @ 300dpi
const H = 600; // 2in @ 300dpi
const BLEED = 37.5; // 0.125in

function Qr({ size }: { size: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL("https://cityministers.com", { margin: 0, width: size * 2, errorCorrectionLevel: "M" }).then(setSrc);
  }, [size]);
  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 14, border: `4px solid ${GOLD}` }}>
      {src && <img src={src} width={size} height={size} alt="QR code to cityministers.com" style={{ display: "block" }} />}
    </div>
  );
}

function Frame({ bleed, children }: { bleed: boolean; children: React.ReactNode }) {
  const pad = bleed ? BLEED : 0;
  return (
    <div
      style={{
        width: W + pad * 2,
        height: H + pad * 2,
        position: "relative",
        overflow: "hidden",
        background: `#070812 url(${skyline}) center 70% / cover no-repeat`,
        fontFamily: "Karla, system-ui, sans-serif",
        color: "#fff",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,6,14,0.35) 0%, rgba(5,6,14,0.2) 45%, rgba(5,6,14,0.75) 100%)" }} />
      <div style={{ position: "absolute", left: pad, top: pad, width: W, height: H }}>
        <div style={{ position: "absolute", inset: 14, border: `3px solid ${GOLD}`, borderRadius: 22 }} />
        {children}
      </div>
    </div>
  );
}

function Btn({ color, icon, label }: { color: string; icon: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        height: 70, borderRadius: 16, background: color, border: `2px solid ${SAND}66`,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
        fontSize: 32, fontWeight: 700, boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
      }}
    >
      {icon}
      {label}
    </div>
  );
}

function Front({ bleed = false }: { bleed?: boolean }) {
  return (
    <Frame bleed={bleed}>
      <img src={seal} alt="City Ministers seal" style={{ position: "absolute", left: 44, top: 40, width: 260, height: 260, objectFit: "contain" }} />
      <div style={{ position: "absolute", left: 330, top: 46, right: 50 }}>
        <div style={{ fontFamily: "Bebas Neue", fontSize: 58, letterSpacing: "0.06em", lineHeight: 1 }}>CITYMINISTERS.COM</div>
        <div style={{ color: GOLD, fontSize: 22, letterSpacing: "0.18em", marginTop: 8, fontWeight: 600 }}>FAITH • PEOPLE • NEEDS</div>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 46, fontWeight: 600, lineHeight: 1.08, marginTop: 18 }}>
          Faith. People.<br />Needs. Together.
        </div>
      </div>
      <div style={{ position: "absolute", left: 44, bottom: 40, textAlign: "center" }}>
        <Qr size={170} />
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.14em", marginTop: 8 }}>SCAN TO VISIT</div>
      </div>
      <div style={{ position: "absolute", left: 330, right: 50, bottom: 40, display: "flex", flexDirection: "column", gap: 16 }}>
        <Btn color={PRAYER} icon={<HandHeart size={34} />} label="Post a Prayer" />
        <Btn color={NEED} icon={<Heart size={30} fill="#fff" />} label="Post a Need" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: SAND, fontSize: 24, fontWeight: 700 }}>Create a free account.</span>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.12em" }}>JESUS LOVES YOU.</span>
        </div>
      </div>
    </Frame>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      <div style={{ width: 50, height: 50, borderRadius: 999, background: GOLD, color: "#1a1206", fontSize: 26, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{n}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.04em" }}>{title}</div>
        <div style={{ fontSize: 19, color: "#e6e6ee" }}>{text}</div>
      </div>
    </div>
  );
}

function Back({ bleed = false }: { bleed?: boolean }) {
  return (
    <Frame bleed={bleed}>
      <div style={{ position: "absolute", inset: 14, borderRadius: 22, background: "rgba(5,6,14,0.45)" }} />
      <div style={{ position: "absolute", left: 50, top: 40 }}>
        <div
          style={{
            fontFamily: "Bebas Neue", fontSize: 64, letterSpacing: "0.12em", lineHeight: 1,
            backgroundImage: "linear-gradient(100deg,#f7e6bd 0%,#f3d9a4 38%,#c9973f 100%)",
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          }}
        >
          CITY MINISTERS
        </div>
        <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 30, fontWeight: 600, lineHeight: 1.2, marginTop: 14 }}>
          A place to pray.<br />
          <span style={{ color: SAND }}>A people to care.</span><br />
          A city for Christ.
        </div>
      </div>
      <div style={{ position: "absolute", left: 50, bottom: 44, display: "flex", flexDirection: "column", gap: 14, width: 560 }}>
        <Step n={1} title="POST A PRAYER" text="Share what you are praying for." />
        <Step n={2} title="POST A NEED" text="Let your community know how they can help." />
        <Step n={3} title="CONNECT" text="Pray, care, and respond together." />
      </div>
      <div style={{ position: "absolute", right: 50, top: 60, width: 300, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Qr size={250} />
        <div style={{ fontFamily: "Bebas Neue", fontSize: 38, letterSpacing: "0.06em", marginTop: 16 }}>CITYMINISTERS.COM</div>
        <div style={{ color: SAND, fontSize: 22, fontWeight: 700 }}>Create a free account.</div>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.12em", marginTop: 4 }}>JESUS LOVES YOU.</div>
      </div>
    </Frame>
  );
}

let fontCssPromise: Promise<string> | null = null;
function getFontCss() {
  fontCssPromise ??= (async () => {
    const url =
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fraunces:opsz,wght@9..144,600&family=Karla:wght@400;600;700;800&display=swap";
    let css = await (await fetch(url)).text();
    const files = Array.from(new Set(css.match(/https:[^)]+\.woff2/g) ?? []));
    for (const f of files) {
      const blob = await (await fetch(f)).blob();
      const data = await new Promise<string>((r) => {
        const fr = new FileReader();
        fr.onload = () => r(fr.result as string);
        fr.readAsDataURL(blob);
      });
      css = css.split(f).join(data);
    }
    return css;
  })();
  return fontCssPromise;
}

function Preview({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-xl shadow-2xl" style={{ aspectRatio: `${W} / ${H}` }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: W, height: H }}>{children}</div>
    </div>
  );
}

function BusinessCardPage() {
  const refs = {
    front: useRef<HTMLDivElement>(null),
    back: useRef<HTMLDivElement>(null),
    frontBleed: useRef<HTMLDivElement>(null),
    backBleed: useRef<HTMLDivElement>(null),
  };
  const [busy, setBusy] = useState<string | null>(null);

  const render = async (key: keyof typeof refs) => {
    await document.fonts.ready;
    const node = refs[key].current!.firstElementChild as HTMLElement;
    return toPng(node, {
      pixelRatio: 70 / 300,
      cacheBust: true,
      width: node.offsetWidth,
      height: node.offsetHeight,
      fontEmbedCSS: await getFontCss(),
    });
  };
  const save = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  };
  const run = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    try { await fn(); } finally { setBusy(null); }
  };

  const png = (key: keyof typeof refs, name: string) => run(key, async () => save(await render(key), name));
  const pdf = (bleed: boolean) =>
    run(bleed ? "pdfB" : "pdf", async () => {
      const w = bleed ? 3.75 : 3.5;
      const h = bleed ? 2.25 : 2;
      const doc = new jsPDF({ orientation: "landscape", unit: "in", format: [w, h] });
      doc.addImage(await render(bleed ? "frontBleed" : "front"), "PNG", 0, 0, w, h);
      doc.addPage([w, h], "landscape");
      doc.addImage(await render(bleed ? "backBleed" : "back"), "PNG", 0, 0, w, h);
      doc.save(bleed ? "CityMinisters_Card_Print_Bleed.pdf" : "CityMinisters_Card.pdf");
    });

  const Btn2 = ({ id, onClick, children }: { id: string; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!!busy}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-soft px-4 py-2.5 text-sm font-semibold text-sand ring-1 ring-mist/35 transition hover:bg-ink disabled:opacity-60"
    >
      {busy === id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {children}
    </button>
  );

  return (
    <div className="min-h-dvh bg-ink font-body text-sand">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">City Ministers Business Card</h1>
        <p className="mt-2 text-mist/80">3.5 x 2 in, 300 dpi. The QR code opens cityministers.com.</p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl">Front</h2>
            <Preview><Front /></Preview>
            <div className="flex flex-wrap gap-2">
              <Btn2 id="front" onClick={() => png("front", "CityMinisters_Card_Front.png")}>PNG</Btn2>
              <Btn2 id="frontBleed" onClick={() => png("frontBleed", "CityMinisters_Card_Front_Bleed.png")}>PNG with bleed</Btn2>
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl">Back</h2>
            <Preview><Back /></Preview>
            <div className="flex flex-wrap gap-2">
              <Btn2 id="back" onClick={() => png("back", "CityMinisters_Card_Back.png")}>PNG</Btn2>
              <Btn2 id="backBleed" onClick={() => png("backBleed", "CityMinisters_Card_Back_Bleed.png")}>PNG with bleed</Btn2>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-2xl bg-ink-soft/60 p-5 ring-1 ring-mist/25">
          <h2 className="font-display text-xl">For the print shop</h2>
          <p className="mt-1 text-sm text-mist/80">Both sides in one file. Most printers want the bleed version (3.75 x 2.25 in).</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn2 id="pdf" onClick={() => pdf(false)}>PDF (both sides)</Btn2>
            <Btn2 id="pdfB" onClick={() => pdf(true)}>PDF with bleed</Btn2>
          </div>
        </section>
      </main>

      {/* Full-size offscreen copies used for exporting */}
      <div aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0, width: "max-content" }}>
        <div ref={refs.front}><Front /></div>
        <div ref={refs.back}><Back /></div>
        <div ref={refs.frontBleed}><Front bleed /></div>
        <div ref={refs.backBleed}><Back bleed /></div>
      </div>
    </div>
  );
}
