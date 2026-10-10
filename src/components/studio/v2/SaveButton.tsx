import { Heart } from "lucide-react";
import { m } from "motion/react";
import { useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import type { ActiveMask, Colors4 } from "@/lib/palettes";
import { useConfigStore } from "@/store";
import { type FavoriteItem, useFavoritesStore } from "@/store/useFavoritesStore";

/** Two favorites are "the same wallpaper" when everything that draws it matches. */
function sameLook(a: FavoriteItem["config"], b: FavoriteItem["config"]): boolean {
  return (
    a.colors.join(",").toLowerCase() === b.colors.join(",").toLowerCase() &&
    a.style === b.style &&
    a.seed === b.seed &&
    a.blur === b.blur &&
    a.grain === b.grain &&
    (a.lightAngle ?? 135) === (b.lightAngle ?? 135) &&
    (a.contrast ?? 1) === (b.contrast ?? 1) &&
    (a.vibrance ?? 1) === (b.vibrance ?? 1)
  );
}

function snapshot(): FavoriteItem["config"] {
  const s = useConfigStore.getState();
  return {
    colors: [...s.colors] as Colors4,
    active: [...s.active] as ActiveMask,
    style: s.style,
    blur: s.blur,
    grain: s.grain,
    seed: s.seed,
    lightAngle: s.lightAngle,
    density: s.density,
    contrast: s.contrast,
    vibrance: s.vibrance,
  };
}

interface Props {
  onMessage: (message: string) => void;
}

/** Heart that saves the current wallpaper to the strip, and removes it again if tapped twice. */
export function SaveButton({ onMessage }: Props) {
  const items = useFavoritesStore((s) => s.items);
  // Subscribing to the look fields makes `saved` follow every change.
  const colors = useConfigStore((s) => s.colors);
  const seed = useConfigStore((s) => s.seed);
  const style = useConfigStore((s) => s.style);
  const blur = useConfigStore((s) => s.blur);
  const grain = useConfigStore((s) => s.grain);
  const lightAngle = useConfigStore((s) => s.lightAngle);
  const contrast = useConfigStore((s) => s.contrast);
  const vibrance = useConfigStore((s) => s.vibrance);
  const [burst, setBurst] = useState(0);

  const here = { colors, style, seed, blur, grain, lightAngle, contrast, vibrance };
  const saved = items.find((it) => sameLook(it.config, here as FavoriteItem["config"]));

  const toggle = () => {
    if (saved) {
      useFavoritesStore.getState().unpin(saved.id);
      onMessage("Removed from saved");
      return;
    }
    useFavoritesStore.getState().pin(snapshot());
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
