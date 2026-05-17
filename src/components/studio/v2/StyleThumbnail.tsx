import { useGradientCanvas } from "@/lib/useGradientCanvas";
import { activeColors, type Style } from "@/lib/palettes";
import { useConfigStore } from "@/store";

/**
 * StyleThumbnail — chip cuadrado que muestra cómo se vería el wallpaper
 * actual con un `style` distinto. Usado en `CustomizePopover` para que el
 * usuario elija style visualmente en lugar de leer "mesh / liquid / aurora /
 * nebula".
 *
 * Pinta con la misma paleta + seed actuales para que comparar entre las 4
 * miniaturas refleje exclusivamente la diferencia de style. Si el usuario
 * cambia de seed o paleta el thumbnail se re-renderiza solo (deps en
 * useGradientCanvas).
 */

// Resolución del canvas — fija para mantener la matemática constante. El
// elemento DOM puede escalar libre (w-full) gracias al downscale del navegador.
const CANVAS_W = 120;
const CANVAS_H = 80;

interface Props {
  style: Style;
  label: string;
  selected: boolean;
  onSelect: (s: Style) => void;
}

export function StyleThumbnail({ style, label, selected, onSelect }: Props) {
  const colors = useConfigStore((s) => s.colors);
  const active = useConfigStore((s) => s.active);
  const seed = useConfigStore((s) => s.seed);

  const filteredColors = activeColors(colors, active);

  const ref = useGradientCanvas(
    {
      w: CANVAS_W,
      h: CANVAS_H,
      colors: filteredColors,
      style,
      blur: 24,
      seed,
    },
    [filteredColors.join(","), style, seed],
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(style)}
      aria-pressed={selected}
      aria-label={`Switch to ${label} style`}
      title={label}
      className={`focus-ring group relative w-full overflow-hidden rounded-[6px] border transition-all duration-150 ${
        selected
          ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.18)]"
          : "border-white/12 hover:border-white/40"
      }`}
    >
      <canvas ref={ref} width={CANVAS_W} height={CANVAS_H} className="block aspect-[3/2] w-full" />
      <span
        className={`block px-1 py-1 font-sans text-[10px] uppercase tracking-[0.12em] ${
          selected ? "bg-white text-[#07070a]" : "bg-black/45 text-white/65 group-hover:text-white"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
