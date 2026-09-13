import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HandHeart, Heart, HeartHandshake } from "lucide-react";
import { useState } from "react";
import { listMyFavorites, toggleFavorite } from "@/lib/favorites.functions";

export function FavoritesTab() {
  const fetchFavorites = useServerFn(listMyFavorites);
  const unsave = useServerFn(toggleFavorite);
  const { data: saved, refetch, isLoading } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => fetchFavorites(),
  });
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <p className="py-10 text-center text-base text-mist/60">Loading…</p>;

  if (!saved || saved.length === 0) {
    return (
      <p className="rounded-2xl bg-ink-soft/60 p-6 text-center text-base text-mist/70 ring-1 ring-mist/15">
        Nothing saved yet. Tap the heart on a ministry or need to keep it here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {saved.map((item) => {
        const Icon = item.postType === "need" ? HandHeart : HeartHandshake;
        const open = openId === item.postId;
        return (
          <div
            key={`${item.postType}-${item.postId}`}
            className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15"
          >
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.postId)}
              className="flex items-start gap-3 text-left"
              aria-expanded={open}
            >
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-mist/25"
                />
              ) : (
                <span
                  className={`grid size-14 shrink-0 place-items-center rounded-xl ring-1 ${
                    item.postType === "need"
                      ? "bg-ink-soft text-sand ring-mist/25"
                      : "bg-tone-purple/12 text-tone-purple ring-tone-purple/35"
                  }`}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-mist/50">
                  {item.postType === "need" ? "Need" : "Ministry"}
                </p>
                <p className="truncate text-xl font-semibold text-sand sm:text-2xl">{item.shortTitle}</p>
                <p className="truncate text-base text-mist/60">
                  {[item.city, item.zip].filter(Boolean).join(" ")}
                </p>
              </div>
            </button>

            {open && (
              <p className="text-base leading-relaxed text-mist/80">{item.description}</p>
            )}

            <button
              type="button"
              onClick={async () => {
                await unsave({ data: { postType: item.postType, postId: item.postId } });
                await refetch();
              }}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-base font-medium text-rose ring-1 ring-rose/30 transition hover:bg-rose/10"
            >
              <Heart className="size-4" aria-hidden="true" />
              Remove from favorites
            </button>
          </div>
        );
      })}
    </div>
  );
}
