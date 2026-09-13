import { LocateFixed } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const MIN_Z = 0.45;
const MAX_Z = 1.8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type View = { x: number; y: number; z: number };

type Props = {
  /** Size of the scrollable canvas, in canvas pixels. */
  width: number;
  height: number;
  /** Tiled map artwork. */
  background: string;
  /** Canvas point to centre on (a ZIP district). */
  target?: { x: number; y: number } | null;
  children: ReactNode;
  label?: string;
  className?: string;
};

/**
 * A draggable, zoomable map surface. Pins are positioned in canvas coordinates
 * by the caller; this component only moves the surface under the viewport.
 */
export function PanMap({
  width,
  height,
  background,
  target,
  children,
  label = "Map. Drag to move around.",
  className = "",
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, z: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [gliding, setGliding] = useState(true);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; z: number } | null>(null);
  const moved = useRef(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  /** True only for the click that immediately follows a real drag. */
  const wasDrag = useRef(false);

  const clampView = useCallback(
    (v: View): View => {
      const el = viewportRef.current;
      if (!el) return v;
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      const cw = width * v.z;
      const ch = height * v.z;
      const x = cw <= vw ? (vw - cw) / 2 : clamp(v.x, vw - cw, 0);
      const y = ch <= vh ? (vh - ch) / 2 : clamp(v.y, vh - ch, 0);
      return { x, y, z: v.z };
    },
    [width, height],
  );

  const centerOn = useCallback(
    (tx: number, ty: number, z?: number, animate = true) => {
      const el = viewportRef.current;
      if (!el) return;
      const zoom = z ?? viewRef.current.z;
      setGliding(animate);
      setView(
        clampView({
          x: el.clientWidth / 2 - tx * zoom,
          y: el.clientHeight / 2 - ty * zoom,
          z: zoom,
        }),
      );
    },
    [clampView],
  );

  // Glide to the searched district.
  const targetX = target?.x ?? null;
  const targetY = target?.y ?? null;
  useLayoutEffect(() => {
    if (targetX === null || targetY === null) return;
    centerOn(targetX, targetY);
  }, [targetX, targetY, centerOn]);

  // Keep the canvas in frame when the viewport resizes.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setView((v) => clampView(v)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [clampView]);

  const zoomAt = useCallback(
    (nextZoom: number, px: number, py: number) => {
      setGliding(false);
      setView((v) => {
        const z = clamp(nextZoom, MIN_Z, MAX_Z);
        const k = z / v.z;
        return clampView({ x: px - (px - v.x) * k, y: py - (py - v.y) * k, z });
      });
    },
    [clampView],
  );

  // Native non-passive wheel: React's onWheel cannot preventDefault.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
      const dy = e.deltaY * scale;
      if (e.ctrlKey) {
        zoomAt(viewRef.current.z * Math.exp(-dy * 0.0015), px, py);
        return;
      }
      const dx = e.deltaX * scale;
      setGliding(false);
      setView((v) => clampView({ ...v, x: v.x - dx, y: v.y - dy }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampView, zoomAt]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Pins and map controls own their gestures. Starting the map drag from a
    // button made normal finger wobble cancel the button's click on phones.
    if (e.target instanceof Element && e.target.closest("button")) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    setGliding(false);
    if (pointers.current.size === 1) {
      moved.current = false;
      wasDrag.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      setDragging(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const points = [...pointers.current.values()];

    if (points.length >= 2) {
      const [a, b] = points as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (a.x + b.x) / 2 - rect.left;
      const py = (a.y + b.y) / 2 - rect.top;
      if (!pinch.current) {
        pinch.current = { dist, z: viewRef.current.z };
        return;
      }
      zoomAt((pinch.current.z * dist) / pinch.current.dist, px, py);
      return;
    }

    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    // A finger always wobbles a few pixels on a tap: only distance travelled
    // from where the pointer landed counts as a real drag.
    const start = origin.current;
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) {
      moved.current = true;
    }
    setView((v) => clampView({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      setDragging(false);
      // Only the click from this gesture may be suppressed; the next tap starts clean.
      wasDrag.current = moved.current;
      moved.current = false;
      origin.current = null;
    }
  };

  return (
    <div
      ref={viewportRef}
      role="application"
      aria-label={label}
      className={`relative overflow-hidden rounded-2xl ring-1 ring-mist/15 ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClickCapture={(e) => {
        // A real drag should not open the pin it finished on; a tap always may.
        if (wasDrag.current) {
          e.preventDefault();
          e.stopPropagation();
        }
        wasDrag.current = false;
      }}
    >
      <div
        className={gliding ? "transition-transform duration-500 ease-out" : ""}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          transformOrigin: "0 0",
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.z})`,
          backgroundImage: `url(${background})`,
          backgroundSize: "900px 600px",
          backgroundRepeat: "repeat",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-ink/30" />
        {children}
      </div>

      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (targetX === null || targetY === null) return;
            centerOn(targetX, targetY, 1);
          }}
          className="grid size-9 place-items-center rounded-full bg-ink/90 text-lemon ring-1 ring-mist/25 transition hover:bg-ink-soft"
          aria-label="Recenter map"
        >
          <LocateFixed className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
