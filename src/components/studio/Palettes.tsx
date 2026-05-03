import { useEffect, useRef } from "react";
import { useUIStore, applyPalette, useConfigStore, useRenderParams } from "@/store";
import { PALETTES, ALL_ACTIVE, type Colors4 } from "@/lib/palettes";
import { buildGradientSpec, paintSpecToCanvas, randomColors } from "@/lib/gradient";

const THUMB_W = 132;
const THUMB_H = 80;

/**
 * Curated palettes as live thumbnails of the current gradient style. Each
 * tile renders the wallpaper using its OWN colors but the user's CURRENT
 * style/seed/blur/lightAngle/density — so picking a palette becomes a
 * preview-driven decision, not a guess from four flat swatches. Apoya la
 * heurística de Hick-en-creative-tools: cuando hay muchas opciones, la
 * galería visual gana al menú porque cada elección se evalúa en su efecto
 * final, no por nombre.
 *
 * The first tile is a "Surprise palette" that rolls four random colors
 * into the current gradient — exploration without leaving the rail.
 */
export function Palettes() {
  const activePalette = useUIStore((s) => s.activePalette);
  const setColors = useConfigStore((s) => s.setColors);
  const params = useRenderParams();

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <SurprisePaletteTile onPick={(cs) => setColors(cs)} renderKey={params} />
      {PALETTES.map((p, i) => (
        <PaletteTile
          key={p.name}
          name={p.name}
          colors={p.colors}
          active={i === activePalette}
          onClick={() => applyPalette(i)}
          renderKey={params}
        />
      ))}
    </div>
  );
}

interface PaletteTileProps {
  name: string;
  colors: Colors4;
  active: boolean;
  onClick: () => void;
  renderKey: ReturnType<typeof useRenderParams>;
}

function PaletteTile({ name, colors, active, onClick, renderKey }: PaletteTileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const spec = buildGradientSpec({
      w: THUMB_W,
      h: THUMB_H,
      colors,
      style: renderKey.style === "nebula" ? "mesh" : renderKey.style,
      blur: Math.max(8, Math.round(renderKey.blur * 0.35)),
      seed: renderKey.seed,
      lightAngle: renderKey.lightAngle,
    });
    paintSpecToCanvas(c, spec);
  }, [
    colors,
    renderKey.style,
    renderKey.blur,
    renderKey.seed,
    renderKey.lightAngle,
  ]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-[2px] p-2 liquid-subtle text-left cursor-pointer transition-colors duration-150 hover:bg-white/5 ${
        active ? "!border-white" : ""
      }`}
    >
      <div className="overflow-hidden rounded mb-1.5" style={{ aspectRatio: `${THUMB_W} / ${THUMB_H}` }}>
        <canvas
          ref={canvasRef}
          width={THUMB_W}
          height={THUMB_H}
          className="block w-full h-full"
        />
      </div>
      <div className="flex justify-between items-center font-sans text-[10px] tracking-[0.12em] uppercase text-white/70">
        <span className="truncate">{name}</span>
      </div>
    </button>
  );
}

interface SurprisePaletteTileProps {
  onPick: (colors: Colors4) => void;
  renderKey: ReturnType<typeof useRenderParams>;
}

function SurprisePaletteTile({ onPick, renderKey }: SurprisePaletteTileProps) {
  // Surprise tile preview rolls a fresh palette per render-key change so the
  // tile is always showing a *currently-fresh* possibility, not a stale one.
  const colorsRef = useRef<Colors4>(randomColors() as Colors4);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    colorsRef.current = randomColors() as Colors4;
    const c = canvasRef.current;
    if (!c) return;
    const spec = buildGradientSpec({
      w: THUMB_W,
      h: THUMB_H,
      colors: colorsRef.current,
      style: renderKey.style === "nebula" ? "mesh" : renderKey.style,
      blur: Math.max(8, Math.round(renderKey.blur * 0.35)),
      seed: renderKey.seed,
      lightAngle: renderKey.lightAngle,
    });
    paintSpecToCanvas(c, spec);
  }, [renderKey.style, renderKey.blur, renderKey.seed, renderKey.lightAngle]);

  return (
    <button
      type="button"
      onClick={() => onPick(colorsRef.current)}
      className="relative rounded-[2px] p-2 liquid-subtle text-left cursor-pointer transition-colors duration-150 hover:bg-white/5"
      title="Random palette — rerolls every time"
    >
      <div className="overflow-hidden rounded mb-1.5" style={{ aspectRatio: `${THUMB_W} / ${THUMB_H}` }}>
        <canvas
          ref={canvasRef}
          width={THUMB_W}
          height={THUMB_H}
          className="block w-full h-full"
        />
      </div>
      <div className="flex justify-between items-center font-sans text-[10px] tracking-[0.12em] uppercase text-white/70">
        <span>✦ Surprise</span>
      </div>
    </button>
  );
}

// Re-export so tests/consumers wanting the all-active mask don't have to
// import it from `@/lib/palettes`. Pure type-level convenience.
export { ALL_ACTIVE };
