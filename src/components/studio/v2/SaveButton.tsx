import { Heart } from "lucide-react";
import { m } from "motion/react";
import { useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { fromFavorite, isSameLook, toFavoriteConfig } from "@/lib/look";
import { useLook } from "@/store";
import { useFavoritesStore } from "@/store/useFavoritesStore";

interface Props {
  onMessage: (message: string) => void;
}

/** Heart that saves the current wallpaper to the strip, and removes it again if tapped twice. */
export function SaveButton({ onMessage }: Props) {
  const items = useFavoritesStore((s) => s.items);
  // Subscribing to the whole look makes `saved` follow every change.
  const look = useLook();
  const [burst, setBurst] = useState(0);

  const saved = items.find((it) => isSameLook(fromFavorite(it.config), look));

  const toggle = () => {
    if (saved) {
      useFavoritesStore.getState().unpin(saved.id);
      onMessage("Removed from saved");
      return;
    }
    useFavoritesStore.getState().pin(toFavoriteConfig(look));
    setBurst((n) => n + 1);
    onMessage("Saved. Tap it below to come back to it.");
  };

  return (
    <GlassButton
      variant="icon"
      onClick={toggle}
      aria-pressed={!!saved}
      aria-label="Save this wallpaper"
      data-tip={saved ? "Saved" : "Save"}
      className={`gws-tip ${saved ? "bg-rose/10 text-rose shadow-[inset_0_0_0_1px_rgba(255,107,129,0.35)] hover:bg-rose/15" : ""}`}
    >
      <m.span
        key={burst}
        initial={burst === 0 ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 480, damping: 14 }}
        className="inline-flex"
      >
        <Heart className="size-5" fill={saved ? "currentColor" : "none"} aria-hidden />
      </m.span>
      {burst > 0 && saved && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {[0, 90, 180, 270].map((angle) => (
            <span
              key={`${burst}-${angle}`}
              style={{ ["--angle" as string]: `${angle}deg` }}
              className="motion-safe:animate-[gw-heart-burst_0.55s_ease-out_forwards] absolute left-1/2 top-1/2 size-1.5 rounded-full bg-rose opacity-0"
            />
          ))}
        </span>
      )}
    </GlassButton>
  );
}
