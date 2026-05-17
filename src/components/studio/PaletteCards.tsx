import { PALETTES } from "@/lib/palettes";
import { applyPalette, useUIStore } from "@/store";

/**
 * PaletteCards — selector visual de paletas curadas. Adaptación al theme dark
 * del Studio del componente Color Palette Card (ravikatiyar @ 21st.dev): card
 * con 4 swatches `flex-1`; al hover, el swatch focused crece a `flex-[2.5]`,
 * los otros se comprimen y el hex aparece centrado en el focused. Stats
 * (nombre + ⋯) ocupan el 14% inferior.
 *
 * Por decisión de catálogo se renderizan solo las paletas con `featured=true`
 * (4 iniciales que cubren warm/cool/nature/neutral). Stack vertical (1 col)
 * dentro del CustomizePanel — cada card ocupa el ancho del panel y mantiene
 * el ratio horizontal del original para preservar el hover-expand.
 */

export function PaletteCards() {
  const activePalette = useUIStore((s) => s.activePalette);
  const featured = PALETTES.map((p, i) => ({ p, i })).filter(({ p }) => p.featured);

  return (
    <div className="flex flex-col gap-2.5">
      {featured.map(({ p, i }) => (
        <PaletteCard
          key={p.name}
          name={p.name}
          colors={p.colors}
          isActive={i === activePalette}
          onSelect={() => applyPalette(i)}
        />
      ))}
    </div>
  );
}

interface PaletteCardProps {
  name: string;
  colors: readonly string[];
  isActive: boolean;
  onSelect: () => void;
}

function PaletteCard({ name, colors, isActive, onSelect }: PaletteCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      aria-label={`Apply palette ${name}`}
      className={`focus-ring group flex aspect-[3.5/1] w-full flex-col overflow-hidden rounded-[10px] border bg-white/[0.03] text-left shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_8px_22px_rgba(0,0,0,0.5)] ${
        isActive
          ? "border-white shadow-[0_0_0_1px_white,0_8px_22px_rgba(0,0,0,0.5)]"
          : "border-white/10"
      }`}
    >
      {/* Color strip: 86% height. Key incluye `name` + slot index para que dos
          paletas con un color repetido no colisionen. Las paletas son
          inmutables a runtime (vienen de palettes.ts), así que el index estable
          como parte de la key no genera el problema clásico de reordenamiento. */}
      <div className="palette-strip flex h-[86%] w-full">
        {colors.map((c, idx) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: paleta inmutable, slot fijo
            key={`${name}-${idx}`}
            className="palette-swatch relative flex-1 transition-[flex] duration-200 ease-out"
            style={{ background: c }}
          >
            <span
              className="palette-hex pointer-events-none absolute inset-0 grid place-items-center font-sans text-[10px] font-semibold uppercase tracking-[0.04em] text-white opacity-0 transition-opacity duration-200"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
            >
              {c.toUpperCase().replace("#", "")}
            </span>
          </div>
        ))}
      </div>

      {/* Stats: 14% height */}
      <div className="flex h-[14%] w-full items-center justify-between border-t border-white/6 bg-[rgba(8,8,10,0.92)] px-2.5">
        <span className="font-sans text-[9.5px] uppercase tracking-[0.10em] text-white/72">
          {name}
        </span>
        <span aria-hidden className="text-[14px] leading-none text-white/45">
          ⋯
        </span>
      </div>
    </button>
  );
}
