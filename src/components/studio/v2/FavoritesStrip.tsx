import { Heart } from "lucide-react";
import { Reorder } from "motion/react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { FavoriteThumbnail } from "./FavoriteThumbnail";

/**
 * Saved wallpapers, always under the dock. Tap one to go back to it, drag to
 * reorder, hover and press ✕ to remove. Persisted by `useFavoritesStore`.
 */
export function FavoritesStrip() {
  const items = useFavoritesStore((s) => s.items);
  const reorder = useFavoritesStore((s) => s.reorder);

  return (
    <section
      aria-label={items.length === 0 ? "Favorites — empty" : "Favorites"}
      className="relative z-[3] flex min-h-[108px] min-w-0 items-center justify-center gap-3.5 px-[18px] pb-[18px] pt-3.5 @max-[760px]:min-h-0 @max-[760px]:flex-col @max-[760px]:gap-2 @max-[760px]:px-3.5 @max-[760px]:pb-4"
    >
      <span className="inline-flex flex-none items-center gap-2 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-ink-dim">
        Saved
        <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-ink/[0.08] px-1.5 tracking-normal text-ink tabular-nums">
          {items.length}
        </span>
      </span>
      {items.length === 0 ? (
        <p className="m-0 text-balance text-center font-sans text-[0.85rem] text-ink-dim">
          <Heart className="mr-1.5 inline size-3.5 -translate-y-px text-rose" aria-hidden />
          Tap the heart to keep a wallpaper. Saved in this browser only.
        </p>
      ) : (
        <Reorder.Group
          axis="x"
          values={items}
          onReorder={(reordered) => reorder(reordered.map((it) => it.id))}
          className="m-0 flex min-w-0 items-center gap-2.5 overflow-x-auto overflow-y-hidden p-1.5 [scrollbar-width:none] @max-[760px]:max-w-full"
          style={{
            scrollSnapType: "x proximity",
            overscrollBehaviorX: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {items.map((item) => (
            <FavoriteThumbnail key={item.id} item={item} />
          ))}
        </Reorder.Group>
      )}
    </section>
  );
}
