import { Heart } from "lucide-react";
import { Reorder } from "motion/react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { FavoriteThumbnail } from "./FavoriteThumbnail";

/**
 * FavoritesStrip — galería persistente en horizontal, siempre visible al pie
 * del StudioShell. Filosofía Studio v2: invitar a guardar y volver. El usuario
 * pinea wallpapers que le gustan, vuelve a la página después y los encuentra
 * tal cual los dejó.
 *
 * Comportamiento:
 * - Vacía → "empty state" suave: icono ♥ + copy "Save your favorites" centrado
 *   con opacity baja. Sin animaciones, no se promueve hasta que tenga sentido.
 * - Con items → tira horizontal scrollable (overflow-x-auto). Cada chip es
 *   un FavoriteThumbnail con:
 *     · mini canvas 64×112 renderizado con la config persistida
 *     · click → carga la config al canvas principal
 *     · X hover → unpin
 *     · drag → reorder (motion Reorder.Group)
 *
 * Persistencia gestionada por useFavoritesStore (zustand persist en
 * localStorage `gw:favorites:v1`).
 */

export function FavoritesStrip() {
  const items = useFavoritesStore((s) => s.items);
  const reorder = useFavoritesStore((s) => s.reorder);

  if (items.length === 0) {
    return (
      <section
        aria-label="Favorites — empty"
        className="mt-6 flex h-[var(--strip-height)] items-center justify-center rounded-[10px] border border-dashed border-white/8"
      >
        <span className="inline-flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.18em] text-white/35">
          <Heart className="size-3.5" aria-hidden />
          Save your favorites
        </span>
      </section>
    );
  }

  return (
    <section
      aria-label="Favorites"
      className="glass-modern mt-6 rounded-[10px] p-3"
      style={{ height: "var(--strip-height)" }}
    >
      {/* axis="x" hace que motion gestione el drag-reorder en horizontal.
          values + onReorder cierran el ciclo: el orden visual del DOM es la
          fuente de verdad del store tras un drop. */}
      <Reorder.Group
        axis="x"
        values={items}
        onReorder={(reordered) => reorder(reordered.map((it) => it.id))}
        className="flex h-full items-center gap-2 overflow-x-auto overflow-y-hidden"
        style={{ scrollSnapType: "x proximity" }}
      >
        {items.map((item) => (
          <FavoriteThumbnail key={item.id} item={item} />
        ))}
      </Reorder.Group>
    </section>
  );
}
