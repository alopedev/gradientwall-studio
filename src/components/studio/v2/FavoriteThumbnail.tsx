import { X } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useGradientCanvas } from "@/lib/useGradientCanvas";
import { activeColors, ALL_ACTIVE } from "@/lib/palettes";
import { useConfigStore } from "@/store/useConfigStore";
import { type FavoriteItem, useFavoritesStore } from "@/store/useFavoritesStore";

/**
 * FavoriteThumbnail — chip dentro del FavoritesStrip. Cada uno:
 * - Renderiza un mini canvas (64×112, aspect 9:16) con la config del item.
 * - Click → carga la config en el ConfigStore (canvas principal cambia).
 * - X hover → unpin (eliminar del store).
 * - Drag handle integrado vía useDragControls para que el cursor sea
 *   "grab" sólo en el chip, no en el botón X.
 *
 * Usa `useGradientCanvas` (legacy fixed-size) — el thumbnail no necesita
 * adaptarse a container queries, su tamaño es fijo.
 */

const THUMB_W = 64;
const THUMB_H = 112;

interface Props {
  item: FavoriteItem;
}

export function FavoriteThumbnail({ item }: Props) {
  const unpin = useFavoritesStore((s) => s.unpin);
  const controls = useDragControls();

  // Restaura active mask si el item es legacy (sin active). Por defecto todos
  // activos — mismo posture que el coordinator.loadHistoryItem() del v1.
  const active = item.config.active ?? ALL_ACTIVE;
  const filteredColors = activeColors(item.config.colors, active);

  const ref = useGradientCanvas(
    {
      w: THUMB_W,
      h: THUMB_H,
      colors: filteredColors,
      style: item.config.style,
      blur: item.config.blur,
      seed: item.config.seed,
      lightAngle: item.config.lightAngle,
      density: item.config.density,
    },
    [
      filteredColors.join(","),
      item.config.style,
      item.config.blur,
      item.config.seed,
      item.config.lightAngle,
      item.config.density,
    ],
  );

  const loadIntoCanvas = () => {
    useConfigStore.setState({
      colors: [...item.config.colors] as [string, string, string, string],
      active: [...active] as [boolean, boolean, boolean, boolean],
      style: item.config.style,
      blur: item.config.blur,
      grain: item.config.grain,
      seed: item.config.seed,
      lightAngle: item.config.lightAngle ?? 135,
      density: item.config.density ?? 0.5,
      contrast: item.config.contrast ?? 1,
      vibrance: item.config.vibrance ?? 1,
    });
  };

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      // gw-reveal-on-scroll: scroll-driven CSS animation nativa (Fase 5).
      // Aparece con fade + slide-up cuando el elemento entra al viewport
      // vertical. Cero JS, GPU-composited. Donde no se soporta (Safari
      // <TP), el thumbnail aparece directo — degradación elegante.
      className="gw-reveal-on-scroll group relative shrink-0"
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        onClick={loadIntoCanvas}
        aria-label={`Load favorite wallpaper from ${new Date(item.createdAt).toLocaleString()}`}
        className="focus-ring relative block size-full cursor-grab overflow-hidden rounded-[6px] border border-white/12 transition-all duration-150 hover:scale-[1.04] hover:border-white/40 active:cursor-grabbing active:scale-[0.98]"
      >
        <canvas ref={ref} width={THUMB_W} height={THUMB_H} className="block size-full" />
      </button>
      {/* Unpin — visible en hover. Posicionado encima de la esquina superior
          derecha. Click NO debe propagar al thumbnail (que cargaría la config). */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          unpin(item.id);
        }}
        aria-label="Remove from favorites"
        className="focus-ring absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full border border-white/20 bg-black/65 text-white/80 opacity-0 transition-opacity duration-150 hover:scale-110 hover:text-white group-hover:opacity-100"
      >
        <X className="size-3" aria-hidden />
      </button>
    </Reorder.Item>
  );
}
